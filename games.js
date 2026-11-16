const SUITS = [
  { sym: '♠', color: 'text-slate-900', red: false },
  { sym: '♥', color: 'text-rose-600', red: true },
  { sym: '♦', color: 'text-rose-600', red: true },
  { sym: '♣', color: 'text-slate-900', red: false }
];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function createDeck() {
  const d = [];
  for (let s = 0; s < 4; s++) {
    for (let r = 0; r < 13; r++) {
      d.push({ suit: SUITS[s], rank: RANKS[r], val: r + 1 });
    }
  }
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// ----------------------------------------------------
// 1. SPEED SOLITAIRE (Card Game -> Excluded from Hero Coins)
// ----------------------------------------------------
function initSpeedSolitaire(stage) {
  let stock = [], waste = [], foundations = [[],[],[],[]], tableau = [[],[],[],[],[],[],[]];
  let score = 0, combo = 1, moves = 0, selected = null, seconds = 0;

  function deal() {
    const deck = createDeck();
    foundations = [[],[],[],[]];
    tableau = [[],[],[],[],[],[],[]];
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r <= c; r++) {
        const card = deck.pop();
        card.faceUp = (r === c);
        tableau[c].push(card);
      }
    }
    stock = deck.map(c => ({ ...c, faceUp: false }));
    waste = [];
    score = 0; combo = 1; moves = 0; seconds = 0; selected = null;
    render();
  }

  const timer = setInterval(() => {
    seconds++;
    const el = document.getElementById('sol-time');
    if (el) el.textContent = `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  }, 1000);

  function canMoveToFoundation(card, fIdx) {
    const pile = foundations[fIdx];
    if (pile.length === 0) return card.val === 1;
    const top = pile[pile.length - 1];
    return top.suit.sym === card.suit.sym && card.val === top.val + 1;
  }

  function canMoveToTableau(card, tIdx) {
    const pile = tableau[tIdx];
    if (pile.length === 0) return card.val === 13;
    const top = pile[pile.length - 1];
    return top.faceUp && top.suit.red !== card.suit.red && card.val === top.val - 1;
  }

  function autoFlip() {
    tableau.forEach(col => {
      if (col.length && !col[col.length - 1].faceUp) {
        col[col.length - 1].faceUp = true;
        score += 15;
      }
    });
  }

  function drawStock() {
    AudioFX.card();
    if (stock.length > 0) {
      const c = stock.pop();
      c.faceUp = true;
      waste.push(c);
    } else {
      stock = waste.reverse().map(c => ({ ...c, faceUp: false }));
      waste = [];
    }
    selected = null;
    render();
  }

  function autoSend(card, source) {
    for (let f = 0; f < 4; f++) {
      if (canMoveToFoundation(card, f)) {
        if (source.type === 'waste') waste.pop();
        else if (source.type === 'tab') tableau[source.col].pop();
        foundations[f].push(card);
        score += 50 * combo;
        combo = Math.min(8, combo + 1);
        moves++;
        AudioFX.coin();
        addXP(15, window.innerWidth * 0.6, 160, `+${50 * combo} PTS (${combo}x)`);
        autoFlip();
        selected = null;
        render();
        return true;
      }
    }
    return false;
  }

  function render() {
    const totalFound = foundations.reduce((a, b) => a + b.length, 0);
    stage.innerHTML = `
      <div class="w-full h-full flex flex-col justify-between px-3 sm:px-8 py-3 pb-12 sm:pb-6 overflow-y-auto">
        <div class="flex flex-wrap items-center justify-between gap-2 max-w-5xl w-full mx-auto">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full bg-emerald-950/80 border border-amber-400/30 text-amber-300 font-bold text-xs">SCORE: ${score}</span>
            <span class="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-emerald-200 font-mono text-xs">COMBO ${combo}x</span>
            <span id="sol-time" class="font-mono text-xs text-emerald-200/80">${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}</span>
          </div>
          <div class="flex items-center gap-2">
            <button id="sol-deal" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow">New Deal</button>
          </div>
        </div>

        ${totalFound === 52 ? `
          <div class="my-auto text-center">
            <div class="text-5xl mb-2">👑</div>
            <h2 class="text-3xl font-black text-amber-300">Table Cleared!</h2>
            <p class="text-emerald-100 text-sm mb-4">Final Score: ${score}</p>
            <button id="sol-win-deal" class="px-6 py-3 rounded-2xl bg-amber-400 text-slate-950 font-black">Play Again</button>
          </div>
        ` : `
        <div class="max-w-5xl w-full mx-auto grid grid-cols-7 gap-1.5 sm:gap-3 my-2">
          <button id="sol-stock" class="aspect-[2.5/3.5] rounded-xl border-2 border-amber-300/40 bg-emerald-900/70 flex flex-col items-center justify-center shadow-inner hover:border-amber-300">
            <span class="text-xl sm:text-2xl">${stock.length ? '🂠' : '🔄'}</span>
            <span class="text-[10px] font-bold text-emerald-200">${stock.length}</span>
          </button>

          <div id="sol-waste" class="aspect-[2.5/3.5] rounded-xl border border-dashed border-white/20 flex items-center justify-center">
            ${waste.length ? renderCardHTML(waste[waste.length - 1], selected?.type === 'waste') : ''}
          </div>

          <div></div>

          ${foundations.map((pile, i) => `
            <div data-found="${i}" class="sol-found aspect-[2.5/3.5] rounded-xl border-2 border-amber-400/35 bg-black/25 flex items-center justify-center cursor-pointer">
              ${pile.length ? renderCardHTML(pile[pile.length - 1], false) : `<span class="text-amber-300/40 text-xl font-bold">${SUITS[i].sym}</span>`}
            </div>
          `).join('')}
        </div>

        <div class="max-w-5xl w-full mx-auto grid grid-cols-7 gap-1.5 sm:gap-3 flex-1 min-h-[260px] pt-2">
          ${tableau.map((col, cIdx) => `
            <div data-tab="${cIdx}" class="sol-tab relative rounded-xl bg-black/15 border border-white/5 p-0.5 min-h-[220px]">
              ${col.map((card, rIdx) => {
                const isSel = selected && selected.type === 'tab' && selected.col === cIdx && rIdx >= selected.idx;
                return `
                  <div data-col="${cIdx}" data-idx="${rIdx}" class="sol-card absolute left-0.5 right-0.5 cursor-pointer" style="top:${rIdx * 22}px; z-index:${rIdx + 1}">
                    ${card.faceUp ? renderCardHTML(card, isSel) : `<div class="aspect-[2.5/3.5] rounded-lg bg-gradient-to-br from-rose-800 to-rose-950 border border-amber-200/30 shadow"></div>`}
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
        `}
      </div>
    `;

    document.getElementById('sol-deal')?.addEventListener('click', deal);
    document.getElementById('sol-win-deal')?.addEventListener('click', deal);
    document.getElementById('sol-stock')?.addEventListener('click', drawStock);

    document.getElementById('sol-waste')?.addEventListener('click', () => {
      if (!waste.length) return;
      const top = waste[waste.length - 1];
      if (selected?.type === 'waste') {
        autoSend(top, { type: 'waste' });
      } else {
        selected = { type: 'waste', card: top };
        AudioFX.click();
        render();
      }
    });

    document.querySelectorAll('.sol-found').forEach(el => {
      el.addEventListener('click', () => {
        const f = Number(el.dataset.found);
        if (!selected) return;
        const card = selected.type === 'waste' ? waste[waste.length - 1] : tableau[selected.col][selected.idx];
        if (selected.type === 'tab' && selected.idx !== tableau[selected.col].length - 1) return;
        if (canMoveToFoundation(card, f)) {
          if (selected.type === 'waste') waste.pop();
          else tableau[selected.col].pop();
          foundations[f].push(card);
          score += 50 * combo;
          combo = Math.min(8, combo + 1);
          AudioFX.coin();
          autoFlip();
          selected = null;
          render();
        }
      });
    });

    document.querySelectorAll('.sol-tab').forEach(el => {
      el.addEventListener('click', (e) => {
        const c = Number(el.dataset.tab);
        const cardEl = e.target.closest('.sol-card');
        if (cardEl) {
          const r = Number(cardEl.dataset.idx);
          const clickedCard = tableau[c][r];
          if (!clickedCard.faceUp) return;

          if (selected && !(selected.type === 'tab' && selected.col === c && selected.idx === r)) {
            const movingCard = selected.type === 'waste' ? waste[waste.length - 1] : tableau[selected.col][selected.idx];
            if (canMoveToTableau(movingCard, c)) {
              executeTableauMove(c);
              return;
            }
          }
          if (selected && selected.type === 'tab' && selected.col === c && r === tableau[c].length - 1) {
            if (autoSend(clickedCard, { type: 'tab', col: c })) return;
          }
          selected = { type: 'tab', col: c, idx: r };
          AudioFX.click();
          render();
        } else if (selected) {
          const movingCard = selected.type === 'waste' ? waste[waste.length - 1] : tableau[selected.col][selected.idx];
          if (canMoveToTableau(movingCard, c)) {
            executeTableauMove(c);
          }
        }
      });
    });
  }

  function executeTableauMove(targetCol) {
    if (selected.type === 'waste') {
      tableau[targetCol].push(waste.pop());
    } else {
      const slice = tableau[selected.col].splice(selected.idx);
      tableau[targetCol].push(...slice);
    }
    score += 20;
    AudioFX.card();
    autoFlip();
    selected = null;
    render();
  }

  function renderCardHTML(card, isSelected) {
    return `
      <div class="playing-card aspect-[2.5/3.5] w-full rounded-lg bg-slate-50 ${card.suit.color} p-1 sm:p-1.5 flex flex-col justify-between border-2 ${isSelected ? 'border-amber-400 ring-2 ring-amber-400/60 -translate-y-1' : 'border-slate-300'}">
        <div class="text-[11px] sm:text-sm font-black leading-none">${card.rank}${card.suit.sym}</div>
        <div class="text-base sm:text-2xl self-center leading-none">${card.suit.sym}</div>
        <div class="text-[10px] sm:text-xs font-bold self-end leading-none rotate-180">${card.rank}${card.suit.sym}</div>
      </div>
    `;
  }

  deal();
  return () => clearInterval(timer);
}

// ----------------------------------------------------
// 2. COIN SCATTER V2 (Casino Game -> Excluded from Hero Coins)
// ----------------------------------------------------
function initCoinScatter(stage, meta) {
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
          <button id="spin-btn" onclick="triggerScatterSpin()" class="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 font-black text-sm text-slate-950 shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition">
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
          <button onclick="closeScatterModal()" class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 font-extrabold text-xs text-slate-950 hover:opacity-95 transition">
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

  const betBtn = document.getElementById('bet-tier-btn');
  if (betBtn) {
    betBtn.onclick = () => {
      if (isAutoSpinning) return;
      currentBetIdx = (currentBetIdx + 1) % betTiers.length;
      currentBet = betTiers[currentBetIdx];
      betBtn.textContent = `${currentBet >= 1000 ? (currentBet/1000) + 'k' : currentBet} 🔼`;
      if (typeof AudioFX !== 'undefined') AudioFX.click();
    };
  }

  window.renderScatterGrid = function(highlightScatters = false) {
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
  };

  window.triggerScatterSpin = function() {
    if (isAutoSpinning) return;
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

    let shuffles = 0;
    const shuffleInterval = setInterval(() => {
      currentGrid = currentGrid.map(row => row.map(() => symbols[Math.floor(Math.random() * symbols.length)]));
      window.renderScatterGrid(false);
      shuffles++;
      if (shuffles > 8) {
        clearInterval(shuffleInterval);
        finalizeSpinResult();
      }
    }, 90);
  };

  function finalizeSpinResult() {
    currentGrid = currentGrid.map(row => row.map(() => symbols[Math.floor(Math.random() * symbols.length)]));
    
    let scatterCount = 0;
    currentGrid.forEach(row => row.forEach(sym => { if (sym === '⚡') scatterCount++; }));

    window.renderScatterGrid(true);

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

      setTimeout(() => {
        isAutoSpinning = false;
        if (spinBtn) spinBtn.disabled = false;
        runAutoBonusSpins();
      }, 1200);
    } else if (freeSpinsRemaining > 0) {
      freeSpinsRemaining--;
      if (spinsEl) spinsEl.textContent = freeSpinsRemaining;

      const baseWin = (Math.floor(Math.random() * 120) + 30);
      const spinWin = baseWin * randomMultObj.val;
      totalBonusWon += spinWin;

      if (msgEl) msgEl.textContent = `⚡ Free Spin Win: +${spinWin} Coins (${randomMultObj.emoji} Multiplier)!`;
      if (typeof AudioFX !== 'undefined') AudioFX.coin();

      isAutoSpinning = false;
      if (spinBtn) spinBtn.disabled = false;

      setTimeout(() => {
        if (freeSpinsRemaining > 0) {
          runAutoBonusSpins();
        } else {
          showWinModal(totalBonusWon, "FREE SPINS FEATURE COMPLETE!");
        }
      }, 900);
    } else {
      const baseWin = (Math.floor(Math.random() * 120) + 20);
      const spinWin = baseWin * randomMultObj.val;
      lastSessionWin = spinWin;

      if (msgEl) msgEl.textContent = `Spin Win: +${spinWin} Coins (${randomMultObj.emoji} Multiplier)!`;
      if (typeof AudioFX !== 'undefined') AudioFX.coin();

      isAutoSpinning = false;
      if (spinBtn) {
        spinBtn.disabled = false;
        spinBtn.textContent = "SPIN THE REELS 🎰";
      }
      showWinModal(spinWin, "SPIN WIN COLLECTED!");
    }
  }

  function runAutoBonusSpins() {
    if (freeSpinsRemaining <= 0) {
      showWinModal(totalBonusWon, "FREE SPINS FEATURE COMPLETE!");
      return;
    }
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) spinBtn.textContent = `AUTO-SPINNING (${freeSpinsRemaining} left)...`;
    window.triggerScatterSpin();
  }

  function showWinModal(targetWin, titleText) {
    const titleEl = document.getElementById('modal-title');
    const modalEl = document.getElementById('scatter-modal');
    const spinBtn = document.getElementById('spin-btn');
    const tallyEl = document.getElementById('modal-win-tally');

    if (titleEl) titleEl.textContent = titleText;
    if (modalEl) {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('flex');
    }
    if (spinBtn) spinBtn.textContent = "SPIN THE REELS 🎰";
    
    let currentCount = 0;
    const step = Math.max(1, Math.floor(targetWin / 25));
    if (tallyEl) tallyEl.textContent = "0";
    
    const countInterval = setInterval(() => {
      currentCount += step;
      if (currentCount >= targetWin) {
        currentCount = targetWin;
        clearInterval(countInterval);
      }
      if (tallyEl) tallyEl.textContent = currentCount.toLocaleString();
    }, 40);

    if (typeof AudioFX !== 'undefined') AudioFX.win();
    if (typeof addXP === 'function') addXP(75);
  }

  window.closeScatterModal = function() {
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
  };

  window.renderScatterGrid(false);
}

// ----------------------------------------------------
// 3. BLACKJACK 21 (Card Game -> Excluded from Hero Coins)
// ----------------------------------------------------
function initBlackjack(stage) {
  let bank = 2000, bet = 100, deck = [], player = [], dealer = [], phase = 'bet', status = 'Place your bet at the VIP Table';

  function handValue(hand) {
    let sum = 0, aces = 0;
    hand.forEach(c => {
      if (c.val === 1) { sum += 11; aces++; }
      else if (c.val >= 10) sum += 10;
      else sum += c.val;
    });
    while (sum > 21 && aces > 0) { sum -= 10; aces--; }
    return sum;
  }

  function deal() {
    if (bank < bet) bank = 1000;
    bank -= bet;
    deck = createDeck();
    player = [deck.pop(), deck.pop()];
    dealer = [deck.pop(), deck.pop()];
    phase = 'play';
    status = 'Hit, Stand, or Double Down';
    AudioFX.card();
    if (handValue(player) === 21) stand();
    else render();
  }

  function hit() {
    if (phase !== 'play') return;
    player.push(deck.pop());
    AudioFX.card();
    if (handValue(player) > 21) {
      phase = 'done';
      status = 'Bust! Dealer wins.';
      AudioFX.lose();
    }
    render();
  }

  function doubleDown() {
    if (phase !== 'play' || player.length !== 2 || bank < bet) return;
    bank -= bet;
    bet *= 2;
    player.push(deck.pop());
    AudioFX.card();
    if (handValue(player) > 21) {
      phase = 'done';
      status = 'Bust on Double Down!';
      bet /= 2;
      AudioFX.lose();
      render();
    } else {
      stand(true);
    }
  }

  function stand(wasDouble = false) {
    phase = 'done';
    while (handValue(dealer) < 17) {
      dealer.push(deck.pop());
    }
    const p = handValue(player), d = handValue(dealer);
    if (d > 21 || p > d) {
      const payout = (p === 21 && player.length === 2 && !wasDouble) ? Math.floor(bet * 2.5) : bet * 2;
      bank += payout;
      status = `You Win! +$${payout}`;
      AudioFX.win();
      addXP(25, window.innerWidth / 2, window.innerHeight * 0.45, `+$${payout}`);
    } else if (p === d) {
      bank += bet;
      status = 'Push — Bet Returned.';
    } else {
      status = 'Dealer Wins.';
      AudioFX.lose();
    }
    if (wasDouble) bet /= 2;
    render();
  }

  function cardEl(c, hidden = false) {
    if (hidden) {
      return `<div class="w-16 sm:w-24 aspect-[2.5/3.5] rounded-xl bg-gradient-to-br from-amber-700 to-amber-950 border-2 border-amber-300/50 shadow-xl flex items-center justify-center text-2xl">⚜️</div>`;
    }
    return `
      <div class="w-16 sm:w-24 aspect-[2.5/3.5] rounded-xl bg-white ${c.suit.color} p-2 flex flex-col justify-between shadow-xl border border-slate-300">
        <div class="text-sm sm:text-lg font-black leading-none">${c.rank}${c.suit.sym}</div>
        <div class="text-2xl sm:text-4xl self-center">${c.suit.sym}</div>
        <div class="text-xs sm:text-sm font-bold self-end rotate-180">${c.rank}${c.suit.sym}</div>
      </div>
    `;
  }

  function render() {
    const pVal = handValue(player);
    const dVal = phase === 'play' ? '?' : handValue(dealer);
    stage.innerHTML = `
      <div class="w-full h-full flex flex-col justify-between items-center px-4 py-4 pb-12 sm:pb-6 overflow-y-auto">
        <div class="flex items-center gap-3">
          <span class="px-4 py-1.5 rounded-full bg-black/50 border border-amber-400/40 text-amber-300 font-black text-xs sm:text-sm">BANK: $${bank.toLocaleString()}</span>
          <span class="px-4 py-1.5 rounded-full bg-teal-950/80 border border-teal-400/30 text-teal-200 font-bold text-xs sm:text-sm">BET: $${bet}</span>
        </div>

        <div class="flex flex-col items-center gap-2">
          <div class="text-xs uppercase tracking-widest text-teal-200/70 font-bold">Dealer (${dVal})</div>
          <div class="flex items-center gap-2 sm:gap-3 min-h-[110px]">
            ${dealer.map((c, idx) => cardEl(c, phase === 'play' && idx === 1)).join('')}
          </div>
        </div>

        <div class="px-6 py-2 rounded-full bg-black/40 border border-amber-400/30 text-amber-200 font-extrabold text-sm sm:text-base text-center">
          ${status}
        </div>

        <div class="flex flex-col items-center gap-2">
          <div class="flex items-center gap-2 sm:gap-3 min-h-[110px]">
            ${player.map(c => cardEl(c)).join('')}
          </div>
          <div class="text-xs uppercase tracking-widest text-amber-300 font-bold">Your Hand (${player.length ? pVal : 0})</div>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-2.5 pb-2">
          ${phase === 'play' ? `
            <button id="bj-hit" class="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg">HIT</button>
            <button id="bj-stand" class="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-sm shadow-lg">STAND</button>
            <button id="bj-dbl" class="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg">DOUBLE</button>
          ` : `
            ${[25, 100, 250, 500].map(amt => `
              <button data-chip="${amt}" class="bj-chip w-12 h-12 rounded-full font-black text-xs border-2 ${bet === amt ? 'border-amber-300 bg-amber-500 text-slate-950 scale-110' : 'border-white/30 bg-black/50 text-white'} transition">$${amt}</button>
            `).join('')}
            <button id="bj-deal" class="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-xl ml-2">DEAL HAND</button>
          `}
        </div>
      </div>
    `;

    document.getElementById('bj-hit')?.addEventListener('click', hit);
    document.getElementById('bj-stand')?.addEventListener('click', () => stand(false));
    document.getElementById('bj-dbl')?.addEventListener('click', doubleDown);
    document.getElementById('bj-deal')?.addEventListener('click', deal);
    document.querySelectorAll('.bj-chip').forEach(b => {
      b.onclick = () => { bet = Number(b.dataset.chip); AudioFX.click(); render(); };
    });
  }

  render();
}

// ----------------------------------------------------
// 4. HIGH-LOE / HIGH-LOW (Card Game -> Excluded from Hero Coins)
// ----------------------------------------------------
function initHighLow(stage) {
  let deck = createDeck();
  let current = deck.pop();
  let streak = 0, pot = 100, banked = 500, msg = 'Will the next card be Higher or Lower?';

  function guess(dir) {
    if (deck.length < 5) deck = createDeck();
    const next = deck.pop();
    const win = (dir === 'hi' && next.val >= current.val) || (dir === 'lo' && next.val <= current.val);
    current = next;
    if (win) {
      streak++;
      pot = Math.round(pot * 1.45);
      msg = `Correct! Streak ${streak}x — Pot is now ${pot}`;
      AudioFX.coin();
      addXP(12, window.innerWidth / 2, window.innerHeight * 0.4, `${streak}x STREAK!`);
    } else {
      streak = 0;
      pot = 100;
      msg = `Missed! Streak reset.`;
      AudioFX.lose();
    }
    render();
  }

  function cashOut() {
    if (streak === 0) return;
    banked += pot;
    AudioFX.win();
    addXP(30, window.innerWidth / 2, window.innerHeight * 0.4, `BANKED +${pot}!`);
    msg = `Cashed out +${pot} coins!`;
    streak = 0;
    pot = 100;
    render();
  }

  function render() {
    renderCard();
  }

  function renderCard() {
    stage.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-between px-4 py-5 pb-12 sm:pb-6 overflow-y-auto">
        <div class="flex items-center gap-3">
          <span class="px-4 py-1.5 rounded-full bg-rose-950/90 border border-rose-400/40 text-rose-200 font-bold text-xs">BANKED: ${banked}</span>
          <span class="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-300/40 text-amber-300 font-black text-xs">CURRENT POT: ${pot} (${streak}x)</span>
        </div>

        <div class="flex flex-col items-center gap-4 my-auto">
          <div class="text-sm sm:text-base font-bold text-rose-200 text-center">${msg}</div>

          <div class="w-40 sm:w-48 aspect-[2.5/3.5] rounded-3xl bg-white ${current.suit.color} p-4 flex flex-col justify-between shadow-[0_20px_60px_rgba(225,29,72,0.35)] border-4 border-amber-300/80">
            <div class="text-2xl sm:text-3xl font-black leading-none">${current.rank}${current.suit.sym}</div>
            <div class="text-6xl sm:text-7xl self-center">${current.suit.sym}</div>
            <div class="text-xl sm:text-2xl font-bold self-end rotate-180">${current.rank}${current.suit.sym}</div>
          </div>

          <div class="text-[11px] text-rose-300/70">Deck remaining: ${deck.length} cards (Ties win)</div>
        </div>

        <div class="flex items-center gap-3 pb-2">
          <button id="hl-lo" class="px-6 sm:px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm sm:text-base shadow-lg">🔽 LOWER</button>
          <button id="hl-cash" ${streak === 0 ? 'disabled' : ''} class="px-5 py-3.5 rounded-2xl bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm shadow-lg">💰 CASH OUT</button>
          <button id="hl-hi" class="px-6 sm:px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base shadow-lg">🔼 HIGHER</button>
        </div>
      </div>
    `;
    document.getElementById('hl-hi').onclick = () => guess('hi');
    document.getElementById('hl-lo').onclick = () => guess('lo');
    document.getElementById('hl-cash').onclick = cashOut;
  }

  render();
}

// ----------------------------------------------------
// 5. CHESS (Arcade Game - Fixed Drawer Positioning)
// ----------------------------------------------------
function initChess(stage) {
  const GLYPHS = {
    wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
    bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟'
  };
  const VALS = { P:10, N:32, B:33, R:50, Q:90, K:900 };

  let board = [], turn = 'w', sel = null, legal = [], capturedW = [], capturedB = [], status = 'Your Move (White)';
  let gameMode = 'pve'; 
  let aiDifficulty = 'normal'; 
  let drawerOpen = false;
  let configModalOpen = true;

  function reset() {
    const back = ['R','N','B','Q','K','B','N','R'];
    board = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => {
      if (r === 0) return 'b' + back[c];
      if (r === 1) return 'bP';
      if (r === 6) return 'wP';
      if (r === 7) return 'w' + back[c];
      return null;
    }));
    turn = 'w'; sel = null; legal = []; capturedW = []; capturedB = [];
    status = 'Your Move (White)';
    configModalOpen = false;
    render();
  }

  function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

  function pseudoMoves(b, r, c) {
    const p = b[r][c];
    if (!p) return [];
    const side = p[0], type = p[1], moves = [];
    const add = (nr, nc) => {
      if (!inBounds(nr, nc)) return false;
      const t = b[nr][nc];
      if (!t) { moves.push([nr, nc]); return true; }
      if (t[0] !== side) moves.push([nr, nc]);
      return false;
    };

    if (type === 'P') {
      const dir = side === 'w' ? -1 : 1;
      const start = side === 'w' ? 6 : 1;
      if (inBounds(r + dir, c) && !b[r + dir][c]) {
        moves.push([r + dir, c]);
        if (r === start && !b[r + dir * 2][c]) moves.push([r + dir * 2, c]);
      }
      [-1, 1].forEach(dc => {
        if (inBounds(r + dir, c + dc) && b[r + dir][c + dc] && b[r + dir][c + dc][0] !== side) {
          moves.push([r + dir, c + dc]);
        }
      });
    } else if (type === 'N') {
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => add(r + dr, c + dc));
    } else if (type === 'K') {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) add(r + dr, c + dc);
    } else {
      const dirs = [];
      if (type === 'R' || type === 'Q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
      if (type === 'B' || type === 'Q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
      dirs.forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc;
        while (add(nr, nc)) { nr += dr; nc += dc; }
      });
    }
    return moves;
  }

  function isKingInCheck(b, side) {
    let kr = -1, kc = -1;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (b[r][c] === side + 'K') { kr = r; kc = c; }
    const opp = side === 'w' ? 'b' : 'w';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c]?.[0] === opp) {
          if (pseudoMoves(b, r, c).some(([mr, mc]) => mr === kr && mc === kc)) return true;
        }
      }
    }
    return false;
  }

  function getLegalMoves(r, c) {
    const p = board[r][c];
    if (!p) return [];
    const side = p[0];
    return pseudoMoves(board, r, c).filter(([nr, nc]) => {
      const copy = board.map(row => [...row]);
      copy[nr][nc] = copy[r][c];
      copy[r][c] = null;
      return !isKingInCheck(copy, side);
    });
  }

  function applyMove(sr, sc, dr, dc) {
    const moving = board[sr][sc];
    const target = board[dr][dc];
    if (target) {
      if (target[0] === 'w') capturedW.push(target);
      else capturedB.push(target);
    }
    board[dr][dc] = moving;
    board[sr][sc] = null;

    if (moving === 'wP' && dr === 0) board[dr][dc] = 'wQ';
    if (moving === 'bP' && dr === 7) board[dr][dc] = 'bQ';
    AudioFX.card();
  }

  function aiMove() {
    const all = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]?.[0] === 'b') {
          getLegalMoves(r, c).forEach(([dr, dc]) => {
            const cap = board[dr][dc];
            const score = (cap ? VALS[cap[1]] * 10 : 0) + (dr * 0.5) + (aiDifficulty === 'hard' ? Math.random() : Math.random() * 4);
            all.push({ sr: r, sc: c, dr, dc, score });
          });
        }
      }
    }
    if (!all.length) {
      status = isKingInCheck(board, 'b') ? '🎉 You Win!' : 'Stalemate!';
      AudioFX.win();
      addXP(60, window.innerWidth / 2, window.innerHeight / 2, 'CHECKMATE +60 XP!');
      window.ArcadeHero?.awardGameScore('chess', 150);
      render();
      return;
    }
    all.sort((a, b) => b.score - a.score);
    const best = all[0];
    applyMove(best.sr, best.sc, best.dr, best.dc);
    turn = 'w';
    status = isKingInCheck(board, 'w') ? 'Check! Your Move' : 'Your Move (White)';
    render();
  }

  function render() {
    stage.innerHTML = `
      <div class="relative w-full h-full flex flex-col items-center justify-between px-3 py-3 pb-16 sm:pb-6 select-none overflow-y-auto">
        
        <div class="flex items-center justify-between w-full max-w-[min(90vw,440px)] z-10">
          <button id="chess-menu" class="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg font-black shadow hover:bg-amber-900 transition cursor-pointer">
            ☰
          </button>
          <div class="px-4 py-1.5 rounded-xl bg-black/60 border border-amber-400/30 text-amber-200 font-bold text-xs shadow text-center truncate max-w-[220px]">
            ${status}
          </div>
          <button id="chess-reset-btn" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow cursor-pointer">
            Reset
          </button>
        </div>

        <div class="text-[11px] text-amber-200/80 font-bold z-10">
          Captured: ${capturedB.map(p => GLYPHS[p]).join(' ')}
        </div>

        <div class="grid grid-cols-8 aspect-square w-[min(86vw,420px)] rounded-3xl overflow-hidden border-4 border-amber-900 shadow-[0_20px_60px_rgba(0,0,0,0.8)] my-auto z-10">
          ${board.map((row, r) => row.map((cell, c) => {
            const dark = (r + c) % 2 === 1;
            const isSel = sel && sel[0] === r && sel[1] === c;
            const isLeg = legal.some(([lr, lc]) => lr === r && lc === c);
            return `
              <button data-r="${r}" data-c="${c}" class="ch-sq relative flex items-center justify-center text-3xl sm:text-4xl touch-none ${dark ? 'bg-[#7c4a2d]' : 'bg-[#e7d3b5]'} ${isSel ? 'ring-inset ring-4 ring-amber-400 bg-amber-500/25' : ''}">
                ${cell ? `<span class="${cell[0] === 'w' ? 'text-white drop-shadow-[0_3px_3px_rgba(0,0,0,0.9)] font-bold' : 'text-slate-950 drop-shadow-[0_2px_2px_rgba(255,255,255,0.5)] font-bold'}">${GLYPHS[cell]}</span>` : ''}
                ${isLeg ? `<span class="absolute w-4 h-4 rounded-full ${cell ? 'ring-4 ring-emerald-400 bg-transparent w-9 h-9 rounded-xl' : 'bg-emerald-500/80 shadow-md w-4 h-4'}"></span>` : ''}
              </button>
            `;
          }).join('')).join('')}
        </div>

        <div class="text-[11px] text-amber-200/80 font-bold z-10">
          Lost: ${capturedW.map(p => GLYPHS[p]).join(' ')}
        </div>

        <!-- Settings Drawer Overlay (Positioned below top header) -->
        <div id="chess-drawer-bg" class="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}"></div>
        
        <div class="fixed top-16 bottom-0 left-0 z-40 w-[82%] max-w-xs bg-slate-900 border-r-4 border-t-2 border-amber-600/50 p-6 shadow-2xl flex flex-col gap-5 transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto rounded-tr-3xl">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 class="text-lg font-black text-amber-400">⚙️ Chess Settings</h2>
            <button id="chess-close-drawer" class="w-8 h-8 rounded-full bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer">✕</button>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">Game Mode</label>
            <div class="grid grid-cols-2 gap-2">
              <button id="chess-mode-pve" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pve' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10'}">🤖 vs AI</button>
              <button id="chess-mode-pvp" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pvp' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10'}">👥 2P PvP</button>
            </div>
          </div>

          <div id="chess-ai-diff" class="flex flex-col gap-1.5 ${gameMode === 'pvp' ? 'hidden' : ''}">
            <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Difficulty</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button id="chess-diff-easy" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'easy' ? 'bg-amber-600 text-white border-amber-400' : 'bg-black/40 text-slate-300 border-white/10'}">Easy</button>
              <button id="chess-diff-normal" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'normal' ? 'bg-amber-600 text-white border-amber-400' : 'bg-black/40 text-slate-300 border-white/10'}">Normal</button>
              <button id="chess-diff-hard" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'hard' ? 'bg-amber-600 text-white border-amber-400' : 'bg-black/40 text-slate-300 border-white/10'}">Hard</button>
            </div>
          </div>

          <button id="chess-apply-drawer" type="button" class="w-full py-3.5 mt-auto rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer">
            Apply &amp; Restart Match ⚔️
          </button>
        </div>

        <!-- Pre-Game Configuration Modal -->
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md ${configModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div class="max-w-sm w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-5">
            <div class="text-4xl">♟️</div>
            <h2 class="text-xl font-black text-amber-400">GRANDMASTER CHESS</h2>
            <p class="text-xs text-slate-300">Configure your match before starting:</p>
            
            <div class="flex flex-col gap-2 text-left">
              <label class="text-xs font-bold text-slate-400">Mode:</label>
              <div class="grid grid-cols-2 gap-2">
                <button id="chess-cfg-pve" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pve' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">vs AI</button>
                <button id="chess-cfg-pvp" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pvp' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">2P PvP</button>
              </div>
            </div>

            <button id="chess-start-btn" type="button" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer">
              START MATCH 🚀
            </button>
          </div>
        </div>

      </div>
    `;

    document.getElementById('chess-menu').onclick = () => { drawerOpen = true; render(); };
    document.getElementById('chess-reset-btn').onclick = () => { configModalOpen = true; render(); };
    document.getElementById('chess-close-drawer').onclick = () => { drawerOpen = false; render(); };
    document.getElementById('chess-drawer-bg').onclick = () => { drawerOpen = false; render(); };

    document.getElementById('chess-mode-pve').onclick = () => { gameMode = 'pve'; render(); };
    document.getElementById('chess-mode-pvp').onclick = () => { gameMode = 'pvp'; render(); };
    document.getElementById('chess-cfg-pve').onclick = () => { gameMode = 'pve'; render(); };
    document.getElementById('chess-cfg-pvp').onclick = () => { gameMode = 'pvp'; render(); };

    document.getElementById('chess-diff-easy').onclick = () => { aiDifficulty = 'easy'; render(); };
    document.getElementById('chess-diff-normal').onclick = () => { aiDifficulty = 'normal'; render(); };
    document.getElementById('chess-diff-hard').onclick = () => { aiDifficulty = 'hard'; render(); };

    document.getElementById('chess-apply-drawer').onclick = () => { drawerOpen = false; reset(); };
    document.getElementById('chess-start-btn').onclick = () => { reset(); };

    document.querySelectorAll('.ch-sq').forEach(btn => {
      btn.onpointerup = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (turn !== 'w' && gameMode === 'pve') return;
        const r = Number(btn.dataset.r), c = Number(btn.dataset.c);
        
        if (sel && legal.some(([lr, lc]) => lr === r && lc === c)) {
          applyMove(sel[0], sel[1], r, c);
          sel = null; legal = []; turn = gameMode === 'pve' ? 'b' : (turn === 'w' ? 'b' : 'w');
          status = gameMode === 'pve' ? 'Grandmaster AI thinking...' : `Player ${turn === 'w' ? 'White' : 'Black'}'s Turn`;
          render();
          if (gameMode === 'pve' && turn === 'b') {
            setTimeout(aiMove, 280);
          }
          return;
        }
        
        const currentSide = gameMode === 'pvp' ? turn : 'w';
        if (board[r][c]?.[0] === currentSide) {
          sel = [r, c];
          legal = getLegalMoves(r, c);
          AudioFX.click();
        } else {
          sel = null; legal = [];
        }
        render();
      };
    });
  }

  render();
}

