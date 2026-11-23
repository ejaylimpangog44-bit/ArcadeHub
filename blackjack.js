window.initBlackjack = function initBlackjack(stage) {
  let active = true;
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
    if (!active) return;
    if (bank < bet) bank = 1000;
    bank -= bet;
    deck = window.createShuffledDeck();
    player = [deck.pop(), deck.pop()];
    dealer = [deck.pop(), deck.pop()];
    phase = 'play';
    status = 'Hit, Stand, or Double Down';
    AudioFX.card();
    if (handValue(player) === 21) stand();
    else render();
  }

  function hit() {
    if (!active || phase !== 'play') return;
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
    if (!active || phase !== 'play' || player.length !== 2 || bank < bet) return;
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
    if (!active) return;
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
    if (!active) return;
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
      b.onclick = () => { if (!active) return; bet = Number(b.dataset.chip); AudioFX.click(); render(); };
    });
  }

  render();

  return () => {
    active = false;
  };
};