window.initStickRun = function initStickRun(stage) {
  let active = true;

  stage.innerHTML = `
    <div class="relative w-full h-full">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span id="sr-score" class="px-4 py-1.5 rounded-full bg-black/55 border border-lime-400/40 text-lime-200 font-black text-sm">🏃 RUN: 0</span>
        <span class="px-3 py-1 rounded-full bg-black/55 border border-white/15 text-xs text-lime-100 font-bold">TAP OR SPACE TO JUMP</span>
      </div>
      <canvas id="sr-canvas" class="w-full h-full block touch-none"></canvas>
    </div>
  `;

  const canvas = document.getElementById('sr-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let groundY = h - 75;
  let py = groundY, vy = 0, grounded = true, obstacles = [], score = 0, spawnTimer = 0, alive = true, raf;

  function jump() {
    if (!active) return;
    if (!alive) {
      py = groundY; vy = 0; grounded = true; obstacles = []; score = 0; spawnTimer = 0; alive = true;
      return;
    }
    if (grounded) {
      vy = -14.5;
      grounded = false;
      AudioFX.jump();
    }
  }

  canvas.addEventListener('pointerdown', jump);
  const onKey = (e) => { if (!active) return; if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); } };
  window.addEventListener('keydown', onKey);
  const onResize = () => {
    if (!active) return;
    w = canvas.width = stage.clientWidth;
    h = canvas.height = stage.clientHeight;
    groundY = h - 75;
    if (grounded) py = groundY;
  };
  window.addEventListener('resize', onResize);

  function loop() {
    if (!active) return;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#365314';
    ctx.fillRect(0, groundY + 24, w, h - groundY);
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(0, groundY + 20, w, 6);

    if (alive) {
      score++;
      if (score % 8 === 0) {
        const scoreEl = document.getElementById('sr-score');
        if (scoreEl) scoreEl.textContent = `🏃 RUN: ${Math.floor(score / 8)}`;
      }
      if (score % 240 === 0) addXP(15, 140, groundY - 40, '+15 XP');

      vy += 0.68;
      py += vy;
      if (py >= groundY) { py = groundY; vy = 0; grounded = true; }

      spawnTimer++;
      if (spawnTimer > 75 + Math.random() * 55) {
        spawnTimer = 0;
        const tall = Math.random() < 0.35;
        obstacles.push({ x: w + 30, w: tall ? 24 : 28, h: tall ? 46 : 30 });
      }
    }

    const px = 90;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(px, py - 24, 9, 0, Math.PI * 2);
    ctx.moveTo(px, py - 15); ctx.lineTo(px, py + 6);
    ctx.moveTo(px - 10, py - 8); ctx.lineTo(px + 10, py - 8);
    const legSwing = grounded ? Math.sin(score * 0.25) * 8 : 6;
    ctx.moveTo(px, py + 6); ctx.lineTo(px - legSwing, py + 22);
    ctx.moveTo(px, py + 6); ctx.lineTo(px + legSwing, py + 22);
    ctx.stroke();

    const speed = 6.5 + Math.min(7, score / 500);
    obstacles.forEach(o => {
      if (alive) o.x -= speed;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.roundRect(o.x, groundY + 22 - o.h, o.w, o.h, 5);
      ctx.fill();

      if (alive && px + 10 > o.x && px - 10 < o.x + o.w && py + 20 > groundY + 22 - o.h) {
        alive = false;
        AudioFX.lose();
        window.ArcadeHero?.awardGameScore('stick-run', Math.floor(score / 8));
      }
    });
    obstacles = obstacles.filter(o => o.x > -60);

    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 30px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`Run Score: ${Math.floor(score / 8)}`, w / 2, h / 2 - 12);
      ctx.font = '700 16px Inter';
      ctx.fillStyle = '#bef264';
      ctx.fillText('Tap or Press Space to Run Again', w / 2, h / 2 + 22);
    }

    raf = requestAnimationFrame(loop);
  }
  loop();

  return () => {
    active = false;
    alive = false;
    cancelAnimationFrame(raf);
    canvas.removeEventListener('pointerdown', jump);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  };
};