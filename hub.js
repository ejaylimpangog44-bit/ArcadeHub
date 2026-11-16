// Toggle Assistive Touch Fox Menu
const foxWidget = document.getElementById('assistive-touch-fox');
const foxModal = document.getElementById('fox-menu-modal');
const closeFoxBtn = document.getElementById('close-fox-menu');

if (foxWidget && foxModal) {
  foxWidget.onclick = () => {
    foxModal.classList.remove('hidden');
    foxModal.classList.add('flex');
    if (typeof AudioFX !== 'undefined') AudioFX.click();
  };
}

if (closeFoxBtn && foxModal) {
  closeFoxBtn.onclick = () => {
    foxModal.classList.remove('flex');
    foxModal.classList.add('hidden');
    if (typeof AudioFX !== 'undefined') AudioFX.click();
  };
}

// Make the Assistive Touch Fox draggable anywhere on screen
if (foxWidget) {
  let isDragging = false;
  let startX, startY, initialX, initialY;

  foxWidget.onpointerdown = (e) => {
    isDragging = false;
    startX = e.clientX;
    startY = e.clientY;
    initialX = foxWidget.offsetLeft;
    initialY = foxWidget.offsetTop;
    foxWidget.setPointerCapture(e.pointerId);
  };

  foxWidget.onpointermove = (e) => {
    if (!startX || !startY) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.hypot(dx, dy) > 6) {
      isDragging = true;
      foxWidget.style.left = `${initialX + dx}px`;
      foxWidget.style.top = `${initialY + dy}px`;
      foxWidget.style.right = 'auto';
      foxWidget.style.bottom = 'auto';
    }
  };

  foxWidget.onpointerup = (e) => {
    if (!isDragging) {
      if (foxModal) {
        foxModal.classList.remove('hidden');
        foxModal.classList.add('flex');
      }
      if (typeof AudioFX !== 'undefined') AudioFX.click();
    }
    startX = null;
    startY = null;
  };
}

