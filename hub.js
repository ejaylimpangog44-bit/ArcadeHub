
const foxWidget = document.getElementById('assistive-touch-fox');
const foxModal = document.getElementById('fox-menu-modal') || document.getElementById('hero-modal-backdrop');
const closeFoxBtn = document.getElementById('close-fox-menu');

function syncFoxCompanionVisibility() {
  if (!foxWidget) return;
  const appShell = document.getElementById('app-shell');
  const loginScreen = document.getElementById('login-screen');
  const isLoggedIn = Boolean(
    appShell &&
    !appShell.classList.contains('hidden') &&
    (!loginScreen || loginScreen.classList.contains('hidden'))
  );
  foxWidget.classList.toggle('hidden', !isLoggedIn);
  foxWidget.classList.toggle('flex', isLoggedIn);
}

function openFoxCompanionModal() {
  if (typeof window.openHeroModal === 'function') {
    window.openHeroModal();
    return;
  }
  if (foxModal) {
    foxModal.classList.remove('hidden');
    foxModal.classList.add('flex');
  }
}

if (closeFoxBtn && foxModal) {
  closeFoxBtn.onclick = () => {
    foxModal.classList.remove('flex');
    foxModal.classList.add('hidden');
    if (typeof window.AudioFX !== 'undefined') window.AudioFX.click();
  };
}

if (foxWidget) {
  let isDragging = false;
  let startX = null;
  let startY = null;
  let initialX = 0;
  let initialY = 0;

  foxWidget.addEventListener('pointerdown', (e) => {
    isDragging = false;
    startX = e.clientX;
    startY = e.clientY;
    initialX = foxWidget.offsetLeft;
    initialY = foxWidget.offsetTop;
    try {
      foxWidget.setPointerCapture(e.pointerId);
    } catch (_) {}
  });

  foxWidget.addEventListener('pointermove', (e) => {
    if (startX === null || startY === null) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.hypot(dx, dy) > 6) {
      isDragging = true;
      const maxX = Math.max(8, window.innerWidth - foxWidget.offsetWidth - 8);
      const maxY = Math.max(8, window.innerHeight - foxWidget.offsetHeight - 8);
      const clampedX = Math.min(maxX, Math.max(8, initialX + dx));
      const clampedY = Math.min(maxY, Math.max(8, initialY + dy));
      foxWidget.style.left = `${clampedX}px`;
      foxWidget.style.top = `${clampedY}px`;
      foxWidget.style.right = 'auto';
      foxWidget.style.bottom = 'auto';
    }
  });

  foxWidget.addEventListener('pointerup', (e) => {
    if (!isDragging) {
      openFoxCompanionModal();
      if (typeof window.AudioFX !== 'undefined') window.AudioFX.click();
    }
    try {
      foxWidget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    startX = null;
    startY = null;
    isDragging = false;
  });

  foxWidget.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFoxCompanionModal();
      if (typeof window.AudioFX !== 'undefined') window.AudioFX.click();
    }
  });
}

const AudioFX = (() => {
  let ctx = null;
  let sfxEnabled = true;

  function ensure() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
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
    coin() {
      playTone(987.77, 'sine', 0.08, 0.1);
      setTimeout(() => playTone(1318.5, 'sine', 0.16, 0.1), 65);
    },
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
window.AudioFX = AudioFX;

const GameLoopGuard = (() => {
  const activeRafIds = new Set();

  function trackRaf(id) {
    if (typeof id === 'number') activeRafIds.add(id);
    return id;
  }

  function clearAllRaf() {
    activeRafIds.forEach((id) => cancelAnimationFrame(id));
    activeRafIds.clear();
  }

  function createDeltaStep(maxDtSec = 0.05) {
    let lastTs = performance.now();
    return function getDeltaSec(now = performance.now()) {
      const rawDt = (now - lastTs) / 1000;
      lastTs = now;
      if (!Number.isFinite(rawDt) || rawDt < 0) return 0;
      return Math.min(rawDt, maxDtSec);
    };
  }

  return { trackRaf, clearAllRaf, createDeltaStep };
})();
window.GameLoopGuard = GameLoopGuard;

const GAME_ID_ALIASES = {
  'solitaire': 'solitaire',
  'speed-solitaire': 'solitaire',
  'coinscatter': 'coinscatter',
  'coin-scatter': 'coinscatter',
  'blackjack': 'blackjack',
  'highlow': 'highlow',
  'high-low': 'highlow',
  'chess': 'chess',
  'dama': 'dama',
  'tictactoe': 'tictactoe',
  'tic-tac-toe': 'tictactoe',
  'numberguess': 'numberguess',
  'number-guess': 'numberguess',
  'wordscape': 'wordscape',
  'basketball': 'basketball',
  'basketball-hoops': 'basketball',
  'fruitmaster': 'fruitmaster',
  'fruit-master': 'fruitmaster',
  'whackamole': 'whackamole',
  'whack-a-mole': 'whackamole',
  'cybersnake': 'cybersnake',
  'snake': 'cybersnake',
  'towerstack': 'towerstack',
  'tower-stack': 'towerstack',
  'carracing': 'carracing',
  'car-racing': 'carracing',
  'brickbreaker': 'brickbreaker',
  'brick-breaker': 'brickbreaker',
  'stickrun': 'stickrun',
  'stick-run': 'stickrun',
  'tiny-cafe': 'tiny-cafe',
  'tinycafe': 'tiny-cafe',
  'flickpoint': 'flickpoint',
  'mythic': 'mythic'
};

function normalizeGameId(rawId) {
  const key = String(rawId || '').trim().toLowerCase();
  return GAME_ID_ALIASES[key] || key;
}

let activeGameId = null;
let activeCleanup = null;

const SELF_MENU_GAMES = new Set(['chess', 'dama']);

function syncUniversalGameBar(gameId = activeGameId) {
  const bar = document.getElementById('universal-game-bar');
  if (!bar) return;
  const shouldHide = !gameId || SELF_MENU_GAMES.has(normalizeGameId(gameId));
  bar.classList.toggle('hidden', shouldHide);
}

function attachGameSettingsFooterActions(containerEl, options = {}) {
  if (!containerEl) return;
  if (containerEl.querySelector('[data-game-settings-hub-actions]')) return;

  const actionsWrap = document.createElement('div');
  actionsWrap.setAttribute('data-game-settings-hub-actions', 'true');
  actionsWrap.className = 'mt-4 pt-3 border-t border-white/10 flex flex-col gap-2';

  actionsWrap.innerHTML = `
    <button type="button" data-action="audio-fullscreen" class="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-extrabold text-white flex items-center justify-between transition active:scale-95">
      <span class="flex items-center gap-2">
        <span>🎵</span>
        <span>Audio &amp; Fullscreen</span>
      </span>
      <span class="text-slate-300">›</span>
    </button>
    <button type="button" data-action="back-to-hub" class="w-full py-2.5 px-4 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/25 text-xs font-extrabold text-pink-300 flex items-center justify-between transition active:scale-95">
      <span class="flex items-center gap-2">
        <span>←</span>
        <span>Back To Hub</span>
      </span>
      <span>›</span>
    </button>
  `;

  actionsWrap.querySelector('[data-action="audio-fullscreen"]')?.addEventListener('click', () => {
    if (typeof options.onCloseDrawer === 'function') options.onCloseDrawer();
    if (typeof window.AudioFX !== 'undefined') window.AudioFX.click();
    if (typeof window.openSettingsModal === 'function') window.openSettingsModal();
  });

  actionsWrap.querySelector('[data-action="back-to-hub"]')?.addEventListener('click', () => {
    if (typeof options.onCloseDrawer === 'function') options.onCloseDrawer();
    if (typeof window.AudioFX !== 'undefined') window.AudioFX.click();
    if (typeof window.openHubHome === 'function') window.openHubHome();
  });

  containerEl.appendChild(actionsWrap);
}
window.attachGameSettingsFooterActions = attachGameSettingsFooterActions;

const SupabaseDB = (() => {
  const SUPABASE_URL = 'https://nrlfudwhnncycjcyupgt.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_TFyTpbQI_sWvPT4G6HEpmQ_ANYNTYfW';
  const LOCAL_SCORES_KEY = 'arcade_hub_local_scores_v1';
  let client = null;
  let lastSubmitKey = '';
  let lastSubmitAt = 0;

  function resolveCreateClient() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      return window.supabase.createClient;
    }
    if (typeof window.createClient === 'function') {
      return window.createClient;
    }
    return null;
  }

  function init() {
    if (client) return client;
    const createFn = resolveCreateClient();
    if (!createFn) return null;
    try {
      client = createFn(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      return client;
    } catch (err) {
      console.error('Supabase init failed:', err);
      return null;
    }
  }

  function readLocalScores() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function writeLocalScore(gameId, score, playerName) {
    try {
      const store = readLocalScores();
      const list = Array.isArray(store[gameId]) ? store[gameId] : [];
      list.push({
        game_name: gameId,
        player_name: playerName,
        score: Number(score) || 0,
        created_at: new Date().toISOString()
      });
      list.sort((a, b) => Number(b.score) - Number(a.score));
      store[gameId] = list.slice(0, 25);
      localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(store));
      return store[gameId];
    } catch (e) {
      return [];
    }
  }

  function getBestLocalScore(gameId) {
    const canon = normalizeGameId(gameId);
    const store = readLocalScores();
    const list = Array.isArray(store[canon]) ? store[canon] : [];
    if (!list.length) return 0;
    return Math.max(...list.map(row => Number(row.score) || 0));
  }

  async function submitScore(rawGameId, rawScore, playerName = window.playerName || 'AJ') {
    const gameId = normalizeGameId(rawGameId);
    const numericScore = Number(rawScore);
    if (!gameId || !Number.isFinite(numericScore) || numericScore <= 0) {
      return { ok: false, reason: 'invalid_score' };
    }

    const cleanScore = Math.floor(numericScore);
    const cleanPlayer = String(playerName || window.playerName || 'AJ').trim() || 'AJ';
    const dedupeKey = `${gameId}:${cleanPlayer}:${cleanScore}`;
    const now = Date.now();
    if (dedupeKey === lastSubmitKey && now - lastSubmitAt < 1500) {
      return { ok: true, deduped: true };
    }
    lastSubmitKey = dedupeKey;
    lastSubmitAt = now;

    writeLocalScore(gameId, cleanScore, cleanPlayer);

    const sb = init();
    if (!sb) {
      return { ok: false, offline: true, reason: 'client_unavailable' };
    }

    const payload = {
      game_name: gameId,
      player_name: cleanPlayer,
      score: cleanScore,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await sb
        .from('high_scores')
        .insert([payload])
        .select();

      if (error) {
        console.error('Supabase high_scores insert error:', error.message || error);
        if (typeof spawnPopup === 'function') {
          spawnPopup(`DB Error: ${error.message || 'Check schema/key'}`, window.innerWidth * 0.5, 90, '#fb7185');
        }
        return { ok: false, error };
      }
      return { ok: true, data: data || [] };
    } catch (err) {
      console.error('Supabase submitScore exception:', err);
      return { ok: false, error: err };
    }
  }

  async function fetchHighScores(rawGameId, limit = 5) {
    const gameId = normalizeGameId(rawGameId);
    const safeLimit = Math.max(1, Math.min(50, Number(limit) || 5));
    const sb = init();

    if (!sb) {
      const localList = readLocalScores()[gameId] || [];
      return localList.slice(0, safeLimit);
    }

    try {
      const { data, error } = await sb
        .from('high_scores')
        .select('*')
        .eq('game_name', gameId)
        .order('score', { ascending: false })
        .limit(safeLimit);

      if (error) {
        console.error('Supabase high_scores fetch error:', error.message || error);
        return (readLocalScores()[gameId] || []).slice(0, safeLimit);
      }
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Supabase fetchHighScores exception:', err);
      return (readLocalScores()[gameId] || []).slice(0, safeLimit);
    }
  }

  return {
    init,
    submitScore,
    fetchHighScores,
    getBestLocalScore,
    isConnected() {
      return Boolean(init());
    }
  };
})();
window.SupabaseDB = SupabaseDB;

