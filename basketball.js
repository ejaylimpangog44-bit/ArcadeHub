function initBasketballHoops(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 overflow-hidden select-none flex flex-col justify-between">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        <span id="bb-score" class="px-4 py-1.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-300 font-black text-sm shadow">🏀 SHOTS: 0 / 7</span>
        <span id="bb-mode" class="px-4 py-1.5 rounded-full bg-orange-950/80 border border-orange-500/40 text-orange-200 font-bold text-xs shadow">STEADY BOARD</span>
        <span id="bb-streak" class="px-4 py-1.5 rounded-full bg-black/60 border border-emerald-400/40 text-emerald-300 font-black text-sm shadow">🔥 COMBO: 0</span>
      </div>
      <canvas id="bb-canvas" class="w-full h-full block touch-none cursor-crosshair"></canvas>
      <div class="absolute bottom-6 left-0 right-0 z-10 flex flex-col items-center gap-2 pointer-events-none">
        <div id="bb-instruction" class="bg-black/70 backdrop-blur-md border border-white/15 px-5 py-2 rounded-2xl text-xs font-bold text-amber-200 shadow-xl pointer-events-auto text-center">
          Hold thumb on ball to aim (watch the arrow), release to shoot!
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById('bb-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let score = 0;
  let combo = 0;
  let totalShots = 0;
  let running = true;

  let hoopX = w / 2;
  let hoopY = h * 0.28;
  let hoopW = 84;
  let hoopMoving = false;
  let hoopSpeed = 1.5;
  let hoopDir = 1;

  let ballStartX = w / 2;
  let ballStartY = h * 0.82;
  let ball = {
    x: ballStartX,
    y: ballStartY,
    vx: 0,
    vy: 0,
    r: 20,
    active: false
  };

  let isHolding = false;
  let holdStartTime = 0;
  let aimAngle = -Math.PI / 2;
  let aimPower = 0;

  const onResize = () => {
    w = canvas.width = stage.clientWidth;
    h = canvas.height = stage.clientHeight;
    if (!ball.active) {
      ballStartX = w / 2;
      ballStartY = h * 0.82;
      ball.x = ballStartX;
      ball.y = ballStartY;
    }
    if (!hoopMoving) {
      hoopX = w / 2;
    }
  };
  window.addEventListener('resize', onResize);

  function startHold(clientX, clientY) {
    if (!running || ball.active) return;
    const dist = Math.hypot(clientX - ball.x, clientY - ball.y);
    if (dist < 70 || ball.y - clientY > -20) {
      isHolding = true;
      holdStartTime = performance.now();
      aimPower = 0;
      if (typeof AudioFX !== 'undefined') AudioFX.click();
    }
  }

  function moveHold(clientX, clientY) {
    if (!isHolding || ball.active) return;
    const dx = clientX - ball.x;
    const dy = clientY - ball.y;
    aimAngle = Math.atan2(dy, dx);
    if (aimAngle > -0.1) aimAngle = -0.1;
    if (aimAngle < -Math.PI + 0.1) aimAngle = -Math.PI + 0.1;

    const elapsed = performance.now() - holdStartTime;
    aimPower = Math.min(1.0, elapsed / 900);
  }

  function releaseHold() {
    if (!isHolding || ball.active) return;
    isHolding = false;

    const speed = 8 + aimPower * 14;
    ball.vx = Math.cos(aimAngle) * speed;
    ball.vy = Math.sin(aimAngle) * speed;
    ball.active = true;
    totalShots++;

    if (typeof AudioFX !== 'undefined') AudioFX.jump();
  }

  canvas.onpointerdown = (e) => startHold(e.offsetX, e.offsetY);
  canvas.onpointermove = (e) => moveHold(e.offsetX, e.offsetY);
  canvas.onpointerup = () => releaseHold();
  canvas.onpointercancel = () => { isHolding = false; };

  let raf;
  function loop() {
    ctx.clearRect(0, 0, w, h);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#7c2d12');
    bgGrad.addColorStop(0.45, '#1e1b4b');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, h + 120, w * 0.45, Math.PI, 2 * Math.PI);
    ctx.stroke();

    if (totalShots >= 7) {
      hoopMoving = true;
      hoopSpeed = 2.2 + Math.min(4, (totalShots - 7) * 0.4);
      document.getElementById('bb-mode').textContent = 'MOVING HOOP (SLOW → FAST)';
      document.getElementById('bb-mode').className = 'px-4 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-200 font-bold text-xs shadow animate-pulse';
    }

    if (hoopMoving) {
      hoopX += hoopSpeed * hoopDir;
      const margin = 60;
      if (hoopX < margin || hoopX > w - margin) {
        hoopDir *= -1;
      }
    }

    const boardW = 120;
    const boardH = 14;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(hoopX - boardW / 2, hoopY - 26, boardW, boardH);

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hoopX - hoopW / 2, hoopY);
    ctx.lineTo(hoopX + hoopW / 2, hoopY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hoopX - hoopW / 2 + 4, hoopY);
    ctx.lineTo(hoopX - 12, hoopY + 45);
    ctx.moveTo(hoopX + hoopW / 2 - 4, hoopY);
    ctx.lineTo(hoopX + 12, hoopY + 45);
    ctx.moveTo(hoopX - hoopW / 4, hoopY);
    ctx.lineTo(hoopX - 4, hoopY + 45);
    ctx.moveTo(hoopX + hoopW / 4, hoopY);
    ctx.lineTo(hoopX + 4, hoopY + 45);
    ctx.stroke();

    if (ball.active) {
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vy += 0.38;

      const rimLeft = hoopX - hoopW / 2;
      const rimRight = hoopX + hoopW / 2;
      
      if (!ball.scored && ball.vy > 0 && ball.y >= hoopY && ball.y <= hoopY + 14 && ball.x >= rimLeft + 4 && ball.x <= rimRight - 4) {
        ball.scored = true;
        score++;
        combo++;
        if (typeof AudioFX !== 'undefined') AudioFX.coin();
        document.getElementById('bb-score').textContent = `🏀 SHOTS: ${score} / 7`;
        document.getElementById('bb-streak').textContent = `🔥 COMBO: ${combo}`;
        spawnPopup('SWISH! +1', ball.x, ball.y - 30, '#fde047');
        if (score % 7 === 0 && typeof addXP === 'function') addXP(30, ball.x, ball.y);
      }

      if (ball.y > h + 50 || ball.x < -50 || ball.x > w + 50) {
        if (!ball.scored) {
          combo = 0;
          document.getElementById('bb-streak').textContent = `🔥 COMBO: 0`;
          if (typeof AudioFX !== 'undefined') AudioFX.lose();
        }
        resetBall();
      }
    }

    if (isHolding && !ball.active) {
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.fillStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      const arrowLen = 50 + aimPower * 90;
      const tipX = ball.x + Math.cos(aimAngle) * arrowLen;
      const tipY = ball.y + Math.sin(aimAngle) * arrowLen;

      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      ctx.beginPath();
      ctx.translate(tipX, tipY);
      ctx.rotate(aimAngle);
      ctx.moveTo(0, 0);
      ctx.lineTo(-12, -6);
      ctx.lineTo(-12, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = ball.active ? 15 : 6;
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#431407';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ball.x - ball.r, ball.y);
    ctx.lineTo(ball.x + ball.r, ball.y);
    ctx.stroke();
    ctx.restore();

    raf = requestAnimationFrame(loop);
  }

  function resetBall() {
    ball.x = ballStartX;
    ball.y = ballStartY;
    ball.vx = 0;
    ball.vy = 0;
    ball.active = false;
    ball.scored = false;
  }

  loop();

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}
