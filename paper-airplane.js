(function () {
  window.ArcadeHubGames = window.ArcadeHubGames || {};

  function mount(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth || canvas.clientWidth || canvas.width || 900;
    let H = window.innerHeight || canvas.clientHeight || canvas.height || 540;

    let rafId = null;
    let mode = opts.mode === 'pvp' ? 'pvp' : 'ai';
    let distance = 0;
    let p1Pitch = -0.15;
    let p2Pitch = -0.1;
    let speed = 6.5;
    let p1Y = H * 0.35;
    let p2Y = H * 0.55;
    let crashed = false;
    let activeDrag = null;
    const keys = {};
    let modeBtnRect = null;
    let restartBtnRect = null;

    let thermals = Array.from({ length: 4 }, (_, i) => ({
      x: 350 + i * 240,
      y: 160 + (i % 2) * 120,
      r: 58
    }));

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
      const ratioY = H ? nextH / H : 1;
      W = canvas.width = nextW;
      H = canvas.height = nextH;
      p1Y = Math.max(24, Math.min(H - 28, p1Y * ratioY));
      p2Y = Math.max(24, Math.min(H - 28, p2Y * ratioY));
      thermals.forEach((th, i) => {
        th.y = Math.max(90, Math.min(H - 110, 140 + (i % 2) * ((H - 240) * 0.5)));
      });
    }

    function restart(nextMode = mode) {
      mode = nextMode === 'pvp' ? 'pvp' : 'ai';
      distance = 0;
      p1Pitch = -0.15;
      p2Pitch = -0.1;
      speed = 6.5;
      p1Y = H * 0.35;
      p2Y = H * 0.55;
      crashed = false;
      activeDrag = null;
      thermals = Array.from({ length: 4 }, (_, i) => ({
        x: W * 0.35 + i * Math.max(180, W * 0.25),
        y: 140 + Math.random() * Math.max(120, H - 240),
        r: 58
      }));
      opts.onScore && opts.onScore(0);
    }

    function hitRect(px, py, r) {
      return r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    }

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
      if (crashed && hitRect(pt.x, pt.y, restartBtnRect)) {
        restart(mode);
        return;
      }
      const target = mode === 'pvp' && pt.x >= W / 2 ? 'p2' : 'p1';
      activeDrag = { id: e.pointerId, target, lastY: pt.y };
    }

    function onPointerMove(e) {
      if (!activeDrag || activeDrag.id !== e.pointerId || crashed) return;
      const pt = toCanvasPt(e);
      const dy = pt.y - activeDrag.lastY;
      activeDrag.lastY = pt.y;
      if (activeDrag.target === 'p2') {
        p2Pitch = Math.max(-0.75, Math.min(0.75, p2Pitch + dy * 0.008));
      } else {
        p1Pitch = Math.max(-0.75, Math.min(0.75, p1Pitch + dy * 0.008));
      }
    }

    function onPointerUp(e) {
      if (activeDrag && activeDrag.id === e.pointerId) activeDrag = null;
    }

    function onKeyDown(e) {
      keys[e.code] = true;
      if (crashed && (e.code === 'KeyR' || e.code === 'Enter' || e.code === 'Space')) restart(mode);
    }
    function onKeyUp(e) { keys[e.code] = false; }

    syncSize();
    window.addEventListener('resize', syncSize);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function update() {
      if (crashed) return;
      if (keys['KeyW']) p1Pitch -= 0.024;
      if (keys['KeyS']) p1Pitch += 0.024;
      if (mode === 'pvp') {
        if (keys['ArrowUp']) p2Pitch -= 0.024;
        if (keys['ArrowDown']) p2Pitch += 0.024;
      } else {
        if (keys['ArrowUp']) p1Pitch -= 0.024;
        if (keys['ArrowDown']) p1Pitch += 0.024;
        const desiredY = H * 0.45 + Math.sin(distance * 0.012) * 90;
        p2Pitch += Math.sign(desiredY - p2Y) * 0.015;
      }
      if (!activeDrag) {
        p1Pitch += 0.007;
        p2Pitch += 0.007;
      }

      p1Pitch = Math.max(-0.75, Math.min(0.75, p1Pitch));
      p2Pitch = Math.max(-0.75, Math.min(0.75, p2Pitch));
      speed = Math.max(4, Math.min(11, speed + Math.sin(p1Pitch) * 0.14));
      p1Y += Math.sin(p1Pitch) * speed;
      p2Y += Math.sin(p2Pitch) * speed;
      p2Y = Math.max(24, Math.min(H - 28, p2Y));

      distance += Math.round(speed);
      opts.onScore && opts.onScore(distance);

      thermals.forEach((th) => {
        th.x -= speed;
        if (th.x < -th.r) {
          th.x = W + th.r;
          th.y = 120 + Math.random() * Math.max(120, H - 220);
        }
        if (Math.hypot(140 - th.x, p1Y - th.y) < th.r + 16) {
          p1Y -= 3.2;
          p1Pitch -= 0.02;
        }
        if (Math.hypot(220 - th.x, p2Y - th.y) < th.r + 16) {
          p2Y -= 3.0;
          p2Pitch -= 0.018;
        }
      });

      if (p1Y > H - 24 || p1Y < 20) {
        crashed = true;
        opts.onGameOver && opts.onGameOver(distance);
      }
    }

    function drawPlane(x, y, ang, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(-16, -10);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-16, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function draw() {
      ctx.fillStyle = '#081224';
      ctx.fillRect(-20, -20, W + 40, H + 40);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      thermals.forEach((th) => {
        ctx.beginPath();
        ctx.arc(th.x, th.y, th.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      drawPlane(220, p2Y, p2Pitch, mode === 'pvp' ? '#f472b6' : 'rgba(148, 163, 184, 0.55)');
      drawPlane(140, p1Y, p1Pitch, '#f8fafc');

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`DISTANCE: ${distance}m`, 18, 28);

      modeBtnRect = { x: W / 2 - 68, y: 12, w: 136, h: 30 };
      ctx.fillStyle = 'rgba(8, 18, 36, 0.9)';
      ctx.strokeStyle = '#38bdf8';
      ctx.fillRect(modeBtnRect.x, modeBtnRect.y, modeBtnRect.w, modeBtnRect.h);
      ctx.strokeRect(modeBtnRect.x, modeBtnRect.y, modeBtnRect.w, modeBtnRect.h);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mode === 'pvp' ? 'MODE: VS PVP' : 'MODE: VS AI', modeBtnRect.x + modeBtnRect.w / 2, modeBtnRect.y + 19);
      ctx.textAlign = 'left';

      restartBtnRect = null;
      if (crashed) {
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(-20, -20, W + 40, H + 40);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 30px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`GLIDE ENDED — ${distance}m`, W / 2, H / 2 - 22);

        restartBtnRect = { x: W / 2 - 80, y: H / 2 + 12, w: 160, h: 44 };
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(restartBtnRect.x, restartBtnRect.y, restartBtnRect.w, restartBtnRect.h);
        ctx.fillStyle = '#081224';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText('FLY AGAIN', W / 2, restartBtnRect.y + 28);
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
        canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      }
    };
  }

  window.ArcadeHubGames['paper-airplane'] = { name: 'Paper Airplane', mount };
})();