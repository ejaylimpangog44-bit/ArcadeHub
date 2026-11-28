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
    let playerY = H / 2;
    let crashed = false;
    const keys = {};
    const gates = Array.from({ length: 4 }, (_, i) => ({
      x: W + i * 260,
      gapY: 140 + Math.random() * (H - 280),
      gapH: 130
    }));

    function onKeyDown(e) { keys[e.code] = true; }
    function onKeyUp(e) { keys[e.code] = false; }
    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      playerY = ((e.clientY - rect.top) / rect.height) * H;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointermove', onPointerMove);

    function update() {
      if (crashed) return;
      if (keys['KeyW'] || keys['ArrowUp']) playerY -= 5.5;
      if (keys['KeyS'] || keys['ArrowDown']) playerY += 5.5;
      playerY = Math.max(20, Math.min(H - 20, playerY));

      gates.forEach((g) => {
        g.x -= 6.5;
        if (g.x < -30) {
          g.x = W + 120;
          g.gapY = 120 + Math.random() * (H - 240);
          score += 50;
          opts.onScore && opts.onScore(score);
        }
        if (Math.abs(g.x - 150) < 22) {
          if (playerY < g.gapY - g.gapH / 2 || playerY > g.gapY + g.gapH / 2) {
            crashed = true;
            opts.onGameOver && opts.onGameOver(score);
          }
        }
      });
    }

    function draw() {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      gates.forEach((g) => {
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(g.x - 10, 0, 20, g.gapY - g.gapH / 2);
        ctx.fillRect(g.x - 10, g.gapY + g.gapH / 2, 20, H - (g.gapY + g.gapH / 2));
      });

      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(150, playerY, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`SCORE: ${score}   (Move Pointer or W/S / Up/Down)`, 18, 28);

      if (crashed) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fb7185';
        ctx.font = 'bold 32px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`CANYON IMPACT — SCORE: ${score}`, W / 2, H / 2);
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
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        canvas.removeEventListener('pointermove', onPointerMove);
      }
    };
  }

  window.ArcadeHubGames['sky-coaster'] = { name: 'Sky Coaster', mount };
})();