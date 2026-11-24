window.initDama = function initDama(stage) {
  let active = true;
  let aiTimeout = null;

  let board = [];
  let turn = 'r';
  let sel = null;
  let moves = [];
  let vsAI = true;
  let aiDifficulty = 'normal';
  let status = 'Your Turn (Red Dama)';
  let redCaptured = 0;
  let blueCaptured = 0;
  let lastMove = null;
  let history = [];
  let mustContinueFrom = null;
  let gameOver = false;
  let winnerText = '';
  let settingsModalOpen = false;
  let configModalOpen = true;

  function vibrate(ms = 12) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (_) {}
    }
  }

  function cloneState() {
    return {
      board: board.map(row => row.map(cell => (cell ? { ...cell } : null))),
      turn,
      redCaptured,
      blueCaptured,
      lastMove: lastMove ? { ...lastMove } : null,
      status
    };
  }

  function reset() {
    if (!active) return;
    if (aiTimeout) {
      clearTimeout(aiTimeout);
      aiTimeout = null;
    }
    board = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => {
      if ((r + c) % 2 === 1) {
        if (r < 3) return { side: 'b', king: false };
        if (r > 4) return { side: 'r', king: false };
      }
      return null;
    }));
    turn = 'r';
    sel = null;
    moves = [];
    redCaptured = 0;
    blueCaptured = 0;
    lastMove = null;
    history = [];
    mustContinueFrom = null;
    gameOver = false;
    winnerText = '';
    status = vsAI ? 'Your Turn (Red Dama)' : 'Red Dama (Player 1) Turn';
    configModalOpen = false;
    settingsModalOpen = false;
    render();
  }

  function getPieceMoves(r, c, customBoard = board) {
    const p = customBoard[r][c];
    if (!p) return [];
    const res = [];
    const capDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const stepDirs = p.king
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : (p.side === 'r' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);

    capDirs.forEach(([dr, dc]) => {
      if (!p.king) {
        const mr = r + dr, mc = c + dc, jr = r + dr * 2, jc = c + dc * 2;
        if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && customBoard[mr][mc] && customBoard[mr][mc].side !== p.side && !customBoard[jr][jc]) {
          res.push({ dr: jr, dc: jc, cap: [mr, mc] });
        }
      } else {
        let step = 1;
        let foundEnemy = null;
        while (true) {
          const nr = r + dr * step, nc = c + dc * step;
          if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
          const cell = customBoard[nr][nc];
          if (!cell) {
            if (foundEnemy) res.push({ dr: nr, dc: nc, cap: foundEnemy });
          } else if (cell.side === p.side) {
            break;
          } else {
            if (foundEnemy) break;
            foundEnemy = [nr, nc];
          }
          step++;
        }
      }
    });

    stepDirs.forEach(([dr, dc]) => {
      let step = 1;
      while (true) {
        const nr = r + dr * step, nc = c + dc * step;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8 || customBoard[nr][nc]) break;
        res.push({ dr: nr, dc: nc, cap: null });
        if (!p.king) break;
        step++;
      }
    });

    return res;
  }

  function checkWinCondition() {
    let redCount = 0, blueCount = 0;
    let redHasMoves = false, blueHasMoves = false;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          if (p.side === 'r') {
            redCount++;
            if (getPieceMoves(r, c).length > 0) redHasMoves = true;
          } else {
            blueCount++;
            if (getPieceMoves(r, c).length > 0) blueHasMoves = true;
          }
        }
      }
    }

    if (redCount === 0 || (turn === 'r' && !redHasMoves)) {
      triggerGameOver(vsAI ? '🤖 AI Wins!' : '🔵 Blue Player Wins!');
      return true;
    }
    if (blueCount === 0 || (turn === 'b' && !blueHasMoves)) {
      triggerGameOver(vsAI ? '🎉 You Win!' : '🔴 Red Player Wins!');
      return true;
    }
    return false;
  }

  function triggerGameOver(msg) {
    if (!active) return;
    gameOver = true;
    winnerText = msg;
    status = msg;
    AudioFX.win();
    addXP(50, window.innerWidth / 2, window.innerHeight / 2, 'DAMA VICTORY!');
    window.ArcadeHero?.awardGameScore('dama', 100);
    render();
  }

  function scoreAiMove(move) {
    const piece = board[move.sr][move.sc];
    let score = 0;

    if (move.cap) {
      const victim = board[move.cap[0]][move.cap[1]];
      score += victim?.king ? 45 : 30;
    }
    if (!piece.king && move.dr === 7) score += 25;
    score += move.dr * 1.2;
    if (move.dc === 0 || move.dc === 7) score += 2.5;

    if (aiDifficulty === 'hard') {
      const sim = board.map(row => row.map(cell => (cell ? { ...cell } : null)));
      const moved = sim[move.sr][move.sc];
      sim[move.dr][move.dc] = moved;
      sim[move.sr][move.sc] = null;
      if (move.cap) sim[move.cap[0]][move.cap[1]] = null;
      if (move.dr === 7) moved.king = true;

      const followCaps = getPieceMoves(move.dr, move.dc, sim).filter(m => m.cap).length;
      score += followCaps * 18;

      let canBeCaptured = false;
      for (let r = 0; r < 8 && !canBeCaptured; r++) {
        for (let c = 0; c < 8 && !canBeCaptured; c++) {
          if (sim[r][c]?.side === 'r') {
            if (getPieceMoves(r, c, sim).some(m => m.cap && m.cap[0] === move.dr && m.cap[1] === move.dc)) {
              canBeCaptured = true;
            }
          }
        }
      }
      if (canBeCaptured) score -= moved.king ? 35 : 22;
      score += Math.random() * 1.5;
    } else if (aiDifficulty === 'normal') {
      score += Math.random() * 8;
    } else {
      score = (move.cap ? 8 : 0) + Math.random() * 25;
    }

    return score;
  }

  function aiTurn() {
    if (!active || gameOver) return;
    const all = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]?.side === 'b') {
          if (mustContinueFrom && (mustContinueFrom[0] !== r || mustContinueFrom[1] !== c)) continue;
          getPieceMoves(r, c).forEach(m => all.push({ sr: r, sc: c, ...m }));
        }
      }
    }
    if (!all.length) {
      triggerGameOver('🎉 You Win!');
      return;
    }

    all.sort((a, b) => scoreAiMove(b) - scoreAiMove(a));
    const pick = all[0];

    if (!mustContinueFrom) {
      history.push(cloneState());
    }

    const piece = board[pick.sr][pick.sc];
    board[pick.dr][pick.dc] = piece;
    board[pick.sr][pick.sc] = null;
    lastMove = { sr: pick.sr, sc: pick.sc, dr: pick.dr, dc: pick.dc };

    let chained = false;
    if (pick.cap) {
      board[pick.cap[0]][pick.cap[1]] = null;
      blueCaptured++;
      AudioFX.coin();
      const nextMoves = getPieceMoves(pick.dr, pick.dc).filter(m => m.cap);
      if (nextMoves.length > 0) {
        chained = true;
        mustContinueFrom = [pick.dr, pick.dc];
      }
    }

    if (!chained && pick.dr === 7) piece.king = true;
    AudioFX.card();
    vibrate(14);

    if (!chained) {
      mustContinueFrom = null;
      turn = 'r';
      if (checkWinCondition()) return;
      status = vsAI ? 'Your Turn (Red Dama)' : 'Red Dama (Player 1) Turn';
    } else {
      status = 'AI Chain Jumping!';
      if (aiTimeout) clearTimeout(aiTimeout);
      aiTimeout = setTimeout(() => {
        aiTimeout = null;
        aiTurn();
      }, 450);
    }
    render();
  }

  function undoMove() {
    if (!active || !history.length || mustContinueFrom) return;
    if (aiTimeout) {
      clearTimeout(aiTimeout);
      aiTimeout = null;
    }
    const steps = (vsAI && turn === 'r' && history.length >= 2) ? 2 : 1;
    let prev = null;
    for (let i = 0; i < steps && history.length; i++) {
      prev = history.pop();
    }
    if (!prev) return;
    board = prev.board;
    turn = prev.turn;
    redCaptured = prev.redCaptured;
    blueCaptured = prev.blueCaptured;
    lastMove = prev.lastMove;
    status = prev.status;
    sel = null;
    moves = [];
    gameOver = false;
    winnerText = '';
    AudioFX.click();
    render();
  }

  function render() {
    if (!active) return;

    stage.innerHTML = `
      <div class="relative w-full h-full flex flex-col items-center justify-between px-3 py-2.5 pb-16 sm:pb-6 select-none overflow-hidden">
        <div class="flex items-center justify-between w-full max-w-[min(92vw,460px)] shrink-0 z-10 gap-2">
          <button id="dama-menu" type="button" class="w-10 h-10 shrink-0 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg font-black shadow hover:bg-amber-900 transition cursor-pointer" aria-label="Settings">
            ☰
          </button>
          <div class="flex-1 px-3 py-2 rounded-xl bg-black/65 border border-amber-400/30 text-amber-200 font-bold text-xs shadow text-center truncate">
            ${status}
          </div>
          <button id="dama-undo-btn" type="button" ${history.length === 0 || mustContinueFrom ? 'disabled' : ''} class="px-3 h-10 shrink-0 rounded-xl bg-slate-800/90 border border-white/15 hover:bg-slate-700 disabled:opacity-40 text-amber-200 font-bold text-xs shadow transition cursor-pointer">
            ↩ Undo
          </button>
          <button id="dama-reset-btn" type="button" class="px-3 h-10 shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow transition cursor-pointer">
            New
          </button>
        </div>

        <div class="flex items-center justify-center gap-3 h-8 shrink-0 z-10">
          <span class="px-3.5 py-1 rounded-xl bg-rose-950/85 border ${turn === 'r' ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-rose-500/40'} text-rose-200 font-bold text-xs transition">
            🔴 Red: ${redCaptured}
          </span>
          <span class="px-3.5 py-1 rounded-xl bg-sky-950/85 border ${turn === 'b' ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-sky-500/40'} text-sky-200 font-bold text-xs transition">
            🔵 Blue: ${blueCaptured}
          </span>
        </div>

        <div class="relative w-[min(88vw,430px)] aspect-square shrink-0 my-auto z-10">
          <div class="grid grid-cols-8 grid-rows-8 w-full h-full rounded-2xl overflow-hidden border-4 border-[#3d1f0d] shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
            ${board.map((row, r) => row.map((cell, c) => {
              const dark = (r + c) % 2 === 1;
              const isSel = sel && sel[0] === r && sel[1] === c;
              const targetMove = moves.find(m => m.dr === r && m.dc === c);
              const isLast = lastMove && ((lastMove.sr === r && lastMove.sc === c) || (lastMove.dr === r && lastMove.dc === c));

              let bgClass = dark ? 'bg-[#5c3317]' : 'bg-[#deb887]';
              if (isLast && dark) bgClass = 'bg-[#764521]';

              return `
                <button
                  type="button"
                  data-r="${r}"
                  data-c="${c}"
                  class="dm-sq relative w-full h-full overflow-hidden flex items-center justify-center p-0 m-0 leading-none touch-none select-none transition-colors ${bgClass} ${isSel ? 'ring-inset ring-4 ring-amber-300' : ''}"
                >
                  ${cell ? `
                    <div class="pointer-events-none w-[74%] h-[74%] rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.65)] flex items-center justify-center font-black leading-none border-2 transition-transform duration-150 ${isSel ? 'scale-110' : ''} ${cell.side === 'r' ? 'bg-gradient-to-br from-rose-500 to-red-800 border-rose-200 text-amber-200' : 'bg-gradient-to-br from-slate-700 to-slate-950 border-sky-300 text-sky-300'}">
                      ${cell.king ? '<span class="text-[clamp(0.85rem,3.4vw,1.2rem)] leading-none">👑</span>' : ''}
                    </div>
                  ` : ''}
                  ${targetMove ? `
                    <span class="pointer-events-none absolute w-[34%] h-[34%] rounded-full shadow-md ${targetMove.cap ? 'bg-rose-500 ring-2 ring-white' : 'bg-emerald-400/90'}"></span>
                  ` : ''}
                </button>
              `;
            }).join('')).join('')}
          </div>
        </div>

        <div class="h-6 shrink-0 flex items-center justify-center text-[11px] font-bold text-amber-200/75 z-10">
          Tap a piece to move or jump
        </div>

        <div id="dama-settings-backdrop" class="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md ${settingsModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div id="dama-settings-modal" class="max-w-sm w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[88vh] overflow-y-auto">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 class="text-lg font-black text-amber-400">⚙️ Dama Settings</h2>
              <button id="dama-close-settings" type="button" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold flex items-center justify-center transition cursor-pointer" aria-label="Close settings">✕</button>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">Game Mode</label>
              <div class="grid grid-cols-2 gap-2.5">
                <button id="dama-mode-ai" type="button" class="py-2.5 px-3 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${vsAI ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">🤖 vs AI</button>
                <button id="dama-mode-pvp" type="button" class="py-2.5 px-3 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${!vsAI ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">👥 2P PvP</button>
              </div>
            </div>

            <div id="dama-ai-diff" class="flex flex-col gap-2 ${!vsAI ? 'hidden' : ''}">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Difficulty</label>
              <div class="grid grid-cols-3 gap-2">
                <button id="dama-diff-easy" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'easy' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Easy</button>
                <button id="dama-diff-normal" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'normal' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Normal</button>
                <button id="dama-diff-hard" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'hard' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Hard</button>
              </div>
            </div>

            <button id="dama-apply-settings" type="button" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg hover:brightness-105 active:scale-[0.99] transition cursor-pointer">
              Apply &amp; Restart Match ⚔️
            </button>

            <div id="dama-settings-extra"></div>
          </div>
        </div>

        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md ${configModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div class="max-w-sm w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-5">
            <div class="text-4xl">🔴👑</div>
            <h2 class="text-xl font-black text-amber-400">FILIPINO DAMA</h2>
            <p class="text-xs text-slate-300">Configure your match before starting:</p>

            <div class="flex flex-col gap-2 text-left">
              <label class="text-xs font-bold text-slate-400">Mode:</label>
              <div class="grid grid-cols-2 gap-2">
                <button id="dama-cfg-ai" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${vsAI ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">vs AI</button>
                <button id="dama-cfg-pvp" type="button" class="py-2.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${!vsAI ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">2P PvP</button>
              </div>
            </div>

            <div class="flex flex-col gap-2 text-left ${!vsAI ? 'hidden' : ''}">
              <label class="text-xs font-bold text-slate-400">AI Difficulty:</label>
              <div class="grid grid-cols-3 gap-2">
                <button id="dama-cfg-easy" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'easy' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">Easy</button>
                <button id="dama-cfg-normal" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'normal' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">Normal</button>
                <button id="dama-cfg-hard" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'hard' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-black/40 text-white border-white/10'}">Hard</button>
              </div>
            </div>

            <button id="dama-start-btn" type="button" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer">
              START MATCH 🚀
            </button>
          </div>
        </div>

        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md ${gameOver ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div class="max-w-sm w-full bg-slate-900 border-2 border-amber-400/60 rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-4">
            <div class="text-5xl">🏆</div>
            <h2 class="text-2xl font-black text-amber-300">GAME OVER</h2>
            <div class="text-lg font-extrabold text-white bg-black/40 py-3 rounded-2xl border border-white/10">
              ${winnerText}
            </div>
            <button id="dama-play-again-btn" type="button" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer">
              🔄 Play Again
            </button>
          </div>
        </div>
      </div>
    `;

    const damaSettingsExtra = document.getElementById('dama-settings-extra');
    if (typeof window.attachGameSettingsFooterActions === 'function' && damaSettingsExtra) {
      window.attachGameSettingsFooterActions(damaSettingsExtra, {
        onCloseDrawer: () => {
          if (!active) return;
          settingsModalOpen = false;
          render();
        }
      });
    }

    document.getElementById('dama-menu').onclick = () => { if (!active) return; settingsModalOpen = true; render(); };
    document.getElementById('dama-undo-btn').onclick = () => undoMove();
    document.getElementById('dama-reset-btn').onclick = () => { if (!active) return; configModalOpen = true; render(); };
    document.getElementById('dama-close-settings').onclick = () => { if (!active) return; settingsModalOpen = false; render(); };
    document.getElementById('dama-settings-backdrop').onclick = (e) => {
      if (!active || e.target.id !== 'dama-settings-backdrop') return;
      settingsModalOpen = false;
      render();
    };

    document.getElementById('dama-mode-ai').onclick = () => { if (!active) return; vsAI = true; render(); };
    document.getElementById('dama-mode-pvp').onclick = () => { if (!active) return; vsAI = false; render(); };
    document.getElementById('dama-cfg-ai').onclick = () => { if (!active) return; vsAI = true; render(); };
    document.getElementById('dama-cfg-pvp').onclick = () => { if (!active) return; vsAI = false; render(); };

    document.getElementById('dama-diff-easy').onclick = () => { if (!active) return; aiDifficulty = 'easy'; render(); };
    document.getElementById('dama-diff-normal').onclick = () => { if (!active) return; aiDifficulty = 'normal'; render(); };
    document.getElementById('dama-diff-hard').onclick = () => { if (!active) return; aiDifficulty = 'hard'; render(); };

    document.getElementById('dama-cfg-easy').onclick = () => { if (!active) return; aiDifficulty = 'easy'; render(); };
    document.getElementById('dama-cfg-normal').onclick = () => { if (!active) return; aiDifficulty = 'normal'; render(); };
    document.getElementById('dama-cfg-hard').onclick = () => { if (!active) return; aiDifficulty = 'hard'; render(); };

    document.getElementById('dama-apply-settings').onclick = () => { if (!active) return; reset(); };
    document.getElementById('dama-start-btn').onclick = () => { if (!active) return; reset(); };
    document.getElementById('dama-play-again-btn').onclick = () => { if (!active) return; reset(); };

    document.querySelectorAll('.dm-sq').forEach(btn => {
      btn.onpointerup = (e) => {
        if (!active || gameOver) return;
        e.preventDefault();
        e.stopPropagation();

        const r = Number(btn.dataset.r);
        const c = Number(btn.dataset.c);
        const currentSide = turn;
        if (vsAI && currentSide !== 'r') return;

        const mv = moves.find(m => m.dr === r && m.dc === c);
        if (sel && mv) {
          if (!mustContinueFrom) {
            history.push(cloneState());
          }

          const piece = board[sel[0]][sel[1]];
          board[r][c] = piece;
          board[sel[0]][sel[1]] = null;
          lastMove = { sr: sel[0], sc: sel[1], dr: r, dc: c };

          let chained = false;
          if (mv.cap) {
            board[mv.cap[0]][mv.cap[1]] = null;
            if (currentSide === 'r') redCaptured++;
            else blueCaptured++;

            AudioFX.coin();
            vibrate(18);
            if (currentSide === 'r') {
              addXP(15, window.innerWidth / 2, window.innerHeight / 2, 'CAPTURE!');
            }

            const nextMoves = getPieceMoves(r, c).filter(m => m.cap);
            if (nextMoves.length > 0) {
              chained = true;
              mustContinueFrom = [r, c];
              sel = [r, c];
              moves = nextMoves;
              status = 'Chain Jump! Pick next target';
              AudioFX.click();
              render();
              return;
            }
          } else {
            AudioFX.card();
            vibrate(10);
          }

          if (!chained) {
            if (currentSide === 'r' && r === 0) piece.king = true;
            if (currentSide === 'b' && r === 7) piece.king = true;
          }

          mustContinueFrom = null;
          sel = null;
          moves = [];

          if (!chained) {
            turn = currentSide === 'r' ? 'b' : 'r';
            if (checkWinCondition()) return;

            status = vsAI
              ? 'Opponent moving...'
              : (turn === 'r' ? 'Red Dama (Player 1) Turn' : 'Blue Dama (Player 2) Turn');
          }
          render();

          if (vsAI && turn === 'b' && !gameOver) {
            if (aiTimeout) clearTimeout(aiTimeout);
            aiTimeout = setTimeout(() => {
              aiTimeout = null;
              aiTurn();
            }, 380);
          }
          return;
        }

        if (mustContinueFrom) return;

        if (board[r][c]?.side === currentSide) {
          sel = [r, c];
          moves = getPieceMoves(r, c);
          AudioFX.click();
          vibrate(8);
        } else {
          sel = null;
          moves = [];
        }
        render();
      };
    });
  }

  reset();

  return () => {
    active = false;
    if (aiTimeout) clearTimeout(aiTimeout);
  };
};