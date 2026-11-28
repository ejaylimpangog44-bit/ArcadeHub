(function () {
  window.ArcadeHubGames = window.ArcadeHubGames || {};

  function mount(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width || 900;
    const H = canvas.height || 540;
    canvas.width = W;
    canvas.height = H;

    const floorY = H - 64;
    let rafId = null;
    let score = 0;
    let thrusting = false;
    let crashed = false;
    const player = { x: 150, y: floorY - 20, vy: 0 };
    const zappers = Array.from({ length: 3 }, (_, i) => ({
      x: W + i * 320,
      y: 150 + i * 95,
      len: 110,
      angle: 0.4
    }));

    function onDown() { thrusting = true; }
    function onUp() { thrusting = false; }
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

    function update() {
      if (crashed) return;
      player.vy += thrusting ? -0.62 : 0.48;
      player.vy = Math.max(-8.5, Math.min(8.5, player.vy));
      player.y += player.vy;

      if (player.y > floorY - 16) {
        player.y = floorY - 16;
        player.vy = 0;
      }
      if (player.y < 24) {
        player.y = 24;
        player.vy = 0;
      }

      score += 1;
      opts.onScore && opts.onScore(score);

      zappers.forEach((z) => {
        z.x -= 6.2;
        if (z.x < -120) {
          z.x = W + 140;
          z.y = 120 + Math.random() * (floorY - 220);
        }
        const x1 = z.x - Math.cos(z.angle) * (z.len / 2);
        const y1 = z.y - Math.sin(z.angle) * (z.len / 2);
        const x2 = z.x + Math.cos(z.angle) * (z.len / 2);
        const y2 = z.y + Math.sin(z.angle) * (z.len / 2);

        const segLenSq = (x2 - x1) ** 2 + (y2 - y1) ** 2 || 1;
        const t = Math.max(0, Math.min(1, ((player.x - x1) * (x2 - x1) + (player.y - y1) * (y2 - y1)) / segLenSq));
        const projX = x1 + t * (x2 - x1);
        const projY = y1 + t * (y2 - y1);
        if (Math.hypot(player.x - projX, player.y - projY) < 18) {
          crashed = true;
          opts.onGameOver && opts.onGameOver(score);
        }
      });
    }

    function draw() {
      ctx.fillStyle = '#0c0a18';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, floorY, W, H - floorY);

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 6;
      zappers.forEach((z) => {
        const x1 = z.x - Math.cos(z.angle) * (z.len / 2);
        const y1 = z.y - Math.sin(z.angle) * (z.len / 2);
        const x2 = z.x + Math.cos(z.angle) * (z.len / 2);
        const y2 = z.y + Math.sin(z.angle) * (z.len / 2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      ctx.lineWidth = 1;

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(player.x - 13, player.y - 16, 26, 32);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`SCORE: ${score}   (Hold Pointer/Touch for Jetpack)`, 18, 28);

      if (crashed) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 32px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`ZAPPED! FINAL SCORE: ${score}`, W / 2, H / 2);
        ctx.textAlign = 'left';
      }
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
        window.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
      }
    };
  }

  window.ArcadeHubGames['jetpack-lab'] = { name: 'Jetpack Joy-Dash', mount };
})();