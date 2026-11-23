window.initHighLow = function initHighLow(stage) {
  let active = true;
  let deck = window.createShuffledDeck();
  let current = deck.pop();
  let streak = 0, pot = 100, banked = 500, msg = 'Will the next card be Higher or Lower?';

  function guess(dir) {
    if (!active) return;
    if (deck.length < 5) deck = window.createShuffledDeck();
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
      msg = 'Missed! Streak reset.';
      AudioFX.lose();
    }
    renderCard();
  }

  function cashOut() {
    if (!active || streak === 0) return;
    banked += pot;
    AudioFX.win();
    addXP(30, window.innerWidth / 2, window.innerHeight * 0.4, `BANKED +${pot}!`);
    msg = `Cashed out +${pot} coins!`;
    streak = 0;
    pot = 100;
    renderCard();
  }

  function renderCard() {
    if (!active) return;
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
          <button id="hl-cash" ${streak === 0 ? 'disabled' : ''} class="px-5 sm:px-8 py-3.5 rounded-2xl bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm shadow-lg">💰 CASH OUT</button>
          <button id="hl-hi" class="px-6 sm:px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base shadow-lg">🔼 HIGHER</button>
        </div>
      </div>
    `;
    document.getElementById('hl-hi').onclick = () => guess('hi');
    document.getElementById('hl-lo').onclick = () => guess('lo');
    document.getElementById('hl-cash').onclick = cashOut;
  }

  renderCard();

  return () => {
    active = false;
  };
};