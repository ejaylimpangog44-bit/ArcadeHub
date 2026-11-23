window.initBrickBreaker = function initBrickBreaker(stage) {
  let active = true;

  stage.innerHTML = `
    <div class="relative w-full h-full">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span id="bb-score" class="px-4 py-1.5 rounded-full bg-black/55 border border-sky-400/40 text-sky-200 font-black text-sm">🧱 SCORE: 0</span>
        <span class="px-3 py-1 rounded-full bg-black/55 border border-white/15 text-xs text-slate-300 font-bold">DRAG / MOVE POINTER</span>
      </div>
      <canvas id="bb-canvas" class="w-full h-full block touch-none"></canvas>
    </div>
  `;

  const canvas = document.getElementById('bb-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let paddleX = w / 2 - 55, paddleW = 110;
  let ball = { x: w / 2, y: h - 90, vx: 4.5, vy: -5, r: 9 };
  let bricks = [], score = 0, alive = true, raf;

  function buildBricks() {
    bricks = [];
    const cols = Math.max(5, Math.min(8, Math.floor((w - 40) / 72)));
    const gap = 8;
    const bw = (w - 40 - gap * (cols - 1)) / cols;
    const colors = ['#f43f5e', '#f97316', '#facc15', '#22c55e', '#38bdf8'];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: 20 + c * (bw + gap),
          y: 65 + r * 26,
          w: bw,
          h: 18,
          color: colors[r % colors.length],
          alive: true
        });
      }
    }
  }

  function reset() {
    if (!active) return;
    score = 0; alive = true;
    paddleW = Math.min(120, Math.max(85, w * 0.18));
    paddleX = w / 2 - paddleW / 2;
    ball = { x: w / 2, y: h - 90, vx: 4.5, vy: -5, r: 9 };
    buildBricks();
    const scoreEl = document.getElementById('bb-score');
    if (scoreEl) scoreEl.textContent = '🧱 SCORE: 0';
  }

  const onMove = (e) => {
    if (!active) return;
    const rect = canvas.getBoundingClientRect();
    paddleX = (e.clientX - rect.left) - paddleW / 2;
    paddleX = Math.max(10, Math.min(w - paddleW - 10, paddleX));
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', (e) => {
    if (!active) return;
    if (!alive) { reset(); return; }
    onMove(e);
  });

  const onResize = () => {
    if (!active) return;
    w = canvas.width = stage.clientWidth;
    h = canvas.height = stage.clientHeight;
  };
  window.addEventListener('resize', onResize);

  function loop() {
    if (!active) return;
    ctx.clearRect(0, 0, w, h);

    if (alive) {
      ball.x += ball.vx;
      ball.y += ball.vy;
      if (ball.x - ball.r < 0 || ball.x + ball.r > w) { ball.vx *= -1; AudioFX.click(); }
      if (ball.y - ball.r < 45) { ball.vy *= -1; AudioFX.click(); }

      if (ball.y + ball.r >= h - 42 && ball.y + ball.r <= h - 24 && ball.x >= paddleX && ball.x <= paddleX + paddleW) {
        ball.vy = -Math.abs(ball.vy);
        ball.vx = ((ball.x - (paddleX + paddleW / 2)) / (paddleW / 2)) * 6;
        AudioFX.card();
      }

      if (ball.y > h + 20) {
        alive = false;
        AudioFX.lose();
        window.ArcadeHero?.awardGameScore('brick-breaker', score);
      }

      bricks.forEach(b => {
        if (!b.alive) return;
        if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
          b.alive = false;
          ball.vy *= -1;
          score += 20;
          const scoreEl = document.getElementById('bb-score');
          if (scoreEl) scoreEl.textContent = `🧱 SCORE: ${score}`;
          AudioFX.coin();
          if (score % 100 === 0) addXP(20, b.x + b.w / 2, b.y, '+20 XP');
        }
      });

      if (bricks.every(b => !b.alive)) {
        AudioFX.win();
        addXP(50, w / 2, h / 2, 'STAGE CLEAR!');
        buildBricks();
      }
    }

    bricks.forEach(b => {
      if (!b.alive) return;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 5);
      ctx.fill();
    });

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(paddleX, h - 38, paddleW, 14, 7);
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.68)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 30px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`Final Score: ${score}`, w / 2, h / 2 - 12);
      ctx.font = '700 16px Inter';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Tap Canvas to Play Again', w / 2, h / 2 + 22);
    }

    raf = requestAnimationFrame(loop);
  }

  reset();
  loop();

  return () => {
    active = false;
    alive = false;
    cancelAnimationFrame(raf);
    canvas.removeEventListener('pointermove', onMove);
    window.removeEventListener('resize', onResize);
  };
};