(function () {
  window.ArcadeHubGames = window.ArcadeHubGames || {};

  function mount(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width || 900;
    const H = canvas.height || 540;
    canvas.width = W;
    canvas.height = H;

    let rafId = null;
    let distance = 0;
    let pitch = -0.15;
    let speed = 6.5;
    let planeY = H * 0.35;
    let crashed = false;
    let holding = false;

    const thermals = Array.from({ length: 4 }, (_, i) => ({
      x: 350 + i * 240,
      y: 220 + (i % 2) * 110,
      r: 58
    }));

    function onDown() { holding = true; }
    function onUp() { holding = false; }
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

    function update() {
      if (crashed) return;
      pitch += holding ? -0.025 : 0.018;
      pitch = Math.max(-0.75, Math.min(0.75, pitch));
      speed = Math.max(4, Math.min(11, speed + Math.sin(pitch) * 0.14));
      planeY += Math.sin(pitch) * speed;
      distance += Math.round(speed);
      opts.onScore && opts.onScore(distance);

      thermals.forEach((th) => {
        th.x -= speed;
        if (th.x < -th.r) {
          th.x = W + th.r;
          th.y = 140 + Math.random() * (H - 240);
        }
        if (Math.hypot(140 - th.x, planeY - th.y) < th.r + 16) {
          planeY -= 3.2;
          pitch -= 0.02;
        }
      });

      if (planeY > H - 24 || planeY < 20) {
        crashed = true;
        opts.onGameOver && opts.onGameOver(distance);
      }
    }

    function draw() {
      ctx.fillStyle = '#081224';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      thermals.forEach((th) => {
        ctx.beginPath();
        ctx.arc(th.x, th.y, th.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.save();
      ctx.translate(140, planeY);
      ctx.rotate(pitch);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(-16, -10);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-16, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`DISTANCE: ${distance}m   (Hold to Pitch Up)`, 18, 28);

      if (crashed) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 32px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`GLIDE ENDED — ${distance}m`, W / 2, H / 2);
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

  window.ArcadeHubGames['paper-airplane'] = { name: 'Paper Airplane', mount };
})();