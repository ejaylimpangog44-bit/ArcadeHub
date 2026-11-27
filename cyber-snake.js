window.initCyberSnakePreserved = function initCyberSnakePreserved(stage) {
  let active = true;

  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 overflow-hidden select-none flex flex-col items-center justify-center">
      <div class="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <span class="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold shadow">🐍 Organic Snake</span>
        <span class="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold shadow">SCORE: <span id="snake-score">0</span></span>
      </div>

      <canvas id="snake-canvas" class="absolute inset-0 w-full h-full block touch-none cursor-crosshair"></canvas>

      <div id="snake-death-modal" class="hidden absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-rose-500/40 rounded-2xl px-8 py-6 text-center shadow-2xl max-w-sm w-full text-white">
          <h1 class="text-2xl font-extrabold text-rose-400 tracking-tight m-0"><b>Snake Died</b></h1><br>
          <p class="text-xs font-mono text-slate-400 mb-4">Final Score: <span id="snake-final-score" class="text-amber-300 font-bold">0</span></p>
          <button
            id="btnTryAgain"
            type="button"
            class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-sm transition cursor-pointer shadow-lg"
          >Try again</button>
        </div>
      </div>

      <div class="absolute bottom-3 left-0 right-0 z-20 text-center pointer-events-none">
        <span class="px-3 py-1 rounded-full bg-slate-900/70 border border-white/10 text-[11px] text-slate-400 font-semibold shadow">Swipe anywhere on screen to steer</span>
      </div>
    </div>
  `;

  const canvas = document.getElementById('snake-canvas');
  const ctx = canvas.getContext('2d');
  const deathModal = document.getElementById('snake-death-modal');
  const finalScoreEl = document.getElementById('snake-final-score');
  const btnTryAgain = document.getElementById('btnTryAgain');

  const grid = 20;
  // Time-based step interval (ms) for consistent speed in fullscreen & high-Hz displays
  const STEP_INTERVAL = 115;

  let w = (canvas.width = Math.max(grid, stage.clientWidth));
  let h = (canvas.height = Math.max(grid, stage.clientHeight));

  let score = 0;
  let running = true;
  let lastTimestamp = null;
  let elapsedMs = 0;

  let snake = {
    x: Math.floor((w / 2) / grid) * grid,
    y: Math.floor((h / 2) / grid) * grid,
    dx: grid,
    dy: 0,
    nextDx: grid,
    nextDy: 0,
    cells: [],
    maxLen: 5
  };

  let apple = { x: grid * 2, y: grid * 2 };

  function updateScoreDisplay(val) {
    const scoreEl = document.getElementById('snake-score');
    if (scoreEl) scoreEl.textContent = val;
  }

  function spawnApple() {
    const cols = Math.max(1, Math.floor(w / grid));
    const rows = Math.max(1, Math.floor(h / grid));

    let candidateX = Math.floor(Math.random() * cols) * grid;
    let candidateY = Math.floor(Math.random() * rows) * grid;
    let attempts = 0;

    while (
      attempts < 100 &&
      snake.cells.some((cell) => cell.x === candidateX && cell.y === candidateY)
    ) {
      candidateX = Math.floor(Math.random() * cols) * grid;
      candidateY = Math.floor(Math.random() * rows) * grid;
      attempts++;
    }

    apple.x = candidateX;
    apple.y = candidateY;
  }

  function hideDeathModal() {
    if (deathModal) deathModal.classList.add('hidden');
  }

  function showDeathModal() {
    if (finalScoreEl) finalScoreEl.textContent = score;
    if (deathModal) deathModal.classList.remove('hidden');
  }

  function handleSnakeDeath() {
    if (!active || !running) return;
    running = false;
    elapsedMs = 0;
    lastTimestamp = null;

    if (typeof AudioFX !== 'undefined' && AudioFX.lose) AudioFX.lose();
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
    window.ArcadeHero?.awardGameScore?.('snake', score);
    showDeathModal();
  }

  function resetSnake() {
    if (!active) return;
    hideDeathModal();
    score = 0;
    updateScoreDisplay(score);

    w = canvas.width = Math.max(grid, stage.clientWidth);
    h = canvas.height = Math.max(grid, stage.clientHeight);

    snake.x = Math.floor((w / 2) / grid) * grid;
    snake.y = Math.floor((h / 2) / grid) * grid;
    snake.dx = grid;
    snake.dy = 0;
    snake.nextDx = grid;
    snake.nextDy = 0;
    snake.cells = [];
    snake.maxLen = 5;

    spawnApple();
    elapsedMs = 0;
    lastTimestamp = null;
    running = true;
  }

  const onTryAgainClick = () => {
    resetSnake();
  };
  btnTryAgain?.addEventListener('click', onTryAgainClick);

  const onResize = () => {
    if (!active) return;
    w = canvas.width = Math.max(grid, stage.clientWidth);
    h = canvas.height = Math.max(grid, stage.clientHeight);

    // Keep apple inside bounds after resizing (e.g. entering/exiting fullscreen)
    const maxX = Math.max(0, (Math.floor(w / grid) - 1) * grid);
    const maxY = Math.max(0, (Math.floor(h / grid) - 1) * grid);
    if (apple.x > maxX || apple.y > maxY) {
      spawnApple();
    }
  };
  window.addEventListener('resize', onResize);

  function stepGame() {
    snake.dx = snake.nextDx;
    snake.dy = snake.nextDy;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    snake.x += snake.dx;
    snake.y += snake.dy;

    if (snake.x < 0 || snake.x >= canvas.width || snake.y < 0 || snake.y >= canvas.height) {
      handleSnakeDeath();
      return;
    }

    // Self-collision check against existing body cells
    for (let i = 0; i < snake.cells.length; i++) {
      if (snake.x === snake.cells[i].x && snake.y === snake.cells[i].y) {
        handleSnakeDeath();
        return;
      }
    }

    snake.cells.unshift({ x: snake.x, y: snake.y });
    if (snake.cells.length > snake.maxLen) snake.cells.pop();

    const ax = apple.x + grid / 2;
    const ay = apple.y + grid / 2;
    ctx.save();
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 15;
    const grad = ctx.createRadialGradient(ax - 2, ay - 2, 2, ax, ay, grid / 2);
    grad.addColorStop(0, '#fda4af');
    grad.addColorStop(1, '#e11d48');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ax, ay, grid / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (snake.x === apple.x && snake.y === apple.y) {
      snake.maxLen++;
      score += 10;
      updateScoreDisplay(score);
      if (typeof addXP === 'function') addXP(15, apple.x, apple.y, '+15 XP');
      if (typeof AudioFX !== 'undefined' && AudioFX.coin) AudioFX.coin();
      spawnApple();
    }

    snake.cells.forEach((cell, index) => {
      const isHead = index === 0;
      const cx = cell.x + grid / 2;
      const cy = cell.y + grid / 2;
      const radius = isHead ? 10 : Math.max(5, 9 - index * 0.1);

      ctx.save();
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = isHead ? 12 : 4;

      const sGrad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, radius);
      if (isHead) {
        sGrad.addColorStop(0, '#34d399');
        sGrad.addColorStop(1, '#047857');
      } else {
        sGrad.addColorStop(0, '#10b981');
        sGrad.addColorStop(1, '#065f46');
      }

      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isHead) {
        ctx.fillStyle = '#0f172a';
        let eyeOffsetX1 = 3, eyeOffsetY1 = -4;
        let eyeOffsetX2 = 3, eyeOffsetY2 = 4;
        if (snake.dx < 0) { eyeOffsetX1 = -3; eyeOffsetX2 = -3; }
        if (snake.dy < 0) { eyeOffsetX1 = -4; eyeOffsetX2 = 4; eyeOffsetY1 = -3; eyeOffsetY2 = -3; }
        if (snake.dy > 0) { eyeOffsetX1 = -4; eyeOffsetX2 = 4; eyeOffsetY1 = 3; eyeOffsetY2 = 3; }

        ctx.beginPath();
        ctx.arc(cx + eyeOffsetX1, cy + eyeOffsetY1, 1.8, 0, Math.PI * 2);
        ctx.arc(cx + eyeOffsetX2, cy + eyeOffsetY2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  let animId;
  function loop(timestamp) {
    if (!active) return;
    animId = requestAnimationFrame(loop);

    if (!running) {
      lastTimestamp = timestamp;
      return;
    }

    if (lastTimestamp === null) {
      lastTimestamp = timestamp;
    }

    const delta = Math.min(timestamp - lastTimestamp, 250);
    lastTimestamp = timestamp;
    elapsedMs += delta;

    while (elapsedMs >= STEP_INTERVAL && running) {
      elapsedMs -= STEP_INTERVAL;
      stepGame();
    }
  }

  const setDir = (newDx, newDy) => {
    if (newDx !== -snake.dx || newDy !== -snake.dy) {
      snake.nextDx = newDx;
      snake.nextDy = newDy;
    }
  };

  const handleKey = (e) => {
    if (!active) return;
    if (!running && deathModal && !deathModal.classList.contains('hidden')) {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        resetSnake();
        return;
      }
    }
    if (['ArrowUp', 'KeyW'].includes(e.code) && snake.dy === 0) setDir(0, -grid);
    else if (['ArrowDown', 'KeyS'].includes(e.code) && snake.dy === 0) setDir(0, grid);
    else if (['ArrowLeft', 'KeyA'].includes(e.code) && snake.dx === 0) setDir(-grid, 0);
    else if (['ArrowRight', 'KeyD'].includes(e.code) && snake.dx === 0) setDir(grid, 0);
  };
  window.addEventListener('keydown', handleKey);

  let touchStartX = 0, touchStartY = 0;

  const onTouchStart = (e) => {
    if (!active || !running) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
  };

  const onTouchEnd = (e) => {
    if (!active || !running) return;
    if (!touchStartX || !touchStartY) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) setDir(grid, 0);
      else setDir(-grid, 0);
    } else {
      if (diffY > 0) setDir(0, grid);
      else setDir(0, -grid);
    }
    touchStartX = 0;
    touchStartY = 0;
    e.preventDefault();
  };

  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });

  spawnApple();
  animId = requestAnimationFrame(loop);

  return () => {
    active = false;
    running = false;
    btnTryAgain?.removeEventListener('click', onTryAgainClick);
    window.removeEventListener('keydown', handleKey);
    window.removeEventListener('resize', onResize);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchend', onTouchEnd);
    cancelAnimationFrame(animId);
  };
};