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
    let W = window.innerWidth || canvas.clientWidth || canvas.width || 900;
    let H = window.innerHeight || canvas.clientHeight || canvas.height || 540;

    let rafId = null;
    let mode = opts.mode === 'pvp' ? 'pvp' : 'ai';
    let score = 0;
    let p2Score = 0;
    let gameOver = false;
    let paddleH = Math.max(76, H * 0.19);
    const paddleW = 14;
    let p1Y = H / 2 - paddleH / 2;
    let p2Y = H / 2 - paddleH / 2;
    let ball = { x: W / 2, y: H / 2, vx: 6.2, vy: 3.4, r: 9 };
    const keys = {};
    const drags = new Map();
    let modeBtnRect = null;
    let restartBtnRect = null;

    function applyFullBleedStyle() {
      canvas.style.position = 'fixed';
      canvas.style.inset = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.maxWidth = '100vw';
      canvas.style.maxHeight = '100vh';
      canvas.style.margin = '0';
      canvas.style.padding = '0';
      canvas.style.display = 'block';
      canvas.style.zIndex = '5';
      canvas.style.touchAction = 'none';
    }

    function syncSize() {
      applyFullBleedStyle();
      const nextW = Math.max(320, Math.floor(window.innerWidth || canvas.clientWidth || 900));
      const nextH = Math.max(240, Math.floor(window.innerHeight || canvas.clientHeight || 540));
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

    function restart(nextMode = mode) {
      mode = nextMode === 'pvp' ? 'pvp' : 'ai';
      score = 0;
      p2Score = 0;
      gameOver = false;
      drags.clear();
      p1Y = H / 2 - paddleH / 2;
      p2Y = H / 2 - paddleH / 2;
      resetBall(1);
      opts.onScore && opts.onScore(0);
      audio.beep(520, 0.08, 'triangle');
    }

    function hitRect(px, py, r) {
      return r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    }

    function onKeyDown(e) {
      keys[e.code] = true;
      if (gameOver && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR')) {
        restart(mode);
      }
    }
    function onKeyUp(e) { keys[e.code] = false; }

    function toCanvasPt(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.width ? ((e.clientX - rect.left) / rect.width) * W : 0,
        y: rect.height ? ((e.clientY - rect.top) / rect.height) * H : 0
      };
    }

    function onPointerDown(e) {
      const pt = toCanvasPt(e);
      if (hitRect(pt.x, pt.y, modeBtnRect)) {
        restart(mode === 'ai' ? 'pvp' : 'ai');
        return;
      }
      if (gameOver && hitRect(pt.x, pt.y, restartBtnRect)) {
        restart(mode);
        return;
      }
      const side = mode === 'pvp' && pt.x >= W / 2 ? 'p2' : 'p1';
      drags.set(e.pointerId, { side, startY: pt.y, startPaddleY: side === 'p1' ? p1Y : p2Y });
      if (side === 'p1') {
        p1Y = Math.max(10, Math.min(H - paddleH - 10, pt.y - paddleH / 2));
      } else {
        p2Y = Math.max(10, Math.min(H - paddleH - 10, pt.y - paddleH / 2));
      }
    }

    function onPointerMove(e) {
      const d = drags.get(e.pointerId);
      if (!d) return;
      const pt = toCanvasPt(e);
      const delta = pt.y - d.startY;
      if (d.side === 'p1') {
        p1Y = Math.max(10, Math.min(H - paddleH - 10, (pt.y - paddleH / 2 + d.startPaddleY + delta) * 0.5));
      } else {
        p2Y = Math.max(10, Math.min(H - paddleH - 10, (pt.y - paddleH / 2 + d.startPaddleY + delta) * 0.5));
      }
    }

    function onPointerUp(e) {
      drags.delete(e.pointerId);
    }

    syncSize();
    window.addEventListener('resize', syncSize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    function update() {
      if (gameOver) return;
      if (keys['KeyW']) p1Y -= 7.5 * (H / 540);
      if (keys['KeyS']) p1Y += 7.5 * (H / 540);
      if (mode === 'pvp') {
        if (keys['ArrowUp']) p2Y -= 7.5 * (H / 540);
        if (keys['ArrowDown']) p2Y += 7.5 * (H / 540);
      } else {
        if (keys['ArrowUp']) p1Y -= 7.5 * (H / 540);
        if (keys['ArrowDown']) p1Y += 7.5 * (H / 540);
        const targetY = ball.y - paddleH / 2;
        p2Y += Math.sign(targetY - p2Y) * Math.min(5.4 * (H / 540), Math.abs(targetY - p2Y));
      }
      p1Y = Math.max(10, Math.min(H - paddleH - 10, p1Y));
      p2Y = Math.max(10, Math.min(H - paddleH - 10, p2Y));

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.y - ball.r < 10 || ball.y + ball.r > H - 10) {
        ball.vy *= -1;
        audio.beep(320, 0.06, 'triangle');
      }

      if (ball.vx < 0 && ball.x - ball.r <= 36 + paddleW && ball.x + ball.r >= 36 && ball.y >= p1Y && ball.y <= p1Y + paddleH) {
        const hitPos = (ball.y - (p1Y + paddleH / 2)) / (paddleH / 2);
        ball.vx = Math.abs(ball.vx * 1.05);
        ball.vy = hitPos * 7.2 * (H / 540);
        score += 1;
        opts.onScore && opts.onScore(score);
        audio.beep(580, 0.08, 'sine');
      }

      if (ball.vx > 0 && ball.x + ball.r >= W - 36 - paddleW && ball.x - ball.r <= W - 36 && ball.y >= p2Y && ball.y <= p2Y + paddleH) {
        const hitPos = (ball.y - (p2Y + paddleH / 2)) / (paddleH / 2);
        ball.vx = -Math.abs(ball.vx * 1.04);
        ball.vy = hitPos * 6.8 * (H / 540);
        if (mode === 'pvp') {
          p2Score += 1;
        }
        audio.beep(440, 0.08, 'sine');
      }

      if (ball.x < 0) {
        p2Score += 1;
        audio.beep(180, 0.2, 'sawtooth', 0.14);
        if (p2Score >= 5) {
          gameOver = true;
          opts.onGameOver && opts.onGameOver(score);
        } else {
          resetBall(1);
        }
      } else if (ball.x > W) {
        score += 3;
        opts.onScore && opts.onScore(score);
        audio.beep(760, 0.12, 'triangle');
        if (score >= 15 && mode === 'pvp') {
          gameOver = true;
          opts.onGameOver && opts.onGameOver(score);
        } else {
          resetBall(-1);
        }
      }
    }

    function draw() {
      ctx.fillStyle = '#070b14';
      ctx.fillRect(-20, -20, W + 40, H + 40);

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
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`P1: ${score}`, 20, 30);
      ctx.textAlign = 'right';
      ctx.fillText(`${mode === 'pvp' ? 'P2' : 'AI'}: ${p2Score}/5`, W - 64, 30);
      ctx.textAlign = 'left';

      modeBtnRect = { x: W / 2 - 68, y: 12, w: 136, h: 30 };
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.fillRect(modeBtnRect.x, modeBtnRect.y, modeBtnRect.w, modeBtnRect.h);
      ctx.strokeRect(modeBtnRect.x, modeBtnRect.y, modeBtnRect.w, modeBtnRect.h);
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mode === 'pvp' ? 'MODE: VS PVP' : 'MODE: VS AI', modeBtnRect.x + modeBtnRect.w / 2, modeBtnRect.y + 19);
      ctx.textAlign = 'left';
      ctx.lineWidth = 1;

      restartBtnRect = null;
      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.fillRect(-20, -20, W + 40, H + 40);
        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 30px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          mode === 'pvp' ? `${score > p2Score ? 'PLAYER 1' : 'PLAYER 2'} WINS — ${score} : ${p2Score}` : `MATCH OVER — SCORE: ${score}`,
          W / 2,
          H / 2 - 22
        );

        restartBtnRect = { x: W / 2 - 88, y: H / 2 + 12, w: 176, h: 46 };
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(restartBtnRect.x, restartBtnRect.y, restartBtnRect.w, restartBtnRect.h);
        ctx.fillStyle = '#070b14';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText('RESTART MATCH', W / 2, restartBtnRect.y + 29);
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
      setMode(m) { restart(m); },
      destroy() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', syncSize);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      }
    };
  }

  window.ArcadeHubGames['neon-pong'] = { name: 'Neon Pong: Air Battle PvP', mount };
})();