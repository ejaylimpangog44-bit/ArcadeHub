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
      <div class="w-full h-full flex flex-col justify-between px-3 sm:px-8 py-3 overflow-y-auto">
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

function initCoinScatter(stage, meta) {
  stage.innerHTML = `
    <div class="relative w-full h-full flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">

      <div class="max-w-xl w-full bg-slate-950/80 backdrop-blur-xl border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 text-center mt-12 sm:mt-0">
        
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs font-bold text-amber-300">
            🪙 COINS: <span id="scatter-coins">3,250</span>
          </div>
          <div class="text-[11px] font-extrabold uppercase tracking-widest text-amber-400/90">
            Royal Vault 5×3 Scatter Machine
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-fuchsia-950/60 border border-fuchsia-500/30 text-xs font-bold text-fuchsia-300">
            ⚡ FREE SPINS: <span id="scatter-spins">0</span>
          </div>
        </div>

        <div id="scatter-msg" class="text-xs sm:text-sm font-bold text-amber-200 bg-amber-500/10 border border-amber-500/20 py-2 px-4 rounded-xl">
          Match 3 Scatters to Trigger Free Spins Bonus!
        </div>

        <div id="slot-grid" class="grid grid-cols-5 gap-2 sm:gap-3 bg-black/60 p-3 sm:p-4 rounded-2xl border border-white/10">
        </div>

        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 font-semibold">Bet:</span>
            <span class="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white">50 🔼</span>
          </div>
          <button id="spin-btn" onclick="triggerScatterSpin()" class="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 font-black text-sm text-slate-950 shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition">
            SPIN THE REELS 🎰
          </button>
        </div>
      </div>

      <div id="scatter-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md hidden items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-6 text-center shadow-2xl flex flex-col gap-4">
          <div class="text-4xl">🎉</div>
          <h2 class="text-xl font-black text-amber-400">FREE SPINS FEATURE COMPLETE!</h2>
          <p class="text-xs text-slate-300">Total Winnings Collected from Bonus Rounds:</p>
          <div class="text-3xl font-black text-white font-mono bg-black/40 py-3 rounded-2xl border border-white/10">
            🪙 <span id="modal-win-tally" class="text-amber-300">0</span> Coins
          </div>
          <button onclick="closeScatterModal()" class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 font-extrabold text-xs text-slate-950 hover:opacity-95 transition">
            Collect & Return to Vault
          </button>
        </div>
      </div>
    </div>
  `;

  const symbols = ['👑', '⚡', '🔔', '💎', '🪙', '7️⃣'];
  let coins = 3250;
  let freeSpinsLeft = 0;
  let totalBonusWon = 0;
  let isAutoSpinning = false;
  let currentGrid = [
    ['👑', '⚡', '🔔', '7️⃣', '🪙'],
    ['⚡', '🪙', '💎', '🪙', '👑'],
    ['🔔', '💎', '7️⃣', '7️⃣', '👑']
  ];

  window.renderScatterGrid = function(highlightScatters = false) {
    const gridEl = document.getElementById('slot-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';
    currentGrid.forEach((row, r) => {
      row.forEach((sym, c) => {
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
    AudioFX.click();

    if (freeSpinsLeft > 0) {
      freeSpinsLeft--;
      document.getElementById('scatter-spins').textContent = freeSpinsLeft;
    }

    isAutoSpinning = true;
    document.getElementById('spin-btn').disabled = true;

    let shuffles = 0;
    const shuffleInterval = setInterval(() => {
      currentGrid = currentGrid.map(row => row.map(() => symbols[Math.floor(Math.random() * symbols.length)]));
      renderScatterGrid(false);
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

    renderScatterGrid(true);

    if (scatterCount >= 3 && freeSpinsLeft === 0) {
      const possibleSpins = [3, 5, 10, 15];
      freeSpinsLeft = possibleSpins[Math.floor(Math.random() * possibleSpins.length)];
      totalBonusWon = freeSpinsLeft * 45;
      document.getElementById('scatter-spins').textContent = freeSpinsLeft;
      document.getElementById('scatter-msg').textContent = `⚡ 3+ SCATTERS! Won ${freeSpinsLeft} Free Spins! Auto-spinning...`;
      AudioFX.win();
      addXP(50);

      setTimeout(() => {
        isAutoSpinning = false;
        document.getElementById('spin-btn').disabled = false;
        document.getElementById('spin-btn').textContent = "AUTO-SPINNING BONUS...";
        runAutoBonusSpins();
      }, 1200);
    } else {
      const spinWin = Math.floor(Math.random() * 120) + 20;
      coins += spinWin;
      totalBonusWon += spinWin;
      document.getElementById('scatter-coins').textContent = coins.toLocaleString();
      document.getElementById('scatter-msg').textContent = `Spin Win: +${spinWin} Coins!`;
      AudioFX.coin();

      isAutoSpinning = false;
      document.getElementById('spin-btn').disabled = false;

      if (freeSpinsLeft > 0) {
        document.getElementById('spin-btn').textContent = `NEXT FREE SPIN (${freeSpinsLeft} left)`;
        setTimeout(() => {
          if (freeSpinsLeft > 0) triggerScatterSpin();
        }, 800);
      } else {
        document.getElementById('spin-btn').textContent = "SPIN THE REELS 🎰";
      }
    }
  }

  function runAutoBonusSpins() {
    if (freeSpinsLeft <= 0) {
      showVictoryModal();
      return;
    }
    triggerScatterSpin();
  }

  function showVictoryModal() {
    document.getElementById('scatter-modal').classList.remove('hidden');
    document.getElementById('scatter-modal').classList.add('flex');
    document.getElementById('spin-btn').textContent = "SPIN THE REELS 🎰";
    
    let currentCount = 0;
    const targetCount = totalBonusWon;
    const step = Math.max(1, Math.floor(targetCount / 25));
    const tallyEl = document.getElementById('modal-win-tally');
    
    const countInterval = setInterval(() => {
      currentCount += step;
      if (currentCount >= targetCount) {
        currentCount = targetCount;
        clearInterval(countInterval);
      }
      tallyEl.textContent = currentCount.toLocaleString();
    }, 40);

    AudioFX.win();
    addXP(100);
  }

  window.closeScatterModal = function() {
    document.getElementById('scatter-modal').classList.remove('flex');
    document.getElementById('scatter-modal').classList.add('hidden');
    coins += totalBonusWon;
    totalBonusWon = 0;
    document.getElementById('scatter-coins').textContent = coins.toLocaleString();
    document.getElementById('scatter-msg').textContent = 'Bonus feature completed! Ready for regular play.';
  };

  renderScatterGrid(false);
}

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
      <div class="w-full h-full flex flex-col justify-between items-center px-4 py-4">
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
      <div class="w-full h-full flex flex-col items-center justify-between px-4 py-5">
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

function initChess(stage) {
  const GLYPHS = {
    wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
    bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟'
  };
  const VALS = { P:10, N:32, B:33, R:50, Q:90, K:900 };

  let board = [], turn = 'w', sel = null, legal = [], capturedW = [], capturedB = [], status = 'Your Move (White)';

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
            const score = (cap ? VALS[cap[1]] * 10 : 0) + (dr * 0.5) + Math.random() * 2;
            all.push({ sr: r, sc: c, dr, dc, score });
          });
        }
      }
    }
    if (!all.length) {
      status = isKingInCheck(board, 'b') ? 'Checkmate! You Win!' : 'Stalemate!';
      AudioFX.win();
      addXP(60, window.innerWidth / 2, window.innerHeight / 2, 'CHECKMATE +60 XP!');
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
      <div class="w-full h-full flex flex-col items-center justify-center px-3 py-2 gap-2">
        <div class="flex items-center justify-between w-full max-w-[min(86vw,460px)]">
          <span class="px-3 py-1 rounded-full bg-amber-950/90 border border-amber-500/30 text-amber-200 font-bold text-xs">${status}</span>
          <button id="chess-reset" class="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs">New Match</button>
        </div>

        <div class="text-xs text-amber-200/80 h-5 flex items-center gap-1">
          Captured: ${capturedB.map(p => GLYPHS[p]).join(' ')}
        </div>

        <div class="grid grid-cols-8 aspect-square w-[min(86vw,460px)] rounded-2xl overflow-hidden border-4 border-amber-900 shadow-[0_20px_50px_rgba(0,0,0,0.75)]">
          ${board.map((row, r) => row.map((cell, c) => {
            const dark = (r + c) % 2 === 1;
            const isSel = sel && sel[0] === r && sel[1] === c;
            const isLeg = legal.some(([lr, lc]) => lr === r && lc === c);
            return `
              <button data-r="${r}" data-c="${c}" class="ch-sq relative flex items-center justify-center text-2xl sm:text-4xl ${dark ? 'bg-[#7c4a2d]' : 'bg-[#e7d3b5]'} ${isSel ? 'ring-inset ring-4 ring-amber-400' : ''}">
                ${cell ? `<span class="${cell[0] === 'w' ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.85)]' : 'text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]'}">${GLYPHS[cell]}</span>` : ''}
                ${isLeg ? `<span class="absolute w-3.5 h-3.5 rounded-full ${cell ? 'ring-4 ring-emerald-400 bg-transparent w-8 h-8' : 'bg-emerald-500/75'}"></span>` : ''}
              </button>
            `;
          }).join('')).join('')}
        </div>

        <div class="text-xs text-amber-200/80 h-5 flex items-center gap-1">
          Lost: ${capturedW.map(p => GLYPHS[p]).join(' ')}
        </div>
      </div>
    `;

    document.getElementById('chess-reset').onclick = reset;
    document.querySelectorAll('.ch-sq').forEach(btn => {
      btn.onclick = () => {
        if (turn !== 'w') return;
        const r = Number(btn.dataset.r), c = Number(btn.dataset.c);
        if (sel && legal.some(([lr, lc]) => lr === r && lc === c)) {
          applyMove(sel[0], sel[1], r, c);
          sel = null; legal = []; turn = 'b';
          status = 'Grandmaster AI thinking...';
          render();
          setTimeout(aiMove, 260);
          return;
        }
        if (board[r][c]?.[0] === 'w') {
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

  reset();
}

function initDama(stage) {
  let board = [], turn = 'r', sel = null, moves = [], status = 'Your Turn (Red Dama)';

  function reset() {
    board = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => {
      if ((r + c) % 2 === 1) {
        if (r < 3) return { side: 'b', king: false };
        if (r > 4) return { side: 'r', king: false };
      }
      return null;
    }));
    turn = 'r'; sel = null; moves = [];
    status = 'Your Turn (Red Dama)';
    render();
  }

  function getPieceMoves(r, c) {
    const p = board[r][c];
    if (!p) return [];
    const res = [];
    const dirs = p.king ? [[-1,-1],[-1,1],[1,-1],[1,1]] : (p.side === 'r' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
    const capDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];

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

    if (res.length > 0) return res;

    dirs.forEach(([dr, dc]) => {
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

  function aiTurn() {
    const all = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]?.side === 'b') {
          getPieceMoves(r, c).forEach(m => all.push({ sr: r, sc: c, ...m }));
        }
      }
    }
    if (!all.length) {
      status = 'Panlo! You Won Dama!';
      AudioFX.win();
      addXP(50, window.innerWidth / 2, window.innerHeight / 2, 'DAMA VICTORY!');
      render();
      return;
    }
    const caps = all.filter(m => m.cap);
    const pick = (caps.length ? caps : all)[Math.floor(Math.random() * (caps.length ? caps.length : all.length))];
    const piece = board[pick.sr][pick.sc];
    board[pick.dr][pick.dc] = piece;
    board[pick.sr][pick.sc] = null;
    if (pick.cap) board[pick.cap[0]][pick.cap[1]] = null;
    if (pick.dr === 7) piece.king = true;
    AudioFX.card();
    turn = 'r';
    status = 'Your Turn (Red Dama)';
    render();
  }

  function render() {
    stage.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center px-3 py-2 gap-3">
        <div class="flex items-center justify-between w-full max-w-[min(86vw,460px)]">
          <span class="px-3.5 py-1 rounded-full bg-amber-950/90 border border-amber-400/35 text-amber-200 font-bold text-xs">${status}</span>
          <button id="dama-reset" class="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs">Reset Board</button>
        </div>

        <div class="grid grid-cols-8 aspect-square w-[min(86vw,460px)] rounded-2xl overflow-hidden border-4 border-[#3d1f0d] shadow-[0_20px_50px_rgba(0,0,0,0.75)]">
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
        <div class="text-[11px] text-amber-200/75">Filipino Dama Rules • Reach the far row to crown a Flying King (👑)</div>
      </div>
    `;

    document.getElementById('dama-reset').onclick = reset;
    document.querySelectorAll('.dm-sq').forEach(btn => {
      btn.onclick = () => {
        if (turn !== 'r') return;
        const r = Number(btn.dataset.r), c = Number(btn.dataset.c);
        const mv = moves.find(m => m.dr === r && m.dc === c);
        if (sel && mv) {
          const piece = board[sel[0]][sel[1]];
          board[r][c] = piece;
          board[sel[0]][sel[1]] = null;
          if (mv.cap) {
            board[mv.cap[0]][mv.cap[1]] = null;
            AudioFX.coin();
            addXP(15, window.innerWidth / 2, window.innerHeight / 2, 'CAPTURE!');
          } else {
            AudioFX.card();
          }
          if (r === 0) piece.king = true;
          sel = null; moves = []; turn = 'b';
          status = 'Opponent moving...';
          render();
          setTimeout(aiTurn, 260);
          return;
        }
        if (board[r][c]?.side === 'r') {
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

function initTicTacToe(stage) {
  let size = 3, cells = Array(9).fill(null), hardAI = true, over = false, msg = 'Your Turn (X)', winLine = [];

  function reset(newSize = size) {
    size = newSize;
    cells = Array(size * size).fill(null);
    over = false;
    winLine = [];
    msg = 'Your Turn (X)';
    render();
  }

  function checkWinner(arr) {
    const lines = [];
    for (let i = 0; i < size; i++) {
      lines.push(Array.from({ length: size }, (_, k) => i * size + k));
      lines.push(Array.from({ length: size }, (_, k) => k * size + i));
    }
    lines.push(Array.from({ length: size }, (_, k) => k * size + k));
    lines.push(Array.from({ length: size }, (_, k) => k * size + (size - 1 - k)));

    for (const line of lines) {
      const first = arr[line[0]];
      if (first && line.every(idx => arr[idx] === first)) return { winner: first, line };
    }
    if (arr.every(Boolean)) return { winner: 'draw', line: [] };
    return null;
  }

  function aiStep() {
    const empty = cells.map((v, i) => v === null ? i : null).filter(v => v !== null);
    if (!empty.length) return;
    let choice = empty[Math.floor(Math.random() * empty.length)];
    if (hardAI) {
      for (const sym of ['O', 'X']) {
        for (const idx of empty) {
          const copy = [...cells];
          copy[idx] = sym;
          if (checkWinner(copy)?.winner === sym) { choice = idx; break; }
        }
      }
    }
    cells[choice] = 'O';
    AudioFX.card();
    const res = checkWinner(cells);
    if (res) finish(res);
    else { msg = 'Your Turn (X)'; render(); }
  }

  function finish(res) {
    over = true;
    winLine = res.line;
    if (res.winner === 'X') {
      msg = '⚡ Neon Victory! You Win!';
      AudioFX.win();
      addXP(30, window.innerWidth / 2, window.innerHeight / 2, 'VICTORY +30 XP!');
    } else if (res.winner === 'O') {
      msg = 'AI Wins this round!';
      AudioFX.lose();
    } else {
      msg = 'Grid Locked — Draw!';
    }
    render();
  }

  function render() {
    stage.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center px-4 gap-4">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button id="ttt-3" class="px-3.5 py-1.5 rounded-full text-xs font-bold ${size === 3 ? 'bg-cyan-500 text-slate-950' : 'bg-white/10 text-slate-300'}">3×3 Classic</button>
          <button id="ttt-5" class="px-3.5 py-1.5 rounded-full text-xs font-bold ${size === 5 ? 'bg-cyan-500 text-slate-950' : 'bg-white/10 text-slate-300'}">5×5 Arena</button>
          <button id="ttt-ai" class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200">AI: ${hardAI ? 'Tactical' : 'Casual'}</button>
        </div>

        <div class="text-lg sm:text-xl font-black text-cyan-300 tracking-wide">${msg}</div>

        <div class="grid gap-2.5 w-[min(85vw,380px)] aspect-square" style="grid-template-columns: repeat(${size}, minmax(0, 1fr));">
          ${cells.map((v, i) => {
            const isWin = winLine.includes(i);
            return `
              <button data-i="${i}" class="ttt-cell rounded-2xl bg-slate-900/80 border-2 ${isWin ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_25px_rgba(251,191,36,0.5)]' : 'border-cyan-500/30 hover:border-cyan-400'} flex items-center justify-center font-black ${size === 3 ? 'text-5xl' : 'text-2xl'} transition">
                ${v === 'X' ? '<span class="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]">✕</span>' : v === 'O' ? '<span class="text-pink-500 drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]">◯</span>' : ''}
              </button>
            `;
          }).join('')}
        </div>

        <button id="ttt-reset" class="px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs">Clear Grid</button>
      </div>
    `;

    document.getElementById('ttt-3').onclick = () => reset(3);
    document.getElementById('ttt-5').onclick = () => reset(5);
    document.getElementById('ttt-ai').onclick = () => { hardAI = !hardAI; render(); };
    document.getElementById('ttt-reset').onclick = () => reset(size);

    document.querySelectorAll('.ttt-cell').forEach(btn => {
      btn.onclick = () => {
        const i = Number(btn.dataset.i);
        if (over || cells[i] !== null) return;
        cells[i] = 'X';
        AudioFX.click();
        const res = checkWinner(cells);
        if (res) finish(res);
        else { msg = 'AI responding...'; render(); setTimeout(aiStep, 200); }
      };
    });
  }

  render();
}

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
      <div class="w-full h-full flex flex-col items-center justify-between px-4 py-4">
        <div class="flex items-center gap-3">
          <span class="px-3.5 py-1 rounded-full bg-black/40 border border-amber-300/30 text-amber-200 font-bold text-xs">LEVEL ${pIdx + 1}</span>
          <span class="px-3.5 py-1 rounded-full bg-black/40 border border-pink-300/30 text-pink-200 font-bold text-xs">BONUS CHEST: ${bonus}</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-lg w-full my-2">
          ${p.words.map(w => {
            const isFound = found.includes(w);
            return `
              <div class="flex items-center justify-center gap-1 p-2 rounded-2xl bg-black/35 border border-white/15">
                ${w.split('').map(ch => `
                  <span class="w-7 h-8 rounded-lg flex items-center justify-center font-black text-sm ${isFound ? 'bg-amber-400 text-slate-950 shadow' : 'bg-white/10 text-transparent'}">
                    ${isFound ? ch : '?'}
                  </span>
                `).join('')}
              </div>
            `;
          }).join('')}
        </div>

        <div class="h-11 px-6 rounded-2xl bg-black/50 border border-amber-300/40 flex items-center justify-center font-black text-xl tracking-[0.25em] text-amber-300 min-w-[180px]">
          ${currentWord || 'TAP LETTERS'}
        </div>

        ${allSolved ? `
          <button id="ws-next" class="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black text-base shadow-xl my-auto">
            Next Mountain Stage →
          </button>
        ` : `
          <div class="flex flex-col items-center gap-3 pb-2">
            <div class="flex items-center justify-center gap-2.5 flex-wrap">
              ${letters.map((l, idx) => `
                <button data-l="${l}" class="ws-let w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/95 hover:bg-amber-300 text-slate-900 font-black text-2xl shadow-xl active:scale-90 transition">
                  ${l}
                </button>
              `).join('')}
            </div>
            <div class="flex items-center gap-2.5">
              <button id="ws-shuf" class="px-4 py-2.5 rounded-xl bg-white/15 text-white font-bold text-xs">🔀 Shuffle</button>
              <button id="ws-clr" class="px-4 py-2.5 rounded-xl bg-white/15 text-white font-bold text-xs">⌫ Clear</button>
              <button id="ws-sub" class="px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg">✓ Submit</button>
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

  render();
}

function initFruitMaster(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span id="fm-score" class="px-4 py-1.5 rounded-full bg-black/50 border border-emerald-400/40 text-emerald-300 font-black text-sm">🍉 SLICED: 0</span>
        <span id="fm-lives" class="px-4 py-1.5 rounded-full bg-black/50 border border-rose-400/40 text-rose-300 font-black text-sm">❤️❤️❤️</span>
      </div>
      <canvas id="fm-canvas" class="w-full h-full block touch-none"></canvas>
    </div>
  `;

  const canvas = document.getElementById('fm-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  const FRUITS = ['🍉','🍍','🍊','🍎','🥝','🍓','💣'];
  let items = [], slashes = [], splashes = [], score = 0, lives = 3, running = true, pointerDown = false;

  const onResize = () => { w = canvas.width = stage.clientWidth; h = canvas.height = stage.clientHeight; };
  window.addEventListener('resize', onResize);

  function spawnWave() {
    if (!running) return;
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const icon = FRUITS[Math.floor(Math.random() * FRUITS.length)];
      items.push({
        x: w * (0.2 + Math.random() * 0.6),
        y: h + 30,
        vx: (Math.random() - 0.5) * 5,
        vy: -(11 + Math.random() * 4.5),
        r: 30,
        icon,
        isBomb: icon === '💣',
        sliced: false
      });
    }
  }
  const spawner = setInterval(spawnWave, 1150);

  function handleSlice(x, y) {
    slashes.push({ x, y, life: 1 });
    items.forEach(it => {
      if (!it.sliced && Math.hypot(it.x - x, it.y - y) < it.r + 16) {
        it.sliced = true;
        if (it.isBomb) {
          lives--;
          AudioFX.hit();
          document.getElementById('fm-lives').textContent = '❤️'.repeat(Math.max(0, lives)) || '💀';
          if (lives <= 0) running = false;
        } else {
          score += 10;
          AudioFX.slice();
          document.getElementById('fm-score').textContent = `🍉 SLICED: ${score}`;
          if (score % 50 === 0) addXP(20, x, y, '+20 XP!');
          for (let k = 0; k < 10; k++) {
            splashes.push({
              x: it.x, y: it.y,
              vx: (Math.random() - 0.5) * 9,
              vy: (Math.random() - 0.5) * 9,
              life: 1,
              color: ['#f43f5e','#facc15','#4ade80','#fb923c'][k % 4]
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
    ctx.clearRect(0, 0, w, h);

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 32px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Dojo Session Over!', w / 2, h / 2 - 20);
      ctx.font = '700 18px Inter';
      ctx.fillStyle = '#fde047';
      ctx.fillText(`Final Score: ${score} — Tap Anywhere to Restart`, w / 2, h / 2 + 20);
      canvas.onclick = () => {
        score = 0; lives = 3; items = []; running = true;
        document.getElementById('fm-score').textContent = '🍉 SLICED: 0';
        document.getElementById('fm-lives').textContent = '❤️❤️❤️';
        canvas.onclick = null;
      };
      raf = requestAnimationFrame(loop);
      return;
    }

    ctx.font = '46px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    items.forEach(it => {
      it.x += it.vx;
      it.y += it.vy;
      it.vy += 0.24;
      if (!it.sliced) ctx.fillText(it.icon, it.x, it.y);
    });
    items = items.filter(it => it.y < h + 80 && !it.sliced);

    splashes.forEach(s => {
      s.x += s.vx; s.y += s.vy; s.life -= 0.035;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    splashes = splashes.filter(s => s.life > 0);

    if (slashes.length > 1) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
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

    raf = requestAnimationFrame(loop);
  }
  loop();

  return () => {
    clearInterval(spawner);
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}

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

function initCyberSnakePreserved(stage, meta) {
  stage.innerHTML = `
    <div class="relative w-full h-full flex flex-col items-center justify-center p-4">
      <div class="mb-3 px-4 py-1.5 rounded-full bg-black/40 border border-white/10 text-white font-mono text-xs">
        🐍 Cyber Snake (Original) | Score: <span id="snake-score" class="text-emerald-400 font-bold">0</span>
      </div>

      <div class="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-950/90 p-2">
        <canvas id="snake-canvas" width="400" height="400" class="block w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] rounded-xl"></canvas>
      </div>
      <p class="text-xs text-slate-400 mt-3 font-semibold">Use Arrow Keys or Swipe to Control Snake</p>
    </div>
  `;

  const canvas = document.getElementById('snake-canvas');
  const ctx = canvas.getContext('2d');
  const grid = 20;
  let count = 0;
  let score = 0;

  let snake = {
    x: 160,
    y: 160,
    dx: grid,
    dy: 0,
    cells: [],
    maxLen: 4
  };

  let apple = {
    x: 320,
    y: 320
  };

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function loop() {
    requestAnimationFrame(loop);
    if (++count < 6) return;
    count = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    snake.x += snake.dx;
    snake.y += snake.dy;

    if (snake.x < 0) snake.x = canvas.width - grid;
    else if (snake.x >= canvas.width) snake.x = 0;
    if (snake.y < 0) snake.y = canvas.height - grid;
    else if (snake.y >= canvas.height) snake.y = 0;

    snake.cells.unshift({ x: snake.x, y: snake.y });
    if (snake.cells.length > snake.maxLen) snake.cells.pop();

    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(apple.x, apple.y, grid - 2, grid - 2);

    ctx.fillStyle = '#10b981';
    snake.cells.forEach((cell, index) => {
      ctx.fillRect(cell.x, cell.y, grid - 2, grid - 2);

      if (cell.x === apple.x && cell.y === apple.y) {
        snake.maxLen++;
        score += 10;
        document.getElementById('snake-score').textContent = score;
        addXP(15, cell.x, cell.y, '+15 XP');
        AudioFX.coin();

        apple.x = getRandomInt(0, canvas.width / grid) * grid;
        apple.y = getRandomInt(0, canvas.height / grid) * grid;
      }

      for (let i = index + 1; i < snake.cells.length; i++) {
        if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
          AudioFX.lose();
          score = 0;
          document.getElementById('snake-score').textContent = score;
          snake.x = 160;
          snake.y = 160;
          snake.cells = [];
          snake.maxLen = 4;
          snake.dx = grid;
          snake.dy = 0;
        }
      }
    });
  }

  const handleKey = (e) => {
    if (e.key === 'ArrowLeft' && snake.dx === 0) { snake.dx = -grid; snake.dy = 0; }
    else if (e.key === 'ArrowUp' && snake.dy === 0) { snake.dy = -grid; snake.dx = 0; }
    else if (e.key === 'ArrowRight' && snake.dx === 0) { snake.dx = grid; snake.dy = 0; }
    else if (e.key === 'ArrowDown' && snake.dy === 0) { snake.dy = grid; snake.dx = 0; }
  };

  window.addEventListener('keydown', handleKey);
  const animId = requestAnimationFrame(loop);

  return () => {
    window.removeEventListener('keydown', handleKey);
  };
}

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
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  };
}

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
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  };
}

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
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}

function initStickRun(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div class="flex items-center gap-2">
          <span id="sr-dist" class="px-4 py-1.5 rounded-full bg-slate-900/75 border border-sky-300/40 text-white font-black text-sm">🏃 0m</span>
          <span id="sr-coins" class="px-3.5 py-1.5 rounded-full bg-slate-900/75 border border-amber-300/40 text-amber-300 font-bold text-xs">🪙 0</span>
        </div>
        <span class="px-3 py-1 rounded-full bg-slate-900/75 text-sky-200 text-xs font-bold">TAP / SPACE TO JUMP (DOUBLE JUMP!)</span>
      </div>
      <canvas id="sr-canvas" class="w-full h-full block touch-none cursor-pointer"></canvas>
    </div>
  `;

  const canvas = document.getElementById('sr-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let player = { x: 90, y: 0, vy: 0, jumps: 0, runCycle: 0 };
  let obstacles = [], coins = [], dist = 0, coinCount = 0, scroll = 0, alive = true, raf;

  function groundY() { return h * 0.75; }

  function reset() {
    player = { x: Math.min(110, w * 0.18), y: groundY(), vy: 0, jumps: 0, runCycle: 0 };
    obstacles = []; coins = []; dist = 0; coinCount = 0; alive = true;
  }

  function jump() {
    if (!alive) { reset(); return; }
    if (player.jumps < 2) {
      player.vy = -13.5;
      player.jumps++;
      AudioFX.jump();
    }
  }

  canvas.onpointerdown = jump;
  const onKey = (e) => { if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } };
  window.addEventListener('keydown', onKey);
  const onResize = () => { w = canvas.width = stage.clientWidth; h = canvas.height = stage.clientHeight; };
  window.addEventListener('resize', onResize);

  function drawStickman(x, y, phase, inAir) {
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

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
      player.y += player.vy;
      if (player.y < gy) {
        player.vy += 0.68;
      } else {
        player.y = gy;
        player.vy = 0;
        player.jumps = 0;
      }

      if (dist % 8 === 0) document.getElementById('sr-dist').textContent = `🏃 ${Math.floor(dist / 4)}m`;

      if (Math.random() < 0.022 && !obstacles.some(o => o.x > w - 240)) {
        const tall = Math.random() < 0.35;
        obstacles.push({ x: w + 40, w: tall ? 26 : 34, h: tall ? 54 : 34 });
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
      ctx.font = '24px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('🪙', c.x, c.y);
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
      if (alive) o.x -= speed;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(o.x, gy - o.h, o.w, o.h, 6);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(o.x + 4, gy - o.h + 6, o.w - 8, 6);

      if (alive && player.x + 10 > o.x && player.x - 10 < o.x + o.w && player.y > gy - o.h + 6) {
        alive = false;
        AudioFX.lose();
      }
    });
    obstacles = obstacles.filter(o => o.x > -60);

    drawStickman(player.x, player.y, player.runCycle, player.y < gy - 2);

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
