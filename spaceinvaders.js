function initSpaceInvaders(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span id="si-score" class="px-4 py-1.5 rounded-full bg-black/60 border border-cyan-400/40 text-cyan-300 font-black text-sm">SCORE: 0</span>
        <span id="si-lives" class="px-4 py-1.5 rounded-full bg-black/60 border border-rose-400/40 text-rose-300 font-black text-sm">♥♥♥</span>
      </div>
      <canvas id="si-canvas" class="w-full h-full block touch-none"></canvas>
    </div>
  `;
  const canvas = document.getElementById('si-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let player = { x: w / 2, y: h - 70, w: 44, h: 24 };
  let bullets = [], aliens = [], score = 0, alive = true, raf;

  function reset() {
    player.x = w / 2; bullets = []; score = 0; alive = true;
    aliens = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        aliens.push({ x: 60 + c * 50, y: 70 + r * 40, w: 32, h: 24, alive: true });
      }
    }
  }
  reset();

  canvas.onpointermove = (e) => { player.x = Math.max(30, Math.min(w - 30, e.offsetX)); };
  canvas.onpointerdown = () => {
    if (!alive) { reset(); return; }
    bullets.push({ x: player.x, y: player.y - 15, vy: -9 });
    if (typeof AudioFX !== 'undefined') AudioFX.click();
  };

  function loop() {
    ctx.clearRect(0, 0, w, h);
    bullets.forEach(b => { b.y += b.vy; });
    bullets = bullets.filter(b => b.y > 0);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(player.x - player.w / 2, player.y, player.w, player.h);

    bullets.forEach(b => {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(b.x - 2, b.y, 4, 12);
    });

    aliens.forEach(a => {
      if (!a.alive) return;
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(a.x, a.y, a.w, a.h);

      bullets.forEach(b => {
        if (b.x > a.x && b.x < a.x + a.w && b.y > a.y && b.y < a.y + a.h) {
          a.alive = false;
          b.dead = true;
          score += 100;
          document.getElementById('si-score').textContent = `SCORE: ${score}`;
          if (typeof AudioFX !== 'undefined') AudioFX.coin();
        }
      });
    });
    bullets = bullets.filter(b => !b.dead);

    raf = requestAnimationFrame(loop);
  }
  loop();

  return () => { cancelAnimationFrame(raf); };
}
