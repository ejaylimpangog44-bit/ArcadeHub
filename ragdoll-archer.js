(function () {
  window.ArcadeHubGames = window.ArcadeHubGames || {};

  function mount(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth || canvas.clientWidth || canvas.width || 900;
    let H = window.innerHeight || canvas.clientHeight || canvas.height || 540;

    let rafId = null;
    let mode = opts.mode === 'pvp' ? 'pvp' : 'ai';
    let score = 0;
    let p2Score = 0;
    let turn = 'p1';
    let aimAngle = -0.55;
    let power = 15;
    let arrow = null;
    let isDragging = false;
    let aiCooldown = 45;
    let modeBtnRect = null;
    const archer = { x: 110, y: H - 110 };
    const dummy = { x: W - 140, y: H - 110, tilt: 0, vx: 0 };

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
      const prevGround = H - 80;
      const nextGround = nextH - 80;
      const ratioX = W ? nextW / W : 1;
      W = canvas.width = nextW;
      H = canvas.height = nextH;
      archer.y = nextGround - 30;
      dummy.x = Math.max(260, Math.min(W - 80, (dummy.x * ratioX) || W - 140));
      dummy.y = nextGround - 30;
      if (arrow) arrow.y += nextGround - prevGround;
    }

    function restart(nextMode = mode) {
      mode = nextMode === 'pvp' ? 'pvp' : 'ai';
      score = 0;
      p2Score = 0;
      turn = 'p1';
      aimAngle = -0.55;
      power = 15;
      arrow = null;
      isDragging = false;
      aiCooldown = 45;
      dummy.tilt = 0;
      dummy.vx = 0;
      dummy.x = Math.max(260, W - 140);
      dummy.y = H - 110;
      opts.onScore && opts.onScore(0);
    }

    function hitRect(px, py, r) {
      return r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    }

    function shootFrom(shooter, angleVal, powerVal, owner) {
      if (arrow) return;
      arrow = {
        owner,
        x: shooter.x + (owner === 'p2' ? -16 : 16),
        y: shooter.y - 24,
        vx: Math.cos(angleVal) * powerVal * (W / 900),
        vy: Math.sin(angleVal) * powerVal * (H / 540)
      };
    }

    function shoot() {
      if (mode === 'pvp' && turn === 'p2') {
        const toP1 = Math.atan2(archer.y - 24 - (dummy.y - 24), archer.x - dummy.x);
        shootFrom(dummy, toP1, 14.5, 'p2');
      } else {
        shootFrom(archer, aimAngle, power, 'p1');
      }
    }

    function updateAimFromClient(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const mx = ((clientX - rect.left) / rect.width) * W;
      const my = ((clientY - rect.top) / rect.height) * H;
      if (mode === 'pvp' && turn === 'p2') {
        aimAngle = Math.atan2(my - (dummy.y - 24), mx - dummy.x);
        power = Math.max(9, Math.min(22, Math.hypot(mx - dummy.x, my - dummy.y) / 28));
      } else {
        aimAngle = Math.max(-1.45, Math.min(0.2, Math.atan2(my - (archer.y - 24), mx - archer.x)));
        power = Math.max(9, Math.min(22, Math.hypot(mx - archer.x, my - archer.y) / 28));
      }
    }

    function onPointerDown(e) {
      const rect = canvas.getBoundingClientRect();
      const px = rect.width ? ((e.clientX - rect.left) / rect.width) * W : 0;
      const py = rect.height ? ((e.clientY - rect.top) / rect.height) * H : 0;
      if (hitRect(px, py, modeBtnRect)) {
        restart(mode === 'ai' ? 'pvp' : 'ai');
        return;
      }
      isDragging = true;
      updateAimFromClient(e.clientX, e.clientY);
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      updateAimFromClient(e.clientX, e.clientY);
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      if (e && typeof e.clientX === 'number' && typeof e.clientY === 'number') {
        updateAimFromClient(e.clientX, e.clientY);
      }
      shoot();
    }

    function onKeyDown(e) {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') aimAngle = Math.max(-1.45, aimAngle - 0.06);
      if (e.code === 'ArrowDown' || e.code === 'KeyS') aimAngle = Math.min(0.2, aimAngle + 0.06);
      if (e.code === 'Space' || e.code === 'Enter') shoot();
      if (e.code === 'KeyR') restart(mode);
    }

    syncSize();
    window.addEventListener('resize', syncSize);
    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    function update() {
      dummy.tilt += dummy.vx;
      dummy.vx *= 0.92;
      if (Math.abs(dummy.tilt) > 1.35) {
        dummy.tilt = 0;
        dummy.vx = 0;
        dummy.x = Math.min(W - 80, Math.max(240, W * 0.52 + Math.random() * Math.max(80, W * 0.34)));
      }

      if (mode === 'ai' && !arrow) {
        aiCooldown -= 1;
        if (aiCooldown <= 0) {
          aiCooldown = 95;
          const ang = Math.atan2(archer.y - 24 - (dummy.y - 24), archer.x - dummy.x) - 0.14;
          shootFrom(dummy, ang, 13.5, 'ai');
        }
      }

      if (!arrow) return;
      arrow.vy += 0.36 * (H / 540);
      arrow.x += arrow.vx;
      arrow.y += arrow.vy;

      if (arrow.owner !== 'p2' && Math.abs(arrow.x - dummy.x) < 22 && arrow.y > dummy.y - 54 && arrow.y < dummy.y) {
        dummy.vx = 0.28;
        score += 100;
        opts.onScore && opts.onScore(score);
        arrow = null;
        if (mode === 'pvp') turn = 'p2';
        return;
      }

      if (arrow.owner === 'p2' && Math.abs(arrow.x - archer.x) < 22 && arrow.y > archer.y - 54 && arrow.y < archer.y) {
        p2Score += 100;
        arrow = null;
        if (mode === 'pvp') turn = 'p1';
        return;
      }

      if (arrow.y > H - 80 || arrow.x > W || arrow.x < 0) {
        arrow = null;
        if (mode === 'pvp') turn = turn === 'p1' ? 'p2' : 'p1';
      }
    }

    function draw() {
      ctx.fillStyle = '#0b1020';
      ctx.fillRect(-20, -20, W + 40, H + 40);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-20, H - 80, W + 40, 100);

      const activeShooter = mode === 'pvp' && turn === 'p2' ? dummy : archer;
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      let px = activeShooter.x + (mode === 'pvp' && turn === 'p2' ? -16 : 16);
      let py = activeShooter.y - 24;
      let pvx = Math.cos(aimAngle) * power * (W / 900);
      let pvy = Math.sin(aimAngle) * power * (H / 540);
      ctx.moveTo(px, py);
      for (let i = 0; i < 16; i++) {
        pvy += 0.36 * (H / 540);
        px += pvx;
        py += pvy;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

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
      ctx.fillText(mode === 'pvp' ? `P1: ${score}  P2: ${p2Score}  (${turn.toUpperCase()})` : `SCORE: ${score}`, 18, 28);

      modeBtnRect = { x: W / 2 - 68, y: 12, w: 136, h: 30 };
      ctx.fillStyle = 'rgba(11, 16, 32, 0.9)';
      ctx.strokeStyle = '#facc15';
      ctx.fillRect(modeBtnRect.x, modeBtnRect.y, modeBtnRect.w, modeBtnRect.h);
      ctx.strokeRect(modeBtnRect.x, modeBtnRect.y, modeBtnRect.w, modeBtnRect.h);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mode === 'pvp' ? 'MODE: VS PVP' : 'MODE: VS AI', modeBtnRect.x + modeBtnRect.w / 2, modeBtnRect.y + 19);
      ctx.textAlign = 'left';
    }

    function loop() {
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    return {
      restart,
      shoot,
      setMode(m) { restart(m); },
      destroy() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', syncSize);
        window.removeEventListener('keydown', onKeyDown);
        canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      }
    };
  }

  window.ArcadeHubGames['ragdoll-archer'] = { name: '2D Ragdoll Archer', mount };
})();