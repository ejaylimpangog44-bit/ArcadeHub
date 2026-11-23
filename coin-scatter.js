window.initCoinScatter = function initCoinScatter(stage) {
  let active = true;
  let shuffleInterval = null;
  let bonusTimeout = null;
  let tallyInterval = null;

  stage.innerHTML = `
    <div class="relative w-full h-full flex flex-col items-center justify-center p-3 sm:p-6 pb-12 sm:pb-6 overflow-y-auto select-none">
      <div class="max-w-xl w-full bg-slate-950/80 backdrop-blur-xl border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 text-center mt-12 sm:mt-0">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs font-bold text-amber-300">
            🪙 COINS: <span id="scatter-coins">3,250</span>
          </div>
          <div class="text-[11px] font-extrabold uppercase tracking-widest text-amber-400/90">
            Poker Vault 5×3 Scatter Machine
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-fuchsia-950/60 border border-fuchsia-500/30 text-xs font-bold text-fuchsia-300">
            ⚡ FREE SPINS: <span id="scatter-spins">0</span>
          </div>
        </div>

        <div class="flex items-center justify-center gap-2">
          <span class="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs">
            🎲 Active Multiplier: <span id="active-mult-badge" class="font-black">1️⃣x</span>
          </span>
        </div>

        <div id="scatter-msg" class="text-xs sm:text-sm font-bold text-amber-200 bg-amber-500/10 border border-amber-500/20 py-2 px-4 rounded-xl">
          Match 3 Scatters (⚡) to Trigger Free Spins Bonus!
        </div>

        <div id="slot-grid" class="grid grid-cols-5 gap-2 sm:gap-3 bg-black/60 p-3 sm:p-4 rounded-2xl border border-white/10">
        </div>

        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 font-semibold">Bet:</span>
            <button id="bet-tier-btn" class="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition">
              50 🔼
            </button>
          </div>
          <button id="spin-btn" class="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 font-black text-sm text-slate-950 shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition">
            SPIN THE REELS 🎰
          </button>
        </div>
      </div>

      <div id="scatter-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md hidden items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-6 text-center shadow-2xl flex flex-col gap-4">
          <div class="text-4xl">🎉</div>
          <h2 id="modal-title" class="text-xl font-black text-amber-400">SPIN WIN COLLECTED!</h2>
          <p class="text-xs text-slate-300">Total Winnings Added to Vault:</p>
          <div class="text-3xl font-black text-white font-mono bg-black/40 py-3 rounded-2xl border border-white/10">
            🪙 <span id="modal-win-tally" class="text-amber-300">0</span> Coins
          </div>
          <button id="scatter-modal-close" class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 font-extrabold text-xs text-slate-950 hover:opacity-95 transition">
            Collect & Continue
          </button>
        </div>
      </div>
    </div>
  `;

  const symbols = ['♠', '♥', '♦', '♣', '🂡', '⚡'];
  let coins = 3250;
  const betTiers = [50, 500, 1000, 1500, 5000, 10000];
  let currentBetIdx = 0;
  let currentBet = betTiers[currentBetIdx];

  const multiplierChoices = [
    { val: 2, emoji: '2️⃣x' },
    { val: 3, emoji: '3️⃣x' },
    { val: 5, emoji: '5️⃣x' },
    { val: 10, emoji: '10️⃣x' }
  ];

  let freeSpinsTotal = 0;
  let freeSpinsRemaining = 0;
  let totalBonusWon = 0;
  let lastSessionWin = 0;
  let isAutoSpinning = false;
  let currentGrid = [
    ['♠', '⚡', '♥', '🂡', '♦'],
    ['⚡', '♦', '♣', '♦', '♠'],
    ['♥', '♣', '🂡', '🂡', '♠']
  ];

  function renderGrid(highlightScatters = false) {
    if (!active) return;
    const gridEl = document.getElementById('slot-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';
    currentGrid.forEach((row) => {
      row.forEach((sym) => {
        const isScatter = sym === '⚡';
        const cell = document.createElement('div');
        cell.className = `aspect-square rounded-xl flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300 ${
          isScatter && highlightScatters
            ? 'bg-amber-500/30 border-2 border-amber-400 shadow-lg shadow-amber-500/50 scale-105'
            : 'bg-white/5 border border-white/10'
        }`;
        cell.textContent = sym;
        gridEl.appendChild(cell);
      });
    });
  }

  function triggerSpin() {
    if (!active || isAutoSpinning) return;
    const msgEl = document.getElementById('scatter-msg');
    const coinsEl = document.getElementById('scatter-coins');
    const spinBtn = document.getElementById('spin-btn');

    if (coins < currentBet && freeSpinsRemaining === 0) {
      if (msgEl) msgEl.textContent = '⚠️ Not enough coins for this bet!';
      if (typeof AudioFX !== 'undefined') AudioFX.lose();
      return;
    }

    if (freeSpinsRemaining === 0) {
      coins -= currentBet;
      if (coinsEl) coinsEl.textContent = coins.toLocaleString();
    }

    if (typeof AudioFX !== 'undefined') AudioFX.click();
    isAutoSpinning = true;
    if (spinBtn) spinBtn.disabled = true;

    if (shuffleInterval) clearInterval(shuffleInterval);
    let shuffles = 0;
    shuffleInterval = setInterval(() => {
      if (!active) {
        clearInterval(shuffleInterval);
        shuffleInterval = null;
        return;
      }
      currentGrid = currentGrid.map(row => row.map(() => symbols[Math.floor(Math.random() * symbols.length)]));
      renderGrid(false);
      shuffles++;
      if (shuffles > 8) {
        clearInterval(shuffleInterval);
        shuffleInterval = null;
        finalizeSpinResult();
      }
    }, 90);
  }

  function finalizeSpinResult() {
    if (!active) return;
    currentGrid = currentGrid.map(row => row.map(() => symbols[Math.floor(Math.random() * symbols.length)]));

    let scatterCount = 0;
    currentGrid.forEach(row => row.forEach(sym => { if (sym === '⚡') scatterCount++; }));
    renderGrid(true);

    const randomMultObj = multiplierChoices[Math.floor(Math.random() * multiplierChoices.length)];
    const activeMultEl = document.getElementById('active-mult-badge');
    if (activeMultEl) activeMultEl.textContent = randomMultObj.emoji;

    const msgEl = document.getElementById('scatter-msg');
    const spinsEl = document.getElementById('scatter-spins');
    const spinBtn = document.getElementById('spin-btn');

    if (scatterCount >= 3 && freeSpinsRemaining === 0) {
      const possibleSpins = [5, 10, 15, 20];
      freeSpinsTotal = possibleSpins[Math.floor(Math.random() * possibleSpins.length)];
      freeSpinsRemaining = freeSpinsTotal;
      totalBonusWon = 0;
      if (spinsEl) spinsEl.textContent = freeSpinsRemaining;
      if (msgEl) msgEl.textContent = `⚡ 3+ SCATTERS! Won ${freeSpinsTotal} Free Spins! Starting bonus...`;
      if (typeof AudioFX !== 'undefined') AudioFX.win();
      if (typeof addXP === 'function') addXP(50);

      if (bonusTimeout) clearTimeout(bonusTimeout);
      bonusTimeout = setTimeout(() => {
        bonusTimeout = null;
        if (!active) return;
        isAutoSpinning = false;
        if (spinBtn) spinBtn.disabled = false;
        runAutoBonusSpins();
      }, 1200);
    } else if (freeSpinsRemaining > 0) {
      freeSpinsRemaining--;
      if (spinsEl) spinsEl.textContent = freeSpinsRemaining;

      const baseWin = Math.floor(Math.random() * 120) + 30;
      const spinWin = baseWin * randomMultObj.val;
      totalBonusWon += spinWin;

      if (msgEl) msgEl.textContent = `⚡ Free Spin Win: +${spinWin} Coins (${randomMultObj.emoji} Multiplier)!`;
      if (typeof AudioFX !== 'undefined') AudioFX.coin();

      isAutoSpinning = false;
      if (spinBtn) spinBtn.disabled = false;

      if (bonusTimeout) clearTimeout(bonusTimeout);
      bonusTimeout = setTimeout(() => {
        bonusTimeout = null;
        if (!active) return;
        if (freeSpinsRemaining > 0) {
          runAutoBonusSpins();
        } else {
          showWinModal(totalBonusWon, 'FREE SPINS FEATURE COMPLETE!');
        }
      }, 900);
    } else {
      const baseWin = Math.floor(Math.random() * 120) + 20;
      const spinWin = baseWin * randomMultObj.val;
      lastSessionWin = spinWin;

      if (msgEl) msgEl.textContent = `Spin Win: +${spinWin} Coins (${randomMultObj.emoji} Multiplier)!`;
      if (typeof AudioFX !== 'undefined') AudioFX.coin();

      isAutoSpinning = false;
      if (spinBtn) {
        spinBtn.disabled = false;
        spinBtn.textContent = 'SPIN THE REELS 🎰';
      }
      showWinModal(spinWin, 'SPIN WIN COLLECTED!');
    }
  }

  function runAutoBonusSpins() {
    if (!active) return;
    if (freeSpinsRemaining <= 0) {
      showWinModal(totalBonusWon, 'FREE SPINS FEATURE COMPLETE!');
      return;
    }
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) spinBtn.textContent = `AUTO-SPINNING (${freeSpinsRemaining} left)...`;
    triggerSpin();
  }

  function showWinModal(targetWin, titleText) {
    if (!active) return;
    const titleEl = document.getElementById('modal-title');
    const modalEl = document.getElementById('scatter-modal');
    const spinBtn = document.getElementById('spin-btn');
    const tallyEl = document.getElementById('modal-win-tally');

    if (titleEl) titleEl.textContent = titleText;
    if (modalEl) {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('flex');
    }
    if (spinBtn) spinBtn.textContent = 'SPIN THE REELS 🎰';

    if (tallyInterval) clearInterval(tallyInterval);
    let currentCount = 0;
    const step = Math.max(1, Math.floor(targetWin / 25));
    if (tallyEl) tallyEl.textContent = '0';

    tallyInterval = setInterval(() => {
      if (!active) {
        clearInterval(tallyInterval);
        tallyInterval = null;
        return;
      }
      currentCount += step;
      if (currentCount >= targetWin) {
        currentCount = targetWin;
        clearInterval(tallyInterval);
        tallyInterval = null;
      }
      if (tallyEl) tallyEl.textContent = currentCount.toLocaleString();
    }, 40);

    if (typeof AudioFX !== 'undefined') AudioFX.win();
    if (typeof addXP === 'function') addXP(75);
  }

  function closeModal() {
    if (!active) return;
    if (tallyInterval) {
      clearInterval(tallyInterval);
      tallyInterval = null;
    }
    const modalEl = document.getElementById('scatter-modal');
    const coinsEl = document.getElementById('scatter-coins');
    const spinsEl = document.getElementById('scatter-spins');
    const msgEl = document.getElementById('scatter-msg');

    if (modalEl) {
      modalEl.classList.remove('flex');
      modalEl.classList.add('hidden');
    }
    const prizeToAdd = totalBonusWon > 0 ? totalBonusWon : lastSessionWin;
    coins += prizeToAdd;
    totalBonusWon = 0;
    lastSessionWin = 0;
    freeSpinsTotal = 0;
    freeSpinsRemaining = 0;
    if (coinsEl) coinsEl.textContent = coins.toLocaleString();
    if (spinsEl) spinsEl.textContent = '0';
    if (msgEl) msgEl.textContent = 'Prize collected! Ready for next spin.';
  }

  const betBtn = document.getElementById('bet-tier-btn');
  const spinBtn = document.getElementById('spin-btn');
  const closeBtn = document.getElementById('scatter-modal-close');

  const onBetClick = () => {
    if (!active || isAutoSpinning) return;
    currentBetIdx = (currentBetIdx + 1) % betTiers.length;
    currentBet = betTiers[currentBetIdx];
    betBtn.textContent = `${currentBet >= 1000 ? (currentBet / 1000) + 'k' : currentBet} 🔼`;
    if (typeof AudioFX !== 'undefined') AudioFX.click();
  };

  betBtn?.addEventListener('click', onBetClick);
  spinBtn?.addEventListener('click', triggerSpin);
  closeBtn?.addEventListener('click', closeModal);

  renderGrid(false);

  return () => {
    active = false;
    if (shuffleInterval) clearInterval(shuffleInterval);
    if (bonusTimeout) clearTimeout(bonusTimeout);
    if (tallyInterval) clearInterval(tallyInterval);
    betBtn?.removeEventListener('click', onBetClick);
    spinBtn?.removeEventListener('click', triggerSpin);
    closeBtn?.removeEventListener('click', closeModal);
  };
};