// ----------------------------------------------------
// 6. DAMA (Arcade Game - Fixed Drawer Positioning)
// ----------------------------------------------------
function initDama(stage) {
  let board = [], turn = 'r', sel = null, moves = [], vsAI = true, status = 'Your Turn (Red Dama)';
  let redCaptured = 0, blueCaptured = 0, gameOver = false, winnerText = '';
  let drawerOpen = false;
  let configModalOpen = true;

  function reset() {
    board = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => {
      if ((r + c) % 2 === 1) {
        if (r < 3) return { side: 'b', king: false };
        if (r > 4) return { side: 'r', king: false };
      }
      return null;
    }));
    turn = 'r'; sel = null; moves = [];
    redCaptured = 0; blueCaptured = 0;
    gameOver = false; winnerText = '';
    status = vsAI ? 'Your Turn (Red Dama vs AI)' : 'Red Dama (Player 1) Turn';
    configModalOpen = false;
    render();
  }

  function getPieceMoves(r, c) {
    const p = board[r][c];
    if (!p) return [];
    const res = [];
    const capDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
    const stepDirs = p.king ? [[-1,-1],[-1,1],[1,-1],[1,1]] : (p.side === 'r' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);

    capDirs.forEach(([dr, dc]) => {
      if (!p.king) {
        const mr = r + dr, mc = c + dc, jr = r + dr * 2, jc = c + dc * 2;
        if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && board[mr][mc] && board[mr][mc].side !== p.side && !board[jr][jc]) {
          res.push({ dr: jr, dc: jc, cap: [mr, mc] });
        }
      } else {
        let step = 1, foundEnemy = null;
        while (true) {
          const nr = r + dr * step, nc = c + dc * step;
          if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
          const cell = board[nr][nc];
          if (!cell) {
            if (foundEnemy) res.push({ dr: nr, dc: nc, cap: foundEnemy });
          } else if (cell.side === p.side) {
            break;
          } else {
            if (foundEnemy) break;
            foundEnemy = [nr, nc];
          }
          step++;
        }
      }
    });

    stepDirs.forEach(([dr, dc]) => {
      let step = 1;
      while (true) {
        const nr = r + dr * step, nc = c + dc * step;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8 || board[nr][nc]) break;
        res.push({ dr: nr, dc: nc, cap: null });
        if (!p.king) break;
        step++;
      }
    });

    return res;
  }

  function checkWinCondition() {
    let redCount = 0, blueCount = 0;
    let redHasMoves = false, blueHasMoves = false;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          if (p.side === 'r') {
            redCount++;
            if (getPieceMoves(r, c).length > 0) redHasMoves = true;
          } else {
            blueCount++;
            if (getPieceMoves(r, c).length > 0) blueHasMoves = true;
          }
        }
      }
    }

    if (redCount === 0 || (turn === 'r' && !redHasMoves)) {
      triggerGameOver(vsAI ? '🤖 AI Wins!' : 'Blue Player Wins!');
      return true;
    }
    if (blueCount === 0 || (turn === 'b' && !blueHasMoves)) {
      triggerGameOver(vsAI ? '🎉 You Win!' : 'Red Player Wins!');
      return true;
    }
    return false;
  }

  function triggerGameOver(msg) {
    gameOver = true;
    winnerText = msg;
    status = msg;
    AudioFX.win();
    addXP(50, window.innerWidth / 2, window.innerHeight / 2, 'DAMA VICTORY!');
    window.ArcadeHero?.awardGameScore('dama', 100);
    render();
  }

  function aiTurn() {
    if (gameOver) return;
    const all = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]?.side === 'b') {
          getPieceMoves(r, c).forEach(m => all.push({ sr: r, sc: c, ...m }));
        }
      }
    }
    if (!all.length) {
      triggerGameOver('🎉 You Win!');
      return;
    }
    const caps = all.filter(m => m.cap);
    const pick = (caps.length ? caps : all)[Math.floor(Math.random() * (caps.length ? caps.length : all.length))];
    const piece = board[pick.sr][pick.sc];
    board[pick.dr][pick.dc] = piece;
    board[pick.sr][pick.sc] = null;
    
    let chained = false;
    if (pick.cap) {
      board[pick.cap[0]][pick.cap[1]] = null;
      blueCaptured++;
      AudioFX.coin();
      const nextMoves = getPieceMoves(pick.dr, pick.dc).filter(m => m.cap);
      if (nextMoves.length > 0) chained = true;
    }

    if (pick.dr === 7) piece.king = true;
    AudioFX.card();

    if (checkWinCondition()) return;

    if (!chained) {
      turn = 'r';
      status = vsAI ? 'Your Turn (Red Dama)' : 'Red Dama (Player 1) Turn';
    } else {
      status = 'AI Chain Jumping!';
      setTimeout(aiTurn, 500);
    }
    render();
  }

  function render() {
    stage.innerHTML = `
      <div class="relative w-full h-full flex flex-col items-center justify-between px-3 py-3 pb-16 sm:pb-6 select-none overflow-y-auto">
        
        <div class="flex items-center justify-between w-full max-w-[min(90vw,480px)] z-10">
          <button id="dama-menu" class="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg font-black shadow hover:bg-amber-900 transition cursor-pointer">
            ☰
          </button>
          <div class="px-4 py-1.5 rounded-xl bg-black/60 border border-amber-400/30 text-amber-200 font-bold text-xs shadow text-center truncate max-w-[220px]">
            ${status}
          </div>
          <button id="dama-reset-btn" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow cursor-pointer">
            Reset
          </button>
        </div>

        <div class="flex items-center gap-3 z-10">
          <span class="px-3 py-1 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 font-bold text-xs">🔴 Red: ${redCaptured}</span>
          <span class="px-3 py-1 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-200 font-bold text-xs">🔵 Blue: ${blueCaptured}</span>
        </div>

        <div class="grid grid-cols-8 aspect-square w-[min(88vw,440px)] rounded-3xl overflow-hidden border-4 border-[#3d1f0d] shadow-[0_20px_60px_rgba(0,0,0,0.8)] my-auto z-10">
          ${board.map((row, r) => row.map((cell, c) => {
            const dark = (r + c) % 2 === 1;
            const isSel = sel && sel[0] === r && sel[1] === c;
            const targetMove = moves.find(m => m.dr === r && m.dc === c);
            return `
              <button data-r="${r}" data-c="${c}" class="dm-sq relative flex items-center justify-center ${dark ? 'bg-[#5c3317]' : 'bg-[#deb887]'} ${isSel ? 'ring-inset ring-4 ring-amber-300' : ''}">
                ${cell ? `
                  <div class="w-[74%] h-[74%] rounded-full shadow-lg flex items-center justify-center font-black text-xs sm:text-sm border-2 ${cell.side === 'r' ? 'bg-gradient-to-br from-rose-500 to-red-800 border-rose-200 text-amber-200' : 'bg-gradient-to-br from-slate-700 to-slate-950 border-sky-300 text-sky-300'}">
                    ${cell.king ? '👑' : ''}
                  </div>
                ` : ''}
                ${targetMove ? `<span class="absolute w-4 h-4 rounded-full ${targetMove.cap ? 'bg-rose-500 animate-ping' : 'bg-emerald-400/80'}"></span>` : ''}
              </button>
            `;
          }).join('')).join('')}
        </div>

        <!-- Settings Drawer Overlay (Positioned below top header) -->
        <div id="dama-drawer-bg" class="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}"></div>
        
        <div class="fixed top-16 bottom-0 left-0 z-40 w-[82%] max-w-xs bg-slate-900 border-r-4 border-t-2 border-amber-600/50 p-6 shadow-2xl flex flex-col gap-5 transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto rounded-tr-3xl">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 class="text-lg font-black text-amber-400">⚙️ Dama Settings</h2>
            <button id="dama-close-drawer" class="w-8 h-8 rounded-full bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer">✕</button>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">Game Mode</label>
            <div class="grid grid-cols-2 gap-2">
              <button id="dama-mode-ai" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${vsAI ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10'}">🤖 vs AI</button>
              <button id="dama-mode-pvp" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${!vsAI ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10'}">👥 2P PvP</button>
            </div>
          </div>

          <button id="dama-apply-drawer" type="button" class="w-full py-3.5 mt-auto rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer">
            Apply &amp; Restart Match ⚔️
          </button>
        </div>

        <!-- Pre-Game Configuration Modal -->
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md ${configModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div class="max-w-sm w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-5">
            <div class="text-4xl">🔴👑</div>
            <h2 class="text-xl font-black text-amber-400">FILIPINO DAMA</h2>
            <p class="text-xs text-slate-300">Configure your match before starting:</p>
            
            <div class="flex flex-col gap-2 text-left">
              <label class="text-xs font-bold text-slate-400">Mode:</label>
              <div class="grid grid-cols-2 gap-2">
                <button id="dama-cfg-ai" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${vsAI ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">vs AI</button>
                <button id="dama-cfg-pvp" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${!vsAI ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">2P PvP</button>
              </div>
            </div>

            <button id="dama-start-btn" type="button" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer">
              START MATCH 🚀
            </button>
          </div>
        </div>

        <!-- Winner Modal Overlay -->
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md ${gameOver ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div class="max-w-sm w-full bg-slate-900 border-2 border-amber-400/60 rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-4">
            <div class="text-5xl">🏆</div>
            <h2 class="text-2xl font-black text-amber-300">GAME OVER</h2>
            <div class="text-lg font-extrabold text-white bg-black/40 py-3 rounded-2xl border border-white/10">
              ${winnerText}
            </div>
            <button id="dama-play-again-btn" type="button" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer">
              🔄 Play Again
            </button>
          </div>
        </div>

      </div>
    `;

    document.getElementById('dama-menu').onclick = () => { drawerOpen = true; render(); };
    document.getElementById('dama-reset-btn').onclick = () => { configModalOpen = true; render(); };
    document.getElementById('dama-close-drawer').onclick = () => { drawerOpen = false; render(); };
    document.getElementById('dama-drawer-bg').onclick = () => { drawerOpen = false; render(); };

    document.getElementById('dama-mode-ai').onclick = () => { vsAI = true; render(); };
    document.getElementById('dama-mode-pvp').onclick = () => { vsAI = false; render(); };
    document.getElementById('dama-cfg-ai').onclick = () => { vsAI = true; render(); };
    document.getElementById('dama-cfg-pvp').onclick = () => { vsAI = false; render(); };

    document.getElementById('dama-apply-drawer').onclick = () => { drawerOpen = false; reset(); };
    document.getElementById('dama-start-btn').onclick = () => { reset(); };
    document.getElementById('dama-play-again-btn').onclick = () => { reset(); };

    document.querySelectorAll('.dm-sq').forEach(btn => {
      btn.onclick = () => {
        if (gameOver) return;
        const r = Number(btn.dataset.r), c = Number(btn.dataset.c);
        const currentSide = turn;
        if (vsAI && currentSide !== 'r') return;

        const mv = moves.find(m => m.dr === r && m.dc === c);
        if (sel && mv) {
          const piece = board[sel[0]][sel[1]];
          board[r][c] = piece;
          board[sel[0]][sel[1]] = null;
          
          let chained = false;
          if (mv.cap) {
            board[mv.cap[0]][mv.cap[1]] = null;
            redCaptured++;
            AudioFX.coin();
            addXP(15, window.innerWidth / 2, window.innerHeight / 2, 'CAPTURE!');
            
            const nextMoves = getPieceMoves(r, c).filter(m => m.cap);
            if (nextMoves.length > 0) {
              chained = true;
              sel = [r, c];
              moves = nextMoves;
              status = `Chain Jump! Pick target`;
              AudioFX.click();
              render();
              return;
            }
          } else {
            AudioFX.card();
          }

          if (currentSide === 'r' && r === 0) piece.king = true;
          if (currentSide === 'b' && r === 7) piece.king = true;

          sel = null; moves = [];
          
          if (checkWinCondition()) return;

          if (!chained) {
            turn = currentSide === 'r' ? 'b' : 'r';
            status = vsAI ? 'Opponent moving...' : (turn === 'r' ? 'Red Dama (Player 1) Turn' : 'Blue Dama (Player 2) Turn');
          }
          render();

          if (vsAI && turn === 'b' && !gameOver) {
            setTimeout(aiTurn, 400);
          }
          return;
        }

        if (board[r][c]?.side === currentSide) {
          sel = [r, c];
          moves = getPieceMoves(r, c);
          AudioFX.click();
        } else {
          sel = null; moves = [];
        }
        render();
      };
    });
  }

  reset();
}

