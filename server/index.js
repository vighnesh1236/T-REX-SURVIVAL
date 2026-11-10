import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 3001);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 8,
  idleTimeoutMillis: 30_000,
}) : null;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

function requireDatabase(_req, res, next) {
  if (!pool) return res.status(503).json({ error: 'Account service is not configured. Set DATABASE_URL on the server.' });
  next();
}

function requireAuth(req, res, next) {
  const token = req.cookies.trex_session;
  if (!token) return res.status(401).json({ error: 'Sign in required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

function issueSession(res, userId) {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('trex_session', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
  });
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', databaseConfigured: Boolean(pool) }));

app.post('/api/auth/signup', requireDatabase, async (req, res, next) => {
  try {
    const { name, username, email, password, gender } = req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80 ||
        typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,24}$/.test(username) ||
        typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== 'string' || password.length < 8 || password.length > 100 ||
        !['male', 'female'].includes(gender)) {
      return res.status(400).json({ error: 'Please check the account details and try again.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        'INSERT INTO users (full_name, username, email, password_hash, gender) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, gender',
        [name.trim(), username.trim(), email.trim().toLowerCase(), passwordHash, gender],
      );
      await client.query('INSERT INTO player_profiles (user_id) VALUES ($1)', [result.rows[0].id]);
      await client.query('COMMIT');
      issueSession(res, result.rows[0].id);
      return res.status(201).json({ user: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') return res.status(409).json({ error: 'That email or runner name is already registered.' });
      throw error;
    } finally { client.release(); }
  } catch (error) { next(error); }
});

app.post('/api/auth/login', requireDatabase, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 100) {
      return res.status(400).json({ error: 'Enter your email and password.' });
    }
    const result = await pool.query(
      'SELECT id, username, email, gender, password_hash FROM users WHERE email = $1',
      [email.trim().toLowerCase()],
    );
    if (!result.rowCount || !(await bcrypt.compare(password, result.rows[0].password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const user = result.rows[0];
    issueSession(res, user.id);
    return res.json({ user: { id: user.id, username: user.username, email: user.email, gender: user.gender } });
  } catch (error) { next(error); }
});

app.get('/api/auth/me', requireDatabase, requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, username, email, gender FROM users WHERE id = $1', [req.user.sub]);
    if (!result.rowCount) return res.status(401).json({ error: 'Account not found' });
    return res.json({ user: result.rows[0] });
  } catch (error) { next(error); }
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('trex_session', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
  return res.json({ status: 'ok' });
});

app.post('/api/runs', requireDatabase, requireAuth, async (req, res, next) => {
  try {
    const { score, distance, coins } = req.body || {};
    if (![score, distance, coins].every((value) => Number.isSafeInteger(value) && value >= 0)) {
      return res.status(400).json({ error: 'Run statistics must be non-negative integers.' });
    }
    await pool.query('INSERT INTO game_sessions (user_id, score, distance, coins) VALUES ($1, $2, $3, $4)', [req.user.sub, score, distance, coins]);
    await pool.query(
      'INSERT INTO player_profiles (user_id, best_score, total_distance) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET best_score = GREATEST(player_profiles.best_score, EXCLUDED.best_score), total_distance = player_profiles.total_distance + EXCLUDED.total_distance, updated_at = NOW()',
      [req.user.sub, score, distance],
    );
    return res.status(201).json({ status: 'saved' });
  } catch (error) { next(error); }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, '../dist')));
  app.get('*', (_req, res, next) => {
    if (_req.path.startsWith('/api/')) return next();
    return res.sendFile(path.resolve(__dirname, '../dist/index.html'));
  });
}

app.use((error, _req, res, _next) => {
  console.error(error);
  return res.status(500).json({ error: 'The server could not complete that request.' });
});

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be set to at least 32 characters in production.');
  process.env.JWT_SECRET = 'local-development-secret-do-not-use-in-production-123';
}

app.listen(port, async () => {
  if (pool) {
    try {
      const schema = await readFile(path.join(__dirname, 'schema.sql'), 'utf8');
      await pool.query(schema);
      console.log(`Neon database ready; API listening on http://localhost:${port}`);
    } catch (error) {
      console.error('Database initialization failed:', error.message);
    }
  } else console.log(`API listening on http://localhost:${port} (database not configured)`);
});