window.ArcadeHero = window.ArcadeHero || {};
window.ArcadeHero.awardGameScore = async function awardGameScore(rawGameId, rawScore, playerName) {
  const gameId = normalizeGameId(rawGameId);
  const numericScore = Math.floor(Number(rawScore) || 0);
  const activePlayer = playerName || window.playerName || 'AJ';

  if (!gameId || numericScore <= 0) {
    return { submitted: false, score: numericScore };
  }

  const prevBest = SupabaseDB.getBestLocalScore(gameId);
  const bonusXp = Math.min(100, Math.max(10, Math.floor(numericScore / 10)));
  if (typeof addXP === 'function') {
    addXP(bonusXp, window.innerWidth * 0.5, window.innerHeight * 0.25, `+${bonusXp} XP`);
  }

  const result = await SupabaseDB.submitScore(gameId, numericScore, activePlayer);
  if (numericScore > prevBest && typeof spawnPopup === 'function') {
    spawnPopup(`NEW BEST: ${numericScore}!`, window.innerWidth * 0.5, window.innerHeight * 0.34, '#34d399');
  }

  return {
    submitted: Boolean(result && result.ok),
    gameId,
    score: numericScore,
    bestScore: Math.max(prevBest, numericScore),
    result
  };
};

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
  const clamped = Math.max(0, Math.min(100, Number(val) || 0));
  if (bgm) bgm.volume = clamped / 100;
  if (label) label.textContent = `${clamped}%`;
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

