window.initDama = function initDama(stage) {
  let active = true;
  let aiTimeout = null;

  let board = [], turn = 'r', sel = null, moves = [], vsAI = true, aiDifficulty = 'normal', status = 'Your Turn (Red Dama)';
  let redCaptured = 0, blueCaptured = 0, gameOver = false, winnerText = '';
  let settingsModalOpen = false;
  let configModalOpen = true;

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
    turn = 'r'; sel = null; moves = [];
    redCaptured = 0; blueCaptured = 0;
    gameOver = false; winnerText = '';
    status = vsAI ? 'Your Turn (Red Dama vs AI)' : 'Red Dama (Player 1) Turn';
    configModalOpen = false;
    settingsModalOpen = false;
    render();
  }

  function getPieceMoves(r, c, customBoard = board) {
    const p = customBoard[r][c];
    if (!p) return [];
    const res = [];
    const capDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const stepDirs = p.king ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : (p.side === 'r' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);

    capDirs.forEach(([dr, dc]) => {
      if (!p.king) {
        const mr = r + dr, mc = c + dc, jr = r + dr * 2, jc = c + dc * 2;
        if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && customBoard[mr][mc] && customBoard[mr][mc].side !== p.side && !customBoard[jr][jc]) {
          res.push({ dr: jr, dc: jc, cap: [mr, mc] });
        }
      } else {
        let step = 1, foundEnemy = null;
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
      triggerGameOver(vsAI ? '🤖 AI Wins!' : 'Blue Player Wins!');
      return true;
    }
    if (blueCount === 0 || (turn === 'b' && !blueHasMoves)) {
      triggerGameOver(vsAI ? '🎉 You Win!' : 'Red Player Wins!');
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
          getPieceMoves(r, c).forEach(m => all.push({ sr: r, sc: c, ...m }));
        }
      }
    }
    if (!all.length) {
      triggerGameOver('🎉 You Win!');
      return;
    }

    const caps = all.filter(m => m.cap);
    const pool = (aiDifficulty !== 'easy' && caps.length) ? caps : all;
    pool.sort((a, b) => scoreAiMove(b) - scoreAiMove(a));
    const pick = pool[0];

    const piece = board[pick.sr][pick.sc];
    board[pick.dr][pick.dc] = piece;
    board[pick.sr][pick.sc] = null;

    let chained = false;
    if (pick.cap) {
      board[pick.cap[0]][pick.cap[1]] = null;
      blueCaptured++;
      AudioFX.coin();
      const nextMoves = getPieceMoves(pick.dr, pick.dc).filter(m => m.cap);
      if (nextMoves.length > 0) chained = true;
    }

    if (pick.dr === 7) piece.king = true;
    AudioFX.card();

    if (checkWinCondition()) return;

    if (!chained) {
      turn = 'r';
      status = vsAI ? 'Your Turn (Red Dama)' : 'Red Dama (Player 1) Turn';
    } else {
      status = 'AI Chain Jumping!';
      if (aiTimeout) clearTimeout(aiTimeout);
      aiTimeout = setTimeout(() => {
        aiTimeout = null;
        aiTurn();
      }, 500);
    }
    render();
  }

  function render() {
    if (!active) return;
    stage.innerHTML = `
      <div class="relative w-full h-full flex flex-col items-center justify-between px-3 py-3 pb-16 sm:pb-6 select-none overflow-y-auto">
        <div class="flex items-center justify-between w-full max-w-[min(90vw,480px)] z-10">
          <button id="dama-menu" class="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg font-black shadow hover:bg-amber-900 transition cursor-pointer">
            ☰
          </button>
          <div class="px-4 py-1.5 rounded-xl bg-black/60 border border-amber-400/30 text-amber-200 font-bold text-xs shadow text-center truncate max-w-[220px]">
            ${status}
          </div>
          <button id="dama-reset-btn" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow cursor-pointer">
            Reset
          </button>
        </div>

        <div class="flex items-center gap-3 z-10">
          <span class="px-3 py-1 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 font-bold text-xs">🔴 Red: ${redCaptured}</span>
          <span class="px-3 py-1 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-200 font-bold text-xs">🔵 Blue: ${blueCaptured}</span>
        </div>

        <div class="grid grid-cols-8 aspect-square w-[min(88vw,440px)] rounded-3xl overflow-hidden border-4 border-[#3d1f0d] shadow-[0_20px_60px_rgba(0,0,0,0.8)] my-auto z-10">
          ${board.map((row, r) => row.map((cell, c) => {
            const dark = (r + c) % 2 === 1;
            const isSel = sel && sel[0] === r && sel[1] === c;
            const targetMove = moves.find(m => m.dr === r && m.dc === c);
            return `
              <button data-r="${r}" data-c="${c}" class="dm-sq relative flex items-center justify-center ${dark ? 'bg-[#5c3317]' : 'bg-[#deb887]'} ${isSel ? 'ring-inset ring-4 ring-amber-300' : ''}">
                ${cell ? `
                  <div class="w-[74%] h-[74%] rounded-full shadow-lg flex items-center justify-center font-black text-xs sm:text-sm border-2 ${cell.side === 'r' ? 'bg-gradient-to-br from-rose-500 to-red-800 border-rose-200 text-amber-200' : 'bg-gradient-to-br from-slate-700 to-slate-950 border-sky-300 text-sky-300'}">
                    ${cell.king ? '👑' : ''}
                  </div>
                ` : ''}
                ${targetMove ? `<span class="absolute w-4 h-4 rounded-full ${targetMove.cap ? 'bg-rose-500 animate-ping' : 'bg-emerald-400/80'}"></span>` : ''}
              </button>
            `;
          }).join('')).join('')}
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
      btn.onclick = () => {
        if (!active || gameOver) return;
        const r = Number(btn.dataset.r), c = Number(btn.dataset.c);
        const currentSide = turn;
        if (vsAI && currentSide !== 'r') return;

        const mv = moves.find(m => m.dr === r && m.dc === c);
        if (sel && mv) {
          const piece = board[sel[0]][sel[1]];
          board[r][c] = piece;
          board[sel[0]][sel[1]] = null;

          let chained = false;
          if (mv.cap) {
            board[mv.cap[0]][mv.cap[1]] = null;
            redCaptured++;
            AudioFX.coin();
            addXP(15, window.innerWidth / 2, window.innerHeight / 2, 'CAPTURE!');

            const nextMoves = getPieceMoves(r, c).filter(m => m.cap);
            if (nextMoves.length > 0) {
              chained = true;
              sel = [r, c];
              moves = nextMoves;
              status = 'Chain Jump! Pick target';
              AudioFX.click();
              render();
              return;
            }
          } else {
            AudioFX.card();
          }

          if (currentSide === 'r' && r === 0) piece.king = true;
          if (currentSide === 'b' && r === 7) piece.king = true;

          sel = null; moves = [];

          if (checkWinCondition()) return;

          if (!chained) {
            turn = currentSide === 'r' ? 'b' : 'r';
            status = vsAI ? 'Opponent moving...' : (turn === 'r' ? 'Red Dama (Player 1) Turn' : 'Blue Dama (Player 2) Turn');
          }
          render();

          if (vsAI && turn === 'b' && !gameOver) {
            if (aiTimeout) clearTimeout(aiTimeout);
            aiTimeout = setTimeout(() => {
              aiTimeout = null;
              aiTurn();
            }, 400);
          }
          return;
        }

        if (board[r][c]?.side === currentSide) {
          sel = [r, c];
          moves = getPieceMoves(r, c);
          AudioFX.click();
        } else {
          sel = null; moves = [];
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