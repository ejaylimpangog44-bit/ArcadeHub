window.initTicTacToe = function initTicTacToe(stage) {
  let active = true;
  let aiTimeout = null;
  let modalTimeout = null;

  const WINS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  // Coordinates (0-100 SVG space) for drawing the animated strike line
  const LINE_COORDS = {
    '0,1,2': { x1: 12, y1: 16.67, x2: 88, y2: 16.67 },
    '3,4,5': { x1: 12, y1: 50,    x2: 88, y2: 50 },
    '6,7,8': { x1: 12, y1: 83.33, x2: 88, y2: 83.33 },
    '0,3,6': { x1: 16.67, y1: 12, x2: 16.67, y2: 88 },
    '1,4,7': { x1: 50,    y1: 12, x2: 50,    y2: 88 },
    '2,5,8': { x1: 83.33, y1: 12, x2: 83.33, y2: 88 },
    '0,4,8': { x1: 14, y1: 14, x2: 86, y2: 86 },
    '2,4,6': { x1: 86, y1: 14, x2: 14, y2: 86 }
  };

  const THEMES = {
    neon: {
      name: 'Neon Cyber',
      boardBg: 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.22)]',
      cellBg: 'bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.45)]',
      winCell: 'ring-2 ring-inset ring-emerald-400 bg-emerald-950/60 shadow-[0_0_24px_rgba(52,211,153,0.45)]',
      xColor: '#38bdf8',
      xGlow: 'drop-shadow-[0_0_12px_rgba(56,189,248,0.85)]',
      oColor: '#fb7185',
      oGlow: 'drop-shadow-[0_0_12px_rgba(251,113,133,0.85)]',
      strikeColor: '#34d399'
    },
    royal: {
      name: 'Royal Gold',
      boardBg: 'bg-[#171324] border-amber-500/45 shadow-[0_20px_60px_rgba(0,0,0,0.75)]',
      cellBg: 'bg-[#221c35] hover:bg-[#2c2444] border border-amber-400/15 shadow-inner',
      winCell: 'ring-2 ring-inset ring-amber-400 bg-amber-950/50 shadow-[0_0_24px_rgba(251,191,36,0.45)]',
      xColor: '#fbbf24',
      xGlow: 'drop-shadow-[0_0_10px_rgba(251,191,36,0.75)]',
      oColor: '#c084fc',
      oGlow: 'drop-shadow-[0_0_10px_rgba(192,132,252,0.75)]',
      strikeColor: '#fde047'
    },
    classic: {
      name: 'Artisan Wood',
      boardBg: 'bg-[#6e5842] border-[#4b3b2b] shadow-[0_20px_60px_rgba(0,0,0,0.65)]',
      cellBg: 'bg-[#fbf7f0] hover:bg-white border border-[#d6c7b2] shadow-inner',
      winCell: 'ring-4 ring-inset ring-emerald-500 bg-emerald-50',
      xColor: '#1d4ed8',
      xGlow: 'drop-shadow-sm',
      oColor: '#dc2626',
      oGlow: 'drop-shadow-sm',
      strikeColor: '#10b981'
    }
  };

  // Game & Session State
  let board = Array(9).fill(null);
  let turn = 'X';
  let startingTurn = 'X';
  let alternateStarter = false;
  let gameMode = 'pve'; // 'pve' | 'pvp'
  let aiDifficulty = 'normal'; // 'easy' | 'normal' | 'hard'
  let themeKey = 'neon';
  let humanMark = 'X'; // Used in PvE ('X' or 'O')
  let lastMoveIdx = -1;

  let status = 'Your Turn (X)';
  let gameOver = false;
  let winLine = [];
  let settingsModalOpen = false;
  let resultModalOpen = false;
  let lastResultData = null;

  // Persistent Session Scoreboard
  const stats = {
    xWins: 0,
    oWins: 0,
    draws: 0,
    streak: 0
  };

  function openGameMenuModal() {
    if (!active) return;
    if (typeof AudioFX !== 'undefined') AudioFX.click();
    resultModalOpen = false;
    settingsModalOpen = true;
    render();
  }

  function closeGameMenuModal() {
    if (!active) return;
    if (typeof AudioFX !== 'undefined') AudioFX.click();
    settingsModalOpen = false;
    render();
  }

  // Listen for custom host/shell menu triggers if dispatched
  const onHostMenuEvent = () => openGameMenuModal();
  window.addEventListener('arcadehub:toggle-menu', onHostMenuEvent);
  window.addEventListener('arcadehub:open-settings', onHostMenuEvent);
  window.addEventListener('ttt:open-menu', onHostMenuEvent);

  // Bind top-right hamburger button outside `stage` if present
  function bindTopRightHamburger() {
    const candidates = Array.from(document.querySelectorAll('button, [role="button"]')).filter(el => {
      if (stage && stage.contains(el)) return false;
      const label = `${el.getAttribute('aria-label') || ''} ${el.title || ''} ${el.id || ''} ${el.className || ''}`.toLowerCase();
      const text = (el.textContent || '').trim();
      const isHamburgerIcon = text === '☰' || text === '≡' || label.includes('menu') || label.includes('hamburger') || label.includes('drawer');
      if (!isHamburgerIcon) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.top < window.innerHeight * 0.25 && rect.left > window.innerWidth * 0.5;
    });

    candidates.forEach(btn => {
      if (btn.dataset.tttMenuBound === '1') return;
      btn.dataset.tttMenuBound = '1';
      btn.addEventListener('click', (e) => {
        if (!active) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (settingsModalOpen) {
          closeGameMenuModal();
        } else {
          openGameMenuModal();
        }
      }, true);
    });
  }

  function injectStyles() {
    if (document.getElementById('ttt-enhanced-styles')) return;
    const style = document.createElement('style');
    style.id = 'ttt-enhanced-styles';
    style.textContent = `
      @keyframes tttPopIn {
        0% { transform: scale(0.45); opacity: 0; }
        70% { transform: scale(1.06); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes tttModalEnter {
        0% { transform: scale(0.92) translateY(12px); opacity: 0; }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }
      @keyframes tttDrawStroke {
        from { stroke-dashoffset: 140; }
        to { stroke-dashoffset: 0; }
      }
      .ttt-piece-anim {
        transform-origin: center;
        animation: tttPopIn 0.24s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      .ttt-modal-anim {
        animation: tttModalEnter 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .ttt-strike-line {
        stroke-dasharray: 140;
        stroke-dashoffset: 0;
        animation: tttDrawStroke 0.42s ease-out forwards;
      }
      .ttt-board-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
        width: 100%;
        height: 100%;
      }
      .ttt-cell {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        min-height: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
  }

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

  // Minimax with Alpha-Beta Pruning for Hard AI
  function minimax(b, depth, isMaximizing, aiMark, playerMark, alpha, beta) {
    const res = checkWinner(b);
    if (res) {
      if (res.winner === aiMark) return 100 - depth;
      if (res.winner === playerMark) return depth - 100;
      return 0;
    }

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] === null) {
          b[i] = aiMark;
          const score = minimax(b, depth + 1, false, aiMark, playerMark, alpha, beta);
          b[i] = null;
          best = Math.max(best, score);
          alpha = Math.max(alpha, best);
          if (beta <= alpha) break;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] === null) {
          b[i] = playerMark;
          const score = minimax(b, depth + 1, true, aiMark, playerMark, alpha, beta);
          b[i] = null;
          best = Math.min(best, score);
          beta = Math.min(beta, best);
          if (beta <= alpha) break;
        }
      }
      return best;
    }
  }

  function pickAiMove() {
    const aiMark = humanMark === 'X' ? 'O' : 'X';
    const empty = board.map((v, idx) => (v === null ? idx : -1)).filter(idx => idx !== -1);
    if (!empty.length) return -1;

    if (aiDifficulty === 'easy') {
      return empty[Math.floor(Math.random() * empty.length)];
    }

    for (const idx of empty) {
      const copy = [...board];
      copy[idx] = aiMark;
      if (checkWinner(copy)?.winner === aiMark) return idx;
    }

    for (const idx of empty) {
      const copy = [...board];
      copy[idx] = humanMark;
      if (checkWinner(copy)?.winner === humanMark) {
        if (aiDifficulty === 'normal' && Math.random() < 0.3) continue;
        return idx;
      }
    }

    if (aiDifficulty === 'normal') {
      if (board[4] === null && Math.random() < 0.65) return 4;
      return empty[Math.floor(Math.random() * empty.length)];
    }

    // Hard: optimal minimax
    if (empty.length === 9) {
      const openers = [0, 2, 4, 6, 8];
      return openers[Math.floor(Math.random() * openers.length)];
    }

    let bestScore = -Infinity;
    let bestMoves = [];
    for (const idx of empty) {
      const copy = [...board];
      copy[idx] = aiMark;
      const score = minimax(copy, 0, false, aiMark, humanMark, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [idx];
      } else if (score === bestScore) {
        bestMoves.push(idx);
      }
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  function updateTurnStatus() {
    if (gameMode === 'pve') {
      status = turn === humanMark
        ? `Your Turn (${humanMark})`
        : `AI Thinking (${turn})...`;
    } else {
      status = `Player ${turn}'s Turn`;
    }
  }

  function startNewRound(toggleStarter = false) {
    if (!active) return;
    if (aiTimeout) {
      clearTimeout(aiTimeout);
      aiTimeout = null;
    }
    if (modalTimeout) {
      clearTimeout(modalTimeout);
      modalTimeout = null;
    }

    if (toggleStarter && alternateStarter) {
      startingTurn = startingTurn === 'X' ? 'O' : 'X';
    }

    board = Array(9).fill(null);
    turn = startingTurn;
    gameOver = false;
    winLine = [];
    lastMoveIdx = -1;
    settingsModalOpen = false;
    resultModalOpen = false;
    lastResultData = null;

    updateTurnStatus();
    render();

    if (gameMode === 'pve' && turn !== humanMark) {
      aiTimeout = setTimeout(() => {
        aiTimeout = null;
        runAiTurn();
      }, 360);
    }
  }

  function finishRound(result) {
    gameOver = true;
    winLine = result.line || [];

    const diffMultiplier = { easy: 1, normal: 1.35, hard: 1.8 }[aiDifficulty] || 1;
    let modalPayload = {
      outcome: 'draw',
      badge: 'STALEMATE',
      icon: '🤝',
      title: 'Draw Match!',
      subtitle: 'Evenly matched — neither side gave an inch.',
      xpText: '+15 XP',
      accentClass: 'from-amber-400 to-orange-500',
      borderClass: 'border-amber-400/50',
      glowClass: 'shadow-[0_0_60px_rgba(251,191,36,0.25)]'
    };

    if (result.winner === 'DRAW') {
      stats.draws += 1;
      stats.streak = 0;
      status = 'Draw Match!';
      if (typeof AudioFX !== 'undefined') AudioFX.click();
      if (typeof addXP === 'function') addXP(15, window.innerWidth / 2, window.innerHeight / 2, 'DRAW +15 XP');
    } else {
      if (result.winner === 'X') stats.xWins += 1;
      if (result.winner === 'O') stats.oWins += 1;

      if (gameMode === 'pve') {
        const playerWon = result.winner === humanMark;
        if (playerWon) {
          stats.streak += 1;
          const xpEarned = Math.round(45 * diffMultiplier);
          const scoreEarned = Math.round(120 * diffMultiplier);
          status = '🎉 Victory!';
          if (typeof AudioFX !== 'undefined') AudioFX.win();
          if (typeof addXP === 'function') addXP(xpEarned, window.innerWidth / 2, window.innerHeight / 2, `VICTORY +${xpEarned} XP!`);
          window.ArcadeHero?.awardGameScore('tictactoe', scoreEarned);

          modalPayload = {
            outcome: 'win',
            badge: stats.streak > 1 ? `🔥 ${stats.streak} WIN STREAK` : 'VICTORY',
            icon: '🏆',
            title: 'You Won!',
            subtitle: `Defeated ${aiDifficulty.toUpperCase()} AI playing as ${humanMark}.`,
            xpText: `+${xpEarned} XP • +${scoreEarned} PTS`,
            accentClass: 'from-emerald-400 to-teal-500',
            borderClass: 'border-emerald-400/60',
            glowClass: 'shadow-[0_0_70px_rgba(16,185,129,0.35)]'
          };
        } else {
          stats.streak = 0;
          status = '🤖 AI Wins!';
          if (typeof AudioFX !== 'undefined') AudioFX.lose();

          modalPayload = {
            outcome: 'lose',
            badge: 'DEFEAT',
            icon: '🤖',
            title: 'AI Takes the Round',
            subtitle: `The ${aiDifficulty.toUpperCase()} AI outmaneuvered you this time.`,
            xpText: '+5 XP',
            accentClass: 'from-rose-500 to-red-600',
            borderClass: 'border-rose-500/50',
            glowClass: 'shadow-[0_0_60px_rgba(244,63,94,0.3)]'
          };
        }
      } else {
        stats.streak += 1;
        status = `🎉 Player ${result.winner} Wins!`;
        if (typeof AudioFX !== 'undefined') AudioFX.win();
        if (typeof addXP === 'function') addXP(35, window.innerWidth / 2, window.innerHeight / 2, `PLAYER ${result.winner} WINS!`);
        window.ArcadeHero?.awardGameScore('tictactoe', 100);

        modalPayload = {
          outcome: 'win',
          badge: '2P PVP MATCH',
          icon: '👑',
          title: `Player ${result.winner} Wins!`,
          subtitle: `Commanding three-in-a-row victory for ${result.winner}.`,
          xpText: '+35 XP • +100 PTS',
          accentClass: 'from-sky-400 to-indigo-500',
          borderClass: 'border-sky-400/60',
          glowClass: 'shadow-[0_0_65px_rgba(56,189,248,0.35)]'
        };
      }
    }

    lastResultData = modalPayload;
    render();

    modalTimeout = setTimeout(() => {
      if (!active || !gameOver) return;
      resultModalOpen = true;
      render();
    }, 580);
  }

  function runAiTurn() {
    if (!active || gameOver || gameMode !== 'pve' || turn === humanMark) return;
    const idx = pickAiMove();
    if (idx === -1) return;

    const aiMark = humanMark === 'X' ? 'O' : 'X';
    board[idx] = aiMark;
    lastMoveIdx = idx;
    if (typeof AudioFX !== 'undefined') AudioFX.card();

    const res = checkWinner(board);
    if (res) {
      finishRound(res);
      return;
    }

    turn = humanMark;
    updateTurnStatus();
    render();
  }

  function renderMarkSVG(mark, theme, isGhost = false) {
    const animClass = isGhost ? 'opacity-0 group-hover:opacity-25 transition-opacity duration-150' : 'ttt-piece-anim';
    if (mark === 'X') {
      return `
        <svg viewBox="0 0 100 100" class="w-[58%] h-[58%] shrink-0 pointer-events-none ${animClass} ${isGhost ? '' : theme.xGlow}" fill="none">
          <path d="M24 24 L76 76 M76 24 L24 76" stroke="${theme.xColor}" stroke-width="13" stroke-linecap="round" />
        </svg>
      `;
    }
    if (mark === 'O') {
      return `
        <svg viewBox="0 0 100 100" class="w-[58%] h-[58%] shrink-0 pointer-events-none ${animClass} ${isGhost ? '' : theme.oGlow}" fill="none">
          <circle cx="50" cy="50" r="28" stroke="${theme.oColor}" stroke-width="13" />
        </svg>
      `;
    }
    return '';
  }

  function renderStrikeOverlay(theme) {
    if (!winLine || winLine.length !== 3) return '';
    const key = winLine.join(',');
    const coords = LINE_COORDS[key];
    if (!coords) return '';
    return `
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="pointer-events-none absolute inset-0 w-full h-full z-20">
        <line
          x1="${coords.x1}" y1="${coords.y1}"
          x2="${coords.x2}" y2="${coords.y2}"
          stroke="${theme.strikeColor}"
          stroke-width="4.5"
          stroke-linecap="round"
          class="ttt-strike-line"
          style="filter: drop-shadow(0 0 8px ${theme.strikeColor});"
        />
      </svg>
    `;
  }

  function render() {
    if (!active) return;
    injectStyles();

    const theme = THEMES[themeKey] || THEMES.neon;
    const modeBadge = gameMode === 'pve'
      ? `🤖 AI • ${aiDifficulty.toUpperCase()}`
      : '👥 2P LOCAL PVP';

    const canHumanMove = !gameOver && !settingsModalOpen && !resultModalOpen && (gameMode === 'pvp' || turn === humanMark);
    const lockScroll = settingsModalOpen || resultModalOpen;

    stage.innerHTML = `
      <div class="relative w-full h-full flex flex-col items-center justify-between px-4 py-4 pb-16 sm:pb-6 select-none ${lockScroll ? 'overflow-hidden' : 'overflow-y-auto'}">
        
        <!-- Top Clean HUD -->
        <div class="w-full max-w-[min(92vw,420px)] shrink-0 flex flex-col items-center gap-3 z-10 pt-1">
          
          <!-- Mode & Streak Badge -->
          <div class="flex items-center justify-center gap-2">
            <div class="px-4 py-1.5 rounded-full bg-slate-900/85 border border-amber-400/35 text-amber-200 font-extrabold text-xs tracking-wider shadow-lg">
              ${modeBadge}
            </div>
            ${stats.streak >= 2 ? `
              <div class="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-xs tracking-wide shadow">
                🔥 ${stats.streak} Streak
              </div>
            ` : ''}
          </div>

          <!-- Scoreboard Cards -->
          <div class="grid grid-cols-3 gap-2.5 w-full">
            <div class="rounded-2xl px-3 py-2 bg-slate-900/80 border ${turn === 'X' && !gameOver ? 'border-sky-400/70 shadow-[0_0_16px_rgba(56,189,248,0.25)]' : 'border-white/10'} flex flex-col items-center transition">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">
                ${gameMode === 'pve' ? (humanMark === 'X' ? 'You (X)' : 'AI (X)') : 'Player X'}
              </span>
              <span class="text-lg sm:text-xl font-black text-white leading-tight">${stats.xWins}</span>
            </div>

            <div class="rounded-2xl px-3 py-2 bg-slate-900/80 border border-white/10 flex flex-col items-center">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Draws</span>
              <span class="text-lg sm:text-xl font-black text-slate-200 leading-tight">${stats.draws}</span>
            </div>

            <div class="rounded-2xl px-3 py-2 bg-slate-900/80 border ${turn === 'O' && !gameOver ? 'border-rose-400/70 shadow-[0_0_16px_rgba(251,113,133,0.25)]' : 'border-white/10'} flex flex-col items-center transition">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-rose-400">
                ${gameMode === 'pve' ? (humanMark === 'O' ? 'You (O)' : 'AI (O)') : 'Player O'}
              </span>
              <span class="text-lg sm:text-xl font-black text-white leading-tight">${stats.oWins}</span>
            </div>
          </div>

          <!-- Live Turn Status Banner -->
          <div class="px-4 py-1 rounded-full bg-white/5 border border-white/10">
            <span class="text-sm sm:text-base font-black tracking-wide text-white drop-shadow">${status}</span>
          </div>
        </div>

        <!-- Fixed-Aspect Game Board -->
        <div class="relative aspect-square shrink-0 w-[min(86vw,375px)] h-[min(86vw,375px)] p-3.5 rounded-3xl border-2 ${theme.boardBg} my-auto z-10 overflow-hidden transition-colors duration-300">
          ${renderStrikeOverlay(theme)}
          <div class="ttt-board-grid">
            ${board.map((cell, idx) => {
              const isWinCell = winLine.includes(idx);
              const isLastMove = idx === lastMoveIdx && !gameOver;
              const cellContent = cell
                ? renderMarkSVG(cell, theme, false)
                : (canHumanMove ? renderMarkSVG(turn, theme, true) : '');

              return `
                <button
                  data-idx="${idx}"
                  type="button"
                  ${cell !== null || !canHumanMove ? 'disabled' : ''}
                  class="ttt-cell group rounded-2xl ${theme.cellBg} transition-colors duration-150 ${canHumanMove && cell === null ? 'cursor-pointer' : 'cursor-default'} ${isWinCell ? theme.winCell : ''} ${isLastMove ? 'ring-1 ring-inset ring-white/30' : ''}"
                  aria-label="Board cell ${idx + 1}"
                >
                  ${cellContent}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Subtle Footer Hint -->
        <div class="shrink-0 text-[11px] font-semibold text-slate-400/80 tracking-wide z-10">
          Open the top-right menu (☰) for mode, AI, theme &amp; match options
        </div>

        <!-- END-OF-GAME / WIN / LOSE / DRAW MODAL OVERLAY -->
        <div id="ttt-result-backdrop" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md ${resultModalOpen && lastResultData ? 'flex' : 'hidden'} items-center justify-center p-4">
          ${lastResultData ? `
            <div class="relative ttt-modal-anim max-w-sm w-full bg-slate-900/95 border-2 ${lastResultData.borderClass} ${lastResultData.glowClass} rounded-3xl p-6 flex flex-col items-center text-center gap-4">
              
              <!-- Small Eye Button in Top-Right of Card -->
              <button
                id="ttt-view-board-btn"
                type="button"
                title="View Board"
                aria-label="View Board"
                class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-xs leading-none transition active:scale-95 cursor-pointer"
              >👁️</button>

              <div class="px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-black tracking-widest uppercase text-amber-300">
                ${lastResultData.badge}
              </div>

              <div class="w-20 h-20 rounded-3xl bg-gradient-to-br ${lastResultData.accentClass} flex items-center justify-center text-4xl shadow-xl">
                ${lastResultData.icon}
              </div>

              <div class="flex flex-col gap-1">
                <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">${lastResultData.title}</h2>
                <p class="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">${lastResultData.subtitle}</p>
              </div>

              <div class="px-4 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs font-extrabold text-emerald-300 tracking-wide">
                ${lastResultData.xpText}
              </div>

              <!-- Mini Session Recap inside Modal -->
              <div class="grid grid-cols-3 gap-2 w-full pt-1">
                <div class="bg-black/40 rounded-xl py-2 border border-white/5">
                  <div class="text-[10px] font-bold text-sky-400 uppercase">X Wins</div>
                  <div class="text-base font-black text-white">${stats.xWins}</div>
                </div>
                <div class="bg-black/40 rounded-xl py-2 border border-white/5">
                  <div class="text-[10px] font-bold text-slate-400 uppercase">Draws</div>
                  <div class="text-base font-black text-white">${stats.draws}</div>
                </div>
                <div class="bg-black/40 rounded-xl py-2 border border-white/5">
                  <div class="text-[10px] font-bold text-rose-400 uppercase">O Wins</div>
                  <div class="text-base font-black text-white">${stats.oWins}</div>
                </div>
              </div>

              <div class="w-full pt-2">
                <button id="ttt-play-again-btn" type="button" class="w-full py-3.5 rounded-2xl bg-gradient-to-r ${lastResultData.accentClass} text-slate-950 font-black text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-[0.98] transition cursor-pointer">
                  Play Next Round ⚔️
                </button>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- HAMBURGER MENU / TIC-TAC-TOE SETUP MODAL -->
        <div id="ttt-settings-backdrop" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md ${settingsModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4">
          <div id="ttt-settings-modal" class="ttt-modal-anim max-w-sm w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 class="text-lg font-black text-amber-400">☰ Tic-Tac-Toe Setup</h2>
              <button id="ttt-close-settings" type="button" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold flex items-center justify-center transition cursor-pointer" aria-label="Close menu">✕</button>
            </div>

            <!-- Game Mode -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Game Mode</label>
              <div class="grid grid-cols-2 gap-2">
                <button id="ttt-mode-pve" type="button" class="py-2.5 px-3 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pve' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">🤖 vs AI</button>
                <button id="ttt-mode-pvp" type="button" class="py-2.5 px-3 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${gameMode === 'pvp' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">👥 2P Local PvP</button>
              </div>
            </div>

            <!-- Player Mark (PvE) -->
            <div class="flex flex-col gap-1.5 ${gameMode === 'pvp' ? 'hidden' : ''}">
              <label class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Your Mark</label>
              <div class="grid grid-cols-2 gap-2">
                <button id="ttt-mark-x" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${humanMark === 'X' ? 'bg-sky-500 text-slate-950 border-sky-300 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Play as X (1st)</button>
                <button id="ttt-mark-o" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${humanMark === 'O' ? 'bg-rose-500 text-white border-rose-300 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Play as O (2nd)</button>
              </div>
            </div>

            <!-- AI Difficulty (3 Modes: Easy, Normal, Hard) -->
            <div id="ttt-ai-diff" class="flex flex-col gap-1.5 ${gameMode === 'pvp' ? 'hidden' : ''}">
              <label class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">AI Difficulty</label>
              <div class="grid grid-cols-3 gap-2">
                <button id="ttt-diff-easy" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'easy' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Easy</button>
                <button id="ttt-diff-normal" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'normal' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Normal</button>
                <button id="ttt-diff-hard" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${aiDifficulty === 'hard' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Hard</button>
              </div>
            </div>

            <!-- Board Theme -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Arena Theme</label>
              <div class="grid grid-cols-3 gap-2">
                <button id="ttt-theme-neon" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${themeKey === 'neon' ? 'bg-cyan-400 text-slate-950 border-cyan-200 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Neon</button>
                <button id="ttt-theme-royal" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${themeKey === 'royal' ? 'bg-amber-400 text-slate-950 border-amber-200 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Royal</button>
                <button id="ttt-theme-classic" type="button" class="py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${themeKey === 'classic' ? 'bg-emerald-400 text-slate-950 border-emerald-200 shadow' : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/5'}">Wood</button>
              </div>
            </div>

            <!-- Turn Rotation Option -->
            <label class="flex items-center justify-between px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 cursor-pointer">
              <span class="text-xs font-bold text-slate-200">Alternate first move each round</span>
              <input id="ttt-alt-starter" type="checkbox" ${alternateStarter ? 'checked' : ''} class="w-4 h-4 accent-amber-400 cursor-pointer" />
            </label>

            <div class="flex flex-col gap-2 pt-1">
              <button id="ttt-apply-settings" type="button" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg hover:brightness-105 active:scale-[0.99] transition cursor-pointer">
                Start New Match ⚔️
              </button>
              <button id="ttt-reset-scores" type="button" class="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs transition cursor-pointer">
                Reset Session Scores
              </button>
            </div>

            <div id="ttt-settings-extra"></div>
          </div>
        </div>
      </div>
    `;

    bindTopRightHamburger();

    // Attach host footer actions if present in global arcade wrapper
    const tttSettingsExtra = document.getElementById('ttt-settings-extra');
    if (typeof window.attachGameSettingsFooterActions === 'function' && tttSettingsExtra) {
      window.attachGameSettingsFooterActions(tttSettingsExtra, {
        onCloseDrawer: () => {
          closeGameMenuModal();
        }
      });
    }

    // Result Modal Event Listeners
    const playAgainBtn = document.getElementById('ttt-play-again-btn');
    if (playAgainBtn) {
      playAgainBtn.onclick = () => {
        if (!active) return;
        if (typeof AudioFX !== 'undefined') AudioFX.click();
        startNewRound(true);
      };
    }

    const viewBoardBtn = document.getElementById('ttt-view-board-btn');
    if (viewBoardBtn) {
      viewBoardBtn.onclick = () => {
        if (!active) return;
        if (typeof AudioFX !== 'undefined') AudioFX.click();
        resultModalOpen = false;
        status = 'Round Complete — Tap Board for Next Round';
        render();
      };
    }

    // Hamburger / Setup Modal Event Listeners
    document.getElementById('ttt-close-settings').onclick = () => {
      closeGameMenuModal();
    };

    document.getElementById('ttt-settings-backdrop').onclick = (e) => {
      if (!active || e.target.id !== 'ttt-settings-backdrop') return;
      closeGameMenuModal();
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

    document.getElementById('ttt-mark-x').onclick = () => {
      if (!active) return;
      humanMark = 'X';
      startingTurn = 'X';
      render();
    };

    document.getElementById('ttt-mark-o').onclick = () => {
      if (!active) return;
      humanMark = 'O';
      startingTurn = 'X';
      render();
    };

    ['easy', 'normal', 'hard'].forEach(diff => {
      const btn = document.getElementById(`ttt-diff-${diff}`);
      if (btn) {
        btn.onclick = () => {
          if (!active) return;
          aiDifficulty = diff;
          render();
        };
      }
    });

    ['neon', 'royal', 'classic'].forEach(t => {
      const btn = document.getElementById(`ttt-theme-${t}`);
      if (btn) {
        btn.onclick = () => {
          if (!active) return;
          themeKey = t;
          render();
        };
      }
    });

    document.getElementById('ttt-alt-starter').onchange = (e) => {
      alternateStarter = e.target.checked;
    };

    document.getElementById('ttt-apply-settings').onclick = () => {
      if (!active) return;
      if (typeof AudioFX !== 'undefined') AudioFX.click();
      startingTurn = 'X';
      startNewRound(false);
    };

    document.getElementById('ttt-reset-scores').onclick = () => {
      if (!active) return;
      if (typeof AudioFX !== 'undefined') AudioFX.click();
      stats.xWins = 0;
      stats.oWins = 0;
      stats.draws = 0;
      stats.streak = 0;
      startNewRound(false);
    };

    // Board Cell Clicks
    document.querySelectorAll('.ttt-cell').forEach(btn => {
      btn.onclick = () => {
        if (!active || settingsModalOpen || resultModalOpen) return;

        if (gameOver) {
          startNewRound(true);
          return;
        }

        if (gameMode === 'pve' && turn !== humanMark) return;

        const idx = Number(btn.dataset.idx);
        if (board[idx] !== null) return;

        board[idx] = turn;
        lastMoveIdx = idx;
        if (typeof AudioFX !== 'undefined') AudioFX.card();

        const res = checkWinner(board);
        if (res) {
          finishRound(res);
          return;
        }

        if (gameMode === 'pve') {
          turn = humanMark === 'X' ? 'O' : 'X';
          updateTurnStatus();
          render();
          if (aiTimeout) clearTimeout(aiTimeout);
          aiTimeout = setTimeout(() => {
            aiTimeout = null;
            runAiTurn();
          }, 300);
        } else {
          turn = turn === 'X' ? 'O' : 'X';
          updateTurnStatus();
          render();
        }
      };
    });
  }

  startNewRound(false);

  return () => {
    active = false;
    window.removeEventListener('arcadehub:toggle-menu', onHostMenuEvent);
    window.removeEventListener('arcadehub:open-settings', onHostMenuEvent);
    window.removeEventListener('ttt:open-menu', onHostMenuEvent);
    if (aiTimeout) clearTimeout(aiTimeout);
    if (modalTimeout) clearTimeout(modalTimeout);
  };
};