window.initCyberSnakePreserved = function initCyberSnakePreserved(stage) {
  let active = true;

  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 overflow-hidden select-none flex flex-col items-center justify-center">
      <div class="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <span class="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold shadow">🐍 Organic Snake</span>
        <span class="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold shadow">SCORE: <span id="snake-score">0</span></span>
      </div>

      <canvas id="snake-canvas" class="absolute inset-0 w-full h-full block touch-none cursor-crosshair"></canvas>

      <div class="absolute bottom-3 left-0 right-0 z-20 text-center pointer-events-none">
        <span class="px-3 py-1 rounded-full bg-slate-900/70 border border-white/10 text-[11px] text-slate-400 font-semibold shadow">Swipe anywhere on screen to steer</span>
      </div>
    </div>
  `;

  const canvas = document.getElementById('snake-canvas');
  const ctx = canvas.getContext('2d');

  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;
  const grid = 20;

  let count = 0;
  let score = 0;
  let running = true;

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

  let apple = {
    x: Math.floor(Math.random() * Math.floor(w / grid)) * grid,
    y: Math.floor(Math.random() * Math.floor(h / grid)) * grid
  };

  function spawnApple() {
    apple.x = Math.floor(Math.random() * Math.floor(w / grid)) * grid;
    apple.y = Math.floor(Math.random() * Math.floor(h / grid)) * grid;
  }

  function resetSnake() {
    if (!active) return;
    score = 0;
    const scoreEl = document.getElementById('snake-score');
    if (scoreEl) scoreEl.textContent = score;
    snake.x = Math.floor((w / 2) / grid) * grid;
    snake.y = Math.floor((h / 2) / grid) * grid;
    snake.dx = grid;
    snake.dy = 0;
    snake.nextDx = grid;
    snake.nextDy = 0;
    snake.cells = [];
    snake.maxLen = 5;
    spawnApple();
    running = true;
  }

  const onResize = () => {
    if (!active) return;
    w = canvas.width = stage.clientWidth;
    h = canvas.height = stage.clientHeight;
  };
  window.addEventListener('resize', onResize);

  let animId;
  function loop() {
    if (!active) return;
    animId = requestAnimationFrame(loop);
    if (!running) return;
    if (++count < 6) return;
    count = 0;

    snake.dx = snake.nextDx;
    snake.dy = snake.nextDy;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += grid) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += grid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    snake.x += snake.dx;
    snake.y += snake.dy;

    if (snake.x < 0 || snake.x >= canvas.width || snake.y < 0 || snake.y >= canvas.height) {
      AudioFX.lose();
      if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
      window.ArcadeHero?.awardGameScore('snake', score);
      resetSnake();
      return;
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
      const scoreEl = document.getElementById('snake-score');
      if (scoreEl) scoreEl.textContent = score;
      addXP(15, apple.x, apple.y, '+15 XP');
      AudioFX.coin();
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

      for (let i = index + 1; i < snake.cells.length; i++) {
        if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
          AudioFX.lose();
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          window.ArcadeHero?.awardGameScore('snake', score);
          resetSnake();
        }
      }
    });
  }

  const setDir = (newDx, newDy) => {
    if (newDx !== -snake.dx || newDy !== -snake.dy) {
      snake.nextDx = newDx;
      snake.nextDy = newDy;
    }
  };

  const handleKey = (e) => {
    if (!active) return;
    if (['ArrowUp', 'KeyW'].includes(e.code) && snake.dy === 0) setDir(0, -grid);
    else if (['ArrowDown', 'KeyS'].includes(e.code) && snake.dy === 0) setDir(0, grid);
    else if (['ArrowLeft', 'KeyA'].includes(e.code) && snake.dx === 0) setDir(-grid, 0);
    else if (['ArrowRight', 'KeyD'].includes(e.code) && snake.dx === 0) setDir(grid, 0);
  };
  window.addEventListener('keydown', handleKey);

  let touchStartX = 0, touchStartY = 0;

  const onTouchStart = (e) => {
    if (!active) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
  };

  const onTouchEnd = (e) => {
    if (!active) return;
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
    touchStartX = 0; touchStartY = 0;
    e.preventDefault();
  };

  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });

  animId = requestAnimationFrame(loop);

  return () => {
    active = false;
    running = false;
    window.removeEventListener('keydown', handleKey);
    window.removeEventListener('resize', onResize);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchend', onTouchEnd);
    cancelAnimationFrame(animId);
  };
};