window.initSpeedSolitaire = function initSpeedSolitaire(stage) {
  let stock = [], waste = [], foundations = [[], [], [], []], tableau = [[], [], [], [], [], [], []];
  let score = 0, combo = 1, moves = 0, selected = null, seconds = 0, active = true;

  function deal() {
    if (!active) return;
    const deck = window.createShuffledDeck();
    foundations = [[], [], [], []];
    tableau = [[], [], [], [], [], [], []];
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
    if (!active) return;
    seconds++;
    const el = document.getElementById('sol-time');
    if (el) el.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
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
    if (!active) return;
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
    if (!active) return;
    const totalFound = foundations.reduce((a, b) => a + b.length, 0);
    stage.innerHTML = `
      <div class="w-full h-full flex flex-col justify-between px-3 sm:px-8 py-3 pb-12 sm:pb-6 overflow-y-auto">
        <div class="flex flex-wrap items-center justify-between gap-2 max-w-5xl w-full mx-auto">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full bg-emerald-950/80 border border-amber-400/30 text-amber-300 font-bold text-xs">SCORE: ${score}</span>
            <span class="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-emerald-200 font-mono text-xs">COMBO ${combo}x</span>
            <span id="sol-time" class="font-mono text-xs text-emerald-200/80">${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}</span>
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
              ${pile.length ? renderCardHTML(pile[pile.length - 1], false) : `<span class="text-amber-300/40 text-xl font-bold">${window.CARD_SUITS[i].sym}</span>`}
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
      if (!active || !waste.length) return;
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
        if (!active) return;
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
        if (!active) return;
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
  return () => {
    active = false;
    clearInterval(timer);
  };
};