const AudioFX = (() => {
  let ctx = null;
  let sfxEnabled = true;

  function ensure() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function playTone(freq = 440, type = 'sine', duration = 0.12, gainVal = 0.12, slideTo = null) {
    if (!sfxEnabled) return;
    try {
      ensure();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  return {
    get enabled() { return sfxEnabled; },
    toggle() { sfxEnabled = !sfxEnabled; return sfxEnabled; },
    click() { playTone(620, 'triangle', 0.06, 0.08); },
    card() { playTone(380, 'sine', 0.07, 0.09, 520); },
    coin() { playTone(987.77, 'sine', 0.08, 0.1); setTimeout(() => playTone(1318.5, 'sine', 0.16, 0.1), 65); },
    win() {
      [523.25, 659.25, 783.99, 1046.5].forEach((n, i) => setTimeout(() => playTone(n, 'triangle', 0.18, 0.12), i * 80));
    },
    lose() {
      [330, 277, 220].forEach((n, i) => setTimeout(() => playTone(n, 'sawtooth', 0.18, 0.08), i * 110));
    },
    slice() { playTone(900, 'sawtooth', 0.09, 0.09, 240); },
    hit() { playTone(160, 'square', 0.11, 0.12, 65); },
    jump() { playTone(280, 'sine', 0.14, 0.1, 620); },
    note(midi) {
      const f = 440 * Math.pow(2, (midi - 69) / 12);
      playTone(f, 'triangle', 0.28, 0.14);
    }
  };
})();

const SupabaseDB = (() => {
  const SUPABASE_URL = 'https://nrlfudwhnncycjcyupgt.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_TFyTpbQI_sWvPT4G6HEpmQ_ANYNTYfW';
  let client = null;

  function init() {
    if (window.supabase && !client) {
      try {
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } catch (e) {}
    }
  }

  async function submitScore(gameId, score, playerName = window.playerName || 'AJ') {
    init();
    if (!client) return;
    try {
      await client.from('high_scores').insert([{ game_id: gameId, score, player_name: playerName, created_at: new Date() }]);
    } catch (e) {}
  }

  async function fetchHighScores(gameId) {
    init();
    if (!client) return [];
    try {
      const { data } = await client.from('high_scores').select('*').eq('game_id', gameId).order('score', { ascending: false }).limit(5);
      return data || [];
    } catch (e) {
      return [];
    }
  }

  return { submitScore, fetchHighScores };
})();

let bgmEnabled = true;

function toggleBGM() {
  bgmEnabled = !bgmEnabled;
  const bgm = document.getElementById('bgm-audio');
  const btn = document.getElementById('bgm-toggle-btn');
  if (bgm) {
    if (bgmEnabled) {
      bgm.play().catch(() => {});
    } else {
      bgm.pause();
    }
  }
  if (btn) {
    btn.textContent = bgmEnabled ? 'ON' : 'OFF';
    btn.className = bgmEnabled
      ? 'px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs transition'
      : 'px-4 py-2 rounded-xl bg-slate-700 text-slate-300 font-extrabold text-xs transition';
  }
  AudioFX.click();
}

function updateBGMVolume(val) {
  const bgm = document.getElementById('bgm-audio');
  const label = document.getElementById('bgm-vol-label');
  if (bgm) bgm.volume = Number(val) / 100;
  if (label) label.textContent = `${val}%`;
}

function toggleSFX() {
  const on = AudioFX.toggle();
  const btn = document.getElementById('sfx-toggle-btn');
  if (btn) {
    btn.textContent = on ? 'ON' : 'OFF';
    btn.className = on
      ? 'px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs transition'
      : 'px-4 py-2 rounded-xl bg-slate-700 text-slate-300 font-extrabold text-xs transition';
  }
  if (on) AudioFX.click();
}

let qrGenerated = false;
function openSettingsModal() {
  AudioFX.click();
  const modal = document.getElementById('settings-modal');
  if (!qrGenerated && window.QRCode) {
    const container = document.getElementById('qrcode-container');
    if (container) {
      container.innerHTML = '';
      new QRCode(container, {
        text: 'https://arcadehubgames-july12.vercel.app/',
        width: 170,
        height: 170,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
      qrGenerated = true;
    }
  }
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeSettingsModal() {
  AudioFX.click();
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function copyHubLink() {
  navigator.clipboard?.writeText('https://arcadehubgames-july12.vercel.app/');
  const btn = document.getElementById('copy-link-btn');
  if (btn) {
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = '📋 Copy URL'; }, 1600);
  }
  AudioFX.coin();
}

function toggleFullScreen() {
  AudioFX.click();
  const docEl = document.documentElement;
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

function syncFullscreenLabel() {
  const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  const label = document.getElementById('fs-label');
  const icon = document.getElementById('fs-icon');
  if (label) label.textContent = isFs ? 'Exit Fullscreen Display' : 'Toggle Fullscreen Display';
  if (icon) icon.textContent = isFs ? '🗗' : '⛶';
}
document.addEventListener('fullscreenchange', syncFullscreenLabel);
document.addEventListener('webkitfullscreenchange', syncFullscreenLabel);

// Background Music Auto Pause/Resume on Browser Tab / Window Focus Loss
document.addEventListener('visibilitychange', () => {
  const bgm = document.getElementById('bgm-audio');
  if (!bgm) return;
  if (document.hidden) {
    if (!bgm.paused) {
      bgm.dataset.wasPlaying = 'true';
      bgm.pause();
    }
  } else {
    if (bgm.dataset.wasPlaying === 'true' && bgmEnabled) {
      bgm.play().catch(() => {});
      delete bgm.dataset.wasPlaying;
    }
  }
});

window.addEventListener('blur', () => {
  const bgm = document.getElementById('bgm-audio');
  if (bgm && !bgm.paused) {
    bgm.dataset.wasPlaying = 'true';
    bgm.pause();
  }
});

window.addEventListener('focus', () => {
  const bgm = document.getElementById('bgm-audio');
  if (bgm && bgm.dataset.wasPlaying === 'true' && bgmEnabled) {
    bgm.play().catch(() => {});
    delete bgm.dataset.wasPlaying;
  }
});

window.playerName = 'AJ';
const RANDOM_NAMES = ['CyberGamer', 'PixelNinja', 'ArcadeLegend', 'NeonFox', 'RetroMaster', 'BitHero', 'SpeedRunner', 'GlitchWizard'];

function randomizePlayerName() {
  const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)] + Math.floor(10 + Math.random() * 89);
  document.getElementById('player-name-input').value = randomName;
}

function submitPlayerName() {
  const input = document.getElementById('player-name-input').value.trim();
  if (input) {
    window.playerName = input;
  } else {
    window.playerName = 'Player_' + Math.floor(100 + Math.random() * 899);
  }
  document.getElementById('header-player-name').textContent = window.playerName;
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  AudioFX.click();
  const bgm = document.getElementById('bgm-audio');
  if (bgm && bgmEnabled) {
    bgm.volume = 0.5;
    bgm.play().catch(() => {});
  }
  openHubHome();
}

let userXP = 2118;
function addXP(amount, x = window.innerWidth / 2, y = window.innerHeight / 2, label = null) {
  userXP += amount;
  const lvl = Math.floor(userXP / 350) + 1;
  const xpEl = document.getElementById('hud-xp');
  const lvlEl = document.getElementById('hud-lvl');
  if (xpEl) xpEl.textContent = userXP.toLocaleString();
  if (lvlEl) lvlEl.textContent = lvl;
  spawnPopup(label || `+${amount} XP`, x, y, '#fbbf24');
}

function spawnPopup(text, x, y, color = '#38bdf8') {
  const el = document.createElement('div');
  el.className = 'score-popup text-sm sm:text-base tracking-wide';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

const GAMES = [
  { id: 'solitaire', num: 1, name: 'Speed Solitaire', cat: 'Card', icon: '🃏', envName: 'Emerald Velvet Casino Table', bg: 'radial-gradient(circle at 50% 35%, #0f5132 0%, #062c1b 65%, #02140c 100%)', theme: 'casino_green' },
  { id: 'coinscatter', num: 2, name: 'Coin Scatter v2', cat: 'Card', icon: '🎰', envName: 'Golden Vault & Neon Chamber', bg: 'radial-gradient(circle at 50% 25%, #451a03 0%, #1c0a00 60%, #090300 100%)', theme: 'gold_vault' },
  { id: 'blackjack', num: 3, name: 'Blackjack 21', cat: 'Card', icon: '🂡', envName: 'VIP Mahogany & Royal Felt', bg: 'radial-gradient(circle at 50% 20%, #134e4a 0%, #042f2e 55%, #021312 100%)', theme: 'vip_table' },
  { id: 'highlow', num: 4, name: 'High-Low', cat: 'Card', icon: '🔼', envName: 'Midnight Crimson Lounge', bg: 'radial-gradient(circle at 50% 30%, #4c0519 0%, #1f040d 65%, #0a0104 100%)', theme: 'crimson_lounge' },
  { id: 'chess', num: 5, name: 'Chess', cat: 'Board', icon: '♟️', envName: 'Grandmaster Mahogany Study', bg: 'radial-gradient(circle at 50% 30%, #3e2723 0%, #1b100e 70%, #0c0706 100%)', theme: 'wood_study' },
  { id: 'dama', num: 6, name: 'Dama', cat: 'Board', icon: '🔴', envName: 'Sunlit Narra & Bamboo Veranda', bg: 'radial-gradient(circle at 50% 25%, #5c3a21 0%, #2b180c 65%, #120904 100%)', theme: 'bamboo_sun' },
  { id: 'tictactoe', num: 7, name: 'Tic-Tac-Toe', cat: 'Puzzle', icon: '❌', envName: 'Chalkboard & Neon Laser Grid', bg: 'radial-gradient(circle at 50% 50%, #111827 0%, #060913 100%)', theme: 'neon_chalk' },
  { id: 'numberguess', num: 8, name: 'Number Guess', cat: 'Puzzle', icon: '🔢', envName: 'Cryptographic Matrix Vault', bg: 'radial-gradient(circle at 50% 30%, #052e16 0%, #02120a 70%, #000804 100%)', theme: 'matrix_vault' },
  { id: 'wordscape', num: 9, name: 'Wordscape Pro', cat: 'Puzzle', icon: '📝', envName: 'Sunset Mountain Valley Sky', bg: 'linear-gradient(180deg, #1e1b4b 0%, #4c1d95 38%, #be185d 75%, #f59e0b 100%)', theme: 'sunset_valley' },
  { id: 'pianotiles', num: 10, name: 'Piano Tiles', cat: 'Action', icon: '🎹', envName: 'Grand Spotlight Concert Hall', bg: 'radial-gradient(circle at 50% 0%, #312e81 0%, #0f172a 55%, #020617 100%)', theme: 'concert_hall' },
  { id: 'fruitmaster', num: 11, name: 'Fruit Master', cat: 'Action', icon: '🍉', envName: 'Tropical Bamboo & Sakura Dojo', bg: 'linear-gradient(160deg, #14532d 0%, #1e3a2f 45%, #3f2e21 100%)', theme: 'bamboo_dojo' },
  { id: 'whackamole', num: 12, name: 'Whack-a-Mole', cat: 'Action', icon: '🔨', envName: 'Sunlit Meadow & Garden Hills', bg: 'linear-gradient(180deg, #0284c7 0%, #38bdf8 42%, #16a34a 43%, #14532d 100%)', theme: 'sunny_meadow' },
  { id: 'cybersnake', num: 13, name: 'Cyber Snake', cat: 'Action', icon: '🐍', envName: 'Original Version Preserved', bg: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #090a10 100%)', theme: 'preserved', locked: true },
  { id: 'towerstack', num: 14, name: 'Tower Stack', cat: 'Action', icon: '🏗️', envName: 'Twilight Skyline to Stratosphere', bg: 'linear-gradient(160deg, #090d16 0%, #1e1b4b 45%, #6d28d9 80%, #f43f5e 100%)', theme: 'skyline_climb' },
  { id: 'carracing', num: 15, name: 'Car Racing', cat: 'Racing', icon: '🏎️', envName: 'Neon Sunset Canyon Highway', bg: 'linear-gradient(160deg, #0f0722 0%, #3b0764 42%, #be123c 55%, #090a0f 56%)', theme: 'synth_highway' },
  { id: 'brickbreaker', num: 16, name: 'Brick Breaker', cat: 'Racing', icon: '🧱', envName: 'Cosmic Synthwave Core', bg: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #090d16 65%, #03050a 100%)', theme: 'cosmic_core' },
  { id: 'stickrun', num: 17, name: 'Stick Run', cat: 'Runner', icon: '🏃', envName: 'Sunlit Park & Rooftop Horizon', bg: 'linear-gradient(180deg, #0ea5e9 0%, #7dd3fc 58%, #fef08a 74%, #1e293b 75%)', theme: 'stick_world' }
];

function launchGame(id) {
  const meta = GAMES.find(g => g.id === id);
  if (!meta) return;
  AudioFX.click();

  if (activeCleanup) {
    try { activeCleanup(); } catch (e) {}
    activeCleanup = null;
  }

  activeGameId = id;

  document.getElementById('hub-header').classList.add('hidden');
  document.getElementById('universal-game-bar').classList.remove('hidden');

  document.getElementById('app-shell').style.background = meta.bg;
  BgEngine.setTheme(meta.theme);

  const stage = document.getElementById('game-stage');
  stage.classList.add('in-game');
  stage.innerHTML = '';

  const runners = {
    solitaire: initSpeedSolitaire,
    coinscatter: initCoinScatter,
    blackjack: initBlackjack,
    highlow: initHighLow,
    chess: initChess,
    dama: initDama,
    tictactoe: initTicTacToe,
    numberguess: initNumberGuess,
    wordscape: initWordscape,
    pianotiles: initPianoTiles,
    fruitmaster: initFruitMaster,
    whackamole: initWhackAMole,
    cybersnake: initCyberSnakePreserved,
    towerstack: initTowerStack,
    carracing: initCarRacing,
    brickbreaker: initBrickBreaker,
    stickrun: initStickRun
  };

  if (runners[id]) {
    activeCleanup = runners[id](stage, meta) || null;
  }
}
