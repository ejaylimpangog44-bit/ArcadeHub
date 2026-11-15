function initPianoTiles(stage) {
  const MELODY = [60, 62, 64, 67, 69, 67, 64, 60, 62, 64, 62, 60, 57, 60];
  let rows = [], score = 0, noteIdx = 0, alive = true;

  function reset() {
    rows = Array.from({ length: 5 }, (_, i) => ({ id: i, blackCol: Math.floor(Math.random() * 4), hit: false }));
    score = 0;
    noteIdx = 0;
    alive = true;
    render();
  }

  function tapCell(rowIdx, col) {
    if (!alive) return;
    const targetRowIdx = rows.length - 1;
    if (rowIdx !== targetRowIdx) return;
    const row = rows[targetRowIdx];
    if (col === row.blackCol) {
      AudioFX.note(MELODY[noteIdx % MELODY.length]);
      noteIdx++;
      score++;
      if (score % 10 === 0) addXP(15, window.innerWidth / 2, window.innerHeight * 0.3, `${score} STREAK!`);
      rows.pop();
      rows.unshift({ id: Date.now() + Math.random(), blackCol: Math.floor(Math.random() * 4), hit: false });
      render();
    } else {
      alive = false;
      AudioFX.lose();
      render();
    }
  }

  function onKey(e) {
    const map = { d: 0, f: 1, j: 2, k: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
    if (e.key.toLowerCase() in map) tapCell(rows.length - 1, map[e.key.toLowerCase()]);
  }
  window.addEventListener('keydown', onKey);

  function render() {
    const fever = score >= 20;
    stage.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-between px-4 py-3">
        <div class="flex items-center gap-3">
          <span class="px-4 py-1 rounded-full bg-indigo-950/90 border border-indigo-400/40 text-indigo-200 font-black text-sm">NOTES: ${score}</span>
          ${fever ? '<span class="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 font-black text-xs animate-pulse">🔥 FEVER MODE</span>' : ''}
        </div>

        ${!alive ? `
          <div class="my-auto text-center">
            <div class="text-5xl mb-2">🎹</div>
            <h2 class="text-3xl font-black text-white">Wrong Key!</h2>
            <p class="text-indigo-200 text-sm mb-4">Concert Score: ${score} Notes</p>
            <button id="pt-retry" class="px-8 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black">Encore (Play Again)</button>
          </div>
        ` : `
          <div class="w-[min(92vw,400px)] flex-1 my-2 rounded-3xl overflow-hidden border-2 ${fever ? 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.35)]' : 'border-indigo-400/30'} grid grid-rows-5 bg-white/95">
            ${rows.map((r, rIdx) => `
              <div class="grid grid-cols-4 border-b border-slate-300">
                ${[0,1,2,3].map(c => {
                  const isBlack = c === r.blackCol;
                  const isBottom = rIdx === rows.length - 1;
                  return `
                    <button data-r="${rIdx}" data-c="${c}" class="pt-cell border-r border-slate-200 flex items-end justify-center pb-2 transition-colors ${isBlack ? (fever ? 'bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-700' : 'bg-slate-950 hover:bg-slate-800') : 'bg-white active:bg-rose-200'}">
                      ${isBlack && isBottom ? '<span class="text-[10px] font-black text-amber-300 tracking-widest animate-bounce">TAP</span>' : ''}
                    </button>
                  `;
                }).join('')}
              </div>
            `).join('')}
          </div>
          <div class="text-[11px] text-indigo-200/70">Tap the bottom black tile or press keys D • F • J • K</div>
        `}
      </div>
    `;

    document.getElementById('pt-retry')?.addEventListener('click', reset);
    document.querySelectorAll('.pt-cell').forEach(btn => {
      btn.onpointerdown = () => tapCell(Number(btn.dataset.r), Number(btn.dataset.c));
    });
  }

  reset();
  return () => window.removeEventListener('keydown', onKey);
}
