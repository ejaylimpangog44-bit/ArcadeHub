window.initChess = function initChess(stage) {
  let active = true;
  let aiTimeout = null;

  const GLYPHS = {
    wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
    bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
  };
  const VALS = { P: 10, N: 32, B: 33, R: 50, Q: 90, K: 900 };

  let board = [], turn = 'w', sel = null, legal = [], capturedW = [], capturedB = [], status = 'Your Move (White)';
  let gameMode = 'pve';
  let aiDifficulty = 'normal';
  let drawerOpen = false;
  let configModalOpen = true;

  function reset() {
    if (!active) return;
    if (aiTimeout) {
      clearTimeout(aiTimeout);
      aiTimeout = null;
    }
    const back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    board = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => {
      if (r === 0) return 'b' + back[c];
      if (r === 1) return 'bP';
      if (r === 6) return 'wP';
      if (r === 7) return 'w' + back[c];
      return null;
    }));
    turn = 'w'; sel = null; legal = []; capturedW = []; capturedB = [];
    status = 'Your Move (White)';
    configModalOpen = false;
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
      [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => add(r + dr, c + dc));
    } else if (type === 'K') {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) add(r + dr, c + dc);
    } else {
      const dirs = [];
      if (type === 'R' || type === 'Q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      if (type === 'B' || type === 'Q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
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
    if (!active) return;
    const all = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]?.[0] === 'b') {
          getLegalMoves(r, c).forEach(([dr, dc]) => {
            const cap = board[dr][dc];
            const score = (cap ? VALS[cap[1]] * 10 : 0) + (dr * 0.5) + (aiDifficulty === 'hard' ? Math.random() : Math.random() * 4);
            all.push({ sr: r, sc: c, dr, dc, score });
          });
        }
      }
    }
    if (!all.length) {
      status = isKingInCheck(board, 'b') ? '🎉 You Win!' : 'Stalemate!';
      AudioFX.win();
      addXP(60, window.innerWidth / 2, window.innerHeight / 2, 'CHECKMATE +60 XP!');
      window.ArcadeHero?.awardGameScore('chess', 150);
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
    if (!active) return;
    stage.innerHTML = `
      <div class="relative w-full h-full flex flex-col items-center justify-between px-3 py-3 pb-16 sm:pb-6 select-none overflow-y-auto">
        <div class="flex items-center justify-between w-full max-w-[min(90vw,440px)] z-10">
          <button id="chess-menu" class="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg font-black shadow hover:bg-amber-900 transition cursor-pointer">
            ☰
          </button>
          <div class="px-4 py-1.5 rounded-xl bg-black/60 border border-amber-400/30 text-amber-200 font-bold text-xs shadow text-center truncate max-w-[220px]">
            ${status}
          </div>
          <button id="chess-reset-btn" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow cursor-pointer">
            Reset
          </button>
        </div>

        <div class="text-[11px] text-amber-200/80 font-bold z-10">
          Captured: ${capturedB.map(p => GLYPHS[p]).join(' ')}
        </div>

        <div class="grid grid-cols-8 aspect-square w-[min(86vw,420px)] rounded-3xl overflow-hidden border-4 border-amber-900 shadow-[0_20px_60px_rgba(0,0,0,0.8)] my-auto z-10">
          ${board.map((row, r) => row.map((cell, c) => {
            const dark = (r + c) % 2 === 1;
            const isSel = sel && sel[0] === r && sel[1] === c;
            const isLeg = legal.some(([lr, lc]) => lr === r && lc === c);
            return `
              <button data-r="${r}" data-c="${c}" class="ch-sq relative flex items-center justify-center text-3xl sm:text-4xl touch-none ${dark ? 'bg-[#7c4a2d]' : 'bg-[#e7d3b5]'} ${isSel ? 'ring-inset ring-4 ring-amber-400 bg-amber-500/25' : ''}">
                ${cell ? `<span class="${cell[0] === 'w' ? 'text-white drop-shadow-[0_3px_3px_rgba(0,0,0,0.9)] font-bold' : 'text-slate-950 drop-shadow-[0_2px_2px_rgba(255,255,255,0.5)] font-bold'}">${GLYPHS[cell]}</span>` : ''}
                ${isLeg ? `<span class="absolute ${cell ? 'ring-4 ring-emerald-400 bg-transparent w-9 h-9 rounded-xl' : 'bg-emerald-500/80 shadow-md w-4 h-4 rounded-full'}"></span>` : ''}
              </button>
            `;
          }).join('')).join('')}
        </div>

        <div class="text-[11px] text-amber-200/80 font-bold z-10">
          Lost: ${capturedW.map(p => GLYPHS[p]).join(' ')}
        </div>

        <div id="chess-drawer-bg" class="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}"></div>

        <div class="fixed top-16 bottom-0 left-0 z-40 w-[82%] max-w-xs bg-slate-900 border-r-4 border-t-2 border-amber-600/50 p-6 shadow-2xl flex flex-col gap-5 transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto rounded-tr-3xl">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 class="text-lg font-black text-amber-400">⚙️ Chess Settings</h2>
            <button id="chess-close-drawer" class="w-8 h-8 rounded-full bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer">✕</button>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">Game Mode</label>
            <div class="grid grid-cols-2 gap-2">
              <button id="chess-mode-pve" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pve' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10'}">🤖 vs AI</button>
              <button id="chess-mode-pvp" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pvp' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10'}">👥 2P PvP</button>
            </div>
          </div>

          <div id="chess-ai-diff" class="flex flex-col gap-1.5 ${gameMode === 'pvp' ? 'hidden' : ''}">
            <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Difficulty</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button id="chess-diff-easy" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'easy' ? 'bg-amber-600 text-white border-amber-400' : 'bg-black/40 text-slate-300 border-white/10'}">Easy</button>
              <button id="chess-diff-normal" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'normal' ? 'bg-amber-600 text-white border-amber-400' : 'bg-black/40 text-slate-300 border-white/10'}">Normal</button>
              <button id="chess-diff-hard" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'hard' ? 'bg-amber-600 text-white border-amber-400' : 'bg-black/40 text-slate-300 border-white/10'}">Hard</button>
            </div>
          </div>

          <button id="chess-apply-drawer" type="button" class="w-full py-3.5 mt-auto rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer">
            Apply &amp; Restart Match ⚔️
          </button>
        </div>

        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md ${configModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div class="max-w-sm w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-5">
            <div class="text-4xl">♟️</div>
            <h2 class="text-xl font-black text-amber-400">GRANDMASTER CHESS</h2>
            <p class="text-xs text-slate-300">Configure your match before starting:</p>

            <div class="flex flex-col gap-2 text-left">
              <label class="text-xs font-bold text-slate-400">Mode:</label>
              <div class="grid grid-cols-2 gap-2">
                <button id="chess-cfg-pve" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pve' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">vs AI</button>
                <button id="chess-cfg-pvp" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pvp' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">2P PvP</button>
              </div>
            </div>

            <button id="chess-start-btn" type="button" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer">
              START MATCH 🚀
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('chess-menu').onclick = () => { if (!active) return; drawerOpen = true; render(); };
    document.getElementById('chess-reset-btn').onclick = () => { if (!active) return; configModalOpen = true; render(); };
    document.getElementById('chess-close-drawer').onclick = () => { if (!active) return; drawerOpen = false; render(); };
    document.getElementById('chess-drawer-bg').onclick = () => { if (!active) return; drawerOpen = false; render(); };

    document.getElementById('chess-mode-pve').onclick = () => { if (!active) return; gameMode = 'pve'; render(); };
    document.getElementById('chess-mode-pvp').onclick = () => { if (!active) return; gameMode = 'pvp'; render(); };
    document.getElementById('chess-cfg-pve').onclick = () => { if (!active) return; gameMode = 'pve'; render(); };
    document.getElementById('chess-cfg-pvp').onclick = () => { if (!active) return; gameMode = 'pvp'; render(); };

    document.getElementById('chess-diff-easy').onclick = () => { if (!active) return; aiDifficulty = 'easy'; render(); };
    document.getElementById('chess-diff-normal').onclick = () => { if (!active) return; aiDifficulty = 'normal'; render(); };
    document.getElementById('chess-diff-hard').onclick = () => { if (!active) return; aiDifficulty = 'hard'; render(); };

    document.getElementById('chess-apply-drawer').onclick = () => { if (!active) return; drawerOpen = false; reset(); };
    document.getElementById('chess-start-btn').onclick = () => { if (!active) return; reset(); };

    document.querySelectorAll('.ch-sq').forEach(btn => {
      btn.onpointerup = (e) => {
        if (!active) return;
        e.preventDefault();
        e.stopPropagation();
        if (turn !== 'w' && gameMode === 'pve') return;
        const r = Number(btn.dataset.r), c = Number(btn.dataset.c);

        if (sel && legal.some(([lr, lc]) => lr === r && lc === c)) {
          applyMove(sel[0], sel[1], r, c);
          sel = null; legal = []; turn = gameMode === 'pve' ? 'b' : (turn === 'w' ? 'b' : 'w');
          status = gameMode === 'pve' ? 'Grandmaster AI thinking...' : `Player ${turn === 'w' ? 'White' : 'Black'}'s Turn`;
          render();
          if (gameMode === 'pve' && turn === 'b') {
            if (aiTimeout) clearTimeout(aiTimeout);
            aiTimeout = setTimeout(() => {
              aiTimeout = null;
              aiMove();
            }, 280);
          }
          return;
        }

        const currentSide = gameMode === 'pvp' ? turn : 'w';
        if (board[r][c]?.[0] === currentSide) {
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

  render();

  return () => {
    active = false;
    if (aiTimeout) clearTimeout(aiTimeout);
  };
};