function initZombieSurvival(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span id="zs-score" class="px-4 py-1.5 rounded-full bg-black/60 border border-emerald-400/40 text-emerald-300 font-black text-sm">SURVIVED ARENA</span>
        <span id="zs-hp" class="px-4 py-1.5 rounded-full bg-black/60 border border-rose-400/40 text-rose-300 font-black text-sm">❤️ 100%</span>
      </div>
      <canvas id="zs-canvas" class="w-full h-full block touch-none"></canvas>
    </div>
  `;
  const canvas = document.getElementById('zs-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let player = { x: w / 2, y: h / 2 };
  let zombies = [], bullets = [], raf;

  canvas.onpointerdown = (e) => {
    const angle = Math.atan2(e.offsetY - player.y, e.offsetX - player.x);
    bullets.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8 });
    if (typeof AudioFX !== 'undefined') AudioFX.hit();
  };

  function loop() {
    ctx.clearRect(0, 0, w, h);
    if (Math.random() < 0.04) {
      zombies.push({ x: Math.random() < 0.5 ? -20 : w + 20, y: Math.random() * h, speed: 1.8 });
    }

    zombies.forEach(z => {
      const angle = Math.atan2(player.y - z.y, player.x - z.x);
      z.x += Math.cos(angle) * z.speed;
      z.y += Math.sin(angle) * z.speed;

      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(z.x, z.y, 14, 0, Math.PI * 2); ctx.fill();
    });

    bullets.forEach(b => {
      b.x += b.vx; b.y += b.vy;
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(player.x, player.y, 16, 0, Math.PI * 2); ctx.fill();

    raf = requestAnimationFrame(loop);
  }
  loop();

  return () => { cancelAnimationFrame(raf); };
}