function openSettingsModal() {
  if (typeof window.closeHubMenu === 'function') window.closeHubMenu();
  AudioFX.click();
  const modal = document.getElementById('settings-modal');
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

const HUB_URLS = {
  vercel: 'https://arcadehubgames-july12.vercel.app/',
  github: 'https://ejaylimpangog44-bit.github.io/ArcadeHub/'
};
let activeShareUrl = HUB_URLS.vercel;

function renderHubQrCode(targetUrl = activeShareUrl) {
  activeShareUrl = targetUrl;
  const container = document.getElementById('qrcode-container');
  const urlTextEl = document.getElementById('qr-url-display');
  if (urlTextEl) urlTextEl.textContent = targetUrl;
  if (container) {
    container.innerHTML = '';
    if (window.QRCode) {
      new QRCode(container, {
        text: targetUrl,
        width: 170,
        height: 170,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      container.innerHTML = `<div class="p-3 text-xs font-mono text-slate-900">${targetUrl}</div>`;
    }
  }
}

function openQrShareModal(url = activeShareUrl) {
  if (typeof window.closeHubMenu === 'function') window.closeHubMenu();
  AudioFX.click();
  renderHubQrCode(url);
  const modal = document.getElementById('qr-share-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeQrShareModal() {
  AudioFX.click();
  const modal = document.getElementById('qr-share-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

const GAME_GUIDES = {
  solitaire: 'Build all four foundation piles up from Ace to King by suit while arranging tableau cards in descending rank with alternating colors.',
  coinscatter: 'Spin the reels to land matching symbols and scatter icons for bonus coin payouts and multiplier streaks.',
  blackjack: 'Draw or stand to get as close to 21 as possible without going over while beating the dealer’s total.',
  highlow: 'Predict whether the next revealed card will be higher or lower than the current card to chain streaks.',
  chess: 'Move pieces across the board following standard chess movement and capture rules to checkmate the opposing king.',
  dama: 'Slide pieces diagonally across dark squares to jump and capture opponent pieces; reach the far edge to promote to Dama.',
  tictactoe: 'Alternate placing X and O marks on the grid and align three in a row horizontally, vertically, or diagonally.',
  numberguess: 'Guess the secret target number using higher and lower hints to solve it in as few tries as possible.',
  wordscape: 'Swipe or tap letters to connect valid words and fill every crossword slot on the board.',
  basketball: 'Swipe upward toward the hoop with controlled angle and power; chain swishes for higher combo points.',
  fruitmaster: 'Swipe across flying fruit to slice them for points while avoiding bombs that break your combo.',
  whackamole: 'Tap targets quickly as they pop up to rack up points before they disappear.',
  cybersnake: 'Guide your snake to collect energy nodes while avoiding arena walls and colliding with your own tail.',
  towerstack: 'Tap at the exact moment each sliding block aligns above the tower to stack higher and earn combos.',
  carracing: 'Steer across highway lanes at high speed to overtake traffic and dodge road obstacles.',
  brickbreaker: 'Deflect the ball off your paddle to smash all bricks while keeping the ball from falling below.',
  stickrun: 'Time jumps and runs cleanly across platforms and rooftops without falling into gaps.',
  'tiny-cafe': 'Prepare and serve café orders promptly to keep customers happy and maximize earnings.',
  flickpoint: 'Aim and flick quickly onto targets before time out to maximize accuracy and score.',
  mythic: 'Survive incoming enemy waves, gather XP gems, and pick upgrades to stay alive as long as possible.'
};

function populateInstructionsDropdown() {
  const select = document.getElementById('instruction-game-select');
  if (!select) return;
  select.innerHTML = '';
  GAMES.forEach((game) => {
    const opt = document.createElement('option');
    opt.value = game.id;
    opt.textContent = `${formatGameNum(game.num)} — ${game.name}`;
    select.appendChild(opt);
  });
  renderSelectedGameInstruction();
}

function renderSelectedGameInstruction() {
  const select = document.getElementById('instruction-game-select');
  const body = document.getElementById('instruction-game-body');
  if (!select || !body) return;
  const game = GAMES.find((g) => g.id === select.value) || GAMES[0];
  const guideText = GAME_GUIDES[game.id] || `Play ${game.name} in ${game.envName} and aim for a high score.`;
  body.innerHTML = `
    <div class="font-extrabold text-white text-sm mb-1">${game.icon} ${game.name} <span class="text-[11px] font-mono text-pink-400">(${game.mode || 'PORTRAIT'})</span></div>
    <div class="text-[11px] text-slate-400 mb-2">${game.envName} • ${game.cat}</div>
    <p class="text-xs text-slate-200 leading-relaxed">${guideText}</p>
  `;
}

function openInstructionsModal() {
  if (typeof window.closeHubMenu === 'function') window.closeHubMenu();
  AudioFX.click();
  populateInstructionsDropdown();
  const modal = document.getElementById('instructions-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeInstructionsModal() {
  AudioFX.click();
  const modal = document.getElementById('instructions-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function openAboutModal() {
  if (typeof window.closeHubMenu === 'function') window.closeHubMenu();
  AudioFX.click();
  const modal = document.getElementById('about-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeAboutModal() {
  AudioFX.click();
  const modal = document.getElementById('about-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function filterGames(query) {
  discoverySearch = String(query || '');
  renderDiscoveryShelves();
}

function copyHubLink() {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(activeShareUrl).catch(() => {});
  }
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
    } else if (docEl.webkitExitFullscreen) {
      docEl.webkitExitFullscreen();
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
  const input = document.getElementById('player-name-input');
  if (input) input.value = randomName;
}

function submitPlayerName() {
  const inputEl = document.getElementById('player-name-input');
  const typed = inputEl ? inputEl.value.trim() : '';
  window.playerName = typed || ('Player_' + Math.floor(100 + Math.random() * 899));

  const headerName = document.getElementById('header-player-name');
  const loginScreen = document.getElementById('login-screen');
  const appShell = document.getElementById('app-shell');

  if (headerName) headerName.textContent = window.playerName;
  if (loginScreen) loginScreen.classList.add('hidden');
  if (appShell) appShell.classList.remove('hidden');

  syncFoxCompanionVisibility();
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
window.addXP = addXP;

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
window.spawnPopup = spawnPopup;

const GAMES = [
  { id: 'solitaire', num: 1, name: 'Speed Solitaire', cat: 'Card', mode: 'PORTRAIT', featured: false, icon: '🃏', envName: 'Emerald Velvet Casino Table', bg: 'radial-gradient(circle at 50% 35%, #0f5132 0%, #062c1b 65%, #02140c 100%)', theme: 'casino_green' },
  { id: 'coinscatter', num: 2, name: 'Coin Scatter v2', cat: 'Card', mode: 'PORTRAIT', featured: false, icon: '🎰', envName: 'Golden Vault & Neon Chamber', bg: 'radial-gradient(circle at 50% 25%, #451a03 0%, #1c0a00 60%, #090300 100%)', theme: 'gold_vault' },
  { id: 'blackjack', num: 3, name: 'Blackjack 21', cat: 'Card', mode: 'PORTRAIT', featured: false, icon: '🂡', envName: 'VIP Mahogany & Royal Felt', bg: 'radial-gradient(circle at 50% 20%, #134e4a 0%, #042f2e 55%, #021312 100%)', theme: 'vip_table' },
  { id: 'highlow', num: 4, name: 'High-Low', cat: 'Card', mode: 'PORTRAIT', featured: false, icon: '🔼', envName: 'Midnight Crimson Lounge', bg: 'radial-gradient(circle at 50% 30%, #4c0519 0%, #1f040d 65%, #0a0104 100%)', theme: 'crimson_lounge' },
  { id: 'chess', num: 5, name: 'Chess', cat: 'Board', mode: 'PORTRAIT', featured: false, icon: '♟️', envName: 'Grandmaster Mahogany Study', bg: 'radial-gradient(circle at 50% 30%, #3e2723 0%, #1b100e 70%, #0c0706 100%)', theme: 'wood_study' },
  { id: 'dama', num: 6, name: 'Dama', cat: 'Board', mode: 'PORTRAIT', featured: false, icon: '🔴', envName: 'Sunlit Narra & Bamboo Veranda', bg: 'radial-gradient(circle at 50% 25%, #5c3a21 0%, #2b180c 65%, #120904 100%)', theme: 'bamboo_sun' },
  { id: 'tictactoe', num: 7, name: 'Tic-Tac-Toe', cat: 'Puzzle', mode: 'PORTRAIT', featured: false, icon: '❌', envName: 'Chalkboard & Neon Laser Grid', bg: 'radial-gradient(circle at 50% 50%, #111827 0%, #060913 100%)', theme: 'neon_chalk' },
  { id: 'numberguess', num: 8, name: 'Number Guess', cat: 'Puzzle', mode: 'PORTRAIT', featured: false, icon: '🔢', envName: 'Cryptographic Matrix Vault', bg: 'radial-gradient(circle at 50% 30%, #052e16 0%, #02120a 70%, #000804 100%)', theme: 'matrix_vault' },
  { id: 'wordscape', num: 9, name: 'Wordscape Pro', cat: 'Puzzle', mode: 'PORTRAIT', featured: true, icon: '📝', envName: 'Sunset Mountain Valley Sky', bg: 'linear-gradient(180deg, #1e1b4b 0%, #4c1d95 38%, #be185d 75%, #f59e0b 100%)', theme: 'sunset_valley' },
  { id: 'basketball', num: 10, name: 'Basketball Hoops', cat: 'Action', mode: 'PORTRAIT', featured: false, icon: '🏀', envName: 'Neon Streetball Court', bg: 'radial-gradient(circle at 50% 0%, #7c2d12 0%, #1e1b4b 55%, #020617 100%)', theme: 'streetball_court' },
  { id: 'fruitmaster', num: 11, name: 'Fruit Master', cat: 'Action', mode: 'PORTRAIT', featured: false, icon: '🍉', envName: 'Tropical Bamboo & Sakura Dojo', bg: 'linear-gradient(160deg, #14532d 0%, #1e3a2f 45%, #3f2e21 100%)', theme: 'bamboo_dojo' },
  { id: 'whackamole', num: 12, name: 'Whack-a-Mole', cat: 'Action', mode: 'PORTRAIT', featured: false, icon: '🔨', envName: 'Sunlit Meadow & Garden Hills', bg: 'linear-gradient(180deg, #0284c7 0%, #38bdf8 42%, #16a34a 43%, #14532d 100%)', theme: 'sunny_meadow' },
  { id: 'cybersnake', num: 13, name: 'Cyber Snake', cat: 'Action', mode: 'PORTRAIT', featured: false, icon: '🐍', envName: 'Original Version Preserved', bg: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #090a10 100%)', theme: 'preserved', locked: true },
  { id: 'towerstack', num: 14, name: 'Tower Stack', cat: 'Action', mode: 'PORTRAIT', featured: false, icon: '🏗️', envName: 'Twilight Skyline to Stratosphere', bg: 'linear-gradient(180deg, #090d16 0%, #1e1b4b 45%, #6d28d9 80%, #f43f5e 100%)', theme: 'skyline_climb' },
  { id: 'carracing', num: 15, name: 'Car Racing', cat: 'Racing', mode: 'PORTRAIT', featured: true, icon: '🏎️', envName: 'Neon Sunset Canyon Highway', bg: 'linear-gradient(180deg, #0f0722 0%, #3b0764 42%, #be123c 55%, #090a0f 56%)', theme: 'synth_highway' },
  { id: 'brickbreaker', num: 16, name: 'Brick Breaker', cat: 'Racing', mode: 'PORTRAIT', featured: false, icon: '🧱', envName: 'Cosmic Synthwave Core', bg: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #090d16 65%, #03050a 100%)', theme: 'cosmic_core' },
  { id: 'stickrun', num: 17, name: 'Stick Run', cat: 'Runner', mode: 'PORTRAIT', featured: false, icon: '🏃', envName: 'Sunlit Park & Rooftop Horizon', bg: 'linear-gradient(180deg, #0ea5e9 0%, #7dd3fc 58%, #fef08a 74%, #1e293b 75%)', theme: 'stick_world' },
  {
    id: 'tiny-cafe',
    num: 18,
    name: 'Tiny Café',
    cat: 'Strategy',
    mode: 'PORTRAIT',
    featured: true,
    icon: '☕',
    envName: 'Cozy Cartoon Café',
    bg: 'radial-gradient(circle at 50% 25%, #fff5e6 0%, #f5dec0 65%, #e4c096 100%)',
    theme: 'wood'
  },
  {
    id: 'flickpoint',
    num: 19,
    name: 'FlickPoint',
    cat: 'Action',
    mode: 'LANDSCAPE',
    featured: true,
    icon: '🎯',
    envName: 'Precision FPS Aim Training Facility',
    bg: 'radial-gradient(circle at 50% 20%, #111827 0%, #030712 70%, #000000 100%)',
    theme: 'neon_chalk'
  },
  {
    id: 'mythic',
    num: 20,
    name: 'Mythic Survivors',
    cat: 'Survival / Action',
    mode: 'LANDSCAPE',
    featured: true,
    icon: '⚔️',
    envName: 'mythic.html',
    bg: 'from-emerald-900 via-stone-900 to-black',
    theme: 'emerald'
  }
];
window.GAMES = GAMES;

const HUB_STORAGE_KEY = 'arcade_hub_discovery_v1';
let hubMetaState = {
  recentIds: ['mythic', 'flickpoint', 'tiny-cafe', 'solitaire'],
  playCounts: {}
};
let discoveryFilter = 'all';
let discoverySearch = '';
let spotlightIdx = 0;
let previewGameMeta = null;

function loadHubMetaState() {
  try {
    const raw = localStorage.getItem(HUB_STORAGE_KEY);
    if (raw) {
      hubMetaState = { ...hubMetaState, ...JSON.parse(raw) };
    }
  } catch (e) {}
}

function saveHubMetaState() {
  try {
    localStorage.setItem(HUB_STORAGE_KEY, JSON.stringify(hubMetaState));
  } catch (e) {}
}

function recordGamePlay(gameId) {
  hubMetaState.recentIds = [
    gameId,
    ...hubMetaState.recentIds.filter(id => id !== gameId)
  ].slice(0, 8);
  hubMetaState.playCounts[gameId] = (hubMetaState.playCounts[gameId] || 0) + 1;
  saveHubMetaState();
}

const GameSettingsDrawer = (() => {
  const MODE_KEY = 'arcade_hub_game_settings_v1';
  let drawerEl = null;
  let backdropEl = null;
  let isOpen = false;
  let isClosing = false;
  let closeTimer = null;

  const PVP_AI_GAMES = new Set(['chess', 'dama', 'tictactoe']);

  const GAME_ADJUSTMENTS = {
    chess: [
      { key: 'mode', label: 'Match Mode', type: 'toggle', options: ['Vs AI', 'PVP'], default: 'Vs AI' },
      { key: 'difficulty', label: 'AI Level', type: 'select', options: ['Casual', 'Standard', 'Master'], default: 'Standard' }
    ],
    dama: [
      { key: 'mode', label: 'Match Mode', type: 'toggle', options: ['Vs AI', 'PVP'], default: 'Vs AI' },
      { key: 'difficulty', label: 'AI Level', type: 'select', options: ['Casual', 'Standard', 'Hard'], default: 'Standard' }
    ],
    tictactoe: [
      { key: 'mode', label: 'Match Mode', type: 'toggle', options: ['Vs AI', 'PVP'], default: 'Vs AI' },
      { key: 'difficulty', label: 'AI Level', type: 'select', options: ['Easy', 'Smart'], default: 'Smart' }
    ],
    carracing: [
      { key: 'speedScale', label: 'Pace / Speed', type: 'select', options: ['Relaxed', 'Normal', 'Turbo'], default: 'Normal' }
    ],
    brickbreaker: [
      { key: 'speedScale', label: 'Ball Pace', type: 'select', options: ['Relaxed', 'Normal', 'Turbo'], default: 'Normal' }
    ],
    stickrun: [
      { key: 'speedScale', label: 'Run Pace', type: 'select', options: ['Relaxed', 'Normal', 'Turbo'], default: 'Normal' }
    ],
    towerstack: [
      { key: 'speedScale', label: 'Block Pace', type: 'select', options: ['Relaxed', 'Normal', 'Turbo'], default: 'Normal' }
    ],
    cybersnake: [
      { key: 'speedScale', label: 'Snake Pace', type: 'select', options: ['Relaxed', 'Normal', 'Turbo'], default: 'Normal' }
    ],
    fruitmaster: [
      { key: 'speedScale', label: 'Spawn Pace', type: 'select', options: ['Relaxed', 'Normal', 'Turbo'], default: 'Normal' }
    ],
    whackamole: [
      { key: 'speedScale', label: 'Pop Pace', type: 'select', options: ['Relaxed', 'Normal', 'Turbo'], default: 'Normal' }
    ]
  };

  function readAllSettings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(MODE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writeAllSettings(store) {
    try {
      localStorage.setItem(MODE_KEY, JSON.stringify(store));
    } catch (_) {}
  }

  function getGameSettings(gameId) {
    const canon = normalizeGameId(gameId);
    const store = readAllSettings();
    const defs = GAME_ADJUSTMENTS[canon] || [];
    const saved = store[canon] || {};
    const merged = {};
    defs.forEach((d) => {
      merged[d.key] = saved[d.key] !== undefined ? saved[d.key] : d.default;
    });
    return merged;
  }

  function setGameSetting(gameId, key, value) {
    const canon = normalizeGameId(gameId);
    const store = readAllSettings();
    store[canon] = {
      ...(store[canon] || {}),
      [key]: value
    };
    writeAllSettings(store);
    window.dispatchEvent(new CustomEvent('arcadehub:game-settings-change', {
      detail: { gameId: canon, key, value, settings: getGameSettings(canon) }
    }));
    return getGameSettings(canon);
  }

  function ensureDom() {
    if (drawerEl && backdropEl) return;

    backdropEl = document.createElement('div');
    backdropEl.id = 'game-drawer-backdrop';
    backdropEl.className = 'game-drawer-backdrop hidden';
    backdropEl.addEventListener('click', () => close());

    drawerEl = document.createElement('aside');
    drawerEl.id = 'game-settings-drawer';
    drawerEl.className = 'game-drawer hidden';
    drawerEl.setAttribute('aria-label', 'Game Settings');

    document.body.appendChild(backdropEl);
    document.body.appendChild(drawerEl);
  }

  function renderContent(gameId) {
    ensureDom();
    const canon = normalizeGameId(gameId);
    const meta = (window.GAMES || []).find((g) => g.id === canon) || {
      id: canon,
      name: 'Game',
      icon: '🎮',
      cat: 'Arcade'
    };
    const defs = GAME_ADJUSTMENTS[canon] || [];
    const current = getGameSettings(canon);

    const controlsHtml = defs.length
      ? defs.map((ctrl) => {
          if (ctrl.type === 'toggle') {
            const isSecond = current[ctrl.key] === ctrl.options[1];
            return `
              <div class="game-drawer-row">
                <div>
                  <div class="game-drawer-label">${ctrl.label}</div>
                  <div class="game-drawer-sub">${PVP_AI_GAMES.has(canon) ? 'Switch between 2-player & bot' : 'Adjust match option'}</div>
                </div>
                <div class="game-mode-pill-group" role="group" aria-label="${ctrl.label}">
                  ${ctrl.options.map((opt, idx) => {
                    const active = current[ctrl.key] === opt || (idx === 1 && isSecond);
                    return `<button type="button" data-ctrl-key="${ctrl.key}" data-ctrl-val="${opt}" class="game-mode-pill ${active ? 'is-active' : ''}">${opt}</button>`;
                  }).join('')}
                </div>
              </div>
            `;
          }

          return `
            <div class="game-drawer-row">
              <div>
                <div class="game-drawer-label">${ctrl.label}</div>
                <div class="game-drawer-sub">Applies to current &amp; next rounds</div>
              </div>
              <select data-ctrl-select="${ctrl.key}" class="game-drawer-select">
                ${ctrl.options.map((opt) => `<option value="${opt}" ${current[ctrl.key] === opt ? 'selected' : ''}>${opt}</option>`).join('')}
              </select>
            </div>
          `;
        }).join('')
      : `
        <div class="game-drawer-row">
          <div>
            <div class="game-drawer-label">Game Adjustments</div>
            <div class="game-drawer-sub">Standard preset active for ${meta.name}</div>
          </div>
          <span class="game-drawer-badge">STANDARD</span>
        </div>
      `;

    drawerEl.innerHTML = `
      <div class="game-drawer-head">
        <div class="game-drawer-title-wrap">
          <span class="game-drawer-icon">${meta.icon}</span>
          <div>
            <div class="game-drawer-title">${meta.name}</div>
            <div class="game-drawer-cat">${meta.cat} Settings</div>
          </div>
        </div>
        <button type="button" id="game-drawer-close-btn" class="game-drawer-close" aria-label="Close settings">✕</button>
      </div>

      <div class="game-drawer-body">
        ${controlsHtml}

        <div class="game-drawer-audio-card">
          <button type="button" id="drawer-sfx-btn" class="game-drawer-mini-btn">
            🔊 SFX: ${window.AudioFX && window.AudioFX.enabled ? 'ON' : 'OFF'}
          </button>
          <button type="button" id="drawer-bgm-btn" class="game-drawer-mini-btn">
            🎵 BGM: ${typeof bgmEnabled !== 'undefined' && bgmEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div class="game-drawer-foot">
        <button type="button" id="drawer-hub-btn" class="game-drawer-hub-btn">
          <span>←</span>
          <span>Back to Hub</span>
        </button>
      </div>
    `;

    drawerEl.querySelector('#game-drawer-close-btn')?.addEventListener('click', () => {
      if (window.AudioFX) window.AudioFX.click();
      close();
    });

    drawerEl.querySelectorAll('[data-ctrl-key]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (window.AudioFX) window.AudioFX.click();
        const k = btn.getAttribute('data-ctrl-key');
        const v = btn.getAttribute('data-ctrl-val');
        setGameSetting(canon, k, v);
        renderContent(canon);
      });
    });

    drawerEl.querySelectorAll('[data-ctrl-select]').forEach((sel) => {
      sel.addEventListener('change', (e) => {
        if (window.AudioFX) window.AudioFX.click();
        const k = sel.getAttribute('data-ctrl-select');
        setGameSetting(canon, k, e.target.value);
      });
    });

    drawerEl.querySelector('#drawer-sfx-btn')?.addEventListener('click', () => {
      if (typeof toggleSFX === 'function') toggleSFX();
      renderContent(canon);
    });

    drawerEl.querySelector('#drawer-bgm-btn')?.addEventListener('click', () => {
      if (typeof toggleBGM === 'function') toggleBGM();
      renderContent(canon);
    });

    drawerEl.querySelector('#drawer-hub-btn')?.addEventListener('click', () => {
      if (window.AudioFX) window.AudioFX.click();
      close(() => {
        if (typeof openHubHome === 'function') openHubHome();
      });
    });
  }

  function open(gameId = activeGameId) {
    if (!gameId) return;
    ensureDom();
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    renderContent(gameId);
    isClosing = false;
    isOpen = true;

    backdropEl.classList.remove('hidden', 'is-closing');
    drawerEl.classList.remove('hidden', 'is-closing');

    requestAnimationFrame(() => {
      backdropEl.classList.add('is-open');
      drawerEl.classList.add('is-open');
    });
  }

  function close(afterClose) {
    if (!drawerEl || !backdropEl || (!isOpen && !isClosing)) {
      if (typeof afterClose === 'function') afterClose();
      return;
    }
    isOpen = false;
    isClosing = true;

    backdropEl.classList.remove('is-open');
    backdropEl.classList.add('is-closing');
    drawerEl.classList.remove('is-open');
    drawerEl.classList.add('is-closing');

    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      isClosing = false;
      drawerEl.classList.add('hidden');
      drawerEl.classList.remove('is-closing');
      backdropEl.classList.add('hidden');
      backdropEl.classList.remove('is-closing');
      if (typeof afterClose === 'function') afterClose();
    }, 340);
  }

  function toggle(gameId = activeGameId) {
    if (isOpen) {
      close();
    } else {
      open(gameId);
    }
  }

  return {
    open,
    close,
    toggle,
    getSettings: getGameSettings,
    setSetting: setGameSetting
  };
})();
window.GameSettingsDrawer = GameSettingsDrawer;

const BgEngine = (() => {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let w = 0;
  let h = 0;
  let theme = 'hub';
  let particles = [];
  let tick = 0;

  function resize() {
    if (!canvas) return;
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function setTheme(newTheme) {
    theme = newTheme;
    particles = [];
    const count = 42;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.5 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.2 - Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        char: ['♠', '♥', '♦', '♣'][i % 4]
      });
    }
  }

  function loop() {
    tick += 0.016;
    if (!ctx) {
      requestAnimationFrame(loop);
      return;
    }
    ctx.clearRect(0, 0, w, h);

    if (theme === 'casino_green' || theme === 'vip_table') {
      ctx.save();
      ctx.font = '28px Inter';
      ctx.textAlign = 'center';
      particles.forEach((p, idx) => {
        p.y += p.vy * 0.4;
        if (p.y < -30) p.y = h + 30;
        if (idx % 4 === 0) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.05)';
          ctx.fillText(p.char, p.x, p.y);
        } else {
          ctx.fillStyle = 'rgba(253, 224, 71, 0.14)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    } else if (theme === 'gold_vault') {
      particles.forEach(p => {
        p.y += p.vy * 1.4;
        p.x += Math.sin(tick + p.phase) * 0.4;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (theme === 'matrix_vault') {
      ctx.font = '13px "JetBrains Mono", monospace';
      particles.forEach((p, i) => {
        p.y += 2.2;
        if (p.y > h) p.y = -20;
        ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
        ctx.fillText((i + Math.floor(tick * 8)) % 2 === 0 ? '1' : '0', p.x, p.y);
      });
    } else if (theme === 'bamboo_dojo') {
      particles.forEach(p => {
        p.y += 0.8;
        p.x += Math.sin(tick * 1.2 + p.phase) * 0.9;
        if (p.y > h + 15) { p.y = -15; p.x = Math.random() * w; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(tick + p.phase);
        ctx.fillStyle = 'rgba(244, 114, 182, 0.32)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    } else if (theme === 'sunny_meadow' || theme === 'stick_world') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 290 + tick * (14 + i * 2)) % (w + 260)) - 130;
        const cy = 65 + (i % 3) * 48;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.arc(cx + 24, cy - 8, 34, 0, Math.PI * 2);
        ctx.arc(cx + 52, cy, 26, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme === 'streetball_court') {
      for (let i = 0; i < 4; i++) {
        const bx = w * (0.2 + i * 0.2) + Math.sin(tick * 0.7 + i) * 35;
        const grad = ctx.createLinearGradient(bx, 0, bx, h);
        grad.addColorStop(0, 'rgba(249, 115, 22, 0.18)');
        grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(bx - 30, 0);
        ctx.lineTo(bx + 30, 0);
        ctx.lineTo(bx + 130, h);
        ctx.lineTo(bx - 130, h);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      particles.forEach(p => {
        p.y += p.vy * 0.35;
        if (p.y < -10) p.y = h + 10;
        const alpha = 0.15 + 0.2 * Math.sin(tick * 2 + p.phase);
        ctx.fillStyle = `rgba(167, 139, 250, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.65, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    requestAnimationFrame(loop);
  }
  loop();

  return { setTheme };
})();

function formatGameNum(num) {
  return `#${String(num).padStart(2, '0')}`;
}

function getGameBgStyle(game) {
  if (game.bg && game.bg.startsWith('from-')) {
    return 'linear-gradient(135deg, #064e3b 0%, #1c1917 55%, #090a10 100%)';
  }
  return game.bg;
}

function openGamePreviewModal(gameId) {
  const game = GAMES.find(g => g.id === gameId);
  if (!game) return;
  AudioFX.click();
  previewGameMeta = game;

  const modal = document.getElementById('game-preview-modal');
  const banner = document.getElementById('preview-banner');
  const badge = document.getElementById('preview-badge');

  if (banner) banner.style.background = getGameBgStyle(game);
  const iconEl = document.getElementById('preview-icon');
  if (iconEl) iconEl.textContent = game.icon;
  if (badge) {
    badge.textContent = game.locked ? 'ORIGINAL' : 'FULL V2';
    badge.className = `px-2 py-0.5 rounded-full ${game.locked ? 'bg-amber-500/25 text-amber-300' : 'bg-emerald-500/25 text-emerald-300'}`;
  }
  const modeEl = document.getElementById('preview-mode');
  if (modeEl) modeEl.textContent = game.mode || 'PORTRAIT';
  const numEl = document.getElementById('preview-num');
  if (numEl) numEl.textContent = formatGameNum(game.num);
  const titleEl = document.getElementById('preview-title');
  if (titleEl) titleEl.textContent = game.name;
  const subEl = document.getElementById('preview-sub');
  if (subEl) subEl.textContent = game.envName;
  const playsEl = document.getElementById('preview-plays');
  if (playsEl) playsEl.textContent = `${hubMetaState.playCounts[game.id] || 0}x`;
  const catEl = document.getElementById('preview-cat');
  if (catEl) catEl.textContent = game.cat;

  const launchBtn = document.getElementById('preview-launch-btn');
  if (launchBtn) {
    launchBtn.onclick = () => {
      const idToLaunch = previewGameMeta?.id;
      closeGamePreviewModal();
      if (idToLaunch) launchGame(idToLaunch);
    };
  }

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeGamePreviewModal() {
  const modal = document.getElementById('game-preview-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  previewGameMeta = null;
}

function surpriseMeGame() {
  AudioFX.click();
  const pick = GAMES[Math.floor(Math.random() * GAMES.length)];
  if (pick) openGamePreviewModal(pick.id);
}

function cycleSpotlight() {
  AudioFX.click();
  const featured = GAMES.filter(g => g.featured);
  if (!featured.length) return;
  spotlightIdx = (spotlightIdx + 1) % featured.length;
  updateSpotlightBanner();
}

function updateSpotlightBanner() {
  const featured = GAMES.filter(g => g.featured);
  if (!featured.length) return;
  const game = featured[spotlightIdx % featured.length];

  const backdrop = document.getElementById('discovery-hero-bg');
  const titleEl = document.getElementById('discovery-hero-title');
  const subEl = document.getElementById('discovery-hero-sub');
  const iconEl = document.getElementById('discovery-hero-icon');
  const numEl = document.getElementById('discovery-hero-num');
  const modeEl = document.getElementById('discovery-hero-mode');
  const playBtn = document.getElementById('discovery-hero-play');

  if (backdrop) backdrop.style.background = getGameBgStyle(game);
  if (titleEl) titleEl.textContent = game.name;
  if (subEl) subEl.textContent = `${game.envName} • ${game.cat}`;
  if (iconEl) iconEl.textContent = game.icon;
  if (numEl) numEl.textContent = formatGameNum(game.num);
  if (modeEl) modeEl.textContent = game.mode || 'PORTRAIT';
  if (playBtn) playBtn.onclick = () => openGamePreviewModal(game.id);
}

function buildDiscoveryCard(game) {
  const plays = hubMetaState.playCounts[game.id] || 0;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'discovery-card';
  btn.onclick = () => openGamePreviewModal(game.id);
  btn.innerHTML = `
    <div class="relative h-28 w-full p-2.5 flex flex-col justify-between" style="background:${getGameBgStyle(game)}">
      <div class="absolute inset-0 bg-black/25"></div>
      <div class="relative z-10 flex items-center justify-between w-full">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${game.locked ? 'bg-amber-500/30 text-amber-200' : 'bg-emerald-500/30 text-emerald-200'}">
          ${game.locked ? 'ORIGINAL' : 'FULL V2'}
        </span>
        <span class="text-[11px] font-mono text-white/75">${formatGameNum(game.num)}</span>
      </div>
      <div class="relative z-10 text-center my-auto">
        <span class="text-3xl sm:text-4xl drop-shadow-md">${game.icon}</span>
      </div>
    </div>
    <div class="p-3 flex-1 flex flex-col justify-between gap-2">
      <div>
        <div class="font-extrabold text-sm text-white leading-tight truncate">${game.name}</div>
        <div class="text-[11px] text-slate-400 line-clamp-1 mt-0.5">${game.envName}</div>
      </div>
      <div class="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px] font-bold text-slate-400">
        <span>${game.mode || 'PORTRAIT'}${plays > 0 ? ` • ${plays}x` : ''}</span>
        <span class="text-pink-400">PLAY →</span>
      </div>
    </div>
  `;
  return btn;
}

function buildDiscoveryShelf(title, list) {
  const section = document.createElement('section');
  section.className = 'flex flex-col gap-2.5';

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between';
  header.innerHTML = `
    <div class="flex items-baseline gap-2">
      <h2 class="text-base sm:text-lg font-extrabold text-white tracking-tight">${title}</h2>
      <span class="text-xs font-semibold text-slate-400">${list.length}</span>
    </div>
    <div class="flex items-center gap-1.5">
      <button type="button" class="shelf-nav-btn shelf-left w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center justify-center transition active:scale-95" aria-label="Scroll ${title} left">‹</button>
      <button type="button" class="shelf-nav-btn shelf-right w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center justify-center transition active:scale-95" aria-label="Scroll ${title} right">›</button>
    </div>
  `;

  const trackWrap = document.createElement('div');
  trackWrap.className = 'shelf-track-wrap';

  const track = document.createElement('div');
  track.className = 'flex gap-3.5 overflow-x-auto no-scrollbar pb-2 scroll-smooth';
  track.style.scrollSnapType = 'x mandatory';
  list.forEach(g => track.appendChild(buildDiscoveryCard(g)));

  const fadeRight = document.createElement('div');
  fadeRight.className = 'shelf-fade-right';

  const leftBtn = header.querySelector('.shelf-left');
  const rightBtn = header.querySelector('.shelf-right');

  const syncShelfControls = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    const hasOverflow = maxScroll > 2;
    const atStart = !hasOverflow || track.scrollLeft <= 2;
    const atEnd = !hasOverflow || track.scrollLeft >= maxScroll - 2;

    if (leftBtn) leftBtn.disabled = atStart;
    if (rightBtn) rightBtn.disabled = atEnd;
    fadeRight.classList.toggle('is-visible', hasOverflow && !atEnd);
  };

  const getStep = () => Math.max(240, Math.round(track.clientWidth * 0.8));

  leftBtn?.addEventListener('click', () => {
    AudioFX.click();
    track.scrollBy({ left: -getStep(), behavior: 'smooth' });
  });

  rightBtn?.addEventListener('click', () => {
    AudioFX.click();
    track.scrollBy({ left: getStep(), behavior: 'smooth' });
  });

  track.addEventListener('scroll', syncShelfControls, { passive: true });
  track.addEventListener(
    'wheel',
    (e) => {
      if (track.scrollWidth <= track.clientWidth) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        track.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    },
    { passive: false }
  );

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(syncShelfControls);
    ro.observe(track);
  } else {
    window.addEventListener('resize', syncShelfControls);
  }

  requestAnimationFrame(syncShelfControls);

  trackWrap.appendChild(track);
  trackWrap.appendChild(fadeRight);
  section.appendChild(header);
  section.appendChild(trackWrap);
  return section;
}

function renderDiscoveryShelves() {
  const shelvesEl = document.getElementById('discovery-shelves');
  const emptyEl = document.getElementById('discovery-empty');
  const heroEl = document.getElementById('discovery-hero');
  if (!shelvesEl) return;

  shelvesEl.innerHTML = '';
  const isFiltering = discoveryFilter !== 'all' || discoverySearch.trim() !== '';
  if (heroEl) heroEl.classList.toggle('hidden', isFiltering);

  const q = discoverySearch.trim().toLowerCase();
  const matches = GAMES.filter(g => {
    const textMatch =
      !q ||
      g.name.toLowerCase().includes(q) ||
      g.envName.toLowerCase().includes(q) ||
      g.cat.toLowerCase().includes(q) ||
      formatGameNum(g.num).includes(q);
    if (!textMatch) return false;
    if (discoveryFilter === 'all') return true;
    if (discoveryFilter === 'portrait' || discoveryFilter === 'landscape') {
      return (g.mode || 'PORTRAIT').toLowerCase() === discoveryFilter;
    }
    return g.cat.toLowerCase().includes(discoveryFilter);
  });

  if (!matches.length) {
    emptyEl?.classList.remove('hidden');
    return;
  }
  emptyEl?.classList.add('hidden');

  if (isFiltering) {
    shelvesEl.appendChild(buildDiscoveryShelf('Filtered Games', matches));
    return;
  }

  const recentGames = hubMetaState.recentIds
    .map(id => GAMES.find(g => g.id === id))
    .filter(Boolean);
  if (recentGames.length) {
    shelvesEl.appendChild(buildDiscoveryShelf('Continue Playing', recentGames));
  }

  shelvesEl.appendChild(
    buildDiscoveryShelf(
      'Action & High-Speed Arena',
      GAMES.filter(g => g.cat.includes('Action') || g.cat.includes('Racing') || g.cat.includes('Runner'))
    )
  );

  shelvesEl.appendChild(
    buildDiscoveryShelf(
      'Card & Casino Lounge',
      GAMES.filter(g => g.cat === 'Card')
    )
  );

  shelvesEl.appendChild(
    buildDiscoveryShelf(
      'Board, Puzzle & Strategy',
      GAMES.filter(g => g.cat === 'Board' || g.cat === 'Puzzle' || g.cat === 'Strategy')
    )
  );
}

function openHubHome() {
  GameSettingsDrawer.close();
  GameLoopGuard.clearAllRaf();
  if (activeCleanup) {
    try { activeCleanup(); } catch (e) {}
    activeCleanup = null;
  }
  activeGameId = null;
  loadHubMetaState();
  syncFoxCompanionVisibility();

  document.getElementById('hub-header')?.classList.remove('hidden');
  syncUniversalGameBar(null);

  const stage = document.getElementById('game-stage');
  if (!stage) return;
  stage.classList.remove('in-game');

  const appShell = document.getElementById('app-shell');
  if (appShell) appShell.style.background = 'radial-gradient(circle at 50% 15%, #16182c 0%, #090a10 75%)';
  BgEngine.setTheme('hub');

  stage.innerHTML = `
    <div class="w-full h-full overflow-y-auto px-4 sm:px-8 py-4 pb-20">
      <div class="max-w-6xl mx-auto flex flex-col gap-5">
        <div class="flex flex-col gap-2.5">
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <input id="hub-search-input" type="text" value="${discoverySearch}" placeholder="Search ${GAMES.length} games..." autocomplete="off"
                class="w-full h-10 pl-3.5 pr-8 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-pink-400 transition" />
              <button type="button" id="discovery-clear-btn" class="${discoverySearch ? '' : 'hidden'} absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm font-bold">✕</button>
            </div>

            <div class="relative group" id="hub-hamburger-wrapper">
              <button id="hub-hamburger-btn" type="button" onclick="toggleHubMenu(event)" aria-label="Open Menu" aria-expanded="false" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex flex-col items-center justify-center gap-1 transition active:scale-95">
                <span class="w-4 h-0.5 bg-slate-200 rounded-full"></span>
                <span class="w-4 h-0.5 bg-slate-200 rounded-full"></span>
                <span class="w-4 h-0.5 bg-slate-200 rounded-full"></span>
              </button>

              <div id="hub-hamburger-dropdown" class="hidden group-hover:block hover:block absolute right-0 top-full mt-2 w-60 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 p-1.5 shadow-2xl z-50">
                <button type="button" onclick="openSettingsModal()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-100 hover:bg-white/10 transition">
                  <span>🎵</span>
                  <span>BGM &amp; SFX Controls</span>
                </button>

                <button type="button" onclick="openQrShareModal()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-100 hover:bg-white/10 transition">
                  <span>📱</span>
                  <span>QR Code &amp; URL</span>
                </button>

                <button type="button" onclick="openInstructionsModal()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-100 hover:bg-white/10 transition">
                  <span>📖</span>
                  <span>Game Instructions</span>
                </button>

                <button type="button" onclick="openAboutModal()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-100 hover:bg-white/10 transition">
                  <span>ℹ️</span>
                  <span>About Arcade Hub</span>
                </button>
              </div>
            </div>
          </div>

          <div id="discovery-chips" class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button type="button" class="discovery-chip ${discoveryFilter === 'all' ? 'active' : ''}" data-filter="all">All (${GAMES.length})</button>
            <button type="button" class="discovery-chip ${discoveryFilter === 'portrait' ? 'active' : ''}" data-filter="portrait">Portrait</button>
            <button type="button" class="discovery-chip ${discoveryFilter === 'landscape' ? 'active' : ''}" data-filter="landscape">Landscape</button>
            <button type="button" class="discovery-chip ${discoveryFilter === 'action' ? 'active' : ''}" data-filter="action">Action</button>
            <button type="button" class="discovery-chip ${discoveryFilter === 'card' ? 'active' : ''}" data-filter="card">Card</button>
            <button type="button" class="discovery-chip ${discoveryFilter === 'puzzle' ? 'active' : ''}" data-filter="puzzle">Puzzle &amp; Board</button>
          </div>
        </div>

        <section id="discovery-hero" class="relative rounded-3xl overflow-hidden border border-white/15 p-5 sm:p-7 flex items-center justify-between gap-4 min-h-[185px] shadow-2xl">
          <div id="discovery-hero-bg" class="absolute inset-0 z-0 transition-all duration-300"></div>
          <div class="absolute inset-0 z-0" style="background:linear-gradient(90deg, rgba(9,10,16,0.92) 0%, rgba(9,10,16,0.65) 55%, rgba(9,10,16,0.25) 100%)"></div>
          <div class="relative z-10 max-w-xl">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">Spotlight Pick</span>
              <span id="discovery-hero-mode" class="text-[11px] font-bold text-slate-300">PORTRAIT</span>
              <span id="discovery-hero-num" class="text-[11px] font-mono text-slate-400">#09</span>
            </div>
            <h2 id="discovery-hero-title" class="text-2xl sm:text-3xl font-black text-white tracking-tight">Wordscape Pro</h2>
            <p id="discovery-hero-sub" class="text-xs sm:text-sm text-slate-300 mt-1 mb-4">Sunset Mountain Valley Sky • Puzzle</p>
            <div class="flex flex-wrap items-center gap-2.5">
              <button type="button" id="discovery-hero-play" class="px-5 py-2.5 rounded-xl bg-white text-slate-950 font-extrabold text-xs sm:text-sm hover:opacity-95 transition">▶ Play Now</button>
              <button type="button" onclick="cycleSpotlight()" class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs sm:text-sm transition">Next Pick</button>
            </div>
          </div>
          <div class="relative z-10 w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
            <span id="discovery-hero-icon" class="text-4xl sm:text-6xl drop-shadow-lg">📝</span>
          </div>
        </section>

        <div id="discovery-shelves" class="flex flex-col gap-6"></div>

        <div id="discovery-empty" class="hidden text-center py-12 flex flex-col items-center gap-3 text-slate-400">
          <p class="text-sm font-semibold">No games matched your search or filter.</p>
          <button type="button" onclick="resetDiscoveryFilters()" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white">Reset Filters</button>
        </div>
      </div>
    </div>
  `;

  updateSpotlightBanner();
  renderDiscoveryShelves();

  const searchInput = document.getElementById('hub-search-input');
  const clearBtn = document.getElementById('discovery-clear-btn');
  const chipsWrap = document.getElementById('discovery-chips');

  searchInput?.addEventListener('input', (e) => {
    discoverySearch = e.target.value;
    clearBtn?.classList.toggle('hidden', discoverySearch.length === 0);
    renderDiscoveryShelves();
  });

  clearBtn?.addEventListener('click', () => {
    discoverySearch = '';
    if (searchInput) searchInput.value = '';
    clearBtn.classList.add('hidden');
    renderDiscoveryShelves();
  });

  chipsWrap?.addEventListener('click', (e) => {
    const chip = e.target.closest('.discovery-chip');
    if (!chip) return;
    AudioFX.click();
    discoveryFilter = chip.dataset.filter || 'all';
    chipsWrap.querySelectorAll('.discovery-chip').forEach(c => c.classList.toggle('active', c === chip));
    renderDiscoveryShelves();
  });
}

function resetDiscoveryFilters() {
  discoveryFilter = 'all';
  discoverySearch = '';
  openHubHome();
}

function getGameRunners() {
  return {
    solitaire: window.initSpeedSolitaire,
    coinscatter: window.initCoinScatter,
    blackjack: window.initBlackjack,
    highlow: window.initHighLow,
    chess: window.initChess,
    dama: window.initDama,
    tictactoe: window.initTicTacToe,
    numberguess: window.initNumberGuess,
    wordscape: window.initWordscape,
    basketball: window.initBasketballHoops,
    fruitmaster: window.initFruitMaster,
    whackamole: window.initWhackAMole,
    cybersnake: window.initCyberSnakePreserved,
    towerstack: window.initTowerStack,
    carracing: window.initCarRacing,
    brickbreaker: window.initBrickBreaker,
    stickrun: window.initStickRun,
    'tiny-cafe': window.initTinyCafe
  };
}

function launchGame(id) {
  const canonId = normalizeGameId(id);
  const meta = GAMES.find(g => g.id === canonId);
  if (!meta) return;
  AudioFX.click();
  recordGamePlay(canonId);

  if (canonId === 'flickpoint') {
    window.location.href = 'flickpoint.html';
    return;
  }
  if (canonId === 'mythic') {
    window.location.href = 'mythic.html';
    return;
  }

  GameSettingsDrawer.close();
  GameLoopGuard.clearAllRaf();
  if (activeCleanup) {
    try { activeCleanup(); } catch (e) {}
    activeCleanup = null;
  }

  activeGameId = canonId;

  document.getElementById('hub-header')?.classList.add('hidden');
  syncUniversalGameBar(canonId);

  const appShell = document.getElementById('app-shell');
  if (appShell) appShell.style.background = getGameBgStyle(meta);
  BgEngine.setTheme(meta.theme);

  const stage = document.getElementById('game-stage');
  if (!stage) return;
  stage.classList.add('in-game');
  stage.innerHTML = '';

  const runners = getGameRunners();
  const runner = runners[canonId];
  if (typeof runner === 'function') {
    activeCleanup = runner(stage, meta) || null;
  } else {
    stage.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div class="text-4xl">${meta.icon}</div>
        <div class="text-lg font-black text-white">${meta.name} script not loaded yet</div>
        <p class="text-xs text-slate-400">Make sure its script tag is included in index.html before hub.js.</p>
        <button type="button" onclick="openHubHome()" class="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs">Back to Hub</button>
      </div>
    `;
  }
}
window.launchGame = launchGame;

window.addEventListener('DOMContentLoaded', () => {
  SupabaseDB.init();
  loadHubMetaState();
  syncFoxCompanionVisibility();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('hub') === 'true') {
    const splashScreen = document.getElementById('splash-screen');
    const powerScreen = document.getElementById('power-screen');
    const loginScreen = document.getElementById('login-screen');
    const appShell = document.getElementById('app-shell');
    const headerName = document.getElementById('header-player-name');

    if (splashScreen) {
      splashScreen.classList.add('splash-hide');
      splashScreen.setAttribute('aria-hidden', 'true');
      splashScreen.style.pointerEvents = 'none';
    }
    if (powerScreen) powerScreen.style.display = 'none';
    if (loginScreen) loginScreen.classList.add('hidden');

    if (appShell) appShell.classList.remove('hidden');
    window.playerName = 'AJ';
    if (headerName) headerName.textContent = window.playerName;

    syncFoxCompanionVisibility();
    openHubHome();
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}