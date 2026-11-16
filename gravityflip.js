function initGravityFlip(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span id="gf-score" class="px-4 py-1.5 rounded-full bg-black/60 border border-violet-400/40 text-violet-200 font-black text-sm">⚡ DIST: 0m</span>
        <span class="px-3 py-1 rounded-full bg-black/60 border border-white/20 text-white text-xs font-bold">TAP TO FLIP</span>
      </div>
      <canvas id="gf-canvas" class="w-full h-full block touch-none cursor-pointer"></canvas>
    </div>
  `;
  const canvas = document.getElementById('gf-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let player = { x: 100, y: h * 0.75, r: 16, flipped: false };
  let obstacles = [], shards = [], dist = 0, score = 0, alive = true, raf;

  function reset() {
    player.y = h * 0.75; player.flipped = false;
    obstacles = []; shards = []; dist = 0; score = 0; alive = true;
  }

  function flip() {
    if (!alive) { reset(); return; }
    player.flipped = !player.flipped;
    if (typeof AudioFX !== 'undefined') AudioFX.jump();
  }

  canvas.onpointerdown = flip;
  const onResize = () => { w = canvas.width = stage.clientWidth; h = canvas.height = stage.clientHeight; };
  window.addEventListener('resize', onResize);

  function loop() {
    ctx.clearRect(0, 0, w, h);
    const speed = 6 + Math.min(6, dist / 400);

    if (alive) {
      dist += 1;
      score += 2;
      if (dist % 10 === 0) document.getElementById('gf-score').textContent = `⚡ DIST: ${dist}m`;

      if (Math.random() < 0.025) {
        const top = Math.random() < 0.5;
        obstacles.push({ x: w + 40, y: top ? 0 : h - 60, w: 32, h: 60 });
      }
      if (Math.random() < 0.03) {
        shards.push({ x: w + 40, y: h * (0.2 + Math.random() * 0.6) });
      }
    }

    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, w, 24);
    ctx.fillRect(0, h - 24, w, 24);

    obstacles.forEach(o => {
      if (alive) o.x -= speed;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.roundRect(o.x, o.y, o.w, o.h, 6);
      ctx.fill();

      if (alive && Math.abs(player.x - (o.x + o.w / 2)) < 24 && Math.abs(player.y - (o.y + o.h / 2)) < 35) {
        alive = false;
        if (typeof AudioFX !== 'undefined') AudioFX.lose();
      }
    });
    obstacles = obstacles.filter(o => o.x > -50);

    shards.forEach(s => {
      if (alive) s.x -= speed;
      ctx.font = '22px Inter';
      ctx.fillText('💎', s.x, s.y);
      if (alive && Math.hypot(s.x - player.x, s.y - player.y) < 28) {
        s.collected = true;
        score += 50;
        if (typeof AudioFX !== 'undefined') AudioFX.coin();
      }
    });
    shards = shards.filter(s => s.x > -40 && !s.collected);

    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 28px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`Gravity Failure — ${dist}m`, w / 2, h / 2 - 15);
      ctx.font = '700 16px Inter';
      ctx.fillStyle = '#fde047';
      ctx.fillText('Tap to Re-engage', w / 2, h / 2 + 20);
    } else {
      if (player.flipped) {
        player.y = Math.max(40, player.y - 12);
      } else {
        player.y = Math.min(h - 40, player.y + 12);
      }
    }

    raf = requestAnimationFrame(loop);
  }
  loop();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}
