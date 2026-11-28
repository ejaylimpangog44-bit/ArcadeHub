(function () {
  window.ArcadeHubGames = window.ArcadeHubGames || {};

  function createAudio(enabled) {
    let ctx = null;
    function beep(freq, duration = 0.08, type = 'sine', gainVal = 0.12) {
      if (!enabled) return;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (_) {}
    }
    return { beep };
  }

  function mount(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    const audio = createAudio(opts.soundEnabled !== false);
    const W = canvas.width || 900;
    const H = canvas.height || 540;
    canvas.width = W;
    canvas.height = H;

    let rafId = null;
    let score = 0;
    let aiScore = 0;
    let gameOver = false;
    const paddleH = 92;
    const paddleW = 14;
    let p1Y = H / 2 - paddleH / 2;
    let p2Y = H / 2 - paddleH / 2;
    let ball = { x: W / 2, y: H / 2, vx: 6.2, vy: 3.4, r: 9 };
    const keys = {};

    function resetBall(dir = 1) {
      ball = {
        x: W / 2,
        y: H / 2,
        vx: dir * (6 + Math.min(4, score * 0.25)),
        vy: (Math.random() * 2 - 1) * 4.5,
        r: 9
      };
    }

    function onKeyDown(e) { keys[e.code] = true; }
    function onKeyUp(e) { keys[e.code] = false; }
    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * H;
      p1Y = Math.max(10, Math.min(H - paddleH - 10, y - paddleH / 2));
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointermove', onPointerMove);

    function update() {
      if (gameOver) return;
      if (keys['KeyW'] || keys['ArrowUp']) p1Y -= 7.5;
      if (keys['KeyS'] || keys['ArrowDown']) p1Y += 7.5;
      p1Y = Math.max(10, Math.min(H - paddleH - 10, p1Y));

      const targetY = ball.y - paddleH / 2;
      p2Y += Math.sign(targetY - p2Y) * Math.min(5.4, Math.abs(targetY - p2Y));
      p2Y = Math.max(10, Math.min(H - paddleH - 10, p2Y));

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.y - ball.r < 10 || ball.y + ball.r > H - 10) {
        ball.vy *= -1;
        audio.beep(320, 0.06, 'triangle');
      }

      if (
        ball.vx < 0 &&
        ball.x - ball.r <= 36 + paddleW &&
        ball.x + ball.r >= 36 &&
        ball.y >= p1Y &&
        ball.y <= p1Y + paddleH
      ) {
        const hitPos = (ball.y - (p1Y + paddleH / 2)) / (paddleH / 2);
        ball.vx = Math.abs(ball.vx * 1.05);
        ball.vy = hitPos * 7.2;
        score += 1;
        opts.onScore && opts.onScore(score);
        audio.beep(580, 0.08, 'sine');
      }

      if (
        ball.vx > 0 &&
        ball.x + ball.r >= W - 36 - paddleW &&
        ball.x - ball.r <= W - 36 &&
        ball.y >= p2Y &&
        ball.y <= p2Y + paddleH
      ) {
        const hitPos = (ball.y - (p2Y + paddleH / 2)) / (paddleH / 2);
        ball.vx = -Math.abs(ball.vx * 1.04);
        ball.vy = hitPos * 6.8;
        audio.beep(440, 0.08, 'sine');
      }

      if (ball.x < 0) {
        aiScore += 1;
        audio.beep(180, 0.2, 'sawtooth', 0.14);
        if (aiScore >= 5) {
          gameOver = true;
          opts.onGameOver && opts.onGameOver(score);
        } else {
          resetBall(1);
        }
      } else if (ball.x > W) {
        score += 3;
        opts.onScore && opts.onScore(score);
        audio.beep(760, 0.12, 'triangle');
        resetBall(-1);
      }
    }

    function draw() {
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 16);
      ctx.lineTo(W / 2, H - 16);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(36, p1Y, paddleW, paddleH);

      ctx.fillStyle = '#ff2a85';
      ctx.fillRect(W - 36 - paddleW, p2Y, paddleW, paddleH);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(`YOU: ${score}`, 64, 38);
      ctx.fillText(`AI: ${aiScore}/5`, W - 150, 38);

      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 34px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`MATCH OVER — SCORE: ${score}`, W / 2, H / 2);
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

  window.ArcadeHubGames['neon-pong'] = { name: 'Neon Pong: Air Battle PvP', mount };
})();