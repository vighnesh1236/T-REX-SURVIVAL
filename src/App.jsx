import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameWorld from './game/World.jsx';
import { defaultSkin, skins } from './data/skins.js';

const initialState = { screen: 'menu', running: false, paused: false, distance: 0, score: 0, runCoins: 0, lane: 0, action: 'run', entities: [], speed: 6, keys: 0, shield: false, magnet: 0, multiplier: 0, boost: 0, invincible: 0, quake: 0, quakeWarning: 0, revive: 10 };
const STORE_KEY = 'trex-survival-profile:';
const ACTIVE_KEY = 'trex-survival-active';
const API = '/api';

function readProfile(id) {
  try {
    const profileId = id || localStorage.getItem(ACTIVE_KEY);
    return profileId ? JSON.parse(localStorage.getItem(`${STORE_KEY}${profileId}`) || 'null') : null;
  } catch { return null; }
}
function writeProfile(profile) {
  localStorage.setItem(`${STORE_KEY}${profile.id}`, JSON.stringify(profile));
  localStorage.setItem(ACTIVE_KEY, profile.id);
}
function makeProfile(user = null) {
  const id = user?.id || 'device-local-runner';
  const own = readProfile(id) || {};
  return {
    id, username: user?.username || 'Runner', email: user?.email || '',
    coins: own.coins || 0, keys: own.keys || 0, best: own.best || 0,
    totalDistance: own.totalDistance || 0, skins: own.skins || ['m-0', 'm-1', 'f-0'],
    selectedSkin: own.selectedSkin || (user?.gender === 'female' ? 'f-0' : 'm-0'),
    gender: user?.gender || own.gender || 'male',
  };
}
function createRun() {
  return { ...initialState, screen: 'game', running: true, entities: [], distance: 0, score: 0, runCoins: 0, lane: 0, keys: 0, shield: false, magnet: 0, multiplier: 0, boost: 0, invincible: 0, quake: 0, quakeWarning: 0, revive: 10 };
}
function Icon({ name }) {
  const paths = {
    play: <><path d="m9 6 10 6-10 6z" fill="currentColor" stroke="none" /></>,
    store: <><path d="M4 9h16l-1 11H5L4 9Z" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    trophy: <><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5v2a4 4 0 0 0 4 4m7-6h3v2a4 4 0 0 1-4 4m-3 0v4m-4 3h8m-7-3h6v3H9z" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.1.8-1 1.8-1.3-.5a7.6 7.6 0 0 1-1.5.9l-.2 1.4h-2.1l-.2-1.4a7.6 7.6 0 0 1-1.7 0l-.2 1.4h-2.1l-.2-1.4a7.6 7.6 0 0 1-1.5-.9l-1.3.5-1-1.8 1.1-.8a7.4 7.4 0 0 1-.2-1.7l-1.2-.7.8-1.9 1.4.2a7.6 7.6 0 0 1 1.2-1.2l-.2-1.4 1.9-.8.8 1.2a7.4 7.4 0 0 1 1.7 0l.8-1.2 1.9.8-.2 1.4a7.6 7.6 0 0 1 1.2 1.2l1.4-.2.8 1.9-1.2.7a7.4 7.4 0 0 1-.2 1.7Z" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    pause: <><path d="M8 5h3v14H8zm5 0h3v14h-3z" fill="currentColor" stroke="none" /></>,
    sound: <><path d="M4 10v4h3l4 3V7l-4 3H4Zm11-1a4 4 0 0 1 0 6m2-9a7 7 0 0 1 0 12" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function App() {
  const [profile, setProfile] = useState(() => makeProfile());
  const [game, setGame] = useState(initialState);
  const [panel, setPanel] = useState(null);
  const [notice, setNotice] = useState('');
  const [auth, setAuth] = useState({ mode: 'login', name: '', username: '', email: '', password: '', confirm: '', gender: 'male', error: '', busy: false });
  const [music, setMusic] = useState(true);
  const [sound, setSound] = useState(true);
  const audio = useRef(null);
  const [skinGender, setSkinGender] = useState(profile.gender);
  const nextId = useRef(0);
  const finalizedRun = useRef(false);
  const spawnIn = useRef(1.2);
  const quakeIn = useRef(34);
  const noticeTimer = useRef(null);
  const skin = useMemo(() => skins.find((item) => item.id === profile.selectedSkin) || defaultSkin, [profile.selectedSkin]);
  const unlocked = new Set(profile.skins);

  const inform = useCallback((message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 2600);
  }, []);

  const startAudio = useCallback(() => {
    let engine = audio.current;
    if (!engine) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const musicGain = context.createGain();
      const sfxGain = context.createGain();
      musicGain.gain.value = music ? 0.68 : 0;
      sfxGain.gain.value = sound ? 0.7 : 0;
      musicGain.connect(context.destination);
      sfxGain.connect(context.destination);

      const jungleFilter = context.createBiquadFilter();
      jungleFilter.type = 'lowpass';
      jungleFilter.frequency.value = 2400;
      jungleFilter.Q.value = 0.35;
      const jungleGain = context.createGain();
      jungleGain.gain.value = 0.19;
      jungleFilter.connect(jungleGain);
      jungleGain.connect(musicGain);
      const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1) * 0.25;
      const leaves = context.createBufferSource();
      leaves.buffer = noiseBuffer;
      leaves.loop = true;
      leaves.connect(jungleFilter);
      leaves.start();

      const insectFilter = context.createBiquadFilter();
      insectFilter.type = 'bandpass';
      insectFilter.frequency.value = 2600;
      insectFilter.Q.value = 1.2;
      const insectGain = context.createGain();
      insectGain.gain.value = 0.018;
      insectFilter.connect(insectGain);
      insectGain.connect(musicGain);
      const insects = context.createBufferSource();
      insects.buffer = noiseBuffer;
      insects.loop = true;
      insects.connect(insectFilter);
      insects.start();

      const droneFilter = context.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 420;
      const chaseGain = context.createGain();
      chaseGain.gain.value = game.screen === 'game' ? 0.95 : 0.38;
      droneFilter.connect(chaseGain);
      chaseGain.connect(musicGain);
      const droneA = context.createOscillator();
      droneA.type = 'sawtooth';
      droneA.frequency.value = 54.5;
      const droneGainA = context.createGain();
      droneGainA.gain.value = 0.09;
      droneA.connect(droneGainA);
      droneGainA.connect(droneFilter);
      droneA.start();
      const droneB = context.createOscillator();
      droneB.type = 'triangle';
      droneB.frequency.value = 57.8;
      const droneGainB = context.createGain();
      droneGainB.gain.value = 0.055;
      droneB.connect(droneGainB);
      droneGainB.connect(droneFilter);
      droneB.start();

      const pulse = context.createOscillator();
      pulse.type = 'sine';
      pulse.frequency.value = 0.22;
      const pulseGain = context.createGain();
      pulseGain.gain.value = 0.016;
      pulse.connect(pulseGain);
      pulseGain.connect(droneGainA.gain);
      pulse.start();

      const howl = context.createOscillator();
      howl.type = 'triangle';
      howl.frequency.value = 110;
      const howlGain = context.createGain();
      howlGain.gain.value = 0.055;
      const howlFilter = context.createBiquadFilter();
      howlFilter.type = 'bandpass';
      howlFilter.frequency.value = 260;
      howlFilter.Q.value = 0.65;
      howl.connect(howlFilter);
      howlFilter.connect(howlGain);
      howlGain.connect(chaseGain);
      howl.start();
      const howlLfo = context.createOscillator();
      howlLfo.type = 'sine';
      howlLfo.frequency.value = 0.13;
      const howlDepth = context.createGain();
      howlDepth.gain.value = 5;
      howlLfo.connect(howlDepth);
      howlDepth.connect(howl.frequency);
      howlLfo.start();
      engine = { context, musicGain, sfxGain, chaseGain };
      audio.current = engine;
    }
    if (engine.context.state === 'suspended') engine.context.resume();
  }, [game.screen, music, sound]);

  useEffect(() => {
    if (!audio.current) return;
    const now = audio.current.context.currentTime;
    audio.current.musicGain.gain.setTargetAtTime(music ? 0.68 : 0, now, 0.18);
    audio.current.sfxGain.gain.setTargetAtTime(sound ? 0.7 : 0, now, 0.18);
  }, [music, sound]);
  useEffect(() => {
    if (!audio.current) return;
    const level = game.screen === 'caught' ? 1 : game.screen === 'game' ? 0.95 : 0.38;
    audio.current.chaseGain.gain.setTargetAtTime(level, audio.current.context.currentTime, 0.35);
  }, [game.screen]);
  useEffect(() => {
    if (game.screen !== 'caught' || !audio.current || !sound) return;
    const { context, sfxGain } = audio.current;
    const now = context.currentTime;
    const roar = context.createOscillator();
    const roarBody = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    roar.type = 'sawtooth';
    roar.frequency.setValueAtTime(145, now);
    roar.frequency.exponentialRampToValueAtTime(46, now + 1.35);
    roarBody.type = 'triangle';
    roarBody.frequency.setValueAtTime(73, now);
    roarBody.frequency.exponentialRampToValueAtTime(38, now + 1.5);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 1.5);
    envelope.gain.setValueAtTime(0.001, now);
    envelope.gain.linearRampToValueAtTime(0.5, now + 0.18);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 1.55);
    roar.connect(filter);
    roarBody.connect(filter);
    filter.connect(envelope);
    envelope.connect(sfxGain);
    roar.start(now);
    roarBody.start(now);
    roar.stop(now + 1.6);
    roarBody.stop(now + 1.6);
  }, [game.screen, sound]);
  useEffect(() => () => {
    if (audio.current) audio.current.context.close();
  }, []);

  useEffect(() => {
    const saved = readProfile();
    if (saved) setProfile(saved);
    fetch(`${API}/health`).then(async (response) => {
      if (!response.ok) throw new Error('Account service unavailable');
      const health = await response.json();
      if (!health.databaseConfigured) return;
      const session = await fetch(`${API}/auth/me`);
      if (!session.ok) return;
      const data = await session.json();
      setProfile(makeProfile(data.user));
    }).catch(() => {});
    return () => clearTimeout(noticeTimer.current);
  }, []);

  const persist = useCallback((next) => {
    setProfile(next);
    writeProfile(next);
  }, []);

  const startRun = useCallback(() => {
    startAudio();
    finalizedRun.current = false;
    nextId.current = 0;
    spawnIn.current = 1.2;
    quakeIn.current = 30 + Math.random() * 28;
    setPanel(null);
    setGame(createRun());
  }, [startAudio]);
  const finishRun = useCallback((current) => {
    if (finalizedRun.current) return;
    finalizedRun.current = true;
    const next = {
      ...profile, coins: profile.coins + current.runCoins, keys: profile.keys + current.keys,
      best: Math.max(profile.best, current.score), totalDistance: profile.totalDistance + current.distance,
    };
    persist(next);
    if (profile.email) {
      fetch(`${API}/runs`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: current.score, distance: Math.floor(current.distance), coins: current.runCoins }),
      }).catch(() => inform('Run saved on this device; account stats could not sync'));
    }
    setGame(initialState);
  }, [inform, persist, profile]);

  const move = useCallback((direction) => setGame((current) => {
    if (current.screen !== 'game' || current.paused || !current.running) return current;
    if (direction === 'left' || direction === 'right') return { ...current, lane: Math.max(-1, Math.min(1, current.lane + (direction === 'left' ? -1 : 1))) };
    const action = direction;
    if (action === 'jump' || action === 'slide') {
      if (current.action !== 'run') return current;
      return { ...current, action, actionTime: action === 'jump' ? 0.72 : 0.82 };
    }
    return current;
  }), []);

  const togglePause = useCallback(() => {
    setGame((current) => current.screen === 'game' ? { ...current, paused: !current.paused } : current);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      const key = event.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) event.preventDefault();
      if (key === 'escape' && game.screen === 'game') { togglePause(); return; }
      if (['arrowleft', 'a'].includes(key)) move('left');
      if (['arrowright', 'd'].includes(key)) move('right');
      if (['arrowup', 'w', ' '].includes(key)) move('jump');
      if (['arrowdown', 's'].includes(key)) move('slide');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [game.screen, move, togglePause]);

  useEffect(() => {
    if (game.screen !== 'game' || game.paused) return undefined;
    const timer = setInterval(() => {
      setGame((current) => {
        if (current.screen !== 'game' || current.paused || !current.running) return current;
        const dt = 0.1;
        const baseSpeed = Math.min(10, 6 + Math.floor(current.distance / 300));
        const speed = Math.min(10, baseSpeed + (current.boost > 0 ? 1.5 : 0));
        const distance = current.distance + speed * dt;
        let entities = current.entities;
        let runCoins = current.runCoins;
        let keys = current.keys;
        let shield = current.shield;
        let magnet = Math.max(0, current.magnet - dt);
        let multiplier = Math.max(0, current.multiplier - dt);
        let boost = Math.max(0, current.boost - dt);
        let invincible = Math.max(0, current.invincible - dt);
        let quake = Math.max(0, current.quake - dt);
        let quakeWarning = Math.max(0, current.quakeWarning - dt);
        let action = current.action === 'run' ? 'run' : (current.actionTime || 0) <= dt ? 'run' : current.action;
        let actionTime = action === 'run' ? 0 : (current.actionTime || 0) - dt;
        let running = current.running;
        let screen = current.screen;
        let collision = false;
        let nextSpawn = spawnIn.current - dt;
        let nextQuake = quakeIn.current - dt;
        if (nextSpawn <= 0) {
          const difficulty = Math.min(0.7, distance / 900);
          const roll = Math.random();
          const powerups = ['key', 'magnet', 'shield', 'multiplier', 'boost', 'invincible'];
          const obstacles = ['barrier', 'rock', 'fire', 'tree', 'pillar', 'spikes', 'log', 'gap', 'branch'];
          const type = roll < 0.42 - difficulty * 0.06
            ? 'coin'
            : roll < 0.54 ? powerups[Math.floor(Math.random() * powerups.length)]
              : obstacles[Math.floor(Math.random() * obstacles.length)];
          const lane = Math.floor(Math.random() * 3) - 1;
          if (type === 'coin') {
            for (let i = 0; i < 4; i++) entities.push({ id: nextId.current++, type, lane, at: distance + 14 + i * 2.4 });
          } else {
            entities.push({ id: nextId.current++, type, lane, at: distance + 17 + Math.random() * 3 });
          }
          nextSpawn = Math.max(0.72, 1.65 - distance / 5000) + Math.random() * 0.45;
        }
        if (nextQuake <= 0 && quake <= 0 && quakeWarning <= 0) {
          quakeWarning = 2.6;
          nextQuake = 42 + Math.random() * 48;
        } else if (current.quakeWarning > 0 && quakeWarning <= 0) {
          quake = 4;
          inform('EARTHQUAKE! Keep moving!');
        }
        if (current.quake > 0) quakeIn.current = 32 + Math.random() * 48;

        entities = entities.filter((entity) => {
          const relativeDistance = entity.at - distance;
          if (relativeDistance < -1.5) return false;
          const reachedPickup = relativeDistance <= 1.25 && relativeDistance >= -1.5;
          const magnetPickup = entity.type === 'coin' && magnet > 0 && relativeDistance <= 12 && relativeDistance >= -1.5;
          if (entity.type === 'coin' && (magnetPickup || (reachedPickup && entity.lane === current.lane))) {
            runCoins += multiplier > 0 ? 2 : 1;
            return false;
          }
          if (!reachedPickup || entity.lane !== current.lane) return true;
          if (entity.type === 'key') keys += 1;
          else if (entity.type === 'magnet') { magnet = 30; inform('Coin magnet active · 30 seconds'); }
          else if (entity.type === 'shield') { shield = true; inform('Shield charged · one hit protected'); }
          else if (entity.type === 'multiplier') { multiplier = 20; inform('2× coin multiplier active'); }
          else if (entity.type === 'boost') { boost = 8; inform('Speed burst!'); }
          else if (entity.type === 'invincible') { invincible = 6; inform('Ancient blessing · invincible'); }
          else if (['barrier', 'rock', 'fire', 'tree', 'pillar', 'spikes', 'log', 'gap', 'branch'].includes(entity.type)) {
            const needsSlide = entity.type === 'barrier' || entity.type === 'log' || entity.type === 'branch';
            const avoided = needsSlide ? action === 'slide' : action === 'jump';
            if (!avoided) {
              if (shield) { shield = false; inform('Shield absorbed the impact'); }
              else if (invincible <= 0) { collision = true; running = false; screen = 'caught'; action = 'caught'; }
            }
          }
          return false;
        });
        if (action !== 'run' && actionTime <= 0) action = 'run';
        if (collision) inform('The T-Rex is right behind you!');
        if (screen === 'caught') return { ...current, screen: 'caught', running: false, paused: false, distance, score: Math.floor(distance * 10), runCoins, keys, action: 'caught', actionTime: 0, revive: 10 };
        spawnIn.current = nextSpawn;
        quakeIn.current = nextQuake;
        const oldMilestone = Math.floor(current.distance / 300);
        const newMilestone = Math.floor(distance / 300);
        const nextBaseSpeed = Math.min(10, 6 + newMilestone);
        if (newMilestone > oldMilestone && nextBaseSpeed > Math.min(10, 6 + oldMilestone)) {
          inform(`SPEED UP · ${nextBaseSpeed.toFixed(1)} m/s`);
        }
        return { ...current, distance, score: Math.floor(distance * 10), runCoins, keys, shield, magnet, multiplier, boost, invincible, quake, quakeWarning, speed, entities, action, actionTime, running };
      });
    }, 100);
    return () => clearInterval(timer);
  }, [game.screen, game.paused, inform]);

  useEffect(() => {
    if (game.screen !== 'caught') return undefined;
    const timer = setTimeout(() => setGame((current) => current.screen === 'caught' ? { ...current, screen: 'over', revive: 10 } : current), 2200);
    return () => clearTimeout(timer);
  }, [game.screen]);

  useEffect(() => {
    if (game.screen !== 'over') return undefined;
    const timer = setInterval(() => setGame((current) => current.screen === 'over' ? { ...current, revive: Math.max(0, current.revive - 1) } : current), 1000);
    return () => clearInterval(timer);
  }, [game.screen]);
  useEffect(() => {
    if (game.screen === 'over' && game.revive <= 0) {
      finishRun(game);
      setPanel(null);
    }
  }, [finishRun, game, game.revive, game.screen]);

  const revive = () => {
    if (!profile.keys && !game.keys) { inform('Collect a golden key to revive'); return; }
    if (!game.keys) persist({ ...profile, keys: profile.keys - 1 });
    setGame((current) => ({ ...current, screen: 'game', running: true, paused: false, shield: true, keys: Math.max(0, current.keys - 1), revive: 10 }));
    inform('Back in the run · shield granted');
  };

  const buySkin = (item) => {
    if (unlocked.has(item.id)) {
      persist({ ...profile, selectedSkin: item.id });
      inform(`${item.name} equipped`);
    } else if (profile.coins >= item.price) {
      persist({ ...profile, coins: profile.coins - item.price, skins: [...profile.skins, item.id], selectedSkin: item.id });
      inform(`${item.name} unlocked and equipped`);
    } else inform(`You need ${item.price - profile.coins} more coins`);
  };
  const changeGender = (gender) => {
    const availableSkin = skins.find((item) => item.gender === gender && profile.skins.includes(item.id));
    const next = { ...profile, gender, selectedSkin: availableSkin?.id || (gender === 'female' ? 'f-0' : 'm-0') };
    persist(next);
    setSkinGender(gender);
  };
  const openArmory = () => {
    setSkinGender(profile.gender);
    setPanel('skins');
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    if (auth.mode === 'signup' && auth.password !== auth.confirm) {
      setAuth((value) => ({ ...value, error: 'Passwords do not match' }));
      return;
    }
    setAuth((value) => ({ ...value, busy: true, error: '' }));
    try {
      const response = await fetch(`${API}/auth/${auth.mode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: auth.name, username: auth.username, email: auth.email, password: auth.password, gender: auth.gender }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Account request failed');
      const next = makeProfile(data.user);
      persist(next);
      setPanel(null);
      inform(auth.mode === 'signup' ? 'Welcome to the jungle' : 'Welcome back, runner');
    } catch (error) {
      setAuth((value) => ({ ...value, error: error.message }));
    } finally { setAuth((value) => ({ ...value, busy: false })); }
  };

  const logout = async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST' }).catch(() => {});
    const guest = makeProfile();
    persist(guest);
    setPanel(null);
    inform('Signed out');
  };

  const panelTitle = panel === 'skins' ? 'The armory' : panel === 'leaderboard' ? 'Hall of legends' : panel === 'settings' ? 'Game settings' : panel === 'profile' ? 'Runner profile' : panel === 'auth' ? 'Your account' : '';
  const gameProps = { distance: game.distance, entities: game.entities, lane: game.lane, action: game.action, skin, paused: game.paused, quake: game.quake, speed: game.speed, menu: game.screen === 'menu' };

  return (
    <main className="app-shell" onPointerDownCapture={startAudio}>
      <div className={`world-stage ${game.screen === 'game' || game.screen === 'caught' || game.screen === 'over' ? 'world-stage--active' : ''} ${game.quake > 0 ? 'world-stage--quake' : ''}`}>
        <GameWorld {...gameProps} />
        <div className="stage-vignette" />
      </div>
      {game.screen === 'menu' && (
        <div className="menu-view">
          <header className="topbar">
            <button className="brand" onClick={() => setPanel(null)} aria-label="Home"><span className="brand-mark">T</span><span>T-REX <b>SURVIVAL</b></span></button>
            <nav className="top-nav">
              <button onClick={openArmory}>ARMORY</button>
              <button onClick={() => setPanel('leaderboard')}>LEADERBOARD</button>
              <button onClick={() => setPanel('settings')}>SETTINGS</button>
            </nav>
            <button className="account-chip" onClick={() => setPanel('profile')}><span className="avatar">{profile.username.slice(0, 1).toUpperCase()}</span><span>{profile.username}</span><span className="coin-mini">◈ {profile.coins}</span></button>
          </header>
          <section className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> THE TEMPLE IS WAKING <span className="eyebrow-line" /></div>
            <h1>RUN FOR<br /><em>YOUR LIFE.</em></h1>
            <p>Ancient gold. Lost temples. One very hungry T-Rex.<br />How far can you make it?</p>
            <div className="hero-actions">
              <button className="button button--primary button--large" onClick={startRun}><Icon name="play" /> START RUN <Icon name="arrow" /></button>
              <button className="button button--ghost" onClick={openArmory}>CHOOSE RUNNER</button>
            </div>
            <div className="hero-stats">
              <div><small>PERSONAL BEST</small><strong>{profile.best.toLocaleString()}</strong><span>POINTS</span></div>
              <div><small>BEST DISTANCE</small><strong>{Math.floor(profile.totalDistance).toLocaleString()}<i>m</i></strong><span>OVER ALL RUNS</span></div>
              <div><small>RUNNER'S PURSE</small><strong className="gold-text">◈ {profile.coins.toLocaleString()}</strong><span>GOLD COLLECTED</span></div>
            </div>
          </section>
          <div className="hero-caption"><span className="caption-dot" /> CHAPTER I — THE FORGOTTEN CANOPY <span>01 / 04</span></div>
          <button className="sound-toggle" onClick={() => { startAudio(); setSound(!sound); }} aria-label="Toggle sound"><Icon name="sound" /> {sound ? 'SOUND ON' : 'SOUND OFF'}</button>
          <footer className="site-footer"><span>CRAFTED WITH PASSION · BY VIGHNESH</span><span>© 2026 ALL RIGHTS RESERVED</span></footer>
        </div>
      )}
      {game.screen === 'game' && (
        <section className="game-hud">
          <div className="hud-top">
            <button className="hud-pause" onClick={togglePause}><Icon name="pause" /> <span>PAUSE</span></button>
            <div className="hud-score"><small>RUN SCORE</small><strong>{game.score.toLocaleString()}</strong></div>
            <div className="hud-stat"><span>◈</span><strong>{game.runCoins}</strong><small>RUN COINS</small></div>
            <div className="hud-stat"><span>⚿</span><strong>{profile.keys + game.keys}</strong><small>KEYS</small></div>
          </div>
          <div className="hud-bottom">
            <div className="hud-distance"><span>DISTANCE</span><strong>{Math.floor(game.distance)}<small> M</small></strong></div>
            <div className="hud-powerups">
              {game.magnet > 0 && <span className="power-pill power-pill--teal">✳ MAGNET {Math.ceil(game.magnet)}s</span>}
              {game.multiplier > 0 && <span className="power-pill">2× COINS</span>}
              {game.shield && <span className="power-pill power-pill--blue">◇ SHIELD</span>}
              {game.boost > 0 && <span className="power-pill">SPEED {Math.ceil(game.boost)}s</span>}
              {game.invincible > 0 && <span className="power-pill">BLESSING</span>}
            </div>
            <div className="hud-speed"><span>PACE</span><div className="pace-track"><i style={{ width: `${Math.min(100, game.speed * 10)}%` }} /></div><strong>{game.speed.toFixed(1)} m/s</strong></div>
          </div>
          {game.quakeWarning > 0 && <div className="quake-alert">⚠ EARTHQUAKE INCOMING</div>}
          <div className="touch-controls">
            <button onPointerDown={(event) => { event.preventDefault(); move('left'); }}>‹</button>
            <button onPointerDown={(event) => { event.preventDefault(); move('right'); }}>›</button>
            <button onPointerDown={(event) => { event.preventDefault(); move('slide'); }}>SLIDE</button>
            <button onPointerDown={(event) => { event.preventDefault(); move('jump'); }}>JUMP</button>
          </div>
          {game.paused && <div className="overlay-card pause-card"><div className="eyebrow">CATCH YOUR BREATH</div><h2>PAUSED</h2><p>The jungle waits for no one.</p><button className="button button--primary" onClick={togglePause}>RESUME RUN</button><button className="button button--ghost" onClick={() => { finishRun(game); startRun(); }}>RESTART RUN</button><button className="button button--text" onClick={() => finishRun(game)}>RETURN TO CAMP</button></div>}
        </section>
      )}
      {game.screen === 'caught' && <div className="catch-caption"><span>THE T-REX CAUGHT YOU</span><i>RUN OVER</i></div>}
      {game.screen === 'over' && (
        <div className="overlay-screen">
          <div className="overlay-card gameover-card"><div className="eyebrow"><span className="eyebrow-line" /> THE CHASE ENDS <span className="eyebrow-line" /></div><h2>RUN<br /><em>OVER.</em></h2><p>The jungle got the better of you this time.</p><div className="results-grid"><div><small>SCORE</small><strong>{game.score.toLocaleString()}</strong></div><div><small>DISTANCE</small><strong>{Math.floor(game.distance)}m</strong></div><div><small>GOLD FOUND</small><strong>◈ {game.runCoins}</strong></div></div><button className="button button--primary button--large" onClick={revive}>REVIVE WITH A KEY <span>⚿ {profile.keys + game.keys}</span></button><div className="revive-time">RETURNING TO CAMP IN <b>{game.revive}s</b></div><button className="button button--ghost" onClick={() => { finishRun(game); startRun(); }}>RUN AGAIN</button></div>
        </div>
      )}
      {panel && game.screen === 'menu' && (
        <div className="panel-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPanel(null); }}>
          <section className={`side-panel ${panel === 'skins' ? 'side-panel--wide' : ''}`}>
            <button className="panel-close" onClick={() => setPanel(null)} aria-label="Close"><Icon name="close" /></button>
            <div className="eyebrow"><span className="eyebrow-line" /> T-REX SURVIVAL</div>
            <h2>{panelTitle}</h2>
            {panel === 'skins' && <><div className="store-header"><span>Choose your legend</span><b>◈ {profile.coins.toLocaleString()}</b></div><div className="gender-switch" role="group" aria-label="Runner gender"><button className={skinGender === 'male' ? 'active' : ''} onClick={() => changeGender('male')}>MALE RUNNER</button><button className={skinGender === 'female' ? 'active' : ''} onClick={() => changeGender('female')}>FEMALE RUNNER</button></div><div className="skin-grid">{skins.filter((item) => item.gender === skinGender).map((item) => <article className={`skin-card ${item.id === skin.id ? 'skin-card--selected' : ''}`} key={item.id}><div className="skin-portrait" style={{ '--skin-color': item.color }}><span className="portrait-head" /><span className="portrait-body" /><span className="portrait-glow" /></div><div className="skin-meta"><small>{item.gender.toUpperCase()}</small><b>{item.name}</b></div><button className={`skin-buy ${unlocked.has(item.id) ? 'skin-buy--owned' : ''}`} onClick={() => buySkin(item)}>{item.id === skin.id ? 'EQUIPPED' : unlocked.has(item.id) ? 'EQUIP' : `◈ ${item.price.toLocaleString()}`}</button></article>)}</div></>}
            {panel === 'leaderboard' && <div className="empty-board"><div className="empty-icon"><Icon name="trophy" /></div><h3>Your next run writes history.</h3><p>Personal bests are saved on this device. Sign in to keep your identity between sessions.</p><div className="leader-row"><span>01</span><b>{profile.username}</b><strong>{profile.best.toLocaleString()} pts</strong></div></div>}
            {panel === 'settings' && <div className="settings-list"><p>Make the jungle yours.</p><label><span><b>Sound effects</b><small>Coins, movement and warnings</small></span><input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /></label><label><span><b>Music</b><small>Ambient jungle atmosphere</small></span><input type="checkbox" checked={music} onChange={(e) => setMusic(e.target.checked)} /></label><div className="control-help"><b>CONTROLS</b><p>← → or A / D <span>Switch lanes</span></p><p>↑ / W / SPACE <span>Jump</span></p><p>↓ / S <span>Slide</span></p><p>ESC <span>Pause the run</span></p></div></div>}
            {panel === 'profile' && <div className="profile-content"><div className="profile-avatar">{profile.username.slice(0, 1).toUpperCase()}</div><h3>{profile.username}</h3><p>{profile.email || 'Playing as a local runner'}</p><div className="profile-stats"><div><small>BEST</small><b>{profile.best.toLocaleString()}</b></div><div><small>GOLD</small><b>◈ {profile.coins.toLocaleString()}</b></div><div><small>KEYS</small><b>⚿ {profile.keys}</b></div><div><small>SKINS</small><b>{profile.skins.length} / {skins.length}</b></div></div>{profile.email ? <button className="button button--ghost" onClick={logout}>SIGN OUT</button> : <button className="button button--primary" onClick={() => { setPanel('auth'); setAuth((value) => ({ ...value, mode: 'login' })); }}>SIGN IN / CREATE ACCOUNT</button>}</div>}
            {panel === 'auth' && <div className="auth-content"><div className="auth-tabs"><button className={auth.mode === 'login' ? 'active' : ''} onClick={() => setAuth((v) => ({ ...v, mode: 'login', error: '' }))}>SIGN IN</button><button className={auth.mode === 'signup' ? 'active' : ''} onClick={() => setAuth((v) => ({ ...v, mode: 'signup', error: '' }))}>CREATE ACCOUNT</button></div><form onSubmit={submitAuth}>{auth.mode === 'signup' && <><label>FULL NAME<input required maxLength="80" value={auth.name} onChange={(e) => setAuth((v) => ({ ...v, name: e.target.value }))} /></label><label>RUNNER NAME<input required minLength="3" maxLength="24" value={auth.username} onChange={(e) => setAuth((v) => ({ ...v, username: e.target.value }))} /></label></>}<label>EMAIL<input required type="email" autoComplete="email" value={auth.email} onChange={(e) => setAuth((v) => ({ ...v, email: e.target.value }))} /></label><label>PASSWORD<input required minLength="8" type="password" autoComplete={auth.mode === 'signup' ? 'new-password' : 'current-password'} value={auth.password} onChange={(e) => setAuth((v) => ({ ...v, password: e.target.value }))} /></label>{auth.mode === 'signup' && <><label>CONFIRM PASSWORD<input required type="password" value={auth.confirm} onChange={(e) => setAuth((v) => ({ ...v, confirm: e.target.value }))} /></label><label>CHARACTER<select value={auth.gender} onChange={(e) => setAuth((v) => ({ ...v, gender: e.target.value }))}><option value="male">Male runner</option><option value="female">Female runner</option></select></label></>}{auth.error && <div className="form-error">{auth.error}</div>}<button disabled={auth.busy} className="button button--primary button--full">{auth.busy ? 'CONNECTING…' : auth.mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}</button><div className="auth-note">Account service requires a configured Neon database.</div></form></div>}
          </section>
        </div>
      )}
      {notice && <div className="toast">{notice}</div>}
    </main>
  );
}

export default App;
