window.initTicTacToe = function initTicTacToe(stage) {
  let active = true;
  let aiTimeout = null;

  let cells = Array(9).fill(null);
  let gameMode = 'pve';
  let difficulty = 'normal';
  let playerSymbol = 'X';
  let currentTurn = 'X';
  let over = false;
  let winLine = [];
  let msg = '';
  let drawerOpen = false;
  let endModalOpen = false;
  let endModalTitle = '';

  function getAiSymbol() {
    return playerSymbol === 'X' ? 'O' : 'X';
  }

  function resetGame() {
    if (!active) return;
    if (aiTimeout) {
      clearTimeout(aiTimeout);
      aiTimeout = null;
    }
    cells = Array(9).fill(null);
    currentTurn = 'X';
    over = false;
    winLine = [];
    endModalOpen = false;
    updateStatus();
    render();
    if (gameMode === 'pve' && currentTurn !== playerSymbol && !over) {
      aiTimeout = setTimeout(() => {
        aiTimeout = null;
        aiStep();
      }, 350);
    }
  }

  function updateStatus() {
    if (over) return;
    if (gameMode === 'pvp') {
      msg = `Player ${currentTurn}'s Turn`;
    } else {
      msg = currentTurn === playerSymbol ? `Your Turn (${playerSymbol})` : 'AI Thinking...';
    }
  }

  function checkWinner(arr) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const line of lines) {
      const [a, b, c] = line;
      if (arr[a] && arr[a] === arr[b] && arr[a] === arr[c]) {
        return { winner: arr[a], line };
      }
    }
    if (arr.every(Boolean)) return { winner: 'draw', line: [] };
    return null;
  }

  function minimax(newCells, depth, isMaximizing, aiSym, humanSym) {
    const res = checkWinner(newCells);
    if (res) {
      if (res.winner === aiSym) return 10 - depth;
      if (res.winner === humanSym) return depth - 10;
      return 0;
    }
    const empty = newCells.map((v, i) => v === null ? i : null).filter(v => v !== null);
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const idx of empty) {
        newCells[idx] = aiSym;
        const evaluation = minimax(newCells, depth + 1, false, aiSym, humanSym);
        newCells[idx] = null;
        maxEval = Math.max(maxEval, evaluation);
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const idx of empty) {
        newCells[idx] = humanSym;
        const evaluation = minimax(newCells, depth + 1, true, aiSym, humanSym);
        newCells[idx] = null;
        minEval = Math.min(minEval, evaluation);
      }
      return minEval;
    }
  }

  function getBestMove(board, aiSym, humanSym) {
    let bestEval = -Infinity;
    let bestMove = null;
    const empty = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    for (const idx of empty) {
      board[idx] = aiSym;
      const evalScore = minimax(board, 0, false, aiSym, humanSym);
      board[idx] = null;
      if (evalScore > bestEval) {
        bestEval = evalScore;
        bestMove = idx;
      }
    }
    return bestMove;
  }

  function aiStep() {
    if (!active || over || gameMode !== 'pve') return;
    const aiSym = getAiSymbol();
    if (currentTurn !== aiSym) return;

    const empty = cells.map((v, i) => v === null ? i : null).filter(v => v !== null);
    if (!empty.length) return;

    let choice = null;
    if (difficulty === 'easy') {
      choice = empty[Math.floor(Math.random() * empty.length)];
    } else if (difficulty === 'normal') {
      if (Math.random() < 0.65) {
        for (const sym of [aiSym, playerSymbol]) {
          for (const idx of empty) {
            const copy = [...cells];
            copy[idx] = sym;
            if (checkWinner(copy)?.winner === sym) { choice = idx; break; }
          }
          if (choice !== null) break;
        }
      }
      if (choice === null) choice = empty[Math.floor(Math.random() * empty.length)];
    } else {
      choice = getBestMove([...cells], aiSym, playerSymbol);
    }

    if (choice !== null) {
      cells[choice] = aiSym;
      AudioFX.card();
      const res = checkWinner(cells);
      if (res) {
        finishGame(res);
      } else {
        currentTurn = playerSymbol;
        updateStatus();
        render();
      }
    }
  }

  function finishGame(res) {
    if (!active) return;
    over = true;
    winLine = res.line;
    if (res.winner === 'draw') {
      msg = 'Game Drawn — Stalemate!';
      endModalTitle = '🤝 Stalemate / Draw!';
    } else if (gameMode === 'pvp') {
      msg = `Player ${res.winner} Wins!`;
      endModalTitle = `🏆 Player ${res.winner} Wins!`;
    } else if (res.winner === playerSymbol) {
      msg = '🎉 Victory! You Win!';
      endModalTitle = '🎉 Victory! You Won!';
      AudioFX.win();
      addXP(30, window.innerWidth / 2, window.innerHeight / 2, 'VICTORY +30 XP!');
      window.ArcadeHero?.awardGameScore('tic-tac-toe', 50);
    } else {
      msg = 'AI Wins!';
      endModalTitle = '🤖 AI Wins! Better Luck Next Time';
      AudioFX.lose();
    }
    endModalOpen = true;
    render();
  }

  function render() {
    if (!active) return;
    stage.innerHTML = `
      <div class="relative w-full h-full flex flex-col items-center justify-between p-4 bg-[#f4f1ea] text-stone-900 select-none overflow-hidden">
        <div class="flex items-center justify-between w-full max-w-sm px-2 pt-1">
          <button id="hamburger-btn" class="w-10 h-10 rounded-xl bg-[#e6e2d3] border-2 border-[#d3c9b1] flex items-center justify-center text-stone-800 text-xl font-black shadow-sm hover:bg-[#d3c9b1] transition">
            ☰
          </button>
          <div class="text-xs font-extrabold uppercase tracking-widest text-stone-600 bg-[#e6e2d3] px-3 py-1.5 rounded-xl border border-[#d3c9b1]">
            ${gameMode === 'pvp' ? '👥 PvP' : `🤖 AI (${difficulty})`}
          </div>
        </div>

        <div class="text-lg font-black text-stone-800 tracking-wide text-center my-1">
          ${msg}
        </div>

        <div class="grid grid-cols-3 gap-3 w-[min(84vw,340px)] aspect-square bg-[#8c7b65] p-3 rounded-2xl shadow-xl border-4 border-[#6b5d4b] my-auto">
          ${cells.map((v, i) => {
            const isWin = winLine.includes(i);
            return `
              <button data-i="${i}" class="ttt-cell rounded-xl bg-[#fdfbf7] border-2 ${isWin ? 'border-amber-600 bg-amber-100 shadow-inner scale-[1.02]' : 'border-[#d3c9b1] hover:bg-white'} flex items-center justify-center font-black text-6xl sm:text-7xl transition shadow-sm">
                ${v === 'X' ? '<span class="text-blue-900 drop-shadow-sm">X</span>' : v === 'O' ? '<span class="text-red-700 drop-shadow-sm">O</span>' : ''}
              </button>
            `;
          }).join('')}
        </div>

        <div class="h-6"></div>

        <div id="settings-overlay" class="fixed inset-0 z-40 bg-stone-950/50 backdrop-blur-xs transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}"></div>

        <div id="settings-drawer" class="fixed top-0 bottom-0 left-0 z-50 w-[82%] max-w-xs bg-[#fdfbf7] border-r-4 border-[#8c7b65] p-6 shadow-2xl flex flex-col gap-5 transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto">
          <div class="flex items-center justify-between border-b border-[#d3c9b1] pb-3">
            <h2 class="text-lg font-black text-stone-900">⚙️ Game Settings</h2>
            <button id="ttt-close-drawer" class="w-8 h-8 rounded-full bg-[#d3c9b1] text-stone-900 font-bold flex items-center justify-center">✕</button>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-stone-700 uppercase tracking-wider">Game Mode</label>
            <div class="grid grid-cols-2 gap-2">
              <button id="ttt-mode-pve" type="button" class="py-2.5 px-2 rounded-xl font-bold text-xs border-2 transition ${gameMode === 'pve' ? 'bg-blue-900 text-white border-blue-900 shadow' : 'bg-[#f4f1ea] text-stone-800 border-[#d3c9b1]'}">
                🤖 vs AI
              </button>
              <button id="ttt-mode-pvp" type="button" class="py-2.5 px-2 rounded-xl font-bold text-xs border-2 transition ${gameMode === 'pvp' ? 'bg-blue-900 text-white border-blue-900 shadow' : 'bg-[#f4f1ea] text-stone-800 border-[#d3c9b1]'}">
                👥 PvP
              </button>
            </div>
          </div>

          <div id="ai-settings-section" class="flex flex-col gap-1.5 ${gameMode === 'pvp' ? 'hidden' : ''}">
            <label class="text-xs font-bold text-stone-700 uppercase tracking-wider">AI Difficulty</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button id="ttt-diff-easy" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition ${difficulty === 'easy' ? 'bg-amber-600 text-white border-amber-600' : 'bg-[#f4f1ea] text-stone-800 border-[#d3c9b1]'}">Easy</button>
              <button id="ttt-diff-normal" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition ${difficulty === 'normal' ? 'bg-amber-600 text-white border-amber-600' : 'bg-[#f4f1ea] text-stone-800 border-[#d3c9b1]'}">Normal</button>
              <button id="ttt-diff-hard" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition ${difficulty === 'hard' ? 'bg-amber-600 text-white border-amber-600' : 'bg-[#f4f1ea] text-stone-800 border-[#d3c9b1]'}">Hard</button>
            </div>
          </div>

          <div id="symbol-settings-section" class="flex flex-col gap-1.5 ${gameMode === 'pvp' ? 'hidden' : ''}">
            <label class="text-xs font-bold text-stone-700 uppercase tracking-wider">Play As</label>
            <div class="grid grid-cols-2 gap-2">
              <button id="ttt-sym-x" type="button" class="py-2.5 rounded-xl font-bold text-sm border-2 transition ${playerSymbol === 'X' ? 'bg-blue-900 text-white border-blue-900' : 'bg-[#f4f1ea] text-blue-900 border-[#d3c9b1]'}">X (First)</button>
              <button id="ttt-sym-o" type="button" class="py-2.5 rounded-xl font-bold text-sm border-2 transition ${playerSymbol === 'O' ? 'bg-red-700 text-white border-red-700' : 'bg-[#f4f1ea] text-red-700 border-[#d3c9b1]'}">O (Second)</button>
            </div>
          </div>

          <button id="ttt-apply-drawer" class="w-full py-3 mt-auto rounded-2xl bg-[#8c7b65] hover:bg-[#786955] text-white font-black text-sm shadow-md transition">
            Apply &amp; Restart ⚔️
          </button>
        </div>

        <div id="endgame-modal" class="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm ${endModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div class="max-w-sm w-full bg-[#fdfbf7] border-4 border-[#8c7b65] rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-5 animate-in fade-in zoom-in duration-200">
            <div class="text-4xl">👑</div>
            <h2 class="text-xl font-black text-stone-900">${endModalTitle}</h2>
            <p class="text-xs text-stone-600">Great match! Ready for another round?</p>
            <button id="ttt-restart-btn" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-black text-sm shadow-lg hover:opacity-95 transition">
              🔄 Restart Match
            </button>
          </div>
        </div>
      </div>
    `;

    const closeDrawer = () => { if (!active) return; drawerOpen = false; render(); };

    document.getElementById('hamburger-btn')?.addEventListener('click', () => { if (!active) return; drawerOpen = true; render(); });
    document.getElementById('ttt-close-drawer')?.addEventListener('click', closeDrawer);
    document.getElementById('settings-overlay')?.addEventListener('click', closeDrawer);

    document.getElementById('ttt-mode-pve')?.addEventListener('click', () => { if (!active) return; gameMode = 'pve'; render(); });
    document.getElementById('ttt-mode-pvp')?.addEventListener('click', () => { if (!active) return; gameMode = 'pvp'; render(); });

    document.getElementById('ttt-diff-easy')?.addEventListener('click', () => { if (!active) return; difficulty = 'easy'; render(); });
    document.getElementById('ttt-diff-normal')?.addEventListener('click', () => { if (!active) return; difficulty = 'normal'; render(); });
    document.getElementById('ttt-diff-hard')?.addEventListener('click', () => { if (!active) return; difficulty = 'hard'; render(); });

    document.getElementById('ttt-sym-x')?.addEventListener('click', () => { if (!active) return; playerSymbol = 'X'; render(); });
    document.getElementById('ttt-sym-o')?.addEventListener('click', () => { if (!active) return; playerSymbol = 'O'; render(); });

    document.getElementById('ttt-apply-drawer')?.addEventListener('click', () => { if (!active) return; drawerOpen = false; resetGame(); });
    document.getElementById('ttt-restart-btn')?.addEventListener('click', resetGame);

    document.querySelectorAll('.ttt-cell').forEach(btn => {
      btn.onclick = () => {
        if (!active || over || drawerOpen || endModalOpen) return;
        const i = Number(btn.dataset.i);
        if (cells[i] !== null) return;
        if (gameMode === 'pve' && currentTurn !== playerSymbol) return;

        cells[i] = currentTurn;
        AudioFX.click();
        const res = checkWinner(cells);
        if (res) {
          finishGame(res);
        } else {
          currentTurn = currentTurn === 'X' ? 'O' : 'X';
          updateStatus();
          render();

          if (gameMode === 'pve' && currentTurn !== playerSymbol && !over) {
            if (aiTimeout) clearTimeout(aiTimeout);
            aiTimeout = setTimeout(() => {
              aiTimeout = null;
              aiStep();
            }, 350);
          }
        }
      };
    });
  }

  resetGame();

  return () => {
    active = false;
    if (aiTimeout) clearTimeout(aiTimeout);
  };
};