// ----------------------------------------------------
// 7. TIC-TAC-TOE (Arcade Game -> Included with Hero Score Reward)
// ----------------------------------------------------
function initTicTacToe(stage) {
  let cells = Array(9).fill(null);
  let gameMode = 'pve'; 
  let difficulty = 'normal'; 
  let playerSymbol = 'X'; 
  let currentTurn = 'X'; 
  let over = false;
  let winLine = [];
  let msg = '';
  let drawerOpen = false;
  let endModalOpen = false;
  let endModalTitle = '';

  function getAiSymbol() {
    return playerSymbol === 'X' ? 'O' : 'X';
  }

  function resetGame() {
    cells = Array(9).fill(null);
    currentTurn = 'X';
    over = false;
    winLine = [];
    endModalOpen = false;
    updateStatus();
    render();
    if (gameMode === 'pve' && currentTurn !== playerSymbol && !over) {
      setTimeout(aiStep, 350);
    }
  }

  function updateStatus() {
    if (over) return;
    if (gameMode === 'pvp') {
      msg = `Player ${currentTurn}'s Turn`;
    } else {
      msg = currentTurn === playerSymbol ? `Your Turn (${playerSymbol})` : `AI Thinking...`;
    }
  }

  function checkWinner(arr) {
    const lines = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];
    for (const line of lines) {
      const [a, b, c] = line;
      if (arr[a] && arr[a] === arr[b] && arr[a] === arr[c]) {
        return { winner: arr[a], line };
      }
    }
    if (arr.every(Boolean)) return { winner: 'draw', line: [] };
    return null;
  }

  function minimax(newCells, depth, isMaximizing, aiSym, humanSym) {
    const res = checkWinner(newCells);
    if (res) {
      if (res.winner === aiSym) return 10 - depth;
      if (res.winner === humanSym) return depth - 10;
      return 0;
    }
    const empty = newCells.map((v, i) => v === null ? i : null).filter(v => v !== null);
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const idx of empty) {
        newCells[idx] = aiSym;
        const evaluation = minimax(newCells, depth + 1, false, aiSym, humanSym);
        newCells[idx] = null;
        maxEval = Math.max(maxEval, evaluation);
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const idx of empty) {
        newCells[idx] = humanSym;
        const evaluation = minimax(newCells, depth + 1, true, aiSym, humanSym);
        newCells[idx] = null;
        minEval = Math.min(minEval, evaluation);
      }
      return minEval;
    }
  }

  function getBestMove(board, aiSym, humanSym) {
    let bestEval = -Infinity;
    let bestMove = null;
    const empty = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    for (const idx of empty) {
      board[idx] = aiSym;
      const evalScore = minimax(board, 0, false, aiSym, humanSym);
      board[idx] = null;
      if (evalScore > bestEval) {
        bestEval = evalScore;
        bestMove = idx;
      }
    }
    return bestMove;
  }

  function aiStep() {
    if (over || gameMode !== 'pve') return;
    const aiSym = getAiSymbol();
    if (currentTurn !== aiSym) return;

    const empty = cells.map((v, i) => v === null ? i : null).filter(v => v !== null);
    if (!empty.length) return;

    let choice = null;
    if (difficulty === 'easy') {
      choice = empty[Math.floor(Math.random() * empty.length)];
    } else if (difficulty === 'normal') {
      if (Math.random() < 0.65) {
        for (const sym of [aiSym, playerSymbol]) {
          for (const idx of empty) {
            const copy = [...cells];
            copy[idx] = sym;
            if (checkWinner(copy)?.winner === sym) { choice = idx; break; }
          }
          if (choice !== null) break;
        }
      }
      if (choice === null) choice = empty[Math.floor(Math.random() * empty.length)];
    } else {
      choice = getBestMove([...cells], aiSym, playerSymbol);
    }

    if (choice !== null) {
      cells[choice] = aiSym;
      AudioFX.card();
      const res = checkWinner(cells);
      if (res) {
        finishGame(res);
      } else {
        currentTurn = playerSymbol;
        updateStatus();
        render();
      }
    }
  }

  function finishGame(res) {
    over = true;
    winLine = res.line;
    if (res.winner === 'draw') {
      msg = 'Game Drawn — Stalemate!';
      endModalTitle = '🤝 Stalemate / Draw!';
    } else {
      if (gameMode === 'pvp') {
        msg = `Player ${res.winner} Wins!`;
        endModalTitle = `🏆 Player ${res.winner} Wins!`;
      } else {
        if (res.winner === playerSymbol) {
          msg = `🎉 Victory! You Win!`;
          endModalTitle = '🎉 Victory! You Won!';
          AudioFX.win();
          addXP(30, window.innerWidth / 2, window.innerHeight / 2, 'VICTORY +30 XP!');
          window.ArcadeHero?.awardGameScore('tic-tac-toe', 50);
        } else {
          msg = `AI Wins!`;
          endModalTitle = '🤖 AI Wins! Better Luck Next Time';
          AudioFX.lose();
        }
      }
    }
    endModalOpen = true;
    render();
  }

  function render() {
    stage.innerHTML = `
      <div class="relative w-full h-full flex flex-col items-center justify-between p-4 bg-[#f4f1ea] text-stone-900 select-none overflow-hidden">
        
        <div class="flex items-center justify-between w-full max-w-sm px-2 pt-1">
          <button id="hamburger-btn" class="w-10 h-10 rounded-xl bg-[#e6e2d3] border-2 border-[#d3c9b1] flex items-center justify-center text-stone-800 text-xl font-black shadow-sm hover:bg-[#d3c9b1] transition">
            ☰
          </button>
          <div class="text-xs font-extrabold uppercase tracking-widest text-stone-600 bg-[#e6e2d3] px-3 py-1.5 rounded-xl border border-[#d3c9b1]">
            ${gameMode === 'pvp' ? '👥 PvP' : `🤖 AI (${difficulty})`}
          </div>
        </div>

        <div class="text-lg font-black text-stone-800 tracking-wide text-center my-1">
          ${msg}
        </div>

        <div class="grid grid-cols-3 gap-3 w-[min(84vw,340px)] aspect-square bg-[#8c7b65] p-3 rounded-2xl shadow-xl border-4 border-[#6b5d4b] my-auto">
          ${cells.map((v, i) => {
            const isWin = winLine.includes(i);
            return `
              <button data-i="${i}" class="ttt-cell rounded-xl bg-[#fdfbf7] border-2 ${isWin ? 'border-amber-600 bg-amber-100 shadow-inner scale-[1.02]' : 'border-[#d3c9b1] hover:bg-white'} flex items-center justify-center font-black text-6xl sm:text-7xl transition shadow-sm">
                ${v === 'X' ? '<span class="text-blue-900 drop-shadow-sm">X</span>' : v === 'O' ? '<span class="text-red-700 drop-shadow-sm">O</span>' : ''}
              </button>
            `;
          }).join('')}
        </div>

        <div class="h-6"></div>

        <div id="settings-overlay" class="fixed inset-0 z-40 bg-stone-950/50 backdrop-blur-xs transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}" onclick="closeDrawer()"></div>
        
        <div id="settings-drawer" class="fixed top-0 bottom-0 left-0 z-50 w-[82%] max-w-xs bg-[#fdfbf7] border-r-4 border-[#8c7b65] p-6 shadow-2xl flex flex-col gap-5 transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#d3c9b1] pb-3">
            <h2 class="text-lg font-black text-stone-900">⚙️ Game Settings</h2>
            <button onclick="closeDrawer()" class="w-8 h-8 rounded-full bg-[#d3c9b1] text-stone-900 font-bold flex items-center justify-center">✕</button>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-stone-700 uppercase tracking-wider">Game Mode</label>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="py-2.5 px-2 rounded-xl font-bold text-xs border-2 transition ${gameMode === 'pve' ? 'bg-blue-900 text-white border-blue-900 shadow' : 'bg-[#f4f1ea] text-stone-800 border-[#d3c9b1]'}" onclick="setGameMode('pve')">
                🤖 vs AI
              </button>
              <button type="button" class="py-2.5 px-2 rounded-xl font-bold text-xs border-2 transition ${gameMode === 'pvp' ? 'bg-blue-900 text-white border-blue-900 shadow' : 'bg-[#f4f1ea] text-stone-800 border-[#d3c9b1]'}" onclick="setGameMode('pvp')">
                👥 PvP
              </button>
            </div>
          </div>

          <div id="ai-settings-section" class="flex flex-col gap-1.5 ${gameMode === 'pvp' ? 'hidden' : ''}">
            <label class="text-xs font-bold text-stone-700 uppercase tracking-wider">AI Difficulty</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition ${difficulty === 'easy' ? 'bg-amber-600 text-white border-amber-600' : 'bg-[#f4f1ea] text-stone-800 border-[#d3c9b1]'}" onclick="setDiff('easy')">Easy</button>
              <button type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition ${difficulty === 'normal' ? 'bg-amber-600 text-white border-amber-600' : 'bg-[#f4f1ea] text-stone-800 border-[#d3c9b1]'}" onclick="setDiff('normal')">Normal</button>
              <button type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition ${difficulty === 'hard' ? 'bg-amber-600 text-white border-amber-600' : 'bg-[#f4f1ea] text-stone-800 border-[#d3c9b1]'}" onclick="setDiff('hard')">Hard</button>
            </div>
          </div>

          <div id="symbol-settings-section" class="flex flex-col gap-1.5 ${gameMode === 'pvp' ? 'hidden' : ''}">
            <label class="text-xs font-bold text-stone-700 uppercase tracking-wider">Play As</label>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="py-2.5 rounded-xl font-bold text-sm border-2 transition ${playerSymbol === 'X' ? 'bg-blue-900 text-white border-blue-900' : 'bg-[#f4f1ea] text-blue-900 border-[#d3c9b1]'}" onclick="setSymbol('X')">X (First)</button>
              <button type="button" class="py-2.5 rounded-xl font-bold text-sm border-2 transition ${playerSymbol === 'O' ? 'bg-red-700 text-white border-red-700' : 'bg-[#f4f1ea] text-red-700 border-[#d3c9b1]'}" onclick="setSymbol('O')">O (Second)</button>
            </div>
          </div>

          <button onclick="applyDrawerSettings()" class="w-full py-3 mt-auto rounded-2xl bg-[#8c7b65] hover:bg-[#786955] text-white font-black text-sm shadow-md transition">
            Apply & Restart ⚔️
          </button>
        </div>

        <div id="endgame-modal" class="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm ${endModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div class="max-w-sm w-full bg-[#fdfbf7] border-4 border-[#8c7b65] rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-5 animate-in fade-in zoom-in duration-200">
            <div class="text-4xl">👑</div>
            <h2 class="text-xl font-black text-stone-900">${endModalTitle}</h2>
            <p class="text-xs text-stone-600">Great match! Ready for another round?</p>
            <button onclick="resetGame()" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-black text-sm shadow-lg hover:opacity-95 transition">
              🔄 Restart Match
            </button>
          </div>
        </div>

      </div>
    `;

    document.getElementById('hamburger-btn')?.addEventListener('click', () => {
      drawerOpen = true;
      render();
    });

    window.closeDrawer = () => {
      drawerOpen = false;
      render();
    };

    window.setGameMode = (mode) => {
      gameMode = mode;
      render();
    };

    window.setDiff = (diff) => {
      difficulty = diff;
      render();
    };

    window.setSymbol = (sym) => {
      playerSymbol = sym;
      render();
    };

    window.applyDrawerSettings = () => {
      drawerOpen = false;
      resetGame();
    };

    window.resetGame = resetGame;

    document.querySelectorAll('.ttt-cell').forEach(btn => {
      btn.onclick = () => {
        if (over || drawerOpen || endModalOpen) return;
        const i = Number(btn.dataset.i);
        if (cells[i] !== null) return;
        if (gameMode === 'pve' && currentTurn !== playerSymbol) return;

        cells[i] = currentTurn;
        AudioFX.click();
        const res = checkWinner(cells);
        if (res) {
          finishGame(res);
        } else {
          currentTurn = currentTurn === 'X' ? 'O' : 'X';
          updateStatus();
          render();

          if (gameMode === 'pve' && currentTurn !== playerSymbol && !over) {
            setTimeout(aiStep, 350);
          }
        }
      };
    });
  }

  resetGame();
}

