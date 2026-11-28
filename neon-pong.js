
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
    let W = canvas.clientWidth || canvas.width || 900;
    let H = canvas.clientHeight || canvas.height || 540;

    let rafId = null;
    let score = 0;
    let aiScore = 0;
    let gameOver = false;
    let paddleH = Math.max(76, H * 0.18);
    const paddleW = 14;
    let p1Y = H / 2 - paddleH / 2;
    let p2Y = H / 2 - paddleH / 2;
    let ball = { x: W / 2, y: H / 2, vx: 6.2, vy: 3.4, r: 9 };
    const keys = {};
    const touchState = { moveY: 0, action: false };
    let restartBtnRect = null;

    function syncSize() {
      const parent = canvas.parentElement;
      const nextW = Math.max(320, Math.floor((parent && parent.clientWidth) || window.innerWidth || 900));
      const nextH = Math.max(240, Math.floor((parent && parent.clientHeight) || window.innerHeight || 540));
      const ratioX = W ? nextW / W : 1;
      const ratioY = H ? nextH / H : 1;
      W = canvas.width = nextW;
      H = canvas.height = nextH;
      paddleH = Math.max(72, Math.min(130, H * 0.19));
      p1Y = Math.max(10, Math.min(H - paddleH - 10, p1Y * ratioY));
      p2Y = Math.max(10, Math.min(H - paddleH - 10, p2Y * ratioY));
      ball.x = Math.max(ball.r, Math.min(W - ball.r, ball.x * ratioX));
      ball.y = Math.max(ball.r, Math.min(H - ball.r, ball.y * ratioY));
    }

    function resetBall(dir = 1) {
      ball = {
        x: W / 2,
        y: H / 2,
        vx: dir * (6 + Math.min(4, score * 0.25)) * (W / 900),
        vy: (Math.random() * 2 - 1) * 4.5 * (H / 540),
        r: 9
      };
    }

    function restart() {
      score = 0;
      aiScore = 0;
      gameOver = false;
      p1Y = H / 2 - paddleH / 2;
      p2Y = H / 2 - paddleH / 2;
      resetBall(1);
      opts.onScore && opts.onScore(0);
      audio.beep(520, 0.08, 'triangle');
    }

    function getTouchInput() {
      const ext = opts.input || window.ArcadeHubTouchInput;
      if (ext && typeof ext.getState === 'function') {
        const s = ext.getState() || {};
        return {
          moveY: Number(s.moveY ?? s.y ?? 0) || 0,
          action: Boolean(s.action || s.fire)
        };
      }
      return touchState;
    }

    function onKeyDown(e) {
      keys[e.code] = true;
      if (gameOver && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR')) {
        restart();
      }
    }
    function onKeyUp(e) { keys[e.code] = false; }

    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.height) return;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      p1Y = Math.max(10, Math.min(H - paddleH - 10, y - paddleH / 2));
    }

    function onPointerDown(e) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = ((e.clientX - rect.left) / rect.width) * W;
      const py = ((e.clientY - rect.top) / rect.height) * H;
      if (gameOver && restartBtnRect) {
        if (
          px >= restartBtnRect.x &&
          px <= restartBtnRect.x + restartBtnRect.w &&
          py >= restartBtnRect.y &&
          py <= restartBtnRect.y + restartBtnRect.h
        ) {
          restart();
          return;
        }
      }
      onPointerMove(e);
    }

    syncSize();
    window.addEventListener('resize', syncSize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);

    function update() {
      if (gameOver) return;
      const ti = getTouchInput();
      if (keys['KeyW'] || keys['ArrowUp']) p1Y -= 7.5 * (H / 540);
      if (keys['KeyS'] || keys['ArrowDown']) p1Y += 7.5 * (H / 540);
      if (Math.abs(ti.moveY) > 0.08) {
        p1Y += ti.moveY * 8.5 * (H / 540);
      }
      p1Y = Math.max(10, Math.min(H - paddleH - 10, p1Y));

      const targetY = ball.y - paddleH / 2;
      p2Y += Math.sign(targetY - p2Y) * Math.min(5.4 * (H / 540), Math.abs(targetY - p2Y));
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
        ball.vy = hitPos * 7.2 * (H / 540);
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
        ball.vy = hitPos * 6.8 * (H / 540);
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
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText(`YOU: ${score}`, 24, 34);
      ctx.fillText(`AI: ${aiScore}/5`, W - 135, 34);

      restartBtnRect = null;
      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 30px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`MATCH OVER — SCORE: ${score}`, W / 2, H / 2 - 22);

        const bw = 176;
        const bh = 46;
        const bx = W / 2 - bw / 2;
        const by = H / 2 + 12;
        restartBtnRect = { x: bx, y: by, w: bw, h: bh };
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(bx, by, bw, bh, 12) : ctx.rect(bx, by, bw, bh);
        ctx.fill();
        ctx.fillStyle = '#070b14';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText('RESTART MATCH', W / 2, by + 29);
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
      restart,
      setTouchInput(next) {
        Object.assign(touchState, next || {});
      },
      destroy() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', syncSize);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerdown', onPointerDown);
      }
    };
  }

  window.ArcadeHubGames['neon-pong'] = { name: 'Neon Pong: Air Battle PvP', mount };
})();