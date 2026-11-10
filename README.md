# T-REX SURVIVAL

A browser-based endless runner with a procedural Three.js jungle, three-lane movement, T-Rex chase, collectible items, power-ups, earthquakes, skins and a responsive menu.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open [http://localhost:5173](http://localhost:5173).

The game runs locally without an account database. Device progress is stored in browser local storage and is separated by local runner ID. Account signup/login and server-side run statistics require the API configuration below.

## Neon accounts and API

Copy `.env.example` to `.env`, then set:

- `DATABASE_URL` to your Neon connection string (keep it private and out of source control).
- `JWT_SECRET` to a random secret of at least 32 characters.
- `CLIENT_ORIGIN` to your frontend origin.

`npm run dev` starts the Vite frontend and Express API together. On startup, the API creates the tables and index from `server/schema.sql`. Passwords are hashed with bcrypt; the signed JWT is kept in an HTTP-only cookie. Device coin balances and skin unlocks are keyed by user ID in local storage and are not synchronized to the database.

If a database connection is unavailable, local guest play remains available and account actions report the API configuration error.

## Controls

- **A / ←, D / →** — change lanes
- **W / ↑ / Space** — jump
- **S / ↓** — slide
- **Escape** — pause/resume
- Touch buttons are available during runs on smaller screens.
- Choose male or female runners and equip skins from the armory. Female runners have a distinct hairstyle.
- Original jungle ambience and an ominous synthesized chase drone are generated in-browser with Web Audio; the music setting controls playback without loading third-party audio tracks.

Obstacle timing changes with distance. Barriers require a slide; rocks and fire traps require a jump. Coins, keys, shields, magnet, multiplier, speed boost and temporary invincibility appear on the track. A magnet lasts 30 seconds. A collected key can revive once during the 10-second game-over window.

## Production / Render

This repository includes a Render Blueprint in `render.yaml`.

1. Push the repository to GitHub and create a Render Blueprint from it.
2. Set `DATABASE_URL` to the Neon pooled connection string in Render's environment settings. Do not commit this secret.
3. Render generates `JWT_SECRET`; the Blueprint builds with `npm ci && npm run build` and starts with `npm start`.
4. The service health check is `/api/health`; Express serves the built frontend and API from the same origin.

The local `.env` file is ignored by Git. Rotate database credentials that have been shared or committed accidentally.
