window.initNumberGuess = function initNumberGuess(stage) {
  let active = true;
  let focusTimeout = null;
  let maxRange = 100, target = 1 + Math.floor(Math.random() * 100), history = [], solved = false;

  function setTier(max) {
    if (!active) return;
    maxRange = max;
    target = 1 + Math.floor(Math.random() * maxRange);
    history = [];
    solved = false;
    render();
  }

  function submitGuess(val) {
    if (!active || solved || isNaN(val) || val < 1 || val > maxRange) return;
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
    if (!active) return;
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
    if (focusTimeout) clearTimeout(focusTimeout);
    focusTimeout = setTimeout(() => {
      focusTimeout = null;
      if (active) document.getElementById('ng-input')?.focus();
    }, 0);
  }

  render();

  return () => {
    active = false;
    if (focusTimeout) clearTimeout(focusTimeout);
  };
};