// ----------------------------------------------------
// 8. NUMBER GUESS / VAULT DECODER (Arcade Game)
// ----------------------------------------------------
function initNumberGuess(stage) {
  let maxRange = 100, target = 1 + Math.floor(Math.random() * 100), history = [], solved = false;

  function setTier(max) {
    maxRange = max;
    target = 1 + Math.floor(Math.random() * maxRange);
    history = [];
    solved = false;
    render();
  }

  function submitGuess(val) {
    if (solved || isNaN(val) || val < 1 || val > maxRange) return;
    const diff = Math.abs(target - val);
    let hint = 'EXACT MATCH!';
    let color = 'text-emerald-300';
    if (val < target) {
      hint = diff <= maxRange * 0.05 ? '🔥 SCORCHING — Go Slightly Higher' : diff <= maxRange * 0.15 ? '🌡️ WARM — Go Higher' : '❄️ COLD — Too Low';
      color = diff <= maxRange * 0.15 ? 'text-amber-300' : 'text-sky-300';
    } else if (val > target) {
      hint = diff <= maxRange * 0.05 ? '🔥 SCORCHING — Go Slightly Lower' : diff <= maxRange * 0.15 ? '🌡️ WARM — Go Lower' : '❄️ COLD — Too High';
      color = diff <= maxRange * 0.15 ? 'text-amber-300' : 'text-rose-300';
    } else {
      solved = true;
      AudioFX.win();
      addXP(35, window.innerWidth / 2, window.innerHeight / 2, 'VAULT UNLOCKED!');
      window.ArcadeHero?.awardGameScore('number-guess', Math.max(20, maxRange - history.length * 6));
    }
    if (!solved) AudioFX.click();
    history.unshift({ val, hint, color });
    render();
  }

  function render() {
    stage.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center px-4 py-4 gap-4 max-w-lg mx-auto">
        <div class="flex items-center gap-2">
          ${[100, 500, 1000].map(m => `
            <button data-max="${m}" class="ng-tier px-3.5 py-1.5 rounded-full font-mono text-xs font-bold ${maxRange === m ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-300'}">1 – ${m}</button>
          `).join('')}
        </div>

        <div class="text-center">
          <div class="font-mono text-xs uppercase tracking-widest text-emerald-400">Encrypted Vault Passcode</div>
          <div class="font-mono text-4xl sm:text-5xl font-black text-emerald-300 mt-1">
            ${solved ? target : '[ ??? ]'}
          </div>
          <div class="text-xs text-emerald-200/70 mt-1">Attempts: ${history.length}</div>
        </div>

        ${solved ? `
          <button id="ng-again" class="px-8 py-3 rounded-2xl bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30">Crack Next Vault</button>
        ` : `
          <form id="ng-form" class="flex items-center gap-2 w-full">
            <input id="ng-input" type="number" min="1" max="${maxRange}" placeholder="Enter 1 - ${maxRange}" class="flex-1 px-4 py-3.5 rounded-2xl bg-black/70 border-2 border-emerald-500/40 focus:border-emerald-400 outline-none font-mono text-lg text-emerald-200 text-center" required />
            <button type="submit" class="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm">DECODE</button>
          </form>
        `}

        <div class="w-full flex-1 max-h-56 overflow-y-auto flex flex-col gap-1.5 pr-1">
          ${history.map((h, idx) => `
            <div class="flex items-center justify-between px-4 py-2 rounded-xl bg-black/50 border border-emerald-500/20 font-mono text-xs">
              <span class="text-emerald-400 font-bold">#${history.length - idx} → ${h.val}</span>
              <span class="${h.color} font-bold">${h.hint}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.querySelectorAll('.ng-tier').forEach(b => b.onclick = () => setTier(Number(b.dataset.max)));
    document.getElementById('ng-again')?.addEventListener('click', () => setTier(maxRange));
    document.getElementById('ng-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      submitGuess(Number(document.getElementById('ng-input').value));
    });
    document.getElementById('ng-input')?.focus();
  }

  render();
}

// ----------------------------------------------------
// 9. WORDSCAPE (Arcade Game - Layout & Touch Fix)
// ----------------------------------------------------
function initWordscape(stage) {
  const PUZZLES = [
    { letters: ['S','T','A','R','E'], words: ['STAR','RATE','TEAR','SEAT','ARTS','STARE'] },
    { letters: ['P','L','A','N','E'], words: ['PLAN','LANE','PALE','LEAP','PANEL','PLANE'] },
    { letters: ['S','H','I','N','E'], words: ['SHINE','NINE','SHIN','HENS','SINE'] }
  ];
  let pIdx = 0, found = [], currentWord = '', letters = [...PUZZLES[0].letters], bonus = 0;

  function loadPuzzle(idx) {
    pIdx = idx % PUZZLES.length;
    found = [];
    currentWord = '';
    letters = [...PUZZLES[pIdx].letters];
    render();
  }

  function addLetter(l) {
    currentWord += l;
    AudioFX.click();
    render();
  }

  function submitWord() {
    const p = PUZZLES[pIdx];
    if (p.words.includes(currentWord) && !found.includes(currentWord)) {
      found.push(currentWord);
      AudioFX.win();
      addXP(25, window.innerWidth / 2, window.innerHeight * 0.4, `${currentWord}! +25 XP`);
      if (found.length === p.words.length) {
        window.ArcadeHero?.awardGameScore('wordscape', 120);
      }
    } else if (currentWord.length >= 3 && !found.includes(currentWord)) {
      bonus++;
      AudioFX.coin();
      spawnPopup(`Bonus Word! (${bonus})`, window.innerWidth / 2, window.innerHeight * 0.4, '#fde047');
    } else {
      AudioFX.lose();
    }
    currentWord = '';
    render();
  }

  function render() {
    const p = PUZZLES[pIdx];
    const allSolved = found.length === p.words.length;
    stage.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-between px-4 py-3 pb-16 sm:pb-8 overflow-y-auto">
        <div class="flex items-center gap-3">
          <span class="px-3.5 py-1 rounded-full bg-black/40 border border-amber-300/30 text-amber-200 font-bold text-xs">LEVEL ${pIdx + 1}</span>
          <span class="px-3.5 py-1 rounded-full bg-black/40 border border-pink-300/30 text-pink-200 font-bold text-xs">BONUS CHEST: ${bonus}</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg w-full my-1">
          ${p.words.map(w => {
            const isFound = found.includes(w);
            return `
              <div class="flex items-center justify-center gap-1 p-2 rounded-2xl bg-black/35 border border-white/15">
                ${w.split('').map(ch => `
                  <span class="w-6 h-7 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm ${isFound ? 'bg-amber-400 text-slate-950 shadow' : 'bg-white/10 text-transparent'}">
                    ${isFound ? ch : '?'}
                  </span>
                `).join('')}
              </div>
            `;
          }).join('')}
        </div>

        <div class="h-10 px-6 rounded-2xl bg-black/50 border border-amber-300/40 flex items-center justify-center font-black text-lg tracking-[0.25em] text-amber-300 min-w-[160px] my-1">
          ${currentWord || 'TAP LETTERS'}
        </div>

        ${allSolved ? `
          <button id="ws-next" class="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black text-base shadow-xl my-auto">
            Next Mountain Stage →
          </button>
        ` : `
          <div class="flex flex-col items-center gap-2.5 pt-1 pb-4">
            <div class="flex items-center justify-center gap-2 flex-wrap">
              ${letters.map((l, idx) => `
                <button data-l="${l}" class="ws-let w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/95 hover:bg-amber-300 text-slate-900 font-black text-xl sm:text-2xl shadow-xl active:scale-90 transition cursor-pointer select-none">
                  ${l}
                </button>
              `).join('')}
            </div>
            <div class="flex items-center gap-2 pt-1">
              <button id="ws-shuf" class="px-3.5 py-2 rounded-xl bg-white/15 text-white font-bold text-xs">🔀 Shuffle</button>
              <button id="ws-clr" class="px-3.5 py-2 rounded-xl bg-white/15 text-white font-bold text-xs">⌫ Clear</button>
              <button id="ws-sub" class="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg">✓ Submit</button>
            </div>
          </div>
        `}
      </div>
    `;

    document.querySelectorAll('.ws-let').forEach(b => b.onclick = () => addLetter(b.dataset.l));
    document.getElementById('ws-clr')?.addEventListener('click', () => { currentWord = ''; render(); });
    document.getElementById('ws-shuf')?.addEventListener('click', () => {
      letters.sort(() => Math.random() - 0.5);
      AudioFX.card();
      render();
    });
    document.getElementById('ws-sub')?.addEventListener('click', submitWord);
    document.getElementById('ws-next')?.addEventListener('click', () => loadPuzzle(pIdx + 1));
  }

  loadPuzzle(0);
}


// ----------------------------------------------------
// 10. FRUIT MASTER (Arcade Game - Freeze, Fire, and Bomb FX)
// ----------------------------------------------------
function initFruitMaster(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        <span id="fm-score" class="px-4 py-1.5 rounded-full bg-black/60 border border-emerald-400/40 text-emerald-300 font-black text-sm shadow">🍉 SLICED: 0</span>
        <div id="fm-boosters" class="flex items-center gap-1.5"></div>
        <span id="fm-lives" class="px-4 py-1.5 rounded-full bg-black/60 border border-rose-400/40 text-rose-300 font-black text-sm shadow">❤️❤️❤️</span>
      </div>
      <canvas id="fm-canvas" class="w-full h-full block touch-none cursor-crosshair"></canvas>
    </div>
  `;

  const canvas = document.getElementById('fm-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  const FRUITS = [
    { icon: '🍉', pts: 10 },
    { icon: '🍍', pts: 15 },
    { icon: '🍊', pts: 10 },
    { icon: '🍎', pts: 10 },
    { icon: '🥝', pts: 12 },
    { icon: '🍓', pts: 12 }
  ];

  let items = [], slicedHalves = [], slashes = [], splashes = [], score = 0, lives = 3, running = true, pointerDown = false;
  let screenShake = 0;
  let freezeTimer = 0; 
  let doubleTimer = 0; 
  let boomFlash = 0;

  const onResize = () => { 
    w = canvas.width = stage.clientWidth; 
    h = canvas.height = stage.clientHeight; 
  };
  window.addEventListener('resize', onResize);

  function spawnWave() {
    if (!running) return;
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const isBomb = Math.random() < 0.16;
      const isFreeze = !isBomb && Math.random() < 0.08;
      const isDouble = !isBomb && !isFreeze && Math.random() < 0.08;

      let icon = '💣';
      let pts = 0;
      if (!isBomb) {
        if (isFreeze) icon = '❄️';
        else if (isDouble) icon = '2️⃣';
        else {
          const f = FRUITS[Math.floor(Math.random() * FRUITS.length)];
          icon = f.icon;
          pts = f.pts;
        }
      }

      items.push({
        x: w * (0.2 + Math.random() * 0.6),
        y: h + 40,
        vx: (Math.random() - 0.5) * 5.5,
        vy: -(12 + Math.random() * 4.5),
        r: 32,
        icon,
        isBomb,
        isFreeze,
        isDouble,
        pts,
        sliced: false,
        rot: 0,
        vRot: (Math.random() - 0.5) * 0.1
      });
    }
  }
  const spawner = setInterval(spawnWave, 1100);

  function handleSlice(x, y) {
    slashes.push({ x, y, life: 1 });
    items.forEach(it => {
      if (!it.sliced && Math.hypot(it.x - x, it.y - y) < it.r + 18) {
        it.sliced = true;
        if (it.isBomb) {
          lives--;
          screenShake = 30;
          boomFlash = 25;
          if (navigator.vibrate) navigator.vibrate([220, 80, 220]);
          AudioFX.hit();
          document.getElementById('fm-lives').textContent = '❤️'.repeat(Math.max(0, lives)) || '💀';

          // Bomb explosion debris
          for (let k = 0; k < 24; k++) {
            splashes.push({
              x: it.x, y: it.y,
              vx: (Math.random() - 0.5) * 16,
              vy: (Math.random() - 0.5) * 16,
              life: 1,
              color: ['#ef4444','#f97316','#eab308','#1e293b'][k % 4]
            });
          }

          if (lives <= 0) {
            running = false;
            window.ArcadeHero?.awardGameScore('fruit-master', score);
          }
        } else {
          AudioFX.slice();
          if (it.isFreeze) {
            freezeTimer = 240;
            screenShake = 8;
            spawnPopup('❄️ FREEZE!', x, y, '#38bdf8');
          } else if (it.isDouble) {
            doubleTimer = 300;
            screenShake = 10;
            spawnPopup('2️⃣ 2X POINTS!', x, y, '#fde047');
          } else {
            const earned = it.pts * (doubleTimer > 0 ? 2 : 1);
            score += earned;
            document.getElementById('fm-score').textContent = `🍉 SLICED: ${score}`;
            if (doubleTimer > 0) spawnPopup(`+${earned} (2x!)`, x, y, '#fde047');
            if (score % 60 === 0) addXP(20, x, y, '+20 XP!');
          }

          slicedHalves.push({
            x: it.x, y: it.y,
            vx1: -3 - Math.random() * 3, vy1: -4 - Math.random() * 2,
            vx2: 3 + Math.random() * 3, vy2: -4 - Math.random() * 2,
            icon: it.icon,
            rot1: 0, rot2: 0,
            vRot1: -0.15, vRot2: 0.15,
            life: 1
          });

          for (let k = 0; k < 12; k++) {
            splashes.push({
              x: it.x, y: it.y,
              vx: (Math.random() - 0.5) * 11,
              vy: (Math.random() - 0.5) * 11,
              life: 1,
              color: it.isFreeze ? '#38bdf8' : it.isDouble ? '#fde047' : ['#f43f5e','#facc15','#4ade80','#fb923c'][k % 4]
            });
          }
        }
      }
    });
  }

  canvas.onpointerdown = (e) => { pointerDown = true; handleSlice(e.offsetX, e.offsetY); };
  canvas.onpointermove = (e) => { if (pointerDown) handleSlice(e.offsetX, e.offsetY); };
  canvas.onpointerup = () => { pointerDown = false; };

  let raf;
  function loop() {
    ctx.save();
    
    // Background Gradient (changes tint when Freeze or Fire active)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (freezeTimer > 0) {
      bgGrad.addColorStop(0, '#0284c7');
      bgGrad.addColorStop(1, '#0369a1');
    } else if (doubleTimer > 0) {
      bgGrad.addColorStop(0, '#c2410c');
      bgGrad.addColorStop(1, '#7c2d12');
    } else {
      bgGrad.addColorStop(0, '#064e3b');
      bgGrad.addColorStop(1, '#022c22');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    if (screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
      screenShake--;
    }

    if (freezeTimer > 0) freezeTimer--;
    if (doubleTimer > 0) doubleTimer--;
    if (boomFlash > 0) boomFlash--;

    // Render Freeze Screen Vignette / Ice Crystals
    if (freezeTimer > 0) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 14;
      ctx.strokeRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fillRect(0, 0, w, h);
    }

    // Render Fire Screen Aura for 2x
    if (doubleTimer > 0) {
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.55)';
      ctx.lineWidth = 16;
      ctx.strokeRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
      ctx.fillRect(0, 0, w, h);
    }

    // Render Bomb Explosion Flash
    if (boomFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${boomFlash / 30})`;
      ctx.fillRect(0, 0, w, h);
    }

    const boosterEl = document.getElementById('fm-boosters');
    if (boosterEl) {
      let html = '';
      if (freezeTimer > 0) html += `<span class="px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 font-bold text-xs animate-pulse">❄️ FREEZE (${Math.ceil(freezeTimer/60)}s)</span>`;
      if (doubleTimer > 0) html += `<span class="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs animate-pulse">🔥 2X FIRE (${Math.ceil(doubleTimer/60)}s)</span>`;
      boosterEl.innerHTML = html;
    }

    const timeScale = freezeTimer > 0 ? 0.4 : 1.0;

    splashes.forEach(s => {
      s.x += s.vx * timeScale;
      s.y += s.vy * timeScale;
      s.life -= 0.012;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0, s.life * 0.75);
      ctx.beginPath(); 
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2); 
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    splashes = splashes.filter(s => s.life > 0);

    ctx.font = '36px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    slicedHalves.forEach(sh => {
      sh.x += sh.vx1 * timeScale;
      sh.y += sh.vy1 * timeScale;
      sh.vy1 += 0.3 * timeScale;
      sh.rot1 += sh.vRot1;

      sh.x2 = (sh.x2 || sh.x) + sh.vx2 * timeScale;
      sh.y2 = (sh.y2 || sh.y) + sh.vy2 * timeScale;
      sh.vy2 = (sh.vy2 || 0) + 0.3 * timeScale;
      sh.rot2 = (sh.rot2 || 0) + sh.vRot2;
      sh.life -= 0.025;

      ctx.save();
      ctx.globalAlpha = Math.max(0, sh.life);
      ctx.save();
      ctx.translate(sh.x, sh.y);
      ctx.rotate(sh.rot1);
      ctx.fillText(sh.icon, 0, 0);
      ctx.restore();
      ctx.save();
      ctx.translate(sh.x2, sh.y2);
      ctx.rotate(sh.rot2);
      ctx.fillText(sh.icon, 0, 0);
      ctx.restore();
      ctx.restore();
    });
    slicedHalves = slicedHalves.filter(sh => sh.life > 0);

    ctx.font = '46px Inter';
    items.forEach(it => {
      it.x += it.vx * timeScale;
      it.y += it.vy * timeScale;
      it.vy += 0.22 * timeScale;
      it.rot += it.vRot;

      if (!it.sliced) {
        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.rotate(it.rot);
        ctx.fillText(it.icon, 0, 0);
        ctx.restore();
      }
    });
    items = items.filter(it => it.y < h + 80 && !it.sliced);

    if (slashes.length > 1) {
      ctx.strokeStyle = doubleTimer > 0 ? '#f97316' : freezeTimer > 0 ? '#38bdf8' : '#38bdf8';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      slashes.forEach((pt, idx) => {
        pt.life -= 0.08;
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    }
    slashes = slashes.filter(s => s.life > 0);

    if (!running) {
      ctx.fillStyle = 'rgba(2, 44, 34, 0.9)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 32px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Dojo Game Over!', w / 2, h / 2 - 25);
      ctx.font = '700 18px Inter';
      ctx.fillStyle = '#fde047';
      ctx.fillText(`Final Score: ${score} — Tap to Play Again`, w / 2, h / 2 + 15);
      canvas.onclick = () => {
        score = 0; lives = 3; items = []; slicedHalves = []; splashes = []; running = true;
        document.getElementById('fm-score').textContent = '🍉 SLICED: 0';
        document.getElementById('fm-lives').textContent = '❤️❤️❤️';
        canvas.onclick = null;
      };
    }

    ctx.restore();
    raf = requestAnimationFrame(loop);
  }
  loop();

  return () => {
    running = false;
    clearInterval(spawner);
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}

// ----------------------------------------------------
// 11. WHACK-A-MOLE (Arcade Game)
// ----------------------------------------------------
function initWhackAMole(stage) {
  let score = 0, timeLeft = 30, activeHole = -1, isGolden = false, playing = true;

  const popTimer = setInterval(() => {
    if (!playing) return;
    activeHole = Math.floor(Math.random() * 9);
    isGolden = Math.random() < 0.22;
    render();
  }, 750);

  const secTimer = setInterval(() => {
    if (!playing) return;
    timeLeft--;
    if (timeLeft <= 0) {
      playing = false;
      activeHole = -1;
      AudioFX.win();
      addXP(25, window.innerWidth / 2, window.innerHeight / 2, 'MEADOW CLEARED!');
      window.ArcadeHero?.awardGameScore('whack-a-mole', score);
    }
    render();
  }, 1000);

  function whack(idx, e) {
    if (!playing || idx !== activeHole) return;
    const pts = isGolden ? 30 : 10;
    score += pts;
    AudioFX.hit();
    spawnPopup(`+${pts}!`, e.clientX, e.clientY, isGolden ? '#fde047' : '#ffffff');
    activeHole = -1;
    render();
  }

  function render() {
    stage.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-between px-4 py-4">
        <div class="flex items-center gap-3">
          <span class="px-4 py-1.5 rounded-full bg-emerald-950/85 border border-emerald-300/40 text-emerald-200 font-black text-sm">🔨 SCORE: ${score}</span>
          <span class="px-4 py-1.5 rounded-full bg-sky-950/85 border border-sky-300/40 text-sky-200 font-mono font-bold text-sm">⏱️ ${timeLeft}s</span>
        </div>

        ${!playing ? `
          <div class="my-auto text-center bg-black/55 backdrop-blur-md p-8 rounded-3xl border border-white/15">
            <div class="text-5xl mb-2">🐹</div>
            <h2 class="text-3xl font-black text-white">Time's Up!</h2>
            <p class="text-amber-300 font-bold text-lg mb-4">Final Score: ${score}</p>
            <button id="wam-again" class="px-8 py-3 rounded-2xl bg-amber-400 text-slate-950 font-black">Play Again</button>
          </div>
        ` : `
          <div class="grid grid-cols-3 gap-4 sm:gap-6 w-[min(90vw,420px)] my-auto">
            ${Array.from({ length: 9 }, (_, i) => `
              <button data-h="${i}" class="wam-hole relative aspect-square rounded-full bg-gradient-to-b from-amber-950 to-stone-950 border-4 border-lime-500/50 shadow-inner overflow-hidden flex items-end justify-center">
                ${activeHole === i ? `
                  <div class="mole-up text-4xl sm:text-6xl pb-2 select-none">
                    ${isGolden ? '👑🐹' : '🐹'}
                  </div>
                ` : ''}
              </button>
            `).join('')}
          </div>
          <div class="text-xs font-bold text-emerald-100 drop-shadow">Tap the moles! Golden Crown Moles = 30 pts</div>
        `}
      </div>
    `;

    document.getElementById('wam-again')?.addEventListener('click', () => {
      score = 0; timeLeft = 30; playing = true; render();
    });
    document.querySelectorAll('.wam-hole').forEach(b => {
      b.onpointerdown = (e) => whack(Number(b.dataset.h), e);
    });
  }

  render();
  return () => { clearInterval(popTimer); clearInterval(secTimer); };
}

// ----------------------------------------------------
// 12. CYBER SNAKE (Arcade Game - Fullscreen & Fixed Food Collision)
// ----------------------------------------------------
function initCyberSnakePreserved(stage, meta) {
  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 overflow-hidden select-none flex flex-col items-center justify-center">
      <div class="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <span class="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold shadow">🐍 Organic Snake</span>
        <span class="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold shadow">SCORE: <span id="snake-score">0</span></span>
      </div>

      <canvas id="snake-canvas" class="absolute inset-0 w-full h-full block touch-none cursor-crosshair"></canvas>
      
      <div class="absolute bottom-3 left-0 right-0 z-20 text-center pointer-events-none">
        <span class="px-3 py-1 rounded-full bg-slate-900/70 border border-white/10 text-[11px] text-slate-400 font-semibold shadow">Swipe anywhere on screen to steer</span>
      </div>
    </div>
  `;

  const canvas = document.getElementById('snake-canvas');
  const ctx = canvas.getContext('2d');
  
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;
  const grid = 20;

  let count = 0;
  let score = 0;
  let running = true;

  let snake = {
    x: Math.floor((w / 2) / grid) * grid,
    y: Math.floor((h / 2) / grid) * grid,
    dx: grid,
    dy: 0,
    nextDx: grid,
    nextDy: 0,
    cells: [],
    maxLen: 5
  };

  let apple = {
    x: Math.floor(Math.random() * Math.floor(w / grid)) * grid,
    y: Math.floor(Math.random() * Math.floor(h / grid)) * grid
  };

  function spawnApple() {
    apple.x = Math.floor(Math.random() * Math.floor(w / grid)) * grid;
    apple.y = Math.floor(Math.random() * Math.floor(h / grid)) * grid;
  }

  function resetSnake() {
    score = 0;
    const scoreEl = document.getElementById('snake-score');
    if (scoreEl) scoreEl.textContent = score;
    snake.x = Math.floor((w / 2) / grid) * grid;
    snake.y = Math.floor((h / 2) / grid) * grid;
    snake.dx = grid;
    snake.dy = 0;
    snake.nextDx = grid;
    snake.nextDy = 0;
    snake.cells = [];
    snake.maxLen = 5;
    spawnApple();
    running = true;
  }

  const onResize = () => {
    w = canvas.width = stage.clientWidth;
    h = canvas.height = stage.clientHeight;
  };
  window.addEventListener('resize', onResize);

  function loop() {
    const animId = requestAnimationFrame(loop);
    if (!running) return;
    if (++count < 6) return;
    count = 0;

    snake.dx = snake.nextDx;
    snake.dy = snake.nextDy;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += grid) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += grid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    snake.x += snake.dx;
    snake.y += snake.dy;

    // Edge collision (Game Over on screen boundary hit)
    if (snake.x < 0 || snake.x >= canvas.width || snake.y < 0 || snake.y >= canvas.height) {
      AudioFX.lose();
      if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
      window.ArcadeHero?.awardGameScore('snake', score);
      resetSnake();
      return;
    }

    snake.cells.unshift({ x: snake.x, y: snake.y });
    if (snake.cells.length > snake.maxLen) snake.cells.pop();

    // Draw Apple
    const ax = apple.x + grid / 2;
    const ay = apple.y + grid / 2;
    ctx.save();
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 15;
    let grad = ctx.createRadialGradient(ax - 2, ay - 2, 2, ax, ay, grid / 2);
    grad.addColorStop(0, '#fda4af');
    grad.addColorStop(1, '#e11d48');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ax, ay, grid / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Check Apple Collision with Head
    if (snake.x === apple.x && snake.y === apple.y) {
      snake.maxLen++;
      score += 10;
      const scoreEl = document.getElementById('snake-score');
      if (scoreEl) scoreEl.textContent = score;
      addXP(15, apple.x, apple.y, '+15 XP');
      AudioFX.coin();
      spawnApple();
    }

    // Draw Snake
    snake.cells.forEach((cell, index) => {
      const isHead = index === 0;
      const cx = cell.x + grid / 2;
      const cy = cell.y + grid / 2;
      const radius = isHead ? 10 : Math.max(5, 9 - index * 0.1);

      ctx.save();
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = isHead ? 12 : 4;

      let sGrad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, radius);
      if (isHead) {
        sGrad.addColorStop(0, '#34d399');
        sGrad.addColorStop(1, '#047857');
      } else {
        sGrad.addColorStop(0, '#10b981');
        sGrad.addColorStop(1, '#065f46');
      }

      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isHead) {
        // Eyes
        ctx.fillStyle = '#0f172a';
        let eyeOffsetX1 = 3, eyeOffsetY1 = -4;
        let eyeOffsetX2 = 3, eyeOffsetY2 = 4;
        if (snake.dx < 0) { eyeOffsetX1 = -3; eyeOffsetX2 = -3; }
        if (snake.dy < 0) { eyeOffsetX1 = -4; eyeOffsetX2 = 4; eyeOffsetY1 = -3; eyeOffsetY2 = -3; }
        if (snake.dy > 0) { eyeOffsetX1 = -4; eyeOffsetX2 = 4; eyeOffsetY1 = 3; eyeOffsetY2 = 3; }

        ctx.beginPath();
        ctx.arc(cx + eyeOffsetX1, cy + eyeOffsetY1, 1.8, 0, Math.PI * 2);
        ctx.arc(cx + eyeOffsetX2, cy + eyeOffsetY2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Self collision
      for (let i = index + 1; i < snake.cells.length; i++) {
        if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
          AudioFX.lose();
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          window.ArcadeHero?.awardGameScore('snake', score);
          resetSnake();
        }
      }
    });

    return animId;
  }

  const setDir = (newDx, newDy) => {
    if (newDx !== -snake.dx || newDy !== -snake.dy) {
      snake.nextDx = newDx;
      snake.nextDy = newDy;
    }
  };

  const handleKey = (e) => {
    if (['ArrowUp', 'KeyW'].includes(e.code) && snake.dy === 0) setDir(0, -grid);
    else if (['ArrowDown', 'KeyS'].includes(e.code) && snake.dy === 0) setDir(0, grid);
    else if (['ArrowLeft', 'KeyA'].includes(e.code) && snake.dx === 0) setDir(-grid, 0);
    else if (['ArrowRight', 'KeyD'].includes(e.code) && snake.dx === 0) setDir(grid, 0);
  };
  window.addEventListener('keydown', handleKey);

  // Swipe Handling across entire screen
  let touchStartX = 0, touchStartY = 0;

  canvas.ontouchstart = (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
  };

  canvas.ontouchend = (e) => {
    if (!touchStartX || !touchStartY) return;
    let diffX = e.changedTouches[0].clientX - touchStartX;
    let diffY = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) setDir(grid, 0);
      else setDir(-grid, 0);
    } else {
      if (diffY > 0) setDir(0, grid);
      else setDir(0, -grid);
    }
    touchStartX = 0; touchStartY = 0;
    e.preventDefault();
  };

  const animId = requestAnimationFrame(loop);

  return () => {
    window.removeEventListener('keydown', handleKey);
    window.removeEventListener('resize', onResize);
    running = false;
    cancelAnimationFrame(animId);
  };
}

