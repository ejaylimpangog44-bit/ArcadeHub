function initBlockPuzzle(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full flex flex-col items-center justify-between p-4 bg-slate-950 select-none">
      <div class="flex items-center gap-3">
        <span id="bp-score" class="px-4 py-1.5 rounded-full bg-slate-900 border border-emerald-500/40 text-emerald-300 font-black text-sm">SCORE: 0</span>
      </div>
      <div id="bp-grid" class="grid grid-cols-10 gap-1 bg-black/60 p-3 rounded-2xl border border-white/10 my-auto"></div>
      <div id="bp-tray" class="flex items-center justify-center gap-4 pb-4">
        <button onclick="if(typeof AudioFX!=='undefined')AudioFX.click();" class="px-6 py-3 bg-emerald-500 text-slate-950 font-black rounded-xl text-sm">Start Puzzle Match 🧩</button>
      </div>
    </div>
  `;
  const gridEl = document.getElementById('bp-grid');
  let grid = Array(10).fill(0).map(() => Array(10).fill(0));

  function renderGrid() {
    gridEl.innerHTML = '';
    grid.forEach((row) => {
      row.forEach((cell) => {
        const div = document.createElement('div');
        div.className = `w-7 h-7 sm:w-9 sm:h-9 rounded-lg ${cell ? 'bg-indigo-500 border border-indigo-300' : 'bg-white/5 border border-white/5'}`;
        gridEl.appendChild(div);
      });
    });
  }
  renderGrid();
}
