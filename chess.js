window.initChess = function initChess(stage) {
  let active = true;
  let aiTimeout = null;

  const GLYPHS = {
    wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
    bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
  };
  const VALS = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };
  const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  let board = [];
  let turn = 'w';
  let sel = null;
  let legal = [];
  let capturedByW = [];
  let capturedByB = [];
  let lastMove = null;
  let enPassant = null;
  let castling = { wK: true, wQ: true, bK: true, bQ: true };
  let history = [];
  let pendingPromo = null;

  let status = 'Your Move (White)';
  let gameMode = 'pve';
  let aiDifficulty = 'normal';
  let settingsModalOpen = false;
  let configModalOpen = true;
  let gameOver = false;
  let winnerText = '';

  function vibrate(ms = 12) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (_) {}
    }
  }

  function cloneState() {
    return {
      board: board.map(r => [...r]),
      turn,
      capturedByW: [...capturedByW],
      capturedByB: [...capturedByB],
      lastMove: lastMove ? { ...lastMove } : null,
      enPassant: enPassant ? [...enPassant] : null,
      castling: { ...castling },
      status
    };
  }

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
    turn = 'w';
    sel = null;
    legal = [];
    capturedByW = [];
    capturedByB = [];
    lastMove = null;
    enPassant = null;
    castling = { wK: true, wQ: true, bK: true, bQ: true };
    history = [];
    pendingPromo = null;
    gameOver = false;
    winnerText = '';
    status = gameMode === 'pve' ? 'Your Move (White)' : 'White Player Turn';
    configModalOpen = false;
    settingsModalOpen = false;
    render();
  }

  function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function isSquareAttacked(b, tr, tc, bySide) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (!p || p[0] !== bySide) continue;
        const type = p[1];
        if (type === 'P') {
          const dir = bySide === 'w' ? -1 : 1;
          if (r + dir === tr && (c - 1 === tc || c + 1 === tc)) return true;
        } else if (type === 'N') {
          if (Math.abs(r - tr) * Math.abs(c - tc) === 2) return true;
        } else if (type === 'K') {
          if (Math.abs(r - tr) <= 1 && Math.abs(c - tc) <= 1 && (r !== tr || c !== tc)) return true;
        } else {
          const dirs = [];
          if (type === 'R' || type === 'Q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
          if (type === 'B' || type === 'Q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
          for (const [dr, dc] of dirs) {
            let nr = r + dr, nc = c + dc;
            while (inBounds(nr, nc)) {
              if (nr === tr && nc === tc) return true;
              if (b[nr][nc]) break;
              nr += dr;
              nc += dc;
            }
          }
        }
      }
    }
    return false;
  }

  function isKingInCheck(b, side) {
    const opp = side === 'w' ? 'b' : 'w';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c] === side + 'K') {
          return isSquareAttacked(b, r, c, opp);
        }
      }
    }
    return false;
  }

  function getPseudoMoves(b, r, c, ep, castleRights) {
    const p = b[r][c];
    if (!p) return [];
    const side = p[0];
    const opp = side === 'w' ? 'b' : 'w';
    const type = p[1];
    const moves = [];

    const add = (nr, nc, extra = {}) => {
      if (!inBounds(nr, nc)) return false;
      const t = b[nr][nc];
      if (!t) {
        moves.push({ r: nr, c: nc, ...extra });
        return true;
      }
      if (t[0] !== side) moves.push({ r: nr, c: nc, ...extra });
      return false;
    };

    if (type === 'P') {
      const dir = side === 'w' ? -1 : 1;
      const start = side === 'w' ? 6 : 1;
      if (inBounds(r + dir, c) && !b[r + dir][c]) {
        moves.push({ r: r + dir, c });
        if (r === start && !b[r + dir * 2][c]) {
          moves.push({ r: r + dir * 2, c, doubleStep: true });
        }
      }
      [-1, 1].forEach(dc => {
        const nr = r + dir, nc = c + dc;
        if (!inBounds(nr, nc)) return;
        if (b[nr][nc] && b[nr][nc][0] === opp) {
          moves.push({ r: nr, c: nc });
        } else if (ep && ep[0] === nr && ep[1] === nc) {
          moves.push({ r: nr, c: nc, enPassant: true });
        }
      });
    } else if (type === 'N') {
      [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => add(r + dr, c + dc));
    } else if (type === 'K') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr || dc) add(r + dr, c + dc);
        }
      }
      const homeRow = side === 'w' ? 7 : 0;
      if (r === homeRow && c === 4 && !isSquareAttacked(b, homeRow, 4, opp)) {
        if (castleRights[side + 'K'] && !b[homeRow][5] && !b[homeRow][6] && b[homeRow][7] === side + 'R') {
          if (!isSquareAttacked(b, homeRow, 5, opp) && !isSquareAttacked(b, homeRow, 6, opp)) {
            moves.push({ r: homeRow, c: 6, castle: 'K' });
          }
        }
        if (castleRights[side + 'Q'] && !b[homeRow][3] && !b[homeRow][2] && !b[homeRow][1] && b[homeRow][0] === side + 'R') {
          if (!isSquareAttacked(b, homeRow, 3, opp) && !isSquareAttacked(b, homeRow, 2, opp)) {
            moves.push({ r: homeRow, c: 2, castle: 'Q' });
          }
        }
      }
    } else {
      const dirs = [];
      if (type === 'R' || type === 'Q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      if (type === 'B' || type === 'Q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      dirs.forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc;
        while (add(nr, nc)) {
          nr += dr;
          nc += dc;
        }
      });
    }
    return moves;
  }

  function simulateMove(b, sr, sc, move) {
    const copy = b.map(row => [...row]);
    const piece = copy[sr][sc];
    copy[move.r][move.c] = piece;
    copy[sr][sc] = null;

    if (move.enPassant) {
      copy[sr][move.c] = null;
    }
    if (move.castle === 'K') {
      copy[sr][5] = copy[sr][7];
      copy[sr][7] = null;
    } else if (move.castle === 'Q') {
      copy[sr][3] = copy[sr][0];
      copy[sr][0] = null;
    }
    return copy;
  }

  function getLegalMoves(r, c, b = board, ep = enPassant, castleRights = castling) {
    const p = b[r][c];
    if (!p) return [];
    const side = p[0];
    return getPseudoMoves(b, r, c, ep, castleRights).filter(mv => {
      const nextBoard = simulateMove(b, r, c, mv);
      return !isKingInCheck(nextBoard, side);
    });
  }

  function hasAnyLegalMoves(side, b = board) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c]?.[0] === side && getLegalMoves(r, c, b).length > 0) return true;
      }
    }
    return false;
  }

  function executeMove(sr, sc, move, promoType = 'Q') {
    history.push(cloneState());
    const moving = board[sr][sc];
    const side = moving[0];
    let target = board[move.r][move.c];

    if (move.enPassant) {
      target = board[sr][move.c];
      board[sr][move.c] = null;
    }

    if (target) {
      if (side === 'w') capturedByW.push(target);
      else capturedByB.push(target);
    }

    board[move.r][move.c] = moving;
    board[sr][sc] = null;

    if (move.castle === 'K') {
      board[sr][5] = board[sr][7];
      board[sr][7] = null;
    } else if (move.castle === 'Q') {
      board[sr][3] = board[sr][0];
      board[sr][0] = null;
    }

    if (moving === 'wK') { castling.wK = false; castling.wQ = false; }
    if (moving === 'bK') { castling.bK = false; castling.bQ = false; }
    if (sr === 7 && sc === 0) castling.wQ = false;
    if (sr === 7 && sc === 7) castling.wK = false;
    if (sr === 0 && sc === 0) castling.bQ = false;
    if (sr === 0 && sc === 7) castling.bK = false;
    if (move.r === 7 && move.c === 0) castling.wQ = false;
    if (move.r === 7 && move.c === 7) castling.wK = false;
    if (move.r === 0 && move.c === 0) castling.bQ = false;
    if (move.r === 0 && move.c === 7) castling.bK = false;

    enPassant = move.doubleStep ? [(sr + move.r) / 2, sc] : null;

    if (moving === 'wP' && move.r === 0) board[move.r][move.c] = 'w' + promoType;
    if (moving === 'bP' && move.r === 7) board[move.r][move.c] = 'b' + promoType;

    lastMove = { sr, sc, dr: move.r, dc: move.c };
    AudioFX.card();
    vibrate(14);
  }

  function evaluateEndState(nextSide) {
    const inCheck = isKingInCheck(board, nextSide);
    const canMove = hasAnyLegalMoves(nextSide);

    if (!canMove) {
      gameOver = true;
      if (inCheck) {
        const winnerSide = nextSide === 'w' ? 'b' : 'w';
        if (gameMode === 'pve') {
          winnerText = winnerSide === 'w' ? '🎉 Checkmate! You Win!' : '🤖 Checkmate! AI Wins!';
          if (winnerSide === 'w') {
            AudioFX.win();
            addXP(60, window.innerWidth / 2, window.innerHeight / 2, 'CHECKMATE +60 XP!');
            window.ArcadeHero?.awardGameScore('chess', 150);
          }
        } else {
          winnerText = winnerSide === 'w' ? '🏆 White Wins by Checkmate!' : '🏆 Black Wins by Checkmate!';
          AudioFX.win();
        }
      } else {
        winnerText = '🤝 Draw by Stalemate!';
      }
      status = winnerText;
      return true;
    }

    if (inCheck) {
      status = gameMode === 'pve'
        ? (nextSide === 'w' ? '⚠️ Check! Your Move' : '⚠️ AI in Check...')
        : `⚠️ Check! ${nextSide === 'w' ? 'White' : 'Black'}'s Turn`;
    } else {
      status = gameMode === 'pve'
        ? (nextSide === 'w' ? 'Your Move (White)' : 'Grandmaster AI thinking...')
        : `${nextSide === 'w' ? 'White' : 'Black'} Player's Turn`;
    }
    return false;
  }

  function evaluateBoard(b) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (!p) continue;
        const centerBonus = (3.5 - Math.abs(3.5 - r)) + (3.5 - Math.abs(3.5 - c));
        const val = VALS[p[1]] + centerBonus * 4;
        score += p[0] === 'b' ? val : -val;
      }
    }
    return score;
  }

  function aiMove() {
    if (!active || gameOver) return;
    const all = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]?.[0] === 'b') {
          getLegalMoves(r, c).forEach(mv => {
            const sim = simulateMove(board, r, c, mv);
            if (sim[mv.r][mv.c] === 'bP' && mv.r === 7) sim[mv.r][mv.c] = 'bQ';
            let score = evaluateBoard(sim);

            if (aiDifficulty === 'hard') {
              let worstReply = Infinity;
              for (let wr = 0; wr < 8; wr++) {
                for (let wc = 0; wc < 8; wc++) {
                  if (sim[wr][wc]?.[0] === 'w') {
                    getLegalMoves(wr, wc, sim, null, castling).forEach(wmv => {
                      const sim2 = simulateMove(sim, wr, wc, wmv);
                      const replyScore = evaluateBoard(sim2);
                      if (replyScore < worstReply) worstReply = replyScore;
                    });
                  }
                }
              }
              if (worstReply !== Infinity) score = worstReply;
              score += Math.random() * 6;
            } else if (aiDifficulty === 'normal') {
              score += Math.random() * 45;
            } else {
              score += Math.random() * 260;
            }
            all.push({ sr: r, sc: c, mv, score });
          });
        }
      }
    }

    if (!all.length) {
      evaluateEndState('b');
      render();
      return;
    }

    all.sort((a, b) => b.score - a.score);
    const best = all[0];
    executeMove(best.sr, best.sc, best.mv, 'Q');
    turn = 'w';
    evaluateEndState('w');
    render();
  }

  function undoMove() {
    if (!active || !history.length || pendingPromo) return;
    if (aiTimeout) {
      clearTimeout(aiTimeout);
      aiTimeout = null;
    }
    const steps = (gameMode === 'pve' && turn === 'w' && history.length >= 2) ? 2 : 1;
    let prev = null;
    for (let i = 0; i < steps && history.length; i++) {
      prev = history.pop();
    }
    if (!prev) return;
    board = prev.board;
    turn = prev.turn;
    capturedByW = prev.capturedByW;
    capturedByB = prev.capturedByB;
    lastMove = prev.lastMove;
    enPassant = prev.enPassant;
    castling = prev.castling;
    status = prev.status;
    sel = null;
    legal = [];
    gameOver = false;
    winnerText = '';
    AudioFX.click();
    render();
  }

  function render() {
    if (!active) return;
    const whiteCheck = isKingInCheck(board, 'w');
    const blackCheck = isKingInCheck(board, 'b');

    stage.innerHTML = `
      <div class="relative w-full h-full flex flex-col items-center justify-between px-3 py-2.5 pb-16 sm:pb-6 select-none overflow-hidden">
        <div class="flex items-center justify-between w-full max-w-[min(92vw,440px)] shrink-0 z-10 gap-2">
          <button id="chess-menu" type="button" class="w-10 h-10 shrink-0 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg font-black shadow hover:bg-amber-900 transition cursor-pointer" aria-label="Settings">
            ☰
          </button>
          <div class="flex-1 px-3 py-2 rounded-xl bg-black/65 border border-amber-400/30 text-amber-200 font-bold text-xs shadow text-center truncate">
            ${status}
          </div>
          <button id="chess-undo-btn" type="button" ${history.length === 0 ? 'disabled' : ''} class="px-3 h-10 shrink-0 rounded-xl bg-slate-800/90 border border-white/15 hover:bg-slate-700 disabled:opacity-40 text-amber-200 font-bold text-xs shadow transition cursor-pointer">
            ↩ Undo
          </button>
          <button id="chess-reset-btn" type="button" class="px-3 h-10 shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow transition cursor-pointer">
            New
          </button>
        </div>

        <div class="w-full max-w-[min(92vw,440px)] h-7 shrink-0 flex items-center justify-between px-2 rounded-lg bg-black/35 border border-white/5 text-xs text-amber-100/90 font-bold z-10">
          <span class="text-[10px] uppercase tracking-wider text-slate-400">Black</span>
          <div class="flex items-center gap-0.5 text-base leading-none overflow-hidden">
            ${capturedByB.length ? capturedByB.map(p => `<span>${GLYPHS[p]}</span>`).join('') : '<span class="text-[10px] text-slate-500 font-normal">No captures</span>'}
          </div>
        </div>

        <div class="relative w-[min(88vw,420px)] aspect-square shrink-0 my-auto z-10">
          <div class="grid grid-cols-8 grid-rows-8 w-full h-full rounded-2xl overflow-hidden border-4 border-amber-900 shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
            ${board.map((row, r) => row.map((cell, c) => {
              const dark = (r + c) % 2 === 1;
              const isSel = sel && sel[0] === r && sel[1] === c;
              const moveObj = legal.find(m => m.r === r && m.c === c);
              const isLast = lastMove && ((lastMove.sr === r && lastMove.sc === c) || (lastMove.dr === r && lastMove.dc === c));
              const isKingDanger = (cell === 'wK' && whiteCheck) || (cell === 'bK' && blackCheck);

              let bgClass = dark ? 'bg-[#7c4a2d]' : 'bg-[#e7d3b5]';
              if (isLast) bgClass = dark ? 'bg-[#946b2d]' : 'bg-[#f3e19c]';

              return `
                <button
                  type="button"
                  data-r="${r}"
                  data-c="${c}"
                  class="ch-sq relative w-full h-full overflow-hidden flex items-center justify-center p-0 m-0 leading-none touch-none select-none transition-colors ${bgClass} ${isSel ? 'ring-inset ring-4 ring-amber-400' : ''} ${isKingDanger ? 'ring-inset ring-4 ring-rose-500 bg-rose-600/40' : ''}"
                >
                  ${c === 0 ? `<span class="pointer-events-none absolute top-0.5 left-1 text-[9px] font-extrabold leading-none ${dark ? 'text-amber-200/60' : 'text-amber-950/60'}">${8 - r}</span>` : ''}
                  ${r === 7 ? `<span class="pointer-events-none absolute bottom-0.5 right-1 text-[9px] font-extrabold leading-none ${dark ? 'text-amber-200/60' : 'text-amber-950/60'}">${FILES[c]}</span>` : ''}
                  ${cell ? `
                    <span class="pointer-events-none block leading-none text-[clamp(1.45rem,6.5vw,2.35rem)] transition-transform duration-150 ${isSel ? 'scale-110' : ''} ${cell[0] === 'w' ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.95)]' : 'text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.65)]'}">
                      ${GLYPHS[cell]}
                    </span>
                  ` : ''}
                  ${moveObj ? (
                    cell || moveObj.enPassant
                      ? `<span class="pointer-events-none absolute inset-1.5 rounded-full border-[3px] border-emerald-400/90"></span>`
                      : `<span class="pointer-events-none absolute w-[28%] h-[28%] rounded-full bg-emerald-500/85 shadow"></span>`
                  ) : ''}
                </button>
              `;
            }).join('')).join('')}
          </div>
        </div>

        <div class="w-full max-w-[min(92vw,440px)] h-7 shrink-0 flex items-center justify-between px-2 rounded-lg bg-black/35 border border-white/5 text-xs text-amber-100/90 font-bold z-10">
          <span class="text-[10px] uppercase tracking-wider text-slate-400">White</span>
          <div class="flex items-center gap-0.5 text-base leading-none overflow-hidden">
            ${capturedByW.length ? capturedByW.map(p => `<span>${GLYPHS[p]}</span>`).join('') : '<span class="text-[10px] text-slate-500 font-normal">No captures</span>'}
          </div>
        </div>

        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md ${pendingPromo ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div class="max-w-xs w-full bg-slate-900 border-2 border-amber-400/60 rounded-3xl p-5 shadow-2xl text-center flex flex-col gap-4">
            <h3 class="text-base font-black text-amber-300">Promote Pawn</h3>
            <div class="grid grid-cols-4 gap-2">
              ${['Q', 'R', 'B', 'N'].map(type => `
                <button type="button" data-promo="${type}" class="ch-promo-btn aspect-square rounded-2xl bg-slate-800 hover:bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl text-white shadow cursor-pointer">
                  ${GLYPHS[(pendingPromo?.side || 'w') + type]}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div id="chess-settings-backdrop" class="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md ${settingsModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div id="chess-settings-modal" class="max-w-sm w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[88vh] overflow-y-auto">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 class="text-lg font-black text-amber-400">⚙️ Chess Settings</h2>
              <button id="chess-close-settings" type="button" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold flex items-center justify-center transition cursor-pointer" aria-label="Close settings">✕</button>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">Game Mode</label>
              <div class="grid grid-cols-2 gap-2.5">
                <button id="chess-mode-pve" type="button" class="py-2.5 px-3 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pve' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">🤖 vs AI</button>
                <button id="chess-mode-pvp" type="button" class="py-2.5 px-3 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pvp' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">👥 2P PvP</button>
              </div>
            </div>

            <div id="chess-ai-diff" class="flex flex-col gap-2 ${gameMode === 'pvp' ? 'hidden' : ''}">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Difficulty</label>
              <div class="grid grid-cols-3 gap-2">
                <button id="chess-diff-easy" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'easy' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Easy</button>
                <button id="chess-diff-normal" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'normal' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Normal</button>
                <button id="chess-diff-hard" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'hard' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Hard</button>
              </div>
            </div>

            <button id="chess-apply-settings" type="button" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg hover:brightness-105 active:scale-[0.99] transition cursor-pointer">
              Apply &amp; Restart Match ⚔️
            </button>

            <div id="chess-settings-extra"></div>
          </div>
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

            <div class="flex flex-col gap-2 text-left ${gameMode === 'pvp' ? 'hidden' : ''}">
              <label class="text-xs font-bold text-slate-400">AI Difficulty:</label>
              <div class="grid grid-cols-3 gap-2">
                <button id="chess-cfg-easy" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'easy' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">Easy</button>
                <button id="chess-cfg-normal" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'normal' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">Normal</button>
                <button id="chess-cfg-hard" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'hard' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">Hard</button>
              </div>
            </div>

            <button id="chess-start-btn" type="button" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer">
              START MATCH 🚀
            </button>
          </div>
        </div>

        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md ${gameOver ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div class="max-w-sm w-full bg-slate-900 border-2 border-amber-400/60 rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-4">
            <div class="text-5xl">👑</div>
            <h2 class="text-2xl font-black text-amber-300">MATCH COMPLETE</h2>
            <div class="text-base font-extrabold text-white bg-black/40 py-3 px-4 rounded-2xl border border-white/10">
              ${winnerText}
            </div>
            <button id="chess-play-again-btn" type="button" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer">
              🔄 Play Again
            </button>
          </div>
        </div>
      </div>
    `;

    const chessSettingsExtra = document.getElementById('chess-settings-extra');
    if (typeof window.attachGameSettingsFooterActions === 'function' && chessSettingsExtra) {
      window.attachGameSettingsFooterActions(chessSettingsExtra, {
        onCloseDrawer: () => {
          if (!active) return;
          settingsModalOpen = false;
          render();
        }
      });
    }

    document.getElementById('chess-menu').onclick = () => { if (!active) return; settingsModalOpen = true; render(); };
    document.getElementById('chess-undo-btn').onclick = () => undoMove();
    document.getElementById('chess-reset-btn').onclick = () => { if (!active) return; configModalOpen = true; render(); };
    document.getElementById('chess-play-again-btn').onclick = () => { if (!active) return; reset(); };
    document.getElementById('chess-close-settings').onclick = () => { if (!active) return; settingsModalOpen = false; render(); };
    document.getElementById('chess-settings-backdrop').onclick = (e) => {
      if (!active || e.target.id !== 'chess-settings-backdrop') return;
      settingsModalOpen = false;
      render();
    };

    document.getElementById('chess-mode-pve').onclick = () => { if (!active) return; gameMode = 'pve'; render(); };
    document.getElementById('chess-mode-pvp').onclick = () => { if (!active) return; gameMode = 'pvp'; render(); };
    document.getElementById('chess-cfg-pve').onclick = () => { if (!active) return; gameMode = 'pve'; render(); };
    document.getElementById('chess-cfg-pvp').onclick = () => { if (!active) return; gameMode = 'pvp'; render(); };

    document.getElementById('chess-diff-easy').onclick = () => { if (!active) return; aiDifficulty = 'easy'; render(); };
    document.getElementById('chess-diff-normal').onclick = () => { if (!active) return; aiDifficulty = 'normal'; render(); };
    document.getElementById('chess-diff-hard').onclick = () => { if (!active) return; aiDifficulty = 'hard'; render(); };

    document.getElementById('chess-cfg-easy').onclick = () => { if (!active) return; aiDifficulty = 'easy'; render(); };
    document.getElementById('chess-cfg-normal').onclick = () => { if (!active) return; aiDifficulty = 'normal'; render(); };
    document.getElementById('chess-cfg-hard').onclick = () => { if (!active) return; aiDifficulty = 'hard'; render(); };

    document.getElementById('chess-apply-settings').onclick = () => { if (!active) return; reset(); };
    document.getElementById('chess-start-btn').onclick = () => { if (!active) return; reset(); };

    document.querySelectorAll('.ch-promo-btn').forEach(btn => {
      btn.onclick = () => {
        if (!active || !pendingPromo) return;
        const { sr, sc, move } = pendingPromo;
        pendingPromo = null;
        executeMove(sr, sc, move, btn.dataset.promo);
        turn = turn === 'w' ? 'b' : 'w';
        const ended = evaluateEndState(turn);
        render();
        if (!ended && gameMode === 'pve' && turn === 'b') {
          if (aiTimeout) clearTimeout(aiTimeout);
          aiTimeout = setTimeout(() => { aiTimeout = null; aiMove(); }, 280);
        }
      };
    });

    document.querySelectorAll('.ch-sq').forEach(btn => {
      btn.onpointerup = (e) => {
        if (!active || gameOver || pendingPromo) return;
        e.preventDefault();
        e.stopPropagation();
        if (turn !== 'w' && gameMode === 'pve') return;

        const r = Number(btn.dataset.r);
        const c = Number(btn.dataset.c);
        const chosen = sel ? legal.find(m => m.r === r && m.c === c) : null;

        if (sel && chosen) {
          const moving = board[sel[0]][sel[1]];
          const isPromotion = (moving === 'wP' && r === 0) || (moving === 'bP' && r === 7);
          if (isPromotion) {
            pendingPromo = { sr: sel[0], sc: sel[1], move: chosen, side: moving[0] };
            sel = null;
            legal = [];
            render();
            return;
          }

          executeMove(sel[0], sel[1], chosen);
          sel = null;
          legal = [];
          turn = turn === 'w' ? 'b' : 'w';
          const ended = evaluateEndState(turn);
          render();

          if (!ended && gameMode === 'pve' && turn === 'b') {
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
          vibrate(8);
        } else {
          sel = null;
          legal = [];
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