// ----------------------------------------------------
// 13. TOWER STACK (Arcade Game)
// ----------------------------------------------------
function initTowerStack(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span id="ts-score" class="px-4 py-1.5 rounded-full bg-black/50 border border-violet-400/40 text-violet-200 font-black text-sm">🏗️ FLOORS: 0</span>
        <span id="ts-combo" class="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-300/40 text-amber-300 font-bold text-xs">TAP TO DROP</span>
      </div>
      <canvas id="ts-canvas" class="w-full h-full block cursor-pointer"></canvas>
    </div>
  `;

  const canvas = document.getElementById('ts-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let stack = [], current = null, combo = 0, alive = true, raf;

  function reset() {
    const baseW = Math.min(220, w * 0.45);
    stack = [{ x: (w - baseW) / 2, w: baseW, hue: 260 }];
    combo = 0; alive = true;
    spawnNext();
  }

  function spawnNext() {
    const top = stack[stack.length - 1];
    const dir = stack.length % 2 === 0 ? 1 : -1;
    current = {
      x: dir === 1 ? 20 : w - top.w - 20,
      w: top.w,
      vx: dir * (3.2 + Math.min(5, stack.length * 0.16)),
      hue: (260 + stack.length * 14) % 360
    };
  }

  function dropBlock() {
    if (!alive) { reset(); return; }
    const top = stack[stack.length - 1];
    const diff = current.x - top.x;
    if (Math.abs(diff) >= top.w) {
      alive = false;
      AudioFX.lose();
      window.ArcadeHero?.awardGameScore('tower-stack', stack.length - 1);
      return;
    }

    if (Math.abs(diff) < 8) {
      combo++;
      current.x = top.x;
      current.w = Math.min(w * 0.55, top.w + (combo >= 3 ? 8 : 0));
      AudioFX.coin();
      spawnPopup(`PERFECT! ${combo}x`, w / 2, h * 0.42, '#fde047');
      addXP(15, w / 2, h * 0.35);
    } else {
      combo = 0;
      current.w = top.w - Math.abs(diff);
      if (diff > 0) current.x = current.x;
      else current.x = top.x;
      AudioFX.card();
    }

    stack.push({ x: current.x, w: current.w, hue: current.hue });
    document.getElementById('ts-score').textContent = `🏗️ FLOORS: ${stack.length - 1}`;
    document.getElementById('ts-combo').textContent = combo > 0 ? `🔥 PERFECT ${combo}x` : 'TAP TO DROP';
    spawnNext();
  }

  canvas.onpointerdown = dropBlock;
  const onKey = (e) => { if (e.code === 'Space') { e.preventDefault(); dropBlock(); } };
  window.addEventListener('keydown', onKey);
  const onResize = () => { w = canvas.width = stage.clientWidth; h = canvas.height = stage.clientHeight; };
  window.addEventListener('resize', onResize);

  function loop() {
    ctx.clearRect(0, 0, w, h);
    const blockH = 26;
    const camOffset = Math.max(0, (stack.length - 8) * blockH);

    stack.forEach((b, idx) => {
      const y = h - 70 - idx * blockH + camOffset;
      ctx.fillStyle = `hsl(${b.hue}, 80%, 60%)`;
      ctx.beginPath();
      ctx.roundRect(b.x, y, b.w, blockH - 2, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(b.x, y, b.w, 5);
    });

    if (alive && current) {
      current.x += current.vx;
      if (current.x <= 10 || current.x + current.w >= w - 10) current.vx *= -1;
      const y = h - 70 - stack.length * blockH + camOffset;
      ctx.fillStyle = `hsl(${current.hue}, 90%, 66%)`;
      ctx.beginPath();
      ctx.roundRect(current.x, y, current.w, blockH - 2, 6);
      ctx.fill();
    } else if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 30px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`Tower Height: ${stack.length - 1} Floors`, w / 2, h / 2 - 12);
      ctx.font = '700 16px Inter';
      ctx.fillStyle = '#fde047';
      ctx.fillText('Tap or Press Space to Rebuild', w / 2, h / 2 + 22);
    }

    raf = requestAnimationFrame(loop);
  }

  reset();
  loop();

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  };
}

// ----------------------------------------------------
// 14. CAR RACING (Arcade Game)
// ----------------------------------------------------
function initCarRacing(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span id="cr-score" class="px-4 py-1.5 rounded-full bg-black/60 border border-pink-400/40 text-pink-200 font-black text-sm">🏎️ DIST: 0m</span>
        <span class="px-3 py-1 rounded-full bg-black/60 border border-cyan-400/30 text-cyan-200 text-xs font-bold">TAP LEFT / RIGHT OR ◀ ▶</span>
      </div>
      <canvas id="cr-canvas" class="w-full h-full block touch-none"></canvas>
    </div>
  `;

  const canvas = document.getElementById('cr-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let lane = 1, traffic = [], coins = [], dist = 0, stripeY = 0, alive = true, raf;

  function reset() {
    lane = 1; traffic = []; coins = []; dist = 0; alive = true;
  }

  function shiftLane(dir) {
    if (!alive) { reset(); return; }
    lane = Math.max(0, Math.min(2, lane + dir));
    AudioFX.click();
  }

  canvas.onpointerdown = (e) => {
    if (e.offsetX < w / 2) shiftLane(-1);
    else shiftLane(1);
  };
  const onKey = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') shiftLane(-1);
    if (e.key === 'ArrowRight' || e.key === 'd') shiftLane(1);
  };
  window.addEventListener('keydown', onKey);
  const onResize = () => { w = canvas.width = stage.clientWidth; h = canvas.height = stage.clientHeight; };
  window.addEventListener('resize', onResize);

  function loop() {
    ctx.clearRect(0, 0, w, h);
    const roadW = Math.min(360, w * 0.82);
    const roadX = (w - roadW) / 2;
    const laneW = roadW / 3;

    ctx.fillStyle = '#11131f';
    ctx.fillRect(roadX, 0, roadW, h);
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 4;
    ctx.strokeRect(roadX, -5, roadW, h + 10);

    if (alive) stripeY = (stripeY + 9 + Math.min(8, dist / 400)) % 60;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.setLineDash([28, 32]);
    ctx.lineDashOffset = -stripeY;
    ctx.lineWidth = 3;
    [1, 2].forEach(i => {
      ctx.beginPath();
      ctx.moveTo(roadX + laneW * i, 0);
      ctx.lineTo(roadX + laneW * i, h);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    const speed = 6.5 + Math.min(8, dist / 350);

    if (alive) {
      dist += 1;
      if (dist % 10 === 0) document.getElementById('cr-score').textContent = `🏎️ DIST: ${Math.floor(dist / 5)}m`;
      if (Math.random() < 0.032) {
        const l = Math.floor(Math.random() * 3);
        if (!traffic.some(t => t.y < 140)) {
          traffic.push({ lane: l, y: -70, color: ['#38bdf8','#facc15','#a855f7'][l] });
        }
      }
      if (Math.random() < 0.025) {
        coins.push({ lane: Math.floor(Math.random() * 3), y: -40 });
      }
    }

    const playerX = roadX + lane * laneW + laneW / 2;
    const playerY = h - 95;

    coins.forEach(c => {
      if (alive) c.y += speed;
      const cx = roadX + c.lane * laneW + laneW / 2;
      ctx.font = '26px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('🪙', cx, c.y);
      if (alive && c.lane === lane && Math.abs(c.y - playerY) < 42) {
        c.collected = true;
        AudioFX.coin();
        addXP(10, cx, playerY - 20, '+10 XP');
      }
    });
    coins = coins.filter(c => c.y < h + 40 && !c.collected);

    traffic.forEach(t => {
      if (alive) t.y += speed * 0.85;
      const tx = roadX + t.lane * laneW + laneW / 2;
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.roundRect(tx - 20, t.y - 34, 40, 68, 10);
      ctx.fill();
      if (alive && t.lane === lane && Math.abs(t.y - playerY) < 58) {
        alive = false;
        AudioFX.lose();
        window.ArcadeHero?.awardGameScore('car-racing', Math.floor(dist / 5));
      }
    });
    traffic = traffic.filter(t => t.y < h + 90);

    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(playerX - 21, playerY - 36, 42, 72, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(playerX - 14, playerY - 14, 28, 22);

    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.68)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 30px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`Crash at ${Math.floor(dist / 5)}m!`, w / 2, h / 2 - 12);
      ctx.font = '700 16px Inter';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Tap Screen to Race Again', w / 2, h / 2 + 22);
    }

    raf = requestAnimationFrame(loop);
  }
  loop();

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  };
}

// ----------------------------------------------------
// 15. BRICK BREAKER (Arcade Game)
// ----------------------------------------------------
function initBrickBreaker(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span id="bb-score" class="px-4 py-1.5 rounded-full bg-black/50 border border-cyan-400/40 text-cyan-200 font-black text-sm">🧱 SCORE: 0</span>
        <span class="px-3 py-1 rounded-full bg-black/50 border border-purple-400/30 text-purple-200 text-xs font-bold">DRAG OR ◀ ▶ TO MOVE PADDLE</span>
      </div>
      <canvas id="bb-canvas" class="w-full h-full block touch-none"></canvas>
    </div>
  `;

  const canvas = document.getElementById('bb-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let paddleW = Math.min(130, w * 0.28), paddleX = (w - paddleW) / 2;
  let ball = { x: w / 2, y: h - 90, vx: 4.5, vy: -4.8, r: 9 };
  let bricks = [], score = 0, alive = true, raf;

  function buildBricks() {
    bricks = [];
    const cols = 7, rows = 5, pad = 8;
    const bw = (Math.min(620, w - 32) - (cols - 1) * pad) / cols;
    const startX = (w - (cols * bw + (cols - 1) * pad)) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: startX + c * (bw + pad),
          y: 68 + r * 28,
          w: bw,
          h: 20,
          hp: r === 0 ? 2 : 1,
          hue: 280 - r * 35
        });
      }
    }
  }
  buildBricks();

  canvas.onpointermove = (e) => {
    paddleX = Math.max(8, Math.min(w - paddleW - 8, e.offsetX - paddleW / 2));
  };
  canvas.onpointerdown = (e) => {
    if (!alive) {
      score = 0; alive = true;
      ball = { x: w / 2, y: h - 90, vx: 4.5, vy: -4.8, r: 9 };
      buildBricks();
      return;
    }
    paddleX = Math.max(8, Math.min(w - paddleW - 8, e.offsetX - paddleW / 2));
  };

  const onResize = () => { w = canvas.width = stage.clientWidth; h = canvas.height = stage.clientHeight; };
  window.addEventListener('resize', onResize);

  function loop() {
    ctx.clearRect(0, 0, w, h);

    if (alive) {
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ball.r < 0 || ball.x + ball.r > w) { ball.vx *= -1; AudioFX.click(); }
      if (ball.y - ball.r < 0) { ball.vy *= -1; AudioFX.click(); }

      const py = h - 55;
      if (ball.vy > 0 && ball.y + ball.r >= py && ball.y - ball.r <= py + 14 && ball.x >= paddleX && ball.x <= paddleX + paddleW) {
        const hitPos = (ball.x - (paddleX + paddleW / 2)) / (paddleW / 2);
        ball.vx = hitPos * 6.5;
        ball.vy = -Math.abs(ball.vy);
        AudioFX.card();
      }

      bricks.forEach(b => {
        if (b.hp > 0 && ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
          b.hp--;
          ball.vy *= -1;
          score += 15;
          AudioFX.coin();
          document.getElementById('bb-score').textContent = `🧱 SCORE: ${score}`;
          if (score % 150 === 0) addXP(20, ball.x, ball.y, '+20 XP!');
        }
      });

      if (bricks.every(b => b.hp <= 0)) {
        buildBricks();
        ball.vy *= 1.08;
      }

      if (ball.y > h + 20) {
        alive = false;
        AudioFX.lose();
        window.ArcadeHero?.awardGameScore('brick-breaker', score);
      }
    }

    bricks.forEach(b => {
      if (b.hp <= 0) return;
      ctx.fillStyle = b.hp === 2 ? '#f59e0b' : `hsl(${b.hue}, 85%, 60%)`;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 6);
      ctx.fill();
    });

    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(paddleX, h - 55, paddleW, 14, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 30px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`Core Breached — Score: ${score}`, w / 2, h / 2 - 12);
      ctx.font = '700 16px Inter';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Tap Anywhere to Relaunch', w / 2, h / 2 + 22);
    }

    raf = requestAnimationFrame(loop);
  }
  loop();

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}

// ----------------------------------------------------
// 16. STICK RUN (Arcade Game)
// ----------------------------------------------------
function initStickRun(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div class="flex items-center gap-2">
          <span id="sr-dist" class="px-4 py-1.5 rounded-full bg-slate-900/75 border border-sky-300/40 text-white font-black text-sm">🏃 0m</span>
          <span id="sr-coins" class="px-3.5 py-1.5 rounded-full bg-slate-900/75 border border-amber-300/40 text-amber-300 font-bold text-xs">🪙 0</span>
        </div>
      </div>
      <canvas id="sr-canvas" class="w-full h-full block touch-none cursor-pointer"></canvas>
    </div>
  `;

  const canvas = document.getElementById('sr-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let player = { x: 90, y: 0, vy: 0, jumps: 0, runCycle: 0, sliding: false, slideTimer: 0 };
  let obstacles = [], coins = [], dist = 0, coinCount = 0, scroll = 0, alive = true, raf;

  function groundY() { return h * 0.75; }

  function reset() {
    player = { x: Math.min(110, w * 0.18), y: groundY(), vy: 0, jumps: 0, runCycle: 0, sliding: false, slideTimer: 0 };
    obstacles = []; coins = []; dist = 0; coinCount = 0; alive = true;
  }

  function jump() {
    if (!alive) { reset(); return; }
    if (player.jumps < 2) {
      player.vy = -13.5;
      player.jumps++;
      player.sliding = false;
      AudioFX.jump();
    }
  }

  function slide() {
    if (!alive) { reset(); return; }
    if (player.y === groundY() && !player.sliding) {
      player.sliding = true;
      player.slideTimer = 32;
      AudioFX.click();
    }
  }
  
  let touchStartX = 0, touchStartY = 0;
  canvas.ontouchstart = (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
  };
  
  canvas.ontouchend = (e) => {
    if (!touchStartX || !touchStartY) return;
    let diffX = e.changedTouches[0].clientX - touchStartX;
    let diffY = e.changedTouches[0].clientY - touchStartY;
    
    if (Math.abs(diffY) > Math.abs(diffX)) {
      if (diffY < -20) {
        jump();
      } else if (diffY > 20) {
        slide();
      } else {
        jump();
      }
    } else {
      if (Math.abs(diffX) < 20) {
        jump();
      }
    }
    touchStartX = 0; touchStartY = 0;
    e.preventDefault();
  };

  const onKey = (e) => { 
    if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); jump(); }
    if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); slide(); }
  };
  window.addEventListener('keydown', onKey);
  const onResize = () => { w = canvas.width = stage.clientWidth; h = canvas.height = stage.clientHeight; };
  window.addEventListener('resize', onResize);

  function drawStickman(x, y, phase, inAir, sliding) {
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    if (sliding) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x + 10, y - 26, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 6, y - 26);
      ctx.lineTo(x - 12, y - 20);
      ctx.stroke();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 22);
      ctx.lineTo(x + 18, y - 10);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x, y - 48, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 51);
      ctx.lineTo(x - 22, y - 48 + Math.sin(phase * 2) * 4);
      ctx.stroke();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 39);
      ctx.lineTo(x - 3, y - 18);
      ctx.stroke();

      const swing = inAir ? 0.75 : Math.sin(phase) * 0.9;
      ctx.beginPath();
      ctx.moveTo(x, y - 35);
      ctx.lineTo(x + Math.sin(swing) * 14, y - 22);
      ctx.moveTo(x, y - 35);
      ctx.lineTo(x - Math.sin(swing) * 14, y - 22);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x - 3, y - 18);
      ctx.lineTo(x + Math.sin(swing) * 16, y);
      ctx.moveTo(x - 3, y - 18);
      ctx.lineTo(x - Math.sin(swing) * 16, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  function loop() {
    ctx.clearRect(0, 0, w, h);
    const gy = groundY();
    const speed = 6.2 + Math.min(7, dist / 450);

    if (alive) {
      scroll += speed;
      dist += 1;
      player.runCycle += 0.26;
      
      if (player.sliding) {
        player.slideTimer--;
        if (player.slideTimer <= 0) player.sliding = false;
      }

      player.y += player.vy;
      if (player.y < gy) {
        player.vy += 0.68;
      } else {
        player.y = gy;
        player.vy = 0;
        player.jumps = 0;
      }

      if (dist % 8 === 0) document.getElementById('sr-dist').textContent = `🏃 ${Math.floor(dist / 4)}m`;

      if (Math.random() < 0.024 && !obstacles.some(o => o.x > w - 240)) {
        const types = ['box', 'saw', 'floatingSaw', 'combo'];
        const type = types[Math.floor(Math.random() * types.length)];
        let obsW = 34, obsH = 34, obsYOffset = 0;
        if (type === 'saw') { obsW = 32; obsH = 32; }
        else if (type === 'floatingSaw') { obsW = 32; obsH = 32; obsYOffset = 52; }
        else if (type === 'combo') { obsW = 42; obsH = 68; }
        obstacles.push({ x: w + 40, w: obsW, h: obsH, type, yOffset: obsYOffset, rot: 0 });
      }

      if (Math.random() < 0.028) {
        coins.push({ x: w + 40, y: gy - (Math.random() < 0.5 ? 28 : 85) });
      }
    }

    ctx.fillStyle = 'rgba(30, 41, 59, 0.25)';
    for (let i = 0; i < 12; i++) {
      const bx = ((i * 160 - scroll * 0.25) % (w + 200) + (w + 200)) % (w + 200) - 100;
      const bh = 70 + (i % 4) * 32;
      ctx.fillRect(bx, gy - bh, 85, bh);
    }

    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, gy, w, 14);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, gy + 14, w, h - gy);

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 16; i++) {
      const dx = ((i * 110 - scroll) % (w + 110) + (w + 110)) % (w + 110) - 55;
      ctx.fillRect(dx, gy + 28, 46, 5);
    }

    coins.forEach(c => {
      if (alive) c.x -= speed;
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.font = '24px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('🪙', c.x, c.y);
      ctx.restore();

      if (alive && Math.hypot(c.x - player.x, c.y - (player.y - 26)) < 32) {
        c.taken = true;
        coinCount++;
        document.getElementById('sr-coins').textContent = `🪙 ${coinCount}`;
        AudioFX.coin();
        addXP(10, player.x, player.y - 50, '+10 XP');
      }
    });
    coins = coins.filter(c => c.x > -40 && !c.taken);

    obstacles.forEach(o => {
      if (alive) {
        o.x -= speed;
        o.rot += 0.15;
      }

      ctx.save();
      if (o.type === 'saw' || o.type === 'floatingSaw') {
        const cx = o.x + o.w / 2;
        const cy = gy - o.h - o.yOffset + o.h / 2;
        ctx.translate(cx, cy);
        ctx.rotate(o.rot);
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, o.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        for (let t = 0; t < 8; t++) {
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(-3, -o.w / 2 - 4, 6, 6);
        }
        ctx.restore();
      } else if (o.type === 'combo') {
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.roundRect(o.x, gy - o.h, o.w, o.h, 6);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(o.x + 4, gy - o.h + 6, o.w - 8, 6);
        
        const cx = o.x + o.w / 2;
        const cy = gy - o.h - 16;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(o.rot);
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(o.x, gy - o.h, o.w, o.h, 6);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(o.x + 4, gy - o.h + 6, o.w - 8, 6);
      }

      if (alive) {
        const pBox = {
          x: player.x - 12,
          y: player.sliding ? gy - 24 : player.y - 45,
          w: 24,
          h: player.sliding ? 24 : 45
        };
        const oBox = {
          x: o.x,
          y: gy - o.h - o.yOffset,
          w: o.w,
          h: o.h
        };

        if (pBox.x < oBox.x + oBox.w && pBox.x + pBox.w > oBox.x &&
            pBox.y < oBox.y + oBox.h && pBox.y + pBox.h > oBox.y) {
          alive = false;
          AudioFX.lose();
          window.ArcadeHero?.awardGameScore('stick-run', Math.floor(dist / 4));
        }
      }
    });
    obstacles = obstacles.filter(o => o.x > -60);

    drawStickman(player.x, player.y, player.runCycle, player.y < gy - 2, player.sliding);

    if (!alive) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 32px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`Run Complete: ${Math.floor(dist / 4)}m`, w / 2, h / 2 - 14);
      ctx.font = '700 16px Inter';
      ctx.fillStyle = '#fde047';
      ctx.fillText('Tap or Press Space to Run Again', w / 2, h / 2 + 22);
    }

    raf = requestAnimationFrame(loop);
  }

  reset();
  loop();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  };
}

// ----------------------------------------------------
// TINY CAFÉ (Cute Cartoon & Cozy Café Edition)
// ----------------------------------------------------
function initTinyCafe(stage) {
  const INGREDIENTS = {
    espresso: { id: 'espresso', name: 'Espresso', icon: '☕', color: 'from-[#8c522b] to-[#593014]', border: 'border-[#d99b66]', unlockRecipe: 'espresso' },
    milk:     { id: 'milk',     name: 'Steamed Milk', icon: '🥛', color: 'from-[#fffdf9] to-[#e6dccf]', border: 'border-[#c8b6a6]', textDark: true, unlockRecipe: 'latte' },
    ice:      { id: 'ice',      name: 'Ice Cubes', icon: '🧊', color: 'from-[#a8e6ff] to-[#64c5eb]', border: 'border-[#d6f5ff]', textDark: true, unlockRecipe: 'iced_latte' },
    matcha:   { id: 'matcha',   name: 'Matcha', icon: '🍵', color: 'from-[#74c69d] to-[#40916c]', border: 'border-[#b7e4c7]', unlockRecipe: 'matcha_latte' },
    syrup:    { id: 'syrup',    name: 'Caramel', icon: '🍯', color: 'from-[#f4a261] to-[#e76f51]', border: 'border-[#ffd199]', unlockRecipe: 'caramel_macchiato' },
    pastry:   { id: 'pastry',   name: 'Croissant', icon: '🥐', color: 'from-[#f7b267] to-[#d97724]', border: 'border-[#ffe0b5]', unlockRecipe: 'croissant' }
  };

  const RECIPES = [
    { id: 'espresso',          name: 'Classic Espresso',  icon: '☕', ingredients: ['espresso'],                    price: 18, unlockCost: 0,   desc: 'Rich, aromatic single shot.' },
    { id: 'latte',             name: 'Cozy Café Latte',   icon: '🤎', ingredients: ['espresso', 'milk'],            price: 28, unlockCost: 0,   desc: 'Velvety steamed milk & espresso.' },
    { id: 'croissant',         name: 'Butter Croissant',  icon: '🥐', ingredients: ['pastry'],                      price: 22, unlockCost: 0,   desc: 'Warm, flaky golden pastry.' },
    { id: 'iced_latte',        name: 'Iced Vanilla Latte',icon: '🧋', ingredients: ['espresso', 'milk', 'ice'],     price: 38, unlockCost: 90,  desc: 'Chilled over crystal ice cubes.' },
    { id: 'caramel_macchiato', name: 'Caramel Macchiato', icon: '🍮', ingredients: ['espresso', 'milk', 'syrup'],   price: 44, unlockCost: 150, desc: 'Sweet golden caramel drizzle.' },
    { id: 'matcha_latte',      name: 'Iced Matcha Latte', icon: '🍵', ingredients: ['matcha', 'milk', 'ice'],       price: 48, unlockCost: 220, desc: 'Earthy Uji matcha with cold milk.' },
    { id: 'honey_croissant',   name: 'Caramel Croissant', icon: '🍯', ingredients: ['pastry', 'syrup'],             price: 36, unlockCost: 280, desc: 'Warm croissant glazed with caramel.' },
    { id: 'affogato_delight',  name: 'Matcha Espresso',   icon: '🌿', ingredients: ['espresso', 'matcha', 'milk'],  price: 58, unlockCost: 360, desc: 'Signature layered café fusion!' }
  ];

  const CUSTOMER_TYPES = [
    { id: 'bear',    name: 'Barnaby Bear',   skin: '#c68642', ears: 'bear',   hair: '#8d5524', shirt: '#e07a5f', vip: false },
    { id: 'bunny',   name: 'Pippa Bunny',    skin: '#ffe5d9', ears: 'bunny',  hair: '#ffb5a7', shirt: '#84a59d', vip: false },
    { id: 'fox',     name: 'Felix Fox',      skin: '#f4a261', ears: 'fox',    hair: '#e76f51', shirt: '#2a9d8f', vip: false },
    { id: 'girl',    name: 'Mina Student',   skin: '#ffcdb2', ears: 'none',   hair: '#4a3022', shirt: '#6d597a', vip: false },
    { id: 'boy',     name: 'Leo Artist',     skin: '#e5989b', ears: 'none',   hair: '#2b2d42', shirt: '#457b9d', vip: false },
    { id: 'vip_cat', name: 'Mochi Golden Cat', skin: '#ffd166', ears: 'cat',  hair: '#f4a261', shirt: '#9b5de5', vip: true, title: 'VIP Mascot' },
    { id: 'vip_star',name: 'Luna Pop Star',  skin: '#ffe8d6', ears: 'none',   hair: '#ff70a6', shirt: '#ffbe0b', vip: true, title: 'VIP Celebrity' }
  ];

  const THEMES = [
    { id: 'theme-wood',     name: 'Cozy Wood Café',   icon: '🪵', cost: 0,   currency: 'coins', desc: 'Warm oak counter & golden pendant glow.' },
    { id: 'theme-sakura',   name: 'Sakura Pastel',    icon: '🌸', cost: 180, currency: 'coins', desc: 'Soft cherry blossom walls & strawberry counter.' },
    { id: 'theme-midnight', name: 'Midnight Lo-Fi',   icon: '🌙', cost: 260, currency: 'coins', desc: 'Starry evening lounge with twilight ambiance.' }
  ];

  const DECOR_ITEMS = [
    { id: 'fairyLights', name: 'Twinkle Fairy Lights', icon: '✨', cost: 120, currency: 'coins', desc: 'Warm sparkling lights strung across the café.' },
    { id: 'wallArt',     name: 'Cozy Mountain Frame',  icon: '🖼️', cost: 140, currency: 'coins', desc: 'Hand-painted landscape art on the wall.' },
    { id: 'plant',       name: 'Monstera Café Plant',  icon: '🌿', cost: 100, currency: 'coins', desc: 'Fresh greenery that brightens the counter.' }
  ];

  const DEFAULT_SAVE = {
    coins: 60,
    gems: 5,
    day: 1,
    unlockedRecipes: ['espresso', 'latte', 'croissant'],
    machineLevel: 1,
    patienceLevel: 1,
    tipLevel: 1,
    theme: 'theme-wood',
    unlockedThemes: ['theme-wood'],
    decor: { fairyLights: false, wallArt: false, plant: false },
    daily: { dateKey: '', quests: [] }
  };

  let saveData = loadSave();

  let gameState = {
    active: false,
    paused: false,
    mode: 'campaign',
    timeLeft: 75,
    shiftDuration: 75,
    targetCoins: 120,
    shiftCoins: 0,
    shiftGems: 0,
    ordersServed: 0,
    combo: 0,
    bestCombo: 0,
    rushHour: false,
    rushTimer: 0,
    slots: [null, null, null],
    tray: [],
    spawnCooldown: 1.5,
    lastTick: 0,
    activeShopTab: 'recipes'
  };

  let audioCtx = null;
  let audioEnabled = true;
  let musicInterval = null;
  let musicStep = 0;
  let animationFrameId = null;
  let toastTimeout = null;

  function loadSave() {
    try {
      const raw = localStorage.getItem('tiny_cafe_save_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SAVE,
          ...parsed,
          decor: { ...DEFAULT_SAVE.decor, ...(parsed.decor || {}) },
          daily: parsed.daily || { dateKey: '', quests: [] }
        };
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_SAVE));
  }

  function writeSave() {
    try {
      localStorage.setItem('tiny_cafe_save_v1', JSON.stringify(saveData));
    } catch (e) {}
    syncHUD();
  }

  function ensureDailyQuests() {
    const today = new Date().toISOString().slice(0, 10);
    if (saveData.daily.dateKey !== today || !saveData.daily.quests.length) {
      const seed = today.split('-').reduce((acc, n) => acc + parseInt(n, 10), 0);
      const pool = [
        { id: 'serve_any',   label: 'Serve 12 Happy Customers', target: 12, progress: 0, rewardCoins: 90,  rewardGems: 2, claimed: false },
        { id: 'combo_5',     label: 'Reach a 5x Order Combo',   target: 5,  progress: 0, rewardCoins: 110, rewardGems: 3, claimed: false },
        { id: 'serve_vip',   label: 'Serve 2 Special VIPs',     target: 2,  progress: 0, rewardCoins: 130, rewardGems: 4, claimed: false },
        { id: 'earn_coins',  label: 'Earn 250 Coins in Shifts', target: 250,progress: 0, rewardCoins: 120, rewardGems: 3, claimed: false }
      ];
      const picked = [
        pool[seed % pool.length],
        pool[(seed + 1) % pool.length],
        pool[(seed + 2) % pool.length]
      ];
      saveData.daily = { dateKey: today, quests: picked };
      writeSave();
    }
  }

  function updateQuestProgress(type, value, isMax = false) {
    let updated = false;
    saveData.daily.quests.forEach(q => {
      if (q.id === type && !q.claimed) {
        if (isMax) {
          if (value > q.progress) {
            q.progress = Math.min(q.target, value);
            updated = true;
          }
        } else {
          q.progress = Math.min(q.target, q.progress + value);
          updated = true;
        }
      }
    });
    if (updated) {
      writeSave();
      checkChallengeBadge();
    }
  }

  function checkChallengeBadge() {
    const hasClaimable = saveData.daily.quests.some(q => q.progress >= q.target && !q.claimed);
    const badge = document.getElementById('badge-challenge');
    if (badge) badge.classList.toggle('hidden', !hasClaimable);
  }

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  function toggleAudio() {
    audioEnabled = !audioEnabled;
    const icon = document.getElementById('audio-icon');
    if (icon) icon.textContent = audioEnabled ? '🔊' : '🔇';
    if (audioEnabled) {
      initAudio();
      startBgMusic();
    } else {
      stopBgMusic();
    }
  }

  function playSfx(type) {
    if (!audioEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'tap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'clear') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'serve') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'vip') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.setValueAtTime(830.61, now + 0.09);
      osc.frequency.setValueAtTime(1046.5, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.start(now);
      osc.stop(now + 0.38);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.linearRampToValueAtTime(135, now + 0.22);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.24);
    }
  }

  function startBgMusic() {
    if (musicInterval || !audioEnabled) return;
    const chords = [
      [261.63, 329.63, 392.00, 493.88],
      [220.00, 261.63, 329.63, 392.00],
      [174.61, 220.00, 261.63, 349.23],
      [196.00, 246.94, 293.66, 392.00]
    ];
    musicInterval = setInterval(() => {
      if (!audioEnabled || !audioCtx || audioCtx.state !== 'running') return;
      const chord = chords[musicStep % chords.length];
      const tempoScale = gameState.rushHour ? 0.75 : 1;
      const now = audioCtx.currentTime;
      chord.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.025, now + idx * 0.06 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.3 * tempoScale);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + 1.35 * tempoScale);
      });
      musicStep++;
    }, 1500);
  }

  function stopBgMusic() {
    if (musicInterval) {
      clearInterval(musicInterval);
      musicInterval = null;
    }
  }

  function applyThemeAndDecor() {
    const appEl = document.getElementById('tiny-cafe-app');
    if (appEl) {
      appEl.className = `relative w-full h-full max-w-5xl mx-auto flex flex-col overflow-hidden shadow-2xl md:border-x-4 border-[#4a2a14] cafe-wall ${saveData.theme}`;
    }
    const fairy = document.getElementById('decor-fairy-lights');
    const art = document.getElementById('decor-wall-art');
    const plant = document.getElementById('decor-plant');
    if (fairy) fairy.classList.toggle('hidden', !saveData.decor.fairyLights);
    if (art) art.classList.toggle('hidden', !saveData.decor.wallArt);
    if (plant) plant.classList.toggle('hidden', !saveData.decor.plant);
  }

  function syncHUD() {
    const hc = document.getElementById('hud-coins');
    const hg = document.getElementById('hud-gems');
    const sc = document.getElementById('start-coins');
    const sg = document.getElementById('start-gems');
    const sd = document.getElementById('start-day');
    const hm = document.getElementById('hud-machine-lv');
    const uc = document.getElementById('unlocked-count-sign');
    if (hc) hc.textContent = saveData.coins;
    if (hg) hg.textContent = saveData.gems;
    if (sc) sc.textContent = `🪙 ${saveData.coins}`;
    if (sg) sg.textContent = `💎 ${saveData.gems}`;
    if (sd) sd.textContent = `Day ${saveData.day}`;
    if (hm) hm.textContent = saveData.machineLevel;
    if (uc) uc.textContent = `${saveData.unlockedRecipes.length} Recipes on Menu`;

    const shopCoins = document.getElementById('shop-coins');
    const shopGems = document.getElementById('shop-gems');
    if (shopCoins) shopCoins.textContent = saveData.coins;
    if (shopGems) shopGems.textContent = saveData.gems;

    const modeLabel = document.getElementById('hud-mode-label');
    const goalText = document.getElementById('hud-goal-text');
    if (modeLabel && goalText) {
      if (gameState.mode === 'campaign') {
        modeLabel.textContent = `DAY ${saveData.day}`;
        goalText.textContent = `Goal: ${gameState.shiftCoins} / ${gameState.targetCoins}`;
      } else {
        modeLabel.textContent = `RUSH ARCADE`;
        goalText.textContent = `Earned: ${gameState.shiftCoins} 🪙`;
      }
    }

    const timerEl = document.getElementById('hud-timer');
    if (timerEl) {
      const mins = Math.floor(Math.max(0, gameState.timeLeft) / 60);
      const secs = Math.floor(Math.max(0, gameState.timeLeft) % 60);
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    checkChallengeBadge();
  }

  function renderStations() {
    const grid = document.getElementById('stations-grid');
    if (!grid) return;
    const unlockedRecipeObjs = RECIPES.filter(r => saveData.unlockedRecipes.includes(r.id));
    const neededIngredientIds = new Set();
    unlockedRecipeObjs.forEach(r => r.ingredients.forEach(i => neededIngredientIds.add(i)));

    grid.innerHTML = '';
    Object.values(INGREDIENTS).forEach(ing => {
      const isAvailable = neededIngredientIds.has(ing.id);
      const btn = document.createElement('button');
      btn.disabled = !isAvailable;
      btn.onclick = () => addIngredientToTray(ing.id);
      btn.className = `station-btn relative rounded-2xl p-2 sm:p-3 border-2 ${ing.border} bg-gradient-to-b ${ing.color} flex flex-col items-center justify-center ${ing.textDark ? 'text-[#3b2314]' : 'text-white'} ${!isAvailable ? 'opacity-40 grayscale cursor-not-allowed' : ''}`;

      btn.innerHTML = `
        <span class="text-2xl sm:text-3xl leading-none mb-1 drop-shadow">${ing.icon}</span>
        <span class="font-display font-bold text-[11px] sm:text-xs tracking-tight leading-none">${isAvailable ? ing.name : 'Locked'}</span>
      `;
      grid.appendChild(btn);
    });
  }

  function addIngredientToTray(ingId) {
    if (!gameState.active || gameState.paused) return;
    if (gameState.tray.length >= 4) {
      showToast('Tray is full! Serve or Clear first.', '⚠️');
      playSfx('error');
      return;
    }
    gameState.tray.push(ingId);
    playSfx('tap');
    renderTray();
  }

  function clearTray() {
    if (gameState.tray.length > 0) playSfx('clear');
    gameState.tray = [];
    renderTray();
  }

  function findMatchingRecipe(trayArr) {
    if (!trayArr.length) return null;
    const sortedTray = [...trayArr].sort().join(',');
    return RECIPES.find(r =>
      saveData.unlockedRecipes.includes(r.id) &&
      [...r.ingredients].sort().join(',') === sortedTray
    ) || null;
  }

  function renderTray() {
    const container = document.getElementById('tray-items-container');
    const preview = document.getElementById('tray-match-preview');
    const serveBtn = document.getElementById('btn-serve');
    if (!container || !preview || !serveBtn) return;

    if (gameState.tray.length === 0) {
      container.innerHTML = `<span class="text-xs sm:text-sm font-bold text-[#9c785c] italic">Tap ingredients below to prep order...</span>`;
      preview.classList.add('hidden');
      serveBtn.disabled = true;
      return;
    }

    container.innerHTML = gameState.tray.map(id => {
      const ing = INGREDIENTS[id];
      return `
        <div class="flex items-center gap-1 bg-[#fcecd8] border-2 border-[#c88a55] px-2 py-1 rounded-xl shrink-0">
          <span class="text-lg sm:text-xl">${ing.icon}</span>
          <span class="text-[11px] font-extrabold text-[#4a2a14] hidden md:inline">${ing.name}</span>
        </div>
      `;
    }).join('<span class="text-[#a36636] font-bold">+</span>');

    const match = findMatchingRecipe(gameState.tray);
    if (match) {
      preview.classList.remove('hidden');
      document.getElementById('tray-match-icon').textContent = match.icon;
      document.getElementById('tray-match-name').textContent = match.name;
      serveBtn.disabled = false;
    } else {
      preview.classList.add('hidden');
      serveBtn.disabled = false;
    }
  }

  function getCustomerSVG(cust, mood) {
    let earsHtml = '';
    if (cust.ears === 'bear') {
      earsHtml = `<circle cx="24" cy="24" r="10" fill="${cust.skin}" stroke="#3b2314" stroke-width="3"/><circle cx="76" cy="24" r="10" fill="${cust.skin}" stroke="#3b2314" stroke-width="3"/>`;
    } else if (cust.ears === 'bunny') {
      earsHtml = `<ellipse cx="32" cy="14" rx="7" ry="16" fill="${cust.skin}" stroke="#3b2314" stroke-width="3"/><ellipse cx="68" cy="14" rx="7" ry="16" fill="${cust.skin}" stroke="#3b2314" stroke-width="3"/>`;
    } else if (cust.ears === 'fox' || cust.ears === 'cat') {
      earsHtml = `<polygon points="20,32 26,8 42,24" fill="${cust.skin}" stroke="#3b2314" stroke-width="3"/><polygon points="80,32 74,8 58,24" fill="${cust.skin}" stroke="#3b2314" stroke-width="3"/>`;
    }

    let eyesHtml = `<circle cx="38" cy="48" r="4" fill="#3b2314"/><circle cx="62" cy="48" r="4" fill="#3b2314"/>`;
    let mouthHtml = `<path d="M 43 58 Q 50 65 57 58" stroke="#3b2314" stroke-width="3" fill="none" stroke-linecap="round"/>`;

    if (mood === 'impatient') {
      eyesHtml = `<path d="M 33 44 L 42 48" stroke="#3b2314" stroke-width="3"/><path d="M 67 44 L 58 48" stroke="#3b2314" stroke-width="3"/><circle cx="38" cy="50" r="3.5" fill="#3b2314"/><circle cx="62" cy="50" r="3.5" fill="#3b2314"/>`;
      mouthHtml = `<path d="M 43 62 Q 50 56 57 62" stroke="#3b2314" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    } else if (mood === 'thrilled') {
      eyesHtml = `<path d="M 33 48 Q 38 42 43 48" stroke="#3b2314" stroke-width="3" fill="none"/><path d="M 57 48 Q 62 42 67 48" stroke="#3b2314" stroke-width="3" fill="none"/>`;
      mouthHtml = `<path d="M 41 56 Q 50 68 59 56 Z" fill="#f25c78" stroke="#3b2314" stroke-width="2.5"/>`;
    }

    const crownHtml = cust.vip ? `<text x="50" y="16" font-size="18" text-anchor="middle">👑</text>` : '';

    return `
      <svg viewBox="0 0 100 96" class="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-md overflow-visible">
        ${earsHtml}
        <path d="M 22 94 C 22 72, 78 72, 78 94 Z" fill="${cust.shirt}" stroke="#3b2314" stroke-width="3.5"/>
        <circle cx="50" cy="48" r="27" fill="${cust.skin}" stroke="#3b2314" stroke-width="3.5"/>
        ${cust.ears === 'none' ? `<path d="M 23 44 C 25 20, 75 20, 77 44 C 68 32, 32 32, 23 44 Z" fill="${cust.hair}" stroke="#3b2314" stroke-width="3"/>` : ''}
        <ellipse cx="31" cy="55" rx="4.5" ry="2.5" fill="#ff8fa3" opacity="0.75"/>
        <ellipse cx="69" cy="55" rx="4.5" ry="2.5" fill="#ff8fa3" opacity="0.75"/>
        ${eyesHtml}
        ${mouthHtml}
        ${crownHtml}
      </svg>
    `;
  }

  function spawnCustomer() {
    const emptyIndices = gameState.slots.map((s, idx) => s === null ? idx : -1).filter(i => i !== -1);
    if (emptyIndices.length === 0) return;

    const slotIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const isVip = Math.random() < (gameState.rushHour ? 0.28 : 0.18);
    const candidates = CUSTOMER_TYPES.filter(c => c.vip === isVip);
    const custType = candidates[Math.floor(Math.random() * candidates.length)];

    const availableRecipes = RECIPES.filter(r => saveData.unlockedRecipes.includes(r.id));
    const recipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];

    const basePatience = (isVip ? 24 : 30) + (saveData.patienceLevel - 1) * 4;
    const speedScale = Math.max(0.68, 1 - (saveData.day - 1) * 0.03);
    const maxPatience = basePatience * speedScale;

    gameState.slots[slotIdx] = {
      id: Date.now() + Math.random(),
      customer: custType,
      recipe: recipe,
      patience: maxPatience,
      maxPatience: maxPatience,
      mood: 'waiting'
    };

    if (isVip) playSfx('vip');
    renderSlot(slotIdx, true);
  }

  function renderSlot(idx, isNew = false) {
    const slotEl = document.getElementById(`slot-${idx}`);
    if (!slotEl) return;
    const order = gameState.slots[idx];

    if (!order) {
      slotEl.innerHTML = `<div class="w-16 h-3 rounded-full bg-[#3b2314]/15 mb-2"></div>`;
      return;
    }

    const pct = Math.max(0, Math.min(100, (order.patience / order.maxPatience) * 100));
    let barColor = 'bg-[#40b37a]';
    let mood = 'waiting';
    if (pct < 30) { barColor = 'bg-[#e64848]'; mood = 'impatient'; }
    else if (pct < 60) { barColor = 'bg-[#f5b82e]'; }

    const ingBadges = order.recipe.ingredients.map(i => `
      <span class="bg-[#fcecd8] border border-[#d99b66] rounded-md px-1 text-xs">${INGREDIENTS[i].icon}</span>
    `).join('');

    slotEl.innerHTML = `
      <div onclick="window.serveTinyCafeSlot && window.serveTinyCafeSlot(${idx})" class="cursor-pointer w-full flex flex-col items-center group ${isNew ? 'anim-enter' : ''}">
        <div class="relative bg-[#fffaf2] border-4 ${order.customer.vip ? 'border-[#f5b82e] anim-vip-glow' : 'border-[#5c361c]'} rounded-2xl p-2 sm:p-2.5 shadow-lg mb-1.5 w-full max-w-[165px]">
          ${order.customer.vip ? `<div class="text-[9px] font-extrabold uppercase tracking-wider text-center bg-[#f5b82e] text-[#3b2314] rounded-full px-1.5 mb-1">⭐ ${order.customer.title}</div>` : ''}
          <div class="flex items-center justify-center gap-1.5">
            <span class="text-2xl sm:text-3xl leading-none">${order.recipe.icon}</span>
            <div class="text-left overflow-hidden">
              <div class="font-display font-bold text-[11px] sm:text-xs text-[#3b2314] truncate">${order.recipe.name}</div>
              <div class="flex items-center gap-0.5 mt-0.5">${ingBadges}</div>
            </div>
          </div>
          <div class="w-full h-2 bg-[#ebd5b9] rounded-full overflow-hidden mt-1.5 border border-[#c88a55]">
            <div id="patience-bar-${idx}" class="h-full ${barColor} transition-all duration-150" style="width: ${pct}%"></div>
          </div>
          <div class="w-3 h-3 bg-[#fffaf2] border-r-2 border-b-2 ${order.customer.vip ? 'border-[#f5b82e]' : 'border-[#5c361c]'} transform rotate-45 mx-auto -mb-3.5 mt-0.5"></div>
        </div>
        <div class="relative flex flex-col items-center">
          <div class="steam-particle" style="left: 20%; animation-delay: 0s;"></div>
          <div class="steam-particle" style="left: 65%; animation-delay: 0.8s;"></div>
          ${getCustomerSVG(order.customer, mood)}
        </div>
      </div>
    `;
  }

  function spawnFloatingPopup(slotIdx, text, colorClass = 'text-[#ffd15c]') {
    const slotEl = document.getElementById(`slot-${slotIdx}`);
    if (!slotEl) return;
    const el = document.createElement('div');
    el.className = `floating-popup font-display font-bold text-base sm:text-xl ${colorClass}`;
    el.style.top = '28%';
    el.textContent = text;
    slotEl.appendChild(el);
    setTimeout(() => el.remove(), 1150);
  }

  function serveMatchingCustomer() {
    if (!gameState.active || gameState.paused) return;
    const match = findMatchingRecipe(gameState.tray);
    if (!match) {
      playSfx('error');
      showToast('Ingredients do not match any recipe!', '🤔');
      return;
    }

    let bestIdx = -1;
    let lowestPatience = Infinity;
    gameState.slots.forEach((order, idx) => {
      if (order && order.recipe.id === match.id && order.patience < lowestPatience) {
        lowestPatience = order.patience;
        bestIdx = idx;
      }
    });

    if (bestIdx !== -1) {
      serveSlot(bestIdx);
    } else {
      playSfx('error');
      showToast(`No customer ordered ${match.name}!`, '🙈');
    }
  }

  function serveSlot(idx) {
    if (!gameState.active || gameState.paused) return;
    const order = gameState.slots[idx];
    if (!order) return;

    if (gameState.tray.length === 0) {
      showToast(`Tap ${order.recipe.ingredients.map(i => INGREDIENTS[i].name).join(' + ')} first!`, '💡');
      return;
    }

    const match = findMatchingRecipe(gameState.tray);
    if (!match || match.id !== order.recipe.id) {
      playSfx('error');
      gameState.combo = 0;
      updateComboUI();
      const slotEl = document.getElementById(`slot-${idx}`);
      if (slotEl) {
        slotEl.classList.add('anim-shake');
        setTimeout(() => slotEl.classList.remove('anim-shake'), 450);
      }
      spawnFloatingPopup(idx, 'Wrong Order!', 'text-[#ff5964]');
      return;
    }

    playSfx('serve');
    gameState.tray = [];
    renderTray();

    gameState.combo += 1;
    if (gameState.combo > gameState.bestCombo) gameState.bestCombo = gameState.combo;
    updateComboUI();

    const comboMult = Math.min(3, 1 + Math.floor(gameState.combo / 2) * 0.25);
    const vipMult = order.customer.vip ? 2.2 : 1;
    const rushMult = gameState.rushHour ? 2 : 1;
    const machineBonus = 1 + (saveData.machineLevel - 1) * 0.15;
    const tipBonus = (saveData.tipLevel - 1) * 4;

    const totalCoins = Math.round((order.recipe.price * comboMult * vipMult * rushMult * machineBonus) + tipBonus);
    const earnedGems = order.customer.vip ? 1 : 0;

    saveData.coins += totalCoins;
    saveData.gems += earnedGems;
    gameState.shiftCoins += totalCoins;
    gameState.shiftGems += earnedGems;
    gameState.ordersServed += 1;

    updateQuestProgress('serve_any', 1);
    updateQuestProgress('combo_5', gameState.combo, true);
    updateQuestProgress('earn_coins', totalCoins);
    if (order.customer.vip) updateQuestProgress('serve_vip', 1);

    writeSave();
    spawnFloatingPopup(idx, `+${totalCoins} 🪙${earnedGems ? ' +1 💎' : ''}`, 'text-[#ffd15c]');

    gameState.slots[idx] = null;
    renderSlot(idx);
    gameState.spawnCooldown = Math.min(gameState.spawnCooldown, 0.9);
  }

  function updateComboUI() {
    const pill = document.getElementById('combo-pill');
    const text = document.getElementById('combo-text');
    if (!pill || !text) return;
    if (gameState.combo >= 2) {
      const mult = Math.min(3, 1 + Math.floor(gameState.combo / 2) * 0.25).toFixed(2).replace(/\.00$/, '');
      text.textContent = `COMBO x${mult} (${gameState.combo}🔥)`;
      pill.classList.remove('opacity-0', 'scale-90');
      pill.classList.add('opacity-100', 'scale-100');
    } else {
      pill.classList.add('opacity-0', 'scale-90');
      pill.classList.remove('opacity-100', 'scale-100');
    }
  }

  function triggerRushHour(active) {
    gameState.rushHour = active;
    const banner = document.getElementById('rush-banner');
    if (banner) banner.classList.toggle('hidden', !active);
    if (active) {
      playSfx('vip');
      showToast('RUSH HOUR! Customers arrive fast & pay 2X COINS!', '⚡');
    }
  }

  function startGame(mode) {
    initAudio();
    startBgMusic();
    closeAllModals();
    const startScreen = document.getElementById('screen-start');
    if (startScreen) startScreen.classList.add('hidden');

    gameState.active = true;
    gameState.paused = false;
    gameState.mode = mode;
    gameState.shiftCoins = 0;
    gameState.shiftGems = 0;
    gameState.ordersServed = 0;
    gameState.combo = 0;
    gameState.bestCombo = 0;
    gameState.slots = [null, null, null];
    gameState.tray = [];
    gameState.spawnCooldown = 0.5;

    if (mode === 'campaign') {
      gameState.shiftDuration = 75;
      gameState.timeLeft = 75;
      gameState.targetCoins = 100 + (saveData.day - 1) * 45;
      triggerRushHour(false);
      gameState.rushTimer = 32;
    } else {
      gameState.shiftDuration = 90;
      gameState.timeLeft = 90;
      gameState.targetCoins = 99999;
      triggerRushHour(true);
      gameState.rushTimer = 999;
    }

    renderStations();
    renderTray();
    updateComboUI();
    [0, 1, 2].forEach(i => renderSlot(i));
    syncHUD();

    gameState.lastTick = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function gameLoop(now) {
    if (!gameState.active) return;
    const dt = Math.min(0.1, (now - gameState.lastTick) / 1000);
    gameState.lastTick = now;

    if (!gameState.paused) {
      gameState.timeLeft -= dt;

      if (gameState.mode === 'campaign') {
        gameState.rushTimer -= dt;
        if (gameState.rushTimer <= 0 && !gameState.rushHour && gameState.timeLeft > 15) {
          triggerRushHour(true);
          gameState.rushTimer = 18;
        } else if (gameState.rushTimer <= 0 && gameState.rushHour) {
          triggerRushHour(false);
          gameState.rushTimer = 999;
        }
      }

      gameState.spawnCooldown -= dt;
      if (gameState.spawnCooldown <= 0) {
        spawnCustomer();
        const baseRate = gameState.rushHour ? 2.2 : Math.max(2.6, 4.4 - saveData.day * 0.12);
        gameState.spawnCooldown = baseRate;
      }

      for (let i = 0; i < 3; i++) {
        const order = gameState.slots[i];
        if (order) {
          order.patience -= dt;
          if (order.patience <= 0) {
            playSfx('error');
            gameState.combo = 0;
            updateComboUI();
            spawnFloatingPopup(i, 'Left Unhappy 💔', 'text-[#ff5964]');
            gameState.slots[i] = null;
            renderSlot(i);
          } else {
            const bar = document.getElementById(`patience-bar-${i}`);
            if (bar) {
              const pct = Math.max(0, (order.patience / order.maxPatience) * 100);
              bar.style.width = `${pct}%`;
              if (pct < 30) bar.className = 'h-full bg-[#e64848] transition-all duration-150';
              else if (pct < 60) bar.className = 'h-full bg-[#f5b82e] transition-all duration-150';
            }
          }
        }
      }

      syncHUD();

      if (gameState.timeLeft <= 0) {
        endShift();
        return;
      }
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function endShift() {
    gameState.active = false;
    triggerRushHour(false);

    const modal = document.getElementById('modal-round-end');
    if (!modal) return;
    const title = document.getElementById('end-title');
    const subtitle = document.getElementById('end-subtitle');
    const emoji = document.getElementById('end-emoji');
    const nextBtn = document.getElementById('btn-next-shift');

    document.getElementById('end-served').textContent = gameState.ordersServed;
    document.getElementById('end-combo').textContent = `${gameState.bestCombo}x`;
    document.getElementById('end-coins').textContent = `+${gameState.shiftCoins} 🪙`;
    document.getElementById('end-gems').textContent = `+${gameState.shiftGems} 💎`;

    if (gameState.mode === 'campaign') {
      const passed = gameState.shiftCoins >= gameState.targetCoins;
      if (passed) {
        saveData.day += 1;
        saveData.gems += 2;
        writeSave();
        if (emoji) emoji.textContent = '🎉';
        if (title) title.textContent = `Day ${saveData.day - 1} Cleared!`;
        if (subtitle) subtitle.textContent = 'You reached your daily goal & earned +2 bonus Gems!';
        if (nextBtn) nextBtn.textContent = `Start Day ${saveData.day} ➡️`;
        playSfx('vip');
      } else {
        if (emoji) emoji.textContent = '☕';
        if (title) title.textContent = 'Almost There!';
        if (subtitle) subtitle.textContent = `Goal was ${gameState.targetCoins} coins. Keep your coins & try again!`;
        if (nextBtn) nextBtn.textContent = `Retry Day ${saveData.day} 🔄`;
        playSfx('clear');
      }
    } else {
      if (emoji) emoji.textContent = '⚡';
      if (title) title.textContent = 'Rush Hour Over!';
      if (subtitle) subtitle.textContent = 'Amazing speed behind the espresso bar!';
      if (nextBtn) nextBtn.textContent = 'Play Rush Again ⚡';
      playSfx('serve');
    }

    modal.classList.remove('hidden');
  }

  function nextShiftAction() {
    const modal = document.getElementById('modal-round-end');
    if (modal) modal.classList.add('hidden');
    startGame(gameState.mode);
  }

  function returnToMenu() {
    gameState.active = false;
    triggerRushHour(false);
    closeAllModals();
    const modalEnd = document.getElementById('modal-round-end');
    if (modalEnd) modalEnd.classList.add('hidden');
    const startScreen = document.getElementById('screen-start');
    if (startScreen) startScreen.classList.remove('hidden');
    syncHUD();
  }

  function openModal(modalId) {
    if (gameState.active) gameState.paused = true;
    closeAllModals(false);
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('hidden');

    if (modalId === 'modal-recipes') renderRecipeModal();
    if (modalId === 'modal-challenges') renderChallengesModal();
    if (modalId === 'modal-shop') renderShopModal();
  }

  function closeAllModals(resumeGame = true) {
    ['modal-recipes', 'modal-challenges', 'modal-shop'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    if (resumeGame && gameState.active) {
      gameState.paused = false;
      gameState.lastTick = performance.now();
    }
  }

  function renderRecipeModal() {
    const list = document.getElementById('recipe-list');
    if (!list) return;
    list.innerHTML = RECIPES.map(r => {
      const unlocked = saveData.unlockedRecipes.includes(r.id);
      const steps = r.ingredients.map(i => `
        <span class="inline-flex items-center gap-1 bg-[#fcecd8] border border-[#c88a55] px-2 py-0.5 rounded-lg text-xs font-bold text-[#4a2a14]">
          ${INGREDIENTS[i].icon} ${INGREDIENTS[i].name}
        </span>
      `).join('<span class="mx-1 font-bold text-[#a36636]">+</span>');

      return `
        <div class="flex items-center justify-between p-3 rounded-2xl border-2 ${unlocked ? 'bg-white border-[#d9b38c]' : 'bg-[#f2e6d8] border-[#cbb59d] opacity-75'}">
          <div class="flex items-center gap-3">
            <div class="text-3xl bg-[#fcecd8] w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-[#e0b88f]">${r.icon}</div>
            <div>
              <div class="font-display font-bold text-base text-[#3b2314] flex items-center gap-2">
                <span>${r.name}</span>
                <span class="text-xs bg-[#e6f7ef] text-[#1b4332] px-2 py-0.5 rounded-full">🪙 ${r.price}</span>
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-y-1">${steps}</div>
            </div>
          </div>
          <div class="shrink-0 ml-2">
            ${unlocked
              ? `<span class="text-xs font-extrabold text-[#2d6a4f] bg-[#d8f3dc] px-2.5 py-1 rounded-xl">Unlocked</span>`
              : `<button onclick="window.openTinyCafeModal && window.openTinyCafeModal('modal-shop')" class="cartoon-btn bg-[#e69138] text-white text-xs font-display font-bold px-3 py-1.5 rounded-xl">Unlock in Shop</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  function renderChallengesModal() {
    const list = document.getElementById('challenges-list');
    if (!list) return;
    list.innerHTML = saveData.daily.quests.map((q, idx) => {
      const done = q.progress >= q.target;
      const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
      return `
        <div class="p-3.5 rounded-2xl bg-white border-2 border-[#d9b38c]">
          <div class="flex justify-between items-start mb-1.5">
            <div class="font-display font-bold text-sm sm:text-base text-[#3b2314]">${q.label}</div>
            <div class="text-xs font-extrabold text-[#8c522b] bg-[#fcecd8] px-2 py-0.5 rounded-lg">
              +${q.rewardCoins} 🪙  +${q.rewardGems} 💎
            </div>
          </div>
          <div class="w-full h-3 bg-[#ebd5b9] rounded-full overflow-hidden mb-2">
            <div class="h-full bg-[#40b37a] transition-all" style="width: ${pct}%"></div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-[#7c583e]">Progress: ${q.progress} / ${q.target}</span>
            ${q.claimed
              ? `<span class="text-xs font-extrabold text-[#2d6a4f] bg-[#d8f3dc] px-3 py-1 rounded-xl">Claimed ✓</span>`
              : done
                ? `<button onclick="window.claimTinyCafeQuest && window.claimTinyCafeQuest(${idx})" class="cartoon-btn bg-[#40b37a] text-white text-xs font-display font-bold px-3.5 py-1.5 rounded-xl">Claim Reward!</button>`
                : `<span class="text-xs font-bold text-[#a36636]">In Progress</span>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  function claimQuest(idx) {
    const q = saveData.daily.quests[idx];
    if (!q || q.claimed || q.progress < q.target) return;
    q.claimed = true;
    saveData.coins += q.rewardCoins;
    saveData.gems += q.rewardGems;
    writeSave();
    playSfx('vip');
    showToast(`Claimed +${q.rewardCoins} Coins & +${q.rewardGems} Gems!`, '🎁');
    renderChallengesModal();
  }

  function switchShopTab(tab) {
    gameState.activeShopTab = tab;
    ['recipes', 'upgrades', 'decor'].forEach(t => {
      const btn = document.getElementById(`tab-${t}`);
      if (btn) {
        if (t === tab) btn.className = 'flex-1 py-1.5 rounded-xl font-display font-bold text-xs sm:text-sm bg-[#e69138] text-white';
        else btn.className = 'flex-1 py-1.5 rounded-xl font-display font-bold text-xs sm:text-sm bg-[#ebd5b9] text-[#5c361c]';
      }
    });
    renderShopModal();
  }

  function renderShopModal() {
    syncHUD();
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    const tab = gameState.activeShopTab;

    if (tab === 'recipes') {
      container.innerHTML = RECIPES.filter(r => r.unlockCost > 0).map(r => {
        const owned = saveData.unlockedRecipes.includes(r.id);
        return `
          <div class="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#d9b38c]">
            <div class="flex items-center gap-3">
              <span class="text-3xl bg-[#fcecd8] w-12 h-12 rounded-2xl flex items-center justify-center">${r.icon}</span>
              <div>
                <div class="font-display font-bold text-sm sm:text-base text-[#3b2314]">${r.name}</div>
                <div class="text-xs text-[#7c583e] font-bold">${r.desc} (Sells for 🪙 ${r.price})</div>
              </div>
            </div>
            ${owned
              ? `<span class="text-xs font-extrabold text-[#2d6a4f] bg-[#d8f3dc] px-3 py-1.5 rounded-xl">Unlocked</span>`
              : `<button onclick="window.buyTinyCafeRecipe && window.buyTinyCafeRecipe('${r.id}')" class="cartoon-btn bg-[#40b37a] text-white font-display font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shrink-0">🪙 ${r.unlockCost}</button>`
            }
          </div>
        `;
      }).join('');
    } else if (tab === 'upgrades') {
      const upgrades = [
        { key: 'machineLevel',  name: 'Espresso Machine Pro', icon: '☕', level: saveData.machineLevel,  cost: saveData.machineLevel * 110,  desc: '+15% drink value per level.' },
        { key: 'patienceLevel', name: 'Cozy Lounge Seating',  icon: '🛋️', level: saveData.patienceLevel, cost: saveData.patienceLevel * 100, desc: '+4s customer patience per level.' },
        { key: 'tipLevel',      name: 'Golden Tip Jar',       icon: '🫙', level: saveData.tipLevel,      cost: saveData.tipLevel * 95,       desc: '+4 bonus tip coins per order.' }
      ];
      container.innerHTML = upgrades.map(u => {
        const maxed = u.level >= 5;
        return `
          <div class="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#d9b38c]">
            <div class="flex items-center gap-3">
              <span class="text-3xl bg-[#fcecd8] w-12 h-12 rounded-2xl flex items-center justify-center">${u.icon}</span>
              <div>
                <div class="font-display font-bold text-sm sm:text-base text-[#3b2314]">${u.name} <span class="text-xs text-[#d97706]">Lv.${u.level}/5</span></div>
                <div class="text-xs text-[#7c583e] font-bold">${u.desc}</div>
              </div>
            </div>
            ${maxed
              ? `<span class="text-xs font-extrabold text-[#2d6a4f] bg-[#d8f3dc] px-3 py-1.5 rounded-xl">MAX</span>`
              : `<button onclick="window.buyTinyCafeUpgrade && window.buyTinyCafeUpgrade('${u.key}', ${u.cost})" class="cartoon-btn bg-[#e69138] text-white font-display font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shrink-0">🪙 ${u.cost}</button>`
            }
          </div>
        `;
      }).join('');
    } else {
      const themesHtml = THEMES.map(t => {
        const owned = saveData.unlockedThemes.includes(t.id);
        const equipped = saveData.theme === t.id;
        return `
          <div class="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#d9b38c]">
            <div class="flex items-center gap-3">
              <span class="text-3xl bg-[#fcecd8] w-12 h-12 rounded-2xl flex items-center justify-center">${t.icon}</span>
              <div>
                <div class="font-display font-bold text-sm text-[#3b2314]">${t.name}</div>
                <div class="text-xs text-[#7c583e] font-bold">${t.desc}</div>
              </div>
            </div>
            ${equipped
              ? `<span class="text-xs font-extrabold text-[#2d6a4f] bg-[#d8f3dc] px-3 py-1.5 rounded-xl">Active</span>`
              : owned
                ? `<button onclick="window.equipTinyCafeTheme && window.equipTinyCafeTheme('${t.id}')" class="cartoon-btn bg-[#6bc4a6] text-[#1c3b30] font-display font-bold text-xs px-3 py-1.5 rounded-xl">Equip</button>`
                : `<button onclick="window.buyTinyCafeTheme && window.buyTinyCafeTheme('${t.id}', ${t.cost})" class="cartoon-btn bg-[#f2798f] text-white font-display font-bold text-xs px-3 py-1.5 rounded-xl">🪙 ${t.cost}</button>`
            }
          </div>
        `;
      }).join('');

      const decorHtml = DECOR_ITEMS.map(d => {
        const owned = saveData.decor[d.id];
        return `
          <div class="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#d9b38c]">
            <div class="flex items-center gap-3">
              <span class="text-3xl bg-[#fcecd8] w-12 h-12 rounded-2xl flex items-center justify-center">${d.icon}</span>
              <div>
                <div class="font-display font-bold text-sm text-[#3b2314]">${d.name}</div>
                <div class="text-xs text-[#7c583e] font-bold">${d.desc}</div>
              </div>
            </div>
            ${owned
              ? `<span class="text-xs font-extrabold text-[#2d6a4f] bg-[#d8f3dc] px-3 py-1.5 rounded-xl">Placed ✓</span>`
              : `<button onclick="window.buyTinyCafeDecor && window.buyTinyCafeDecor('${d.id}', ${d.cost})" class="cartoon-btn bg-[#f2798f] text-white font-display font-bold text-xs px-3 py-1.5 rounded-xl">🪙 ${d.cost}</button>`
            }
          </div>
        `;
      }).join('');

      container.innerHTML = `<div class="text-xs font-extrabold uppercase text-[#8c522b] mb-1">Café Themes</div>${themesHtml}<div class="text-xs font-extrabold uppercase text-[#8c522b] mt-3 mb-1">Cozy Decorations</div>${decorHtml}`;
    }
  }

  function buyRecipe(recipeId) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe || saveData.unlockedRecipes.includes(recipeId)) return;
    if (saveData.coins < recipe.unlockCost) {
      playSfx('error');
      showToast('Not enough coins yet!', '🪙');
      return;
    }
    saveData.coins -= recipe.unlockCost;
    saveData.unlockedRecipes.push(recipeId);
    writeSave();
    renderStations();
    playSfx('vip');
    showToast(`Unlocked ${recipe.name}!`, recipe.icon);
    renderShopModal();
  }

  function buyUpgrade(key, cost) {
    if (saveData[key] >= 5) return;
    if (saveData.coins < cost) {
      playSfx('error');
      showToast('Not enough coins!', '🪙');
      return;
    }
    saveData.coins -= cost;
    saveData[key] += 1;
    writeSave();
    playSfx('serve');
    showToast('Upgrade installed!', '⚙️');
    renderShopModal();
  }

  function buyTheme(themeId, cost) {
    if (saveData.coins < cost) {
      playSfx('error');
      showToast('Not enough coins!', '🪙');
      return;
    }
    saveData.coins -= cost;
    saveData.unlockedThemes.push(themeId);
    saveData.theme = themeId;
    writeSave();
    applyThemeAndDecor();
    playSfx('vip');
    showToast('New Café Theme applied!', '🎨');
    renderShopModal();
  }

  function equipTheme(themeId) {
    saveData.theme = themeId;
    writeSave();
    applyThemeAndDecor();
    playSfx('tap');
    renderShopModal();
  }

  function buyDecor(decorId, cost) {
    if (saveData.coins < cost) {
      playSfx('error');
      showToast('Not enough coins!', '🪙');
      return;
    }
    saveData.coins -= cost;
    saveData.decor[decorId] = true;
    writeSave();
    applyThemeAndDecor();
    playSfx('vip');
    showToast('Decoration added to your café!', '✨');
    renderShopModal();
  }

  function showToast(msg, icon = '✨') {
    const box = document.getElementById('toast-box');
    if (!box) return;
    const msgEl = document.getElementById('toast-msg');
    const iconEl = document.getElementById('toast-icon');
    if (msgEl) msgEl.textContent = msg;
    if (iconEl) iconEl.textContent = icon;
    box.classList.remove('hidden');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => box.classList.add('hidden'), 2200);
  }

  // Inject HTML markup into the active stage
  stage.innerHTML = `
    <div id="tiny-cafe-app" class="relative w-full h-full max-w-5xl mx-auto flex flex-col overflow-hidden shadow-2xl md:border-x-4 border-[#4a2a14] cafe-wall ${saveData.theme}">
      <div class="absolute top-0 left-0 right-0 h-44 pointer-events-none flex justify-around z-0">
        <div class="relative flex flex-col items-center">
          <div class="w-1 h-7 bg-[#3b2314]"></div>
          <div class="w-14 h-7 rounded-t-full border-b-4 border-[#3b2314]" style="background: var(--lamp-shade);"></div>
          <div class="w-5 h-2.5 rounded-b-full bg-[#fff5cc] -mt-0.5 shadow-[0_0_18px_#ffd86b]"></div>
          <div class="w-40 h-36 lamp-glow -mt-1"></div>
        </div>
        <div class="relative hidden sm:flex flex-col items-center">
          <div class="w-1 h-5 bg-[#3b2314]"></div>
          <div class="w-14 h-7 rounded-t-full border-b-4 border-[#3b2314]" style="background: var(--lamp-shade);"></div>
          <div class="w-5 h-2.5 rounded-b-full bg-[#fff5cc] -mt-0.5 shadow-[0_0_18px_#ffd86b]"></div>
          <div class="w-40 h-36 lamp-glow -mt-1"></div>
        </div>
        <div class="relative flex flex-col items-center">
          <div class="w-1 h-7 bg-[#3b2314]"></div>
          <div class="w-14 h-7 rounded-t-full border-b-4 border-[#3b2314]" style="background: var(--lamp-shade);"></div>
          <div class="w-5 h-2.5 rounded-b-full bg-[#fff5cc] -mt-0.5 shadow-[0_0_18px_#ffd86b]"></div>
          <div class="w-40 h-36 lamp-glow -mt-1"></div>
        </div>
      </div>

      <div id="decor-fairy-lights" class="${saveData.decor.fairyLights ? '' : 'hidden'} absolute top-11 left-0 right-0 z-10 pointer-events-none px-4 flex justify-between items-center">
        <span class="w-2.5 h-2.5 rounded-full bg-[#ffe680] shadow-[0_0_8px_#ffd23f]" style="animation: fairyTwinkle 1.6s infinite 0.1s;"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#ff9ebb] shadow-[0_0_8px_#ff7aa2]" style="animation: fairyTwinkle 1.8s infinite 0.4s;"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#9bf6ff] shadow-[0_0_8px_#64dfdf]" style="animation: fairyTwinkle 1.5s infinite 0.7s;"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#ffe680] shadow-[0_0_8px_#ffd23f]" style="animation: fairyTwinkle 1.9s infinite 0.2s;"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#caffbf] shadow-[0_0_8px_#80ed99]" style="animation: fairyTwinkle 1.7s infinite 0.5s;"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#ff9ebb] shadow-[0_0_8px_#ff7aa2]" style="animation: fairyTwinkle 1.6s infinite 0.9s;"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#ffe680] shadow-[0_0_8px_#ffd23f]" style="animation: fairyTwinkle 2.0s infinite 0.3s;"></span>
      </div>

      <header class="relative z-20 flex items-center justify-between px-3 py-2 bg-[#4a2a14]/95 text-[#fffaf2] border-b-4 border-[#2e180a] shadow-md gap-1.5">
        <div class="flex items-center gap-1.5 sm:gap-2.5">
          <button id="btn-home-cafe" class="cartoon-btn bg-[#8c522b] hover:bg-[#a16136] text-white px-2.5 py-1.5 rounded-xl font-display text-xs sm:text-sm flex items-center gap-1 border-2 border-[#c88a55]" title="Hub Lobby">
            <span>🏠</span>
            <span class="hidden sm:inline">Hub</span>
          </button>

          <div class="flex items-center gap-1 bg-[#2e180a] px-2.5 py-1 rounded-xl border border-[#7c4a27]">
            <span class="text-base sm:text-lg">🪙</span>
            <span id="hud-coins" class="font-display font-bold text-sm sm:text-base text-[#ffd15c]">${saveData.coins}</span>
          </div>

          <div class="flex items-center gap-1 bg-[#2e180a] px-2.5 py-1 rounded-xl border border-[#7c4a27]">
            <span class="text-base sm:text-lg">💎</span>
            <span id="hud-gems" class="font-display font-bold text-sm sm:text-base text-[#7ae7ff]">${saveData.gems}</span>
          </div>
        </div>

        <div id="hud-center-status" class="flex items-center gap-2 bg-[#63391d] px-3 py-1 rounded-2xl border-2 border-[#a36636]">
          <div class="text-center">
            <div id="hud-mode-label" class="text-[10px] uppercase tracking-wider text-[#f5d0a9] font-bold leading-none">Day 1</div>
            <div id="hud-goal-text" class="font-display text-xs sm:text-sm font-bold text-white leading-tight">Goal: 0 / 120</div>
          </div>
          <div class="h-6 w-[2px] bg-[#8c522b]"></div>
          <div class="flex items-center gap-1">
            <span class="text-sm">⏱️</span>
            <span id="hud-timer" class="font-display font-bold text-sm sm:text-base text-[#ffe28a] tabular-nums">01:15</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button id="btn-recipes-modal" class="cartoon-btn bg-[#e69138] hover:bg-[#f09e48] text-[#3b2314] px-2.5 py-1.5 rounded-xl font-display font-bold text-xs sm:text-sm border-2 border-[#fff0d4] flex items-center gap-1">
            <span>📖</span>
            <span class="hidden md:inline">Menu</span>
          </button>
          <button id="btn-challenges-modal" class="relative cartoon-btn bg-[#6bc4a6] hover:bg-[#7bd4b6] text-[#1c3b30] px-2.5 py-1.5 rounded-xl font-display font-bold text-xs sm:text-sm border-2 border-[#d4fff0] flex items-center gap-1">
            <span>🎯</span>
            <span id="badge-challenge" class="hidden absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#f24968] rounded-full border-2 border-white"></span>
          </button>
          <button id="btn-shop-modal" class="cartoon-btn bg-[#f2798f] hover:bg-[#ff8ca1] text-white px-2.5 py-1.5 rounded-xl font-display font-bold text-xs sm:text-sm border-2 border-[#ffd6de] flex items-center gap-1">
            <span>🛍️</span>
          </button>
          <button id="btn-audio" class="cartoon-btn bg-[#5c361c] hover:bg-[#734525] text-white w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border-2 border-[#9e6238]">
            <span id="audio-icon">🔊</span>
          </button>
        </div>
      </header>

      <div class="relative z-20 flex items-center justify-between px-3 py-1.5 pointer-events-none">
        <div id="combo-pill" class="opacity-0 transition-all duration-200 transform scale-90 flex items-center gap-1.5 bg-gradient-to-r from-[#ff6b35] to-[#f7b801] text-white px-3 py-1 rounded-full shadow-lg border-2 border-white">
          <span class="text-base">🔥</span>
          <span id="combo-text" class="font-display font-bold text-xs sm:text-sm tracking-wide">COMBO x1.5!</span>
        </div>
        <div id="rush-banner" class="hidden anim-rush flex items-center gap-1.5 bg-gradient-to-r from-[#e63946] via-[#ff7b00] to-[#e63946] text-white px-3.5 py-1 rounded-full shadow-lg border-2 border-[#ffe66d]">
          <span class="text-sm sm:text-base">⚡</span>
          <span class="font-display font-bold text-xs sm:text-sm tracking-wider uppercase">RUSH HOUR! 2X COINS</span>
          <span class="text-sm sm:text-base">⚡</span>
        </div>
        <div id="coffee-speed-badge" class="bg-[#3b2314]/80 text-[#ffe6c7] px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#a36636]/50">
          ☕ Machine Lv.<span id="hud-machine-lv">${saveData.machineLevel}</span>
        </div>
      </div>

      <main id="cafe-floor" class="relative flex-1 flex flex-col justify-end px-2 sm:px-6 pb-2 z-10 overflow-hidden">
        <div class="absolute top-2 left-4 right-4 flex justify-between items-start pointer-events-none opacity-95">
          <div id="decor-wall-art" class="${saveData.decor.wallArt ? '' : 'hidden'} sm:flex flex-col items-center bg-[#fffaf2] p-1.5 rounded-xl border-4 border-[#8c522b] shadow-md transform -rotate-2">
            <div class="w-16 h-12 rounded-lg bg-gradient-to-b from-[#a8dadc] to-[#f1faee] flex flex-col items-center justify-center relative overflow-hidden">
              <div class="w-5 h-5 rounded-full bg-[#ffb703] absolute top-1.5 right-2"></div>
              <div class="text-xl mt-2">🏔️</div>
            </div>
            <span class="text-[9px] font-bold text-[#6b3e1d] mt-0.5">Cozy Peak</span>
          </div>

          <div class="mx-auto bg-[#2b3a34] border-4 border-[#8c522b] rounded-2xl px-3.5 py-1.5 shadow-md text-center">
            <div class="font-display text-[#ffe8b3] text-xs sm:text-sm tracking-wide flex items-center justify-center gap-1.5">
              <span>✨</span>
              <span id="cafe-name-sign">TINY CAFÉ</span>
              <span>✨</span>
            </div>
            <div id="unlocked-count-sign" class="text-[10px] text-[#a7d7c5] font-bold">${saveData.unlockedRecipes.length} Recipes on Menu</div>
          </div>

          <div id="decor-plant" class="${saveData.decor.plant ? '' : 'hidden'} sm:flex flex-col items-center">
            <div class="text-3xl leading-none filter drop-shadow">🌿</div>
            <div class="w-8 h-6 bg-[#d97236] rounded-b-xl border-t-4 border-[#b55621] shadow"></div>
          </div>
        </div>

        <div id="customer-slots" class="grid grid-cols-3 gap-2 sm:gap-4 items-end w-full max-w-4xl mx-auto pt-12">
          <div id="slot-0" class="customer-slot relative flex flex-col items-center justify-end min-h-[195px] sm:min-h-[235px]"></div>
          <div id="slot-1" class="customer-slot relative flex flex-col items-center justify-end min-h-[195px] sm:min-h-[235px]"></div>
          <div id="slot-2" class="customer-slot relative flex flex-col items-center justify-end min-h-[195px] sm:min-h-[235px]"></div>
        </div>
      </main>

      <section class="relative z-20 flex flex-col shadow-[0_-8px_20px_rgba(35,18,8,0.35)] pb-10 sm:pb-4">
        <div class="counter-surface px-3 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-2">
          <button id="btn-clear-tray" class="cartoon-btn bg-[#e64848] hover:bg-[#f25c5c] text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl font-display font-bold text-xs sm:text-sm border-2 border-[#ffc2c2] flex flex-col sm:flex-row items-center gap-1 shrink-0">
            <span class="text-base sm:text-lg">🗑️</span>
            <span>Clear</span>
          </button>

          <div id="serving-tray" class="flex-1 max-w-xl bg-[#fffaf2]/95 border-4 border-[#8c522b] rounded-2xl px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2 shadow-inner min-h-[58px] sm:min-h-[66px]">
            <div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scroll py-0.5" id="tray-items-container">
              <span class="text-xs sm:text-sm font-bold text-[#9c785c] italic">Tap ingredients below to prep order...</span>
            </div>
            <div id="tray-match-preview" class="hidden shrink-0 flex items-center gap-1.5 bg-[#e6f7ef] border-2 border-[#52b788] px-2.5 py-1 rounded-xl">
              <span id="tray-match-icon" class="text-lg sm:text-xl">☕</span>
              <span id="tray-match-name" class="font-display font-bold text-xs sm:text-sm text-[#1b4332] hidden sm:inline">Espresso</span>
            </div>
          </div>

          <button id="btn-serve" disabled class="cartoon-btn bg-[#40b37a] hover:bg-[#4ec98c] disabled:opacity-50 disabled:cursor-not-allowed text-white px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-2xl font-display font-bold text-xs sm:text-base border-2 border-[#b7f5d6] flex flex-col sm:flex-row items-center gap-1 shrink-0">
            <span class="text-base sm:text-lg">🛎️</span>
            <span>Serve</span>
          </button>
        </div>

        <div class="counter-body px-2.5 py-2.5 sm:px-5 sm:py-3.5 pb-10 sm:pb-4">
          <div id="stations-grid" class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 max-w-4xl mx-auto"></div>
        </div>
      </section>

      <div id="screen-start" class="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#241309]/80 backdrop-blur-sm">
        <div class="bg-[#fffaf2] border-4 border-[#6b3e1d] rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl text-center relative overflow-hidden">
          <div class="absolute -top-10 -left-10 w-32 h-32 bg-[#ffd166]/25 rounded-full pointer-events-none"></div>
          <div class="absolute -bottom-10 -right-10 w-36 h-36 bg-[#f2798f]/20 rounded-full pointer-events-none"></div>

          <div class="inline-flex items-center gap-2 bg-[#fcecd8] border-2 border-[#d99b66] px-3.5 py-1 rounded-full text-xs font-extrabold text-[#7c4722] mb-2">
            <span>✨ ARCADE HUB EDITION ✨</span>
          </div>

          <div class="text-5xl sm:text-6xl mb-1 anim-bob">☕🧸🥐</div>
          <h1 class="font-display text-3xl sm:text-5xl font-bold text-[#3b2314] tracking-tight">Tiny Café</h1>
          <p class="text-xs sm:text-sm font-bold text-[#7c583e] mt-1 mb-4">Cozy counter service, cute VIP guests & handcrafted treats!</p>

          <div class="bg-[#f7e7d2] border-2 border-[#d9b38c] rounded-2xl p-3 mb-5 flex items-center justify-around">
            <div>
              <div class="text-[11px] font-extrabold uppercase text-[#8c5a36]">Café Day</div>
              <div id="start-day" class="font-display text-xl font-bold text-[#3b2314]">Day ${saveData.day}</div>
            </div>
            <div class="h-8 w-[2px] bg-[#d9b38c]"></div>
            <div>
              <div class="text-[11px] font-extrabold uppercase text-[#8c5a36]">Coins</div>
              <div id="start-coins" class="font-display text-xl font-bold text-[#d97706]">🪙 ${saveData.coins}</div>
            </div>
            <div class="h-8 w-[2px] bg-[#d9b38c]"></div>
            <div>
              <div class="text-[11px] font-extrabold uppercase text-[#8c5a36]">Gems</div>
              <div id="start-gems" class="font-display text-xl font-bold text-[#0284c7]">💎 ${saveData.gems}</div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button id="btn-start-campaign" class="cartoon-btn bg-gradient-to-b from-[#ff9f43] to-[#e67e22] text-white p-3.5 rounded-2xl border-2 border-[#ffe0b2] flex flex-col items-center">
              <span class="text-2xl mb-0.5">📅</span>
              <span class="font-display text-lg font-bold">Café Career</span>
              <span class="text-[11px] font-bold text-[#fff3e0]">Complete daily coin goals & unlock recipes</span>
            </button>
            <button id="btn-start-rush" class="cartoon-btn bg-gradient-to-b from-[#f25c78] to-[#d63353] text-white p-3.5 rounded-2xl border-2 border-[#ffc2ce] flex flex-col items-center">
              <span class="text-2xl mb-0.5">⚡</span>
              <span class="font-display text-lg font-bold">Rush Hour Endless</span>
              <span class="text-[11px] font-bold text-[#ffe5ec]">Non-stop fast orders, VIPs & high scores</span>
            </button>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <button id="btn-start-recipes" class="cartoon-btn bg-[#fcecd8] hover:bg-[#f5dec0] text-[#5c361c] py-2 px-2 rounded-xl font-display font-bold text-xs sm:text-sm border-2 border-[#c88a55]">📖 Recipes</button>
            <button id="btn-start-challenges" class="cartoon-btn bg-[#e3f7ef] hover:bg-[#ccf0e1] text-[#1e4d3b] py-2 px-2 rounded-xl font-display font-bold text-xs sm:text-sm border-2 border-[#6bc4a6]">🎯 Daily Quests</button>
            <button id="btn-start-shop" class="cartoon-btn bg-[#fde8ec] hover:bg-[#fbd0d9] text-[#6e2132] py-2 px-2 rounded-xl font-display font-bold text-xs sm:text-sm border-2 border-[#f2798f]">🛍️ Café Shop</button>
          </div>
        </div>
      </div>

      <div id="modal-round-end" class="hidden absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#241309]/80 backdrop-blur-sm">
        <div class="bg-[#fffaf2] border-4 border-[#6b3e1d] rounded-3xl max-w-md w-full p-6 shadow-2xl text-center">
          <div id="end-emoji" class="text-5xl mb-2 anim-bob">🎉</div>
          <h2 id="end-title" class="font-display text-3xl font-bold text-[#3b2314]">Shift Complete!</h2>
          <p id="end-subtitle" class="text-xs sm:text-sm font-bold text-[#7c583e] mt-1 mb-4">Wonderful hospitality today!</p>

          <div class="bg-[#f7e7d2] border-2 border-[#d9b38c] rounded-2xl p-3.5 mb-5 space-y-2 text-sm font-bold">
            <div class="flex justify-between"><span class="text-[#6b3e1d]">Orders Served:</span><span id="end-served" class="font-display text-[#3b2314]">0</span></div>
            <div class="flex justify-between"><span class="text-[#6b3e1d]">Best Combo:</span><span id="end-combo" class="font-display text-[#d97706]">x1</span></div>
            <div class="flex justify-between"><span class="text-[#6b3e1d]">Coins Earned:</span><span id="end-coins" class="font-display text-[#15803d]">+0 🪙</span></div>
            <div class="flex justify-between"><span class="text-[#6b3e1d]">Bonus Gems:</span><span id="end-gems" class="font-display text-[#0284c7]">+0 💎</span></div>
          </div>

          <div class="flex gap-2.5">
            <button id="btn-modal-menu" class="cartoon-btn flex-1 bg-[#e5d0b8] text-[#4a2a14] py-3 rounded-2xl font-display font-bold text-sm border-2 border-[#b8936d]">🏠 Menu</button>
            <button id="btn-next-shift" class="cartoon-btn flex-1 bg-[#40b37a] text-white py-3 rounded-2xl font-display font-bold text-sm border-2 border-[#b7f5d6]">Next Day ➡️</button>
          </div>
        </div>
      </div>

      <div id="modal-recipes" class="hidden absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#241309]/75 backdrop-blur-sm">
        <div class="bg-[#fffaf2] border-4 border-[#6b3e1d] rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col p-5 shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b-2 border-[#ebd5b9]">
            <div class="flex items-center gap-2"><span class="text-2xl">📖</span><h2 class="font-display text-2xl font-bold text-[#3b2314]">Tiny Café Menu</h2></div>
            <button id="btn-close-recipes" class="cartoon-btn bg-[#e64848] text-white w-8 h-8 rounded-xl font-bold">✕</button>
          </div>
          <p class="text-xs font-bold text-[#7c583e] mt-2 mb-3">Tap ingredients on the counter in any order to craft these recipes!</p>
          <div id="recipe-list" class="flex-1 overflow-y-auto custom-scroll space-y-2.5 pr-1"></div>
        </div>
      </div>

      <div id="modal-challenges" class="hidden absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#241309]/75 backdrop-blur-sm">
        <div class="bg-[#fffaf2] border-4 border-[#6b3e1d] rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col p-5 shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b-2 border-[#ebd5b9]">
            <div class="flex items-center gap-2"><span class="text-2xl">🎯</span><h2 class="font-display text-2xl font-bold text-[#3b2314]">Daily Challenges</h2></div>
            <button id="btn-close-challenges" class="cartoon-btn bg-[#e64848] text-white w-8 h-8 rounded-xl font-bold">✕</button>
          </div>
          <p class="text-xs font-bold text-[#7c583e] mt-2 mb-3">Fresh café goals every day! Complete them for bonus coins & gems.</p>
          <div id="challenges-list" class="flex-1 overflow-y-auto custom-scroll space-y-3 pr-1"></div>
        </div>
      </div>

      <div id="modal-shop" class="hidden absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#241309]/75 backdrop-blur-sm">
        <div class="bg-[#fffaf2] border-4 border-[#6b3e1d] rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col p-5 shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b-2 border-[#ebd5b9]">
            <div class="flex items-center gap-2"><span class="text-2xl">🛍️</span><h2 class="font-display text-2xl font-bold text-[#3b2314]">Café Shop & Decor</h2></div>
            <div class="flex items-center gap-2">
              <span class="bg-[#2e180a] text-[#ffd15c] px-2.5 py-1 rounded-xl font-display text-xs font-bold">🪙 <span id="shop-coins">${saveData.coins}</span></span>
              <span class="bg-[#2e180a] text-[#7ae7ff] px-2.5 py-1 rounded-xl font-display text-xs font-bold">💎 <span id="shop-gems">${saveData.gems}</span></span>
              <button id="btn-close-shop" class="cartoon-btn bg-[#e64848] text-white w-8 h-8 rounded-xl font-bold">✕</button>
            </div>
          </div>
          <div class="flex gap-2 my-3">
            <button id="tab-recipes" class="flex-1 py-1.5 rounded-xl font-display font-bold text-xs sm:text-sm bg-[#e69138] text-white">🍰 New Recipes</button>
            <button id="tab-upgrades" class="flex-1 py-1.5 rounded-xl font-display font-bold text-xs sm:text-sm bg-[#ebd5b9] text-[#5c361c]">⚙️ Equipment</button>
            <button id="tab-decor" class="flex-1 py-1.5 rounded-xl font-display font-bold text-xs sm:text-sm bg-[#ebd5b9] text-[#5c361c]">🎨 Themes & Decor</button>
          </div>
          <div id="shop-items-container" class="flex-1 overflow-y-auto custom-scroll space-y-2.5 pr-1"></div>
        </div>
      </div>

      <div id="toast-box" class="hidden absolute top-16 left-1/2 transform -translate-x-1/2 z-[70] bg-[#3b2314] text-[#fffaf2] border-2 border-[#ffd15c] px-4 py-2 rounded-2xl shadow-xl font-display text-xs sm:text-sm flex items-center gap-2">
        <span id="toast-icon">✨</span>
        <span id="toast-msg">Notification</span>
      </div>
    </div>
  `;

  // Attach global helpers for inline button handlers
  window.serveTinyCafeSlot = serveSlot;
  window.openTinyCafeModal = openModal;
  window.claimTinyCafeQuest = claimQuest;
  window.buyTinyCafeRecipe = buyRecipe;
  window.buyTinyCafeUpgrade = buyUpgrade;
  window.buyTinyCafeTheme = buyTheme;
  window.equipTinyCafeTheme = equipTheme;
  window.buyTinyCafeDecor = buyDecor;

  // Bind Listeners
  document.getElementById('btn-home-cafe').onclick = () => { if (typeof openHubHome === 'function') openHubHome(); };
  document.getElementById('btn-recipes-modal').onclick = () => openModal('modal-recipes');
  document.getElementById('btn-challenges-modal').onclick = () => openModal('modal-challenges');
  document.getElementById('btn-shop-modal').onclick = () => openModal('modal-shop');
  document.getElementById('btn-audio').onclick = toggleAudio;
  document.getElementById('btn-clear-tray').onclick = clearTray;
  document.getElementById('btn-serve').onclick = serveMatchingCustomer;

  document.getElementById('btn-start-campaign').onclick = () => startGame('campaign');
  document.getElementById('btn-start-rush').onclick = () => startGame('rush');
  document.getElementById('btn-start-recipes').onclick = () => openModal('modal-recipes');
  document.getElementById('btn-start-challenges').onclick = () => openModal('modal-challenges');
  document.getElementById('btn-start-shop').onclick = () => openModal('modal-shop');

  document.getElementById('btn-modal-menu').onclick = returnToMenu;
  document.getElementById('btn-next-shift').onclick = nextShiftAction;

  document.getElementById('btn-close-recipes').onclick = () => closeAllModals();
  document.getElementById('btn-close-challenges').onclick = () => closeAllModals();
  document.getElementById('btn-close-shop').onclick = () => closeAllModals();

  document.getElementById('tab-recipes').onclick = () => switchShopTab('recipes');
  document.getElementById('tab-upgrades').onclick = () => switchShopTab('upgrades');
  document.getElementById('tab-decor').onclick = () => switchShopTab('decor');

  ensureDailyQuests();
  applyThemeAndDecor();
  renderStations();
  renderTray();
  syncHUD();

  return () => {
    gameState.active = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (toastTimeout) clearTimeout(toastTimeout);
    stopBgMusic();
  };
}
