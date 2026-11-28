(function () {
  window.ArcadeHubGames = window.ArcadeHubGames || {};

  function mount(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width || 900;
    const H = canvas.height || 540;
    canvas.width = W;
    canvas.height = H;

    let rafId = null;
    let score = 0;
    let angle = -0.65;
    let power = 13;
    let wind = (Math.random() - 0.5) * 0.14;
    let projectile = null;
    let target = { x: W - 130, y: H - 115, r: 24 };

    function fire() {
      if (projectile) return;
      projectile = {
        x: 110,
        y: H - 115,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power
      };
    }

    function onKeyDown(e) {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') angle = Math.max(-1.4, angle - 0.05);
      if (e.code === 'ArrowDown' || e.code === 'KeyS') angle = Math.min(-0.1, angle + 0.05);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') power = Math.min(20, power + 0.5);
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') power = Math.max(6, power - 0.5);
      if (e.code === 'Space') fire();
    }

    function onPointerDown(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * W;
      const my = ((e.clientY - rect.top) / rect.height) * H;
      angle = Math.max(-1.4, Math.min(-0.1, Math.atan2(my - (H - 115), mx - 110)));
      fire();
    }

    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('pointerdown', onPointerDown);

    function update() {
      if (!projectile) return;
      projectile.vx += wind;
      projectile.vy += 0.34;
      projectile.x += projectile.vx;
      projectile.y += projectile.vy;

      if (Math.hypot(projectile.x - target.x, projectile.y - target.y) < target.r + 8) {
        score += 150;
        opts.onScore && opts.onScore(score);
        target.x = 520 + Math.random() * (W - 600);
        wind = (Math.random() - 0.5) * 0.18;
        projectile = null;
        return;
      }

      if (projectile.y > H - 80 || projectile.x > W || projectile.x < 0) {
        projectile = null;
      }
    }

    function draw() {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, H - 80, W, 80);

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      let px = 110;
      let py = H - 115;
      let pvx = Math.cos(angle) * power;
      let pvy = Math.sin(angle) * power;
      ctx.moveTo(px, py);
      for (let i = 0; i < 24; i++) {
        pvx += wind;
        pvy += 0.34;
        px += pvx;
        py += pvy;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(92, H - 115, 36, 35);

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
      ctx.fill();

      if (projectile) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`SCORE: ${score}   WIND: ${wind.toFixed(2)}   (Arrows/Click to Aim, Space to Fire)`, 18, 28);
    }

    function loop() {
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    return {
      destroy() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('keydown', onKeyDown);
        canvas.removeEventListener('pointerdown', onPointerDown);
      }
    };
  }

  window.ArcadeHubGames['siege-ballista'] = { name: 'Siege Ballista', mount };
})();