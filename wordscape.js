window.initWordscape = function initWordscape(stage) {
  let active = true;
  const PUZZLES = [
    { letters: ['S', 'T', 'A', 'R', 'E'], words: ['STAR', 'RATE', 'TEAR', 'SEAT', 'ARTS', 'STARE'] },
    { letters: ['P', 'L', 'A', 'N', 'E'], words: ['PLAN', 'LANE', 'PALE', 'LEAP', 'PANEL', 'PLANE'] },
    { letters: ['S', 'H', 'I', 'N', 'E'], words: ['SHINE', 'NINE', 'SHIN', 'HENS', 'SINE'] }
  ];
  let pIdx = 0, found = [], currentWord = '', letters = [...PUZZLES[0].letters], bonus = 0;

  function loadPuzzle(idx) {
    if (!active) return;
    pIdx = idx % PUZZLES.length;
    found = [];
    currentWord = '';
    letters = [...PUZZLES[pIdx].letters];
    render();
  }

  function addLetter(l) {
    if (!active) return;
    currentWord += l;
    AudioFX.click();
    render();
  }

  function submitWord() {
    if (!active) return;
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
    if (!active) return;
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
              ${letters.map(l => `
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
    document.getElementById('ws-clr')?.addEventListener('click', () => { if (!active) return; currentWord = ''; render(); });
    document.getElementById('ws-shuf')?.addEventListener('click', () => {
      if (!active) return;
      letters.sort(() => Math.random() - 0.5);
      AudioFX.card();
      render();
    });
    document.getElementById('ws-sub')?.addEventListener('click', submitWord);
    document.getElementById('ws-next')?.addEventListener('click', () => loadPuzzle(pIdx + 1));
  }

  loadPuzzle(0);

  return () => {
    active = false;
  };
};