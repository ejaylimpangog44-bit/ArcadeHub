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
    let aimAngle = -0.55;
    let power = 15;
    let arrow = null;
    const archer = { x: 110, y: H - 110 };
    const dummy = { x: W - 140, y: H - 110, tilt: 0, vx: 0 };

    function shoot() {
      if (arrow) return;
      arrow = {
        x: archer.x + 16,
        y: archer.y - 24,
        vx: Math.cos(aimAngle) * power,
        vy: Math.sin(aimAngle) * power
      };
    }

    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * W;
      const my = ((e.clientY - rect.top) / rect.height) * H;
      aimAngle = Math.max(-1.45, Math.min(0.2, Math.atan2(my - (archer.y - 24), mx - archer.x)));
      power = Math.max(9, Math.min(22, Math.hypot(mx - archer.x, my - archer.y) / 28));
    }

    function onPointerDown(e) {
      onPointerMove(e);
      shoot();
    }

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);

    function update() {
      dummy.tilt += dummy.vx;
      dummy.vx *= 0.92;
      if (Math.abs(dummy.tilt) > 1.35) {
        dummy.tilt = 0;
        dummy.vx = 0;
        dummy.x = 480 + Math.random() * (W - 560);
      }

      if (!arrow) return;
      arrow.vy += 0.36;
      arrow.x += arrow.vx;
      arrow.y += arrow.vy;

      if (Math.abs(arrow.x - dummy.x) < 22 && arrow.y > dummy.y - 54 && arrow.y < dummy.y) {
        dummy.vx = 0.28;
        score += 100;
        opts.onScore && opts.onScore(score);
        arrow = null;
        return;
      }

      if (arrow.y > H - 80 || arrow.x > W || arrow.x < 0) {
        arrow = null;
      }
    }

    function draw() {
      ctx.fillStyle = '#0b1020';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, H - 80, W, 80);

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(archer.x - 8, archer.y - 44, 16, 44);

      ctx.save();
      ctx.translate(dummy.x, dummy.y);
      ctx.rotate(dummy.tilt);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(-8, -44, 16, 44);
      ctx.beginPath();
      ctx.arc(0, -54, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (arrow) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(arrow.x, arrow.y);
        ctx.lineTo(arrow.x - arrow.vx * 2.2, arrow.y - arrow.vy * 2.2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`SCORE: ${score}   (Move & Click Canvas to Shoot)`, 18, 28);
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
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerdown', onPointerDown);
      }
    };
  }

  window.ArcadeHubGames['ragdoll-archer'] = { name: '2D Ragdoll Archer', mount };
})();