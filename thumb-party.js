(function () {
  window.ArcadeHubGames = window.ArcadeHubGames || {};

  function mount(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width || 900;
    const H = canvas.height || 540;
    canvas.width = W;
    canvas.height = H;

    let rafId = null;
    let tugPos = W / 2;
    let p1Wins = 0;
    let p2Wins = 0;
    let winner = null;

    function resetRound() {
      tugPos = W / 2;
    }

    function onKeyDown(e) {
      if (winner) return;
      if (e.code === 'KeyA' || e.code === 'KeyW') tugPos -= 22;
      if (e.code === 'ArrowRight' || e.code === 'ArrowUp') tugPos += 22;
    }

    function onPointerDown(e) {
      if (winner) return;
      const rect = canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * W;
      if (mx < W / 2) tugPos -= 24;
      else tugPos += 24;
    }

    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('pointerdown', onPointerDown);

    function update() {
      if (winner) return;
      if (tugPos < 150) {
        p1Wins += 1;
        opts.onScore && opts.onScore(p1Wins);
        if (p1Wins >= 3) {
          winner = 'PLAYER 1';
          opts.onGameOver && opts.onGameOver(p1Wins);
        } else {
          resetRound();
        }
      } else if (tugPos > W - 150) {
        p2Wins += 1;
        if (p2Wins >= 3) {
          winner = 'PLAYER 2';
          opts.onGameOver && opts.onGameOver(p1Wins);
        } else {
          resetRound();
        }
      }
    }

    function draw() {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
      ctx.fillRect(0, 0, W / 2, H);
      ctx.fillStyle = 'rgba(255, 42, 133, 0.1)';
      ctx.fillRect(W / 2, 0, W / 2, H);

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(150, H / 2);
      ctx.lineTo(W - 150, H / 2);
      ctx.stroke();
      ctx.lineWidth = 1;

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(tugPos, H / 2, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText(`P1 (Tap Left / A): ${p1Wins}`, 24, 36);
      ctx.fillText(`P2 (Tap Right / Right Arrow): ${p2Wins}`, W - 290, 36);

      if (winner) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 34px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${winner} WINS THE MATCH!`, W / 2, H / 2);
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
        canvas.removeEventListener('pointerdown', onPointerDown);
      }
    };
  }

  window.ArcadeHubGames['thumb-party'] = { name: '2-Player Thumb Wrestling', mount };
})();