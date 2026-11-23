window.initWhackAMole = function initWhackAMole(stage) {
  let active = true;
  let score = 0, timeLeft = 30, activeHole = -1, isGolden = false, playing = true;

  const popTimer = setInterval(() => {
    if (!active || !playing) return;
    activeHole = Math.floor(Math.random() * 9);
    isGolden = Math.random() < 0.22;
    render();
  }, 750);

  const secTimer = setInterval(() => {
    if (!active || !playing) return;
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
    if (!active || !playing || idx !== activeHole) return;
    const pts = isGolden ? 30 : 10;
    score += pts;
    AudioFX.hit();
    spawnPopup(`+${pts}!`, e.clientX, e.clientY, isGolden ? '#fde047' : '#ffffff');
    activeHole = -1;
    render();
  }

  function render() {
    if (!active) return;
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
      if (!active) return;
      score = 0; timeLeft = 30; playing = true; render();
    });
    document.querySelectorAll('.wam-hole').forEach(b => {
      b.onpointerdown = (e) => whack(Number(b.dataset.h), e);
    });
  }

  render();

  return () => {
    active = false;
    playing = false;
    clearInterval(popTimer);
    clearInterval(secTimer);
  };
};