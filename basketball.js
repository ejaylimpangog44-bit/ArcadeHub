function initBasketballHoops(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 overflow-hidden select-none flex flex-col justify-between">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        <span id="bb-score" class="px-4 py-1.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-300 font-black text-sm shadow">🏀 SCORED: 0</span>
        <span id="bb-mode" class="px-4 py-1.5 rounded-full bg-orange-950/80 border border-orange-500/40 text-orange-200 font-bold text-xs shadow">STREETBALL COURT</span>
        <span id="bb-misses" class="px-4 py-1.5 rounded-full bg-black/60 border border-rose-500/40 text-rose-400 font-black text-sm shadow">❌ MISSES: 0 / 5</span>
      </div>
      <canvas id="bb-canvas" class="w-full h-full block touch-none cursor-crosshair"></canvas>
      <div class="absolute bottom-6 left-0 right-0 z-10 flex flex-col items-center gap-2 pointer-events-none">
        <div id="bb-instruction" class="bg-black/70 backdrop-blur-md border border-white/15 px-5 py-2 rounded-2xl text-xs font-bold text-amber-200 shadow-xl pointer-events-auto text-center">
          Hold &amp; drag on ball to aim with trajectory arc, release to shoot!
        </div>
      </div>
      <div id="game-over-overlay" class="absolute inset-0 bg-slate-950/85 backdrop-blur-md hidden flex-col items-center justify-center z-50 p-6 text-center">
        <div class="max-w-xs w-full bg-slate-900 border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-scale-up">
          <div class="text-4xl">🏀💥</div>
          <h2 class="text-2xl font-black text-rose-500 tracking-tight">Try Again!</h2>
          <p class="text-xs text-slate-300">You reached 5 misses. Great effort on the court!</p>
          <div class="text-sm font-bold text-amber-400">Final Score: <span id="final-score">0</span> Baskets</div>
          <button id="restart-btn" class="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/30 hover:opacity-95 transition active:scale-95 cursor-pointer">
            Play Again ↺
          </button>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById('bb-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let score = 0;
  let misses = 0;
  let combo = 0;
  let running = true;

  let hoopX = w / 2;
  let hoopY = h * 0.28;
  let hoopW = 84;
  let hoopMoving = false;
  let hoopSpeed = 1.8;
  let hoopDir = 1;

  let netAnimTimer = 0;

  let ballStartX = w / 2;
  let ballStartY = h * 0.82;
  let ball = {
    x: ballStartX,
    y: ballStartY,
    vx: 0,
    vy: 0,
    r: 20,
    active: false,
    scored: false
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
    aimPower = Math.min(1.0, elapsed / 800);
  }

  function releaseHold() {
    if (!isHolding || ball.active) return;
    isHolding = false;

    const speed = 7 + aimPower * 15;
    ball.vx = Math.cos(aimAngle) * speed;
    ball.vy = Math.sin(aimAngle) * speed;
    ball.active = true;
    ball.scored = false;

    if (typeof AudioFX !== 'undefined') AudioFX.jump();
  }

  canvas.onpointerdown = (e) => startHold(e.offsetX, e.offsetY);
  canvas.onpointermove = (e) => moveHold(e.offsetX, e.offsetY);
  canvas.onpointerup = () => releaseHold();
  canvas.onpointercancel = () => { isHolding = false; };

  window.restartBasketballGame = function() {
    score = 0;
    misses = 0;
    combo = 0;
    running = true;
    hoopMoving = false;
    document.getElementById('bb-score').textContent = `🏀 SCORED: 0`;
    document.getElementById('bb-misses').textContent = `❌ MISSES: 0 / 5`;
    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('game-over-overlay').classList.remove('flex');
    resetBall();
  };

  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) restartBtn.onclick = window.restartBasketballGame;

  let raf;
  function loop() {
    ctx.clearRect(0, 0, w, h);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#7c2d12');
    bgGrad.addColorStop(0.45, '#1e1b4b');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, h + 120, w * 0.45, Math.PI, 2 * Math.PI);
    ctx.stroke();

    if (score >= 5) {
      hoopMoving = true;
      hoopSpeed = 2.0 + Math.min(3.5, (score - 5) * 0.35);
      const modeEl = document.getElementById('bb-mode');
      if (modeEl) {
        modeEl.textContent = 'MOVING HOOP (ACTIVE)';
        modeEl.className = 'px-4 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-200 font-bold text-xs shadow animate-pulse';
      }
    }

    if (hoopMoving) {
      hoopX += hoopSpeed * hoopDir;
      const margin = 70;
      if (hoopX < margin || hoopX > w - margin) {
        hoopDir *= -1;
      }
    }

    const boardW = 140;
    const boardH = 90;
    const boardX = hoopX - boardW / 2;
    const boardY = hoopY - 75;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(boardX, boardY, boardW, boardH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.strokeRect(boardX + 45, boardY + 35, 50, 35);
    ctx.restore();

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hoopX - hoopW / 2, hoopY);
    ctx.lineTo(hoopX + hoopW / 2, hoopY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let netSway = 0;
    if (netAnimTimer > 0) {
      netSway = Math.sin(netAnimTimer * 0.9) * 14 * (netAnimTimer / 15);
      netAnimTimer--;
    }
    
    const topL = hoopX - hoopW / 2 + 4;
    const topR = hoopX + hoopW / 2 - 4;
    const botL = hoopX - 18 + netSway;
    const botR = hoopX + 18 + netSway;

    ctx.moveTo(topL, hoopY); ctx.lineTo(botL, hoopY + 50);
    ctx.moveTo(topR, hoopY); ctx.lineTo(botR, hoopY + 50);
    ctx.moveTo(hoopX - hoopW / 4, hoopY); ctx.lineTo(hoopX - 6 + netSway * 0.6, hoopY + 50);
    ctx.moveTo(hoopX + hoopW / 4, hoopY); ctx.lineTo(hoopX + 6 + netSway * 0.6, hoopY + 50);
    ctx.stroke();

    if (ball.active) {
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vy += 0.38;

      const rimLeft = hoopX - hoopW / 2;
      const rimRight = hoopX + hoopW / 2;
      
      if (!ball.scored && ball.vy > 0 && ball.y >= hoopY && ball.y <= hoopY + 12 && ball.x >= rimLeft + 4 && ball.x <= rimRight - 4) {
        ball.scored = true;
        score++;
        netAnimTimer = 15;
        if (typeof AudioFX !== 'undefined') AudioFX.coin();
        document.getElementById('bb-score').textContent = `🏀 SCORED: ${score}`;
        spawnPopup('SWISH! +1', ball.x, ball.y - 30, '#fde047');
        if (score % 5 === 0 && typeof addXP === 'function') addXP(30, ball.x, ball.y);
      }

      if (ball.y > h + 50 || ball.x < -50 || ball.x > w + 50) {
        if (!ball.scored) {
          misses++;
          document.getElementById('bb-misses').textContent = `❌ MISSES: ${misses} / 5`;
          if (typeof AudioFX !== 'undefined') AudioFX.lose();
          spawnPopup('MISS!', w / 2, h * 0.6, '#f43f5e');

          if (misses >= 5) {
            running = false;
            document.getElementById('final-score').textContent = score;
            const ov = document.getElementById('game-over-overlay');
            ov.classList.remove('hidden');
            ov.classList.add('flex');
          }
        }
        if (running) resetBall();
      }
    }

    if (isHolding && !ball.active && running) {
      ctx.save();
      ctx.fillStyle = '#facc15';
      const simSpeed = 7 + aimPower * 15;
      let simX = ball.x;
      let simY = ball.y;
      let simVx = Math.cos(aimAngle) * simSpeed;
      let simVy = Math.sin(aimAngle) * simSpeed;

      for (let i = 0; i < 28; i++) {
        simX += simVx;
        simY += simVy;
        simVy += 0.38;

        if (simY < 0 || simY > h || simX < 0 || simX > w) break;

        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.arc(simX, simY, 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(250, 204, 21, ${1 - i / 32})`;
          ctx.fill();
        }
      }
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
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y - ball.r);
    ctx.lineTo(ball.x, ball.y + ball.r);
    ctx.stroke();
    ctx.restore();

    if (running) {
      raf = requestAnimationFrame(loop);
    }
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