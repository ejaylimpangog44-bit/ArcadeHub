window.initTinyCafe = function initTinyCafe(stage) {
  let active = true;
  let coins = 120, tray = [], customers = [];
  const ITEMS = [
    { id: 'coffee', icon: '☕', name: 'Espresso' },
    { id: 'croissant', icon: '🥐', name: 'Croissant' },
    { id: 'cake', icon: '🍰', name: 'Berry Cake' }
  ];

  function spawnCustomer() {
    if (!active) return;
    const want = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    customers.push({
      id: Date.now() + Math.random(),
      avatar: ['🧑‍🎨', '👩‍💻', '🧔', '👵', '🧑‍🚀'][Math.floor(Math.random() * 5)],
      want,
      patience: 100
    });
    if (customers.length > 4) customers.shift();
  }

  spawnCustomer();
  spawnCustomer();
  const cSpawner = setInterval(() => {
    if (!active) return;
    if (customers.length < 4) spawnCustomer();
    render();
  }, 4200);

  const pTicker = setInterval(() => {
    if (!active) return;
    customers.forEach(c => c.patience -= 3.5);
    customers = customers.filter(c => c.patience > 0);
    render();
  }, 1000);

  function serve(cIdx, e) {
    if (!active) return;
    const cust = customers[cIdx];
    if (!cust) return;
    const matchIdx = tray.findIndex(t => t.id === cust.want.id);
    if (matchIdx === -1) {
      AudioFX.lose();
      spawnPopup(`Need ${cust.want.icon}`, e.clientX, e.clientY, '#fb7185');
      return;
    }
    tray.splice(matchIdx, 1);
    customers.splice(cIdx, 1);
    const tip = cust.patience > 50 ? 35 : 20;
    coins += tip;
    AudioFX.coin();
    spawnPopup(`+$${tip}!`, e.clientX, e.clientY, '#fde047');
    addXP(20, e.clientX, e.clientY - 24, '+20 XP');
    window.ArcadeHero?.awardGameScore('tiny-cafe', coins);
    if (customers.length < 2) spawnCustomer();
    render();
  }

  function render() {
    if (!active) return;
    stage.innerHTML = `
      <div class="w-full h-full flex flex-col justify-between px-4 py-4 pb-16 sm:pb-6 overflow-y-auto">
        <div class="flex items-center justify-between max-w-4xl w-full mx-auto">
          <span class="px-4 py-1.5 rounded-full bg-amber-950/90 border border-amber-400/40 text-amber-300 font-black text-sm">💰 CAFE COINS: $${coins}</span>
          <span class="px-3.5 py-1 rounded-full bg-black/40 border border-white/15 text-xs text-amber-100 font-bold">1. Prep Item → 2. Tap Matching Guest</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl w-full mx-auto my-auto py-2">
          ${customers.map((c, idx) => `
            <button data-c="${idx}" class="tc-cust flex flex-col items-center gap-2 p-4 rounded-3xl bg-amber-950/75 hover:bg-amber-900/80 border-2 border-amber-400/35 shadow-xl transition cursor-pointer">
              <div class="text-4xl sm:text-5xl">${c.avatar}</div>
              <div class="px-3 py-1 rounded-full bg-black/50 text-xs font-extrabold text-amber-200 flex items-center gap-1">
                <span>Wants:</span> <span class="text-lg">${c.want.icon}</span>
              </div>
              <div class="w-full h-2 rounded-full bg-black/50 overflow-hidden">
                <div class="h-full ${c.patience > 45 ? 'bg-emerald-400' : 'bg-rose-500'}" style="width:${Math.max(0, c.patience)}%"></div>
              </div>
            </button>
          `).join('')}
        </div>

        <div class="max-w-4xl w-full mx-auto flex flex-col gap-3 bg-black/45 backdrop-blur-md border border-amber-300/25 rounded-3xl p-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-amber-200">Serving Tray (${tray.length}/4):</span>
              <div class="flex items-center gap-1.5 min-h-[34px]">
                ${tray.map((t, i) => `<span data-tr="${i}" class="tc-drop px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-base cursor-pointer" title="Tap to discard">${t.icon}</span>`).join('')}
              </div>
            </div>
            <div class="flex items-center gap-2">
              ${ITEMS.map(it => `
                <button data-id="${it.id}" class="tc-prep px-4 py-2 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg active:scale-95 transition">
                  ${it.icon} ${it.name}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.tc-prep').forEach(b => {
      b.onclick = () => {
        if (!active) return;
        if (tray.length >= 4) return;
        const found = ITEMS.find(x => x.id === b.dataset.id);
        tray.push(found);
        AudioFX.click();
        render();
      };
    });

    document.querySelectorAll('.tc-drop').forEach(el => {
      el.onclick = () => {
        if (!active) return;
        tray.splice(Number(el.dataset.tr), 1);
        render();
      };
    });

    document.querySelectorAll('.tc-cust').forEach(b => {
      b.onclick = (e) => serve(Number(b.dataset.c), e);
    });
  }

  render();

  return () => {
    active = false;
    clearInterval(cSpawner);
    clearInterval(pTicker);
  };
};