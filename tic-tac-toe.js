window.initTicTacToe = function initTicTacToe(stage) {
  let active = true;
  let aiTimeout = null;

  const WINS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  let board = Array(9).fill(null);
  let turn = 'X';
  let gameMode = 'pve';
  let aiDifficulty = 'normal';
  let status = 'Your Turn (X)';
  let gameOver = false;
  let winLine = [];
  let settingsModalOpen = false;

  function checkWinner(b) {
    for (const line of WINS) {
      const [a, c, d] = line;
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return { winner: b[a], line };
      }
    }
    if (b.every(cell => cell !== null)) {
      return { winner: 'DRAW', line: [] };
    }
    return null;
  }

  function reset() {
    if (!active) return;
    if (aiTimeout) {
      clearTimeout(aiTimeout);
      aiTimeout = null;
    }
    board = Array(9).fill(null);
    turn = 'X';
    gameOver = false;
    winLine = [];
    settingsModalOpen = false;
    status = gameMode === 'pve' ? 'Your Turn (X)' : 'Player X Turn';
    render();
  }

  function pickAiMove() {
    const empty = board.map((v, idx) => (v === null ? idx : -1)).filter(idx => idx !== -1);
    if (!empty.length) return -1;

    if (aiDifficulty === 'easy') {
      return empty[Math.floor(Math.random() * empty.length)];
    }

    for (const idx of empty) {
      const copy = [...board];
      copy[idx] = 'O';
      if (checkWinner(copy)?.winner === 'O') return idx;
    }

    for (const idx of empty) {
      const copy = [...board];
      copy[idx] = 'X';
      if (checkWinner(copy)?.winner === 'X') {
        if (aiDifficulty === 'normal' && Math.random() < 0.35) continue;
        return idx;
      }
    }

    if (aiDifficulty === 'hard') {
      if (board[4] === null) return 4;
      const corners = [0, 2, 6, 8].filter(i => board[i] === null);
      if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    }

    return empty[Math.floor(Math.random() * empty.length)];
  }

  function finishRound(result) {
    gameOver = true;
    winLine = result.line || [];

    if (result.winner === 'DRAW') {
      status = 'Draw Game!';
      if (typeof AudioFX !== 'undefined') AudioFX.click();
      if (typeof addXP === 'function') addXP(15, window.innerWidth / 2, window.innerHeight / 2, 'DRAW +15 XP');
    } else if (gameMode === 'pve') {
      if (result.winner === 'X') {
        status = '🎉 You Win!';
        if (typeof AudioFX !== 'undefined') AudioFX.win();
        if (typeof addXP === 'function') addXP(45, window.innerWidth / 2, window.innerHeight / 2, 'VICTORY +45 XP!');
        window.ArcadeHero?.awardGameScore('tictactoe', 120);
      } else {
        status = '🤖 AI Wins!';
        if (typeof AudioFX !== 'undefined') AudioFX.lose();
      }
    } else {
      status = `🎉 Player ${result.winner} Wins!`;
      if (typeof AudioFX !== 'undefined') AudioFX.win();
      if (typeof addXP === 'function') addXP(35, window.innerWidth / 2, window.innerHeight / 2, `PLAYER ${result.winner} WINS!`);
      window.ArcadeHero?.awardGameScore('tictactoe', 100);
    }
    render();
  }

  function runAiTurn() {
    if (!active || gameOver || gameMode !== 'pve' || turn !== 'O') return;
    const idx = pickAiMove();
    if (idx === -1) return;

    board[idx] = 'O';
    if (typeof AudioFX !== 'undefined') AudioFX.card();

    const res = checkWinner(board);
    if (res) {
      finishRound(res);
      return;
    }

    turn = 'X';
    status = 'Your Turn (X)';
    render();
  }

  function render() {
    if (!active) return;

    const modeBadge = gameMode === 'pve'
      ? `🤖 AI (${aiDifficulty.toUpperCase()})`
      : '👥 2P PVP';

    stage.innerHTML = `
      <div class="relative w-full h-full flex flex-col items-center justify-between px-4 py-4 pb-16 sm:pb-6 select-none overflow-y-auto">
        <div class="flex items-center justify-between w-full max-w-[min(92vw,420px)] z-10">
          <button id="ttt-menu" type="button" class="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg font-black shadow hover:bg-amber-900 transition cursor-pointer" aria-label="Open Tic-Tac-Toe settings">
            ☰
          </button>

          <div class="px-3.5 py-1.5 rounded-full bg-black/60 border border-amber-400/30 text-amber-200 font-extrabold text-xs tracking-wide shadow">
            ${modeBadge}
          </div>

          <button id="ttt-reset-btn" type="button" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow cursor-pointer">
            Reset
          </button>
        </div>

        <div class="text-center z-10 mt-2">
          <div class="text-base sm:text-lg font-black text-white drop-shadow">${status}</div>
        </div>

        <div class="grid grid-cols-3 gap-3 aspect-square w-[min(84vw,360px)] p-3.5 rounded-3xl bg-[#7b6752] border-4 border-[#5a4a3a] shadow-[0_20px_60px_rgba(0,0,0,0.65)] my-auto z-10">
          ${board.map((cell, idx) => {
            const isWinCell = winLine.includes(idx);
            const markHtml = cell === 'X'
              ? '<span class="text-4xl sm:text-5xl font-black text-blue-700">X</span>'
              : (cell === 'O'
                ? '<span class="text-4xl sm:text-5xl font-black text-red-700">O</span>'
                : '');

            return `
              <button data-idx="${idx}" type="button" class="ttt-cell rounded-2xl bg-[#fbf8f3] hover:bg-white flex items-center justify-center shadow-inner transition active:scale-95 cursor-pointer ${isWinCell ? 'ring-4 ring-emerald-400 bg-emerald-50' : ''}">
                ${markHtml}
              </button>
            `;
          }).join('')}
        </div>

        <div class="h-4 z-10"></div>

        <div id="ttt-settings-backdrop" class="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md ${settingsModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div id="ttt-settings-modal" class="max-w-sm w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[88vh] overflow-y-auto">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 class="text-lg font-black text-amber-400">⚙️ Tic-Tac-Toe Settings</h2>
              <button id="ttt-close-settings" type="button" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold flex items-center justify-center transition cursor-pointer" aria-label="Close settings">✕</button>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">Game Mode</label>
              <div class="grid grid-cols-2 gap-2.5">
                <button id="ttt-mode-pve" type="button" class="py-2.5 px-3 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pve' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">🤖 vs AI</button>
                <button id="ttt-mode-pvp" type="button" class="py-2.5 px-3 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pvp' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">👥 2P PvP</button>
              </div>
            </div>

            <div id="ttt-ai-diff" class="flex flex-col gap-2 ${gameMode === 'pvp' ? 'hidden' : ''}">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Difficulty</label>
              <div class="grid grid-cols-3 gap-2">
                <button id="ttt-diff-easy" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'easy' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Easy</button>
                <button id="ttt-diff-normal" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'normal' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Normal</button>
                <button id="ttt-diff-hard" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'hard' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Hard</button>
              </div>
            </div>

            <button id="ttt-apply-settings" type="button" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg hover:brightness-105 active:scale-[0.99] transition cursor-pointer">
              Apply &amp; Restart Match ⚔️
            </button>

            <div id="ttt-settings-extra"></div>
          </div>
        </div>
      </div>
    `;

    const tttSettingsExtra = document.getElementById('ttt-settings-extra');
    if (typeof window.attachGameSettingsFooterActions === 'function' && tttSettingsExtra) {
      window.attachGameSettingsFooterActions(tttSettingsExtra, {
        onCloseDrawer: () => {
          if (!active) return;
          settingsModalOpen = false;
          render();
        }
      });
    }

    document.getElementById('ttt-menu').onclick = () => {
      if (!active) return;
      if (typeof AudioFX !== 'undefined') AudioFX.click();
      settingsModalOpen = true;
      render();
    };

    document.getElementById('ttt-reset-btn').onclick = () => {
      if (!active) return;
      if (typeof AudioFX !== 'undefined') AudioFX.click();
      reset();
    };

    document.getElementById('ttt-close-settings').onclick = () => {
      if (!active) return;
      if (typeof AudioFX !== 'undefined') AudioFX.click();
      settingsModalOpen = false;
      render();
    };

    document.getElementById('ttt-settings-backdrop').onclick = (e) => {
      if (!active || e.target.id !== 'ttt-settings-backdrop') return;
      settingsModalOpen = false;
      render();
    };

    document.getElementById('ttt-mode-pve').onclick = () => {
      if (!active) return;
      gameMode = 'pve';
      render();
    };

    document.getElementById('ttt-mode-pvp').onclick = () => {
      if (!active) return;
      gameMode = 'pvp';
      render();
    };

    document.getElementById('ttt-diff-easy').onclick = () => {
      if (!active) return;
      aiDifficulty = 'easy';
      render();
    };

    document.getElementById('ttt-diff-normal').onclick = () => {
      if (!active) return;
      aiDifficulty = 'normal';
      render();
    };

    document.getElementById('ttt-diff-hard').onclick = () => {
      if (!active) return;
      aiDifficulty = 'hard';
      render();
    };

    document.getElementById('ttt-apply-settings').onclick = () => {
      if (!active) return;
      reset();
    };

    document.querySelectorAll('.ttt-cell').forEach(btn => {
      btn.onclick = () => {
        if (!active || gameOver || settingsModalOpen) return;
        if (gameMode === 'pve' && turn !== 'X') return;

        const idx = Number(btn.dataset.idx);
        if (board[idx] !== null) return;

        board[idx] = turn;
        if (typeof AudioFX !== 'undefined') AudioFX.card();

        const res = checkWinner(board);
        if (res) {
          finishRound(res);
          return;
        }

        if (gameMode === 'pve') {
          turn = 'O';
          status = 'AI thinking...';
          render();
          if (aiTimeout) clearTimeout(aiTimeout);
          aiTimeout = setTimeout(() => {
            aiTimeout = null;
            runAiTurn();
          }, 260);
        } else {
          turn = turn === 'X' ? 'O' : 'X';
          status = `Player ${turn} Turn`;
          render();
        }
      };
    });
  }

  reset();

  return () => {
    active = false;
    if (aiTimeout) clearTimeout(aiTimeout);
  };
};