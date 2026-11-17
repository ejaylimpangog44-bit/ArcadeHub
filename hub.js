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
    jump() { playTone(280, 'sine', 0.14, 0.1, 620); }
  };
})();

const GAMES = [
  // 📱 Portrait Mode Games (14)
  { id: 'solitaire', num: 1, name: 'Speed Solitaire', cat: 'Card', icon: '🃏', orientation: 'portrait', envName: 'Emerald Velvet Casino Table', bg: 'radial-gradient(circle at 50% 35%, #0f5132 0%, #062c1b 65%, #02140c 100%)', theme: 'casino_green' },
  { id: 'coinscatter', num: 2, name: 'Coin Scatter v2', cat: 'Card', icon: '🎰', orientation: 'portrait', envName: 'Golden Vault & Neon Chamber', bg: 'radial-gradient(circle at 50% 25%, #451a03 0%, #1c0a00 60%, #090300 100%)', theme: 'gold_vault' },
  { id: 'blackjack', num: 3, name: 'Blackjack 21', cat: 'Card', icon: '🂡', orientation: 'portrait', envName: 'VIP Mahogany & Royal Felt', bg: 'radial-gradient(circle at 50% 20%, #134e4a 0%, #042f2e 55%, #021312 100%)', theme: 'vip_table' },
  { id: 'highlow', num: 4, name: 'High-Low', cat: 'Card', icon: '🔼', orientation: 'portrait', envName: 'Midnight Crimson Lounge', bg: 'radial-gradient(circle at 50% 30%, #4c0519 0%, #1f040d 65%, #0a0104 100%)', theme: 'crimson_lounge' },
  { id: 'chess', num: 5, name: 'Chess', cat: 'Board', icon: '♟️', orientation: 'portrait', envName: 'Grandmaster Mahogany Study', bg: 'radial-gradient(circle at 50% 30%, #3e2723 0%, #1b100e 70%, #0c0706 100%)', theme: 'wood_study' },
  { id: 'dama', num: 6, name: 'Dama', cat: 'Board', icon: '🔴', orientation: 'portrait', envName: 'Sunlit Narra & Bamboo Veranda', bg: 'radial-gradient(circle at 50% 25%, #5c3a21 0%, #2b180c 65%, #120904 100%)', theme: 'bamboo_sun' },
  { id: 'tictactoe', num: 7, name: 'Tic-Tac-Toe', cat: 'Puzzle', icon: '❌', orientation: 'portrait', envName: 'Chalkboard & Neon Laser Grid', bg: 'radial-gradient(circle at 50% 50%, #111827 0%, #060913 100%)', theme: 'neon_chalk' },
  { id: 'whackamole', num: 8, name: 'Whack-a-Mole', cat: 'Action', icon: '🔨', orientation: 'portrait', envName: 'Sunlit Meadow & Garden Hills', bg: 'linear-gradient(180deg, #0284c7 0%, #38bdf8 42%, #16a34a 43%, #14532d 100%)', theme: 'sunny_meadow' },
  { id: 'basketball', num: 9, name: 'Basketball Hoops', cat: 'Action', icon: '🏀', orientation: 'portrait', envName: 'Neon Streetball Court', bg: 'radial-gradient(circle at 50% 0%, #7c2d12 0%, #1e1b4b 55%, #020617 100%)', theme: 'streetball_court' },
  { id: 'towerstack', num: 10, name: 'Tower Stack', cat: 'Action', icon: '🏗️', orientation: 'portrait', envName: 'Twilight Skyline to Stratosphere', bg: 'linear-gradient(180deg, #090d16 0%, #1e1b4b 45%, #6d28d9 80%, #f43f5e 100%)', theme: 'skyline_climb' },
  { id: 'cybersnake', num: 11, name: 'Cyber Snake', cat: 'Action', icon: '🐍', orientation: 'portrait', envName: 'Original Version Preserved', bg: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #090a10 100%)', theme: 'preserved', locked: true },
  { id: 'carracing', num: 12, name: 'Car Racing', cat: 'Racing', icon: '🏎️', orientation: 'portrait', envName: 'Neon Sunset Canyon Highway', bg: 'linear-gradient(180deg, #0f0722 0%, #3b0764 42%, #be123c 55%, #090a0f 56%)', theme: 'synth_highway' },
  { id: 'brickbreaker', num: 13, name: 'Brick Breaker', cat: 'Racing', icon: '🧱', orientation: 'portrait', envName: 'Cosmic Synthwave Core', bg: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #090d16 65%, #03050a 100%)', theme: 'cosmic_core' },
  { id: 'fruitmaster', num: 14, name: 'Fruit Master', cat: 'Action', icon: '🍉', orientation: 'portrait', envName: 'Tropical Bamboo & Sakura Dojo', bg: 'linear-gradient(160deg, #14532d 0%, #1e3a2f 45%, #3f2e21 100%)', theme: 'bamboo_dojo' },

  // 🖥️ Landscape Mode Games (5)
  { id: 'flickpoint', num: 1, name: 'Flickpoint', cat: 'Action', icon: '🎯', orientation: 'landscape', envName: 'Precision FPS Aim Training Facility', bg: 'radial-gradient(circle at 50% 20%, #111827 0%, #030712 70%, #000000 100%)', theme: 'neon_chalk' },
  { id: 'mythic', num: 2, name: 'Mythic Survivors', cat: 'Survival / Action', icon: '⚔️', orientation: 'landscape', envName: 'Mythic Survival Battlefield', bg: 'radial-gradient(circle at 50% 30%, #064e3b 0%, #1c1917 65%, #000000 100%)', theme: 'emerald' },
  { id: 'numberguess', num: 3, name: 'Number Guess', cat: 'Puzzle', icon: '🔢', orientation: 'landscape', envName: 'Cryptographic Matrix Vault', bg: 'radial-gradient(circle at 50% 30%, #052e16 0%, #02120a 70%, #000804 100%)', theme: 'matrix_vault' },
  { id: 'wordscape', num: 4, name: 'Wordscape Pro', cat: 'Puzzle', icon: '📝', orientation: 'landscape', envName: 'Sunset Mountain Valley Sky', bg: 'linear-gradient(180deg, #1e1b4b 0%, #4c1d95 38%, #be185d 75%, #f59e0b 100%)', theme: 'sunset_valley' },
  { id: 'stickrun', num: 5, name: 'Stick Run', cat: 'Runner', icon: '🏃', orientation: 'landscape', envName: 'Sunlit Park & Rooftop Horizon', bg: 'linear-gradient(180deg, #0ea5e9 0%, #7dd3fc 58%, #fef08a 74%, #1e293b 75%)', theme: 'stick_world' }
];

let activeGameId = null;
let activeCleanup = null;

function openHubHome() {
  if (activeCleanup) {
    try { activeCleanup(); } catch (e) {}
    activeCleanup = null;
  }
  activeGameId = null;

  document.getElementById('hub-header').classList.remove('hidden');
  document.getElementById('universal-game-bar').classList.add('hidden');

  const stage = document.getElementById('game-stage');
  stage.classList.remove('in-game');
  stage.className = "relative z-10 flex-1 w-full min-h-0 overflow-hidden flex flex-col items-center justify-center";

  const portraitGames = GAMES.filter(g => g.orientation === 'portrait');
  const landscapeGames = GAMES.filter(g => g.orientation === 'landscape');

  stage.innerHTML = `
    <div class="w-full h-full overflow-y-auto px-4 sm:px-8 py-6">
      <div class="max-w-6xl mx-auto flex flex-col gap-8 pb-12">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xl">📱</span>
            <h2 class="text-lg font-black text-white tracking-wide">Portrait Mode Games (14)</h2>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            ${portraitGames.map(g => `
              <button onclick="launchGame('${g.id}')" class="group relative overflow-hidden rounded-2xl p-4 text-left border border-white/10 hover:border-pink-400/50 transition-all flex flex-col justify-between min-h-[148px]" style="background:${g.bg}">
                <div class="absolute inset-0 bg-black/35 group-hover:bg-black/15 transition"></div>
                <div class="relative z-10 flex items-center justify-between w-full">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200">PORTRAIT</span>
                  <span class="text-[11px] font-mono text-white/60">#${g.num}</span>
                </div>
                <div class="relative z-10 my-2 text-center">
                  <div class="text-3xl sm:text-4xl drop-shadow-md group-hover:scale-110 transition-transform">${g.icon}</div>
                </div>
                <div class="relative z-10">
                  <div class="font-extrabold text-sm text-white leading-tight">${g.name}</div>
                  <div class="text-[10px] text-white/75 line-clamp-1 mt-0.5">${g.envName}</div>
                </div>
              </button>
            `).join('')}
          </div>
        </div>

        <div>
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xl">🖥️</span>
            <h2 class="text-lg font-black text-white tracking-wide">Landscape Mode Games (5)</h2>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            ${landscapeGames.map(g => `
              <button onclick="launchGame('${g.id}')" class="group relative overflow-hidden rounded-2xl p-4 text-left border border-white/10 hover:border-cyan-400/50 transition-all flex flex-col justify-between min-h-[148px]" style="background:${g.bg}">
                <div class="absolute inset-0 bg-black/35 group-hover:bg-black/15 transition"></div>
                <div class="relative z-10 flex items-center justify-between w-full">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200">LANDSCAPE</span>
                  <span class="text-[11px] font-mono text-white/60">#${g.num}</span>
                </div>
                <div class="relative z-10 my-2 text-center">
                  <div class="text-3xl sm:text-4xl drop-shadow-md group-hover:scale-110 transition-transform">${g.icon}</div>
                </div>
                <div class="relative z-10">
                  <div class="font-extrabold text-sm text-white leading-tight">${g.name}</div>
                  <div class="text-[10px] text-white/75 line-clamp-1 mt-0.5">${g.envName}</div>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function launchGame(id) {
  const meta = GAMES.find(g => g.id === id);
  if (!meta) return;
  AudioFX.click();

  if (id === 'flickpoint') {
    window.location.href = 'flickpoint.html';
    return;
  }
  if (id === 'mythic') {
    window.location.href = 'mythic.html';
    return;
  }
  
  if (activeCleanup) {
    try { activeCleanup(); } catch (e) {}
    activeCleanup = null;
  }

  activeGameId = id;

  document.getElementById('hub-header').classList.add('hidden');
  document.getElementById('universal-game-bar').classList.remove('hidden');

  document.getElementById('app-shell').style.background = meta.bg;

  const stage = document.getElementById('game-stage');
  stage.classList.add('in-game');
  
  // Apply correct orientation class (Landscape games now take full horizontal width)
  stage.className = `relative z-10 flex-1 w-full min-h-0 overflow-hidden flex flex-col items-center justify-center ${meta.orientation === 'landscape' ? 'game-viewport-landscape' : 'game-viewport-portrait'}`;
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
    basketball: initBasketballHoops,
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
