function initBasketballHoops(stage) {
  const HIGH_SCORE_KEY = 'arcadehub_bb_highscore_v2';
  let bestScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);

  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 overflow-hidden select-none flex flex-col justify-between font-sans">
      <!-- Top HUD -->
      <div class="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <span id="bb-score" class="px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-amber-400/40 text-amber-300 font-black text-xs sm:text-sm shadow-lg">🏀 0</span>
          <span id="bb-best" class="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-slate-300 font-bold text-xs shadow">👑 ${bestScore}</span>
          <span id="bb-streak" class="hidden px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-600 to-red-600 border border-amber-300/60 text-white font-black text-xs shadow-lg animate-bounce">🔥 x2</span>
        </div>

        <div class="flex items-center gap-1.5 pointer-events-auto bg-black/70 backdrop-blur-md p-1 rounded-full border border-white/15 shadow-lg">
          <button id="mode-classic" class="px-3 py-1 rounded-full text-[11px] font-extrabold transition cursor-pointer bg-orange-600 text-white shadow">CLASSIC</button>
          <button id="mode-blitz" class="px-3 py-1 rounded-full text-[11px] font-extrabold transition cursor-pointer text-slate-300 hover:text-white">60s BLITZ</button>
        </div>

        <div class="flex items-center gap-2">
          <span id="bb-status-pill" class="px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-rose-500/40 text-rose-400 font-black text-xs sm:text-sm shadow-lg">❤️❤️❤️❤️❤️</span>
        </div>
      </div>

      <!-- Canvas -->
      <canvas id="bb-canvas" class="w-full h-full block touch-none cursor-crosshair"></canvas>

      <!-- Bottom Instruction Pill -->
      <div id="bb-instruction-wrap" class="absolute bottom-5 left-0 right-0 z-10 flex flex-col items-center gap-2 pointer-events-none px-4 transition-opacity duration-300">
        <div id="bb-instruction" class="bg-black/75 backdrop-blur-md border border-white/15 px-4 py-2 rounded-2xl text-xs font-bold text-amber-200 shadow-xl text-center">
          Hold &amp; drag from ball (or pull back slingshot-style) to aim, release to shoot!
        </div>
      </div>

      <!-- Game Over Overlay -->
      <div id="game-over-overlay" class="absolute inset-0 bg-slate-950/85 backdrop-blur-md hidden flex-col items-center justify-center z-50 p-6 text-center">
        <div class="max-w-xs w-full bg-slate-900/95 border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-3.5">
          <div id="go-icon" class="text-4xl">🏀🏆</div>
          <h2 id="go-title" class="text-2xl font-black text-amber-400 tracking-tight">Game Over!</h2>
          <p id="go-subtitle" class="text-xs text-slate-300">Great run on the court!</p>

          <div class="grid grid-cols-2 gap-2 bg-black/40 border border-white/10 rounded-2xl p-3 my-1">
            <div class="flex flex-col">
              <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Final Score</span>
              <span id="final-score" class="text-xl font-black text-amber-400">0</span>
            </div>
            <div class="flex flex-col border-l border-white/10">
              <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Best Score</span>
              <span id="final-best" class="text-xl font-black text-emerald-400">0</span>
            </div>
            <div class="flex flex-col border-t border-white/10 pt-2">
              <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Swishes</span>
              <span id="final-swishes" class="text-sm font-extrabold text-sky-300">0</span>
            </div>
            <div class="flex flex-col border-t border-l border-white/10 pt-2">
              <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Max Streak</span>
              <span id="final-streak" class="text-sm font-extrabold text-orange-400">0</span>
            </div>
          </div>

          <button id="restart-btn" class="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold text-sm shadow-lg shadow-orange-500/30 hover:brightness-110 transition active:scale-95 cursor-pointer">
            Play Again ↺
          </button>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById('bb-canvas');
  const ctx = canvas.getContext('2d');
  let w = (canvas.width = stage.clientWidth || 600);
  let h = (canvas.height = stage.clientHeight || 500);

  // Game Mode & State
  let gameMode = 'classic'; // 'classic' | 'blitz'
  let score = 0;
  let misses = 0;
  const maxMisses = 5;
  let timeLeft = 60.0;
  let streak = 0;
  let maxStreak = 0;
  let swishCount = 0;
  let running = true;
  let shotsTaken = 0;

  // Hoop & Backboard State
  let hoopX = w / 2;
  let hoopY = h * 0.27;
  let hoopW = 86;
  const rimRadius = 5;
  let hoopMoving = false;
  let hoopSpeed = 1.8;
  let hoopDir = 1;
  let netAnimTimer = 0;
  let rimShakeTimer = 0;

  // Bonus Floating Ring (spawns occasionally for extra points)
  let bonusRing = {
    active: false,
    x: 0,
    y: 0,
    r: 22,
    collected: false,
    pulse: 0
  };

  // Ball State
  let ballStartX = w / 2;
  let ballStartY = h * 0.82;
  let ball = {
    x: ballStartX,
    y: ballStartY,
    prevX: ballStartX,
    prevY: ballStartY,
    vx: 0,
    vy: 0,
    r: 20,
    spin: 0,
    angle: 0,
    active: false,
    scored: false,
    touchedRim: false,
    touchedBoard: false,
    trail: []
  };

  // Aiming State
  let isHolding = false;
  let holdStartTime = 0;
  let aimAngle = -Math.PI / 2;
  let aimPower = 0;
  let pointerStart = { x: 0, y: 0 };

  // Visual Effects
  let particles = [];
  let floatingTexts = [];
  let screenShake = 0;

  const GRAVITY = 0.42;

  function updateLayoutDimensions() {
    w = canvas.width = stage.clientWidth || 600;
    h = canvas.height = stage.clientHeight || 500;
    hoopY = Math.max(115, h * 0.27);
    ballStartY = Math.min(h - 55, h * 0.82);

    if (!ball.active) {
      ballStartX = Math.max(60, Math.min(w - 60, ballStartX));
      ball.x = ballStartX;
      ball.y = ballStartY;
    }
    if (!hoopMoving) {
      hoopX = w / 2;
    } else {
      hoopX = Math.max(85, Math.min(w - 85, hoopX));
    }
  }

  const onResize = () => updateLayoutDimensions();
  window.addEventListener('resize', onResize);

  // Particle & Floating Text Helpers
  function spawnParticles(x, y, color, count = 18, speedScale = 1) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (1.5 + Math.random() * 4.5) * speedScale;
      particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.5,
        life: 1,
        decay: 0.025 + Math.random() * 0.025,
        size: 2.5 + Math.random() * 3.5,
        color
      });
    }
  }

  function addFloatingText(text, x, y, color = '#fde047', scale = 1) {
    floatingTexts.push({
      text,
      x,
      y,
      vy: -1.6,
      life: 1,
      color,
      scale
    });
    if (typeof spawnPopup === 'function') {
      spawnPopup(text, x, y, color);
    }
  }

  function updateHUD() {
    const scoreEl = document.getElementById('bb-score');
    const bestEl = document.getElementById('bb-best');
    const streakEl = document.getElementById('bb-streak');
    const statusEl = document.getElementById('bb-status-pill');

    if (scoreEl) scoreEl.textContent = `🏀 ${score}`;
    if (bestEl) bestEl.textContent = `👑 ${bestScore}`;

    if (streakEl) {
      if (streak >= 2) {
        streakEl.classList.remove('hidden');
        streakEl.textContent = streak >= 3 ? `🔥 ON FIRE x2 (${streak})` : `⚡ STREAK ${streak}`;
      } else {
        streakEl.classList.add('hidden');
      }
    }

    if (statusEl) {
      if (gameMode === 'classic') {
        const livesLeft = Math.max(0, maxMisses - misses);
        statusEl.textContent = '❤️'.repeat(livesLeft) + '🖤'.repeat(maxMisses - livesLeft);
        statusEl.className =
          'px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-rose-500/40 text-rose-400 font-black text-xs sm:text-sm shadow-lg';
      } else {
        const secs = Math.max(0, timeLeft).toFixed(1);
        const urgent = timeLeft <= 10;
        statusEl.textContent = `⏱️ ${secs}s`;
        statusEl.className = `px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border ${
          urgent ? 'border-rose-500 text-rose-400 animate-pulse' : 'border-sky-400/40 text-sky-300'
        } font-black text-xs sm:text-sm shadow-lg`;
      }
    }
  }

  // Pointer Controls (Supports both drag-toward-hoop AND pull-back slingshot intuitively)
  function startHold(clientX, clientY) {
    if (!running || ball.active) return;
    const dist = Math.hypot(clientX - ball.x, clientY - ball.y);
    if (dist < 110 || clientY > h * 0.45) {
      isHolding = true;
      holdStartTime = performance.now();
      pointerStart = { x: clientX, y: clientY };
      aimPower = 0.25;
      aimAngle = Math.atan2(hoopY - ball.y, hoopX - ball.x);

      const inst = document.getElementById('bb-instruction-wrap');
      if (inst && shotsTaken > 0) inst.style.opacity = '0';

      if (typeof AudioFX !== 'undefined') AudioFX.click();
    }
  }

  function moveHold(clientX, clientY) {
    if (!isHolding || ball.active) return;
    const dx = clientX - ball.x;
    const dy = clientY - ball.y;
    const dragDist = Math.hypot(clientX - pointerStart.x, clientY - pointerStart.y);

    // If user drags downward below the ball, invert vector (slingshot feel); otherwise aim toward pointer
    if (dy > 18) {
      const pullDx = pointerStart.x - clientX;
      const pullDy = pointerStart.y - clientY;
      if (Math.hypot(pullDx, pullDy) > 8) {
        aimAngle = Math.atan2(pullDy, pullDx);
      }
    } else if (Math.hypot(dx, dy) > 8) {
      aimAngle = Math.atan2(dy, dx);
    }

    // Clamp upward shooting angles so shots don't fire straight into the floor
    if (aimAngle > -0.18) aimAngle = -0.18;
    if (aimAngle < -Math.PI + 0.18) aimAngle = -Math.PI + 0.18;

    // Combine hold duration & drag distance so stationary holds STILL charge power
    const elapsedPower = Math.min(1.0, (performance.now() - holdStartTime) / 750);
    const dragPower = Math.min(1.0, dragDist / 160);
    aimPower = Math.max(0.18, Math.max(elapsedPower, dragPower));
  }

  function releaseHold() {
    if (!isHolding || ball.active) return;
    isHolding = false;
    shotsTaken++;

    const speed = 8.5 + aimPower * 15.5;
    ball.vx = Math.cos(aimAngle) * speed;
    ball.vy = Math.sin(aimAngle) * speed;
    ball.spin = (ball.vx * 0.035) || 0.08;
    ball.active = true;
    ball.scored = false;
    ball.touchedRim = false;
    ball.touchedBoard = false;
    ball.trail = [];

    if (typeof AudioFX !== 'undefined') AudioFX.jump();
  }

  canvas.onpointerdown = (e) => {
    canvas.setPointerCapture(e.pointerId);
    startHold(e.offsetX, e.offsetY);
  };
  canvas.onpointermove = (e) => moveHold(e.offsetX, e.offsetY);
  canvas.onpointerup = (e) => {
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    releaseHold();
  };
  canvas.onpointercancel = () => {
    isHolding = false;
  };

  // Mode Switching
  function setMode(newMode) {
    gameMode = newMode;
    const classicBtn = document.getElementById('mode-classic');
    const blitzBtn = document.getElementById('mode-blitz');
    if (classicBtn && blitzBtn) {
      if (gameMode === 'classic') {
        classicBtn.className =
          'px-3 py-1 rounded-full text-[11px] font-extrabold transition cursor-pointer bg-orange-600 text-white shadow';
        blitzBtn.className =
          'px-3 py-1 rounded-full text-[11px] font-extrabold transition cursor-pointer text-slate-300 hover:text-white';
      } else {
        blitzBtn.className =
          'px-3 py-1 rounded-full text-[11px] font-extrabold transition cursor-pointer bg-sky-600 text-white shadow';
        classicBtn.className =
          'px-3 py-1 rounded-full text-[11px] font-extrabold transition cursor-pointer text-slate-300 hover:text-white';
      }
    }
    window.restartBasketballGame();
  }

  document.getElementById('mode-classic').onclick = () => setMode('classic');
  document.getElementById('mode-blitz').onclick = () => setMode('blitz');

  function triggerGameOver(reasonTitle, reasonSub) {
    if (!running) return;
    running = false;
    isHolding = false;

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(HIGH_SCORE_KEY, String(bestScore));
    }

    document.getElementById('go-title').textContent = reasonTitle;
    document.getElementById('go-subtitle').textContent = reasonSub;
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-best').textContent = bestScore;
    document.getElementById('final-swishes').textContent = swishCount;
    document.getElementById('final-streak').textContent = maxStreak;

    const ov = document.getElementById('game-over-overlay');
    ov.classList.remove('hidden');
    ov.classList.add('flex');
    updateHUD();
  }

  function spawnBonusRing() {
    if (score < 3 || Math.random() > 0.45) {
      bonusRing.active = false;
      return;
    }
    bonusRing.active = true;
    bonusRing.collected = false;
    bonusRing.x = Math.max(90, Math.min(w - 90, w * (0.25 + Math.random() * 0.5)));
    bonusRing.y = hoopY + 55 + Math.random() * 75;
    bonusRing.pulse = 0;
  }

  function resetBall(afterScore = false) {
    // Relocate shooting spot horizontally once player builds a score/streak for variety
    if (afterScore && score >= 4) {
      const margin = Math.max(65, w * 0.16);
      ballStartX = margin + Math.random() * (w - margin * 2);
    } else if (!afterScore) {
      ballStartX = w / 2;
    }

    ball.x = ballStartX;
    ball.y = ballStartY;
    ball.prevX = ballStartX;
    ball.prevY = ballStartY;
    ball.vx = 0;
    ball.vy = 0;
    ball.spin = 0;
    ball.active = false;
    ball.scored = false;
    ball.touchedRim = false;
    ball.touchedBoard = false;
    ball.trail = [];

    if (afterScore) spawnBonusRing();
  }

  window.restartBasketballGame = function () {
    score = 0;
    misses = 0;
    timeLeft = 60.0;
    streak = 0;
    maxStreak = 0;
    swishCount = 0;
    shotsTaken = 0;
    running = true;
    hoopMoving = false;
    hoopX = w / 2;
    particles = [];
    floatingTexts = [];
    bonusRing.active = false;

    const inst = document.getElementById('bb-instruction-wrap');
    if (inst) inst.style.opacity = '1';

    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('game-over-overlay').classList.remove('flex');
    resetBall(false);
    updateHUD();

    cancelAnimationFrame(raf);
    lastTime = performance.now();
    raf = requestAnimationFrame(loop);
  };

  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) restartBtn.onclick = window.restartBasketballGame;

  // Circle-vs-Point Collision Helper (for Rim edges)
  function collideCirclePoint(px, py, restitution = 0.62) {
    const dx = ball.x - px;
    const dy = ball.y - py;
    const dist = Math.hypot(dx, dy);
    const minDist = ball.r + rimRadius;

    if (dist < minDist && dist > 0.001) {
      const nx = dx / dist;
      const ny = dy / dist;

      // Push ball outside rim edge
      ball.x = px + nx * minDist;
      ball.y = py + ny * minDist;

      // Reflect velocity along normal
      const vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) {
        ball.vx -= (1 + restitution) * vn * nx;
        ball.vy -= (1 + restitution) * vn * ny;
        ball.vx *= 0.92;
        ball.spin = -ball.vx * 0.04;
        ball.touchedRim = true;
        rimShakeTimer = 8;
        if (typeof AudioFX !== 'undefined') AudioFX.click();
      }
    }
  }

  // Main Game Loop
  let raf;
  let lastTime = performance.now();

  function loop(now = performance.now()) {
    const rawDt = (now - lastTime) / 16.6667;
    lastTime = now;
    const dt = Math.min(2.0, Math.max(0.25, rawDt));

    // Blitz Countdown Timer
    if (running && gameMode === 'blitz') {
      timeLeft -= (dt * 16.6667) / 1000;
      if (timeLeft <= 0) {
        timeLeft = 0;
        triggerGameOver("Time's Up!", '60-Second Blitz buzzer sounded!');
      }
      updateHUD();
    }

    // Continuous power update while holding stationary
    if (isHolding && !ball.active && running) {
      const elapsedPower = Math.min(1.0, (now - holdStartTime) / 750);
      if (elapsedPower > aimPower) aimPower = elapsedPower;
    }

    ctx.save();
    if (screenShake > 0) {
      const sx = (Math.random() - 0.5) * screenShake;
      const sy = (Math.random() - 0.5) * screenShake;
      ctx.translate(sx, sy);
      screenShake *= 0.85;
      if (screenShake < 0.4) screenShake = 0;
    }

    ctx.clearRect(0, 0, w, h);

    // 1. Arena Background & Court Lines
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#431407');
    bgGrad.addColorStop(0.42, '#1e1b4b');
    bgGrad.addColorStop(0.78, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle Arena Spotlights
    const spotGrad = ctx.createRadialGradient(w / 2, hoopY - 40, 10, w / 2, hoopY, w * 0.65);
    spotGrad.addColorStop(0, 'rgba(251, 146, 60, 0.16)');
    spotGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, w, h);

    // Court Floor Perspective & Three-Point Arc
    ctx.fillStyle = 'rgba(249, 115, 22, 0.05)';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.lineTo(w, h * 0.72);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(w / 2, h + 110, Math.min(w * 0.46, 360), Math.PI, 2 * Math.PI);
    ctx.stroke();

    // 2. Hoop Movement Logic
    if (score >= 4 || gameMode === 'blitz') {
      hoopMoving = true;
      const baseSpeed = gameMode === 'blitz' ? 1.6 : 1.5;
      hoopSpeed = baseSpeed + Math.min(3.4, score * 0.14);
    }

    if (hoopMoving && running) {
      hoopX += hoopSpeed * hoopDir * dt;
      const margin = 90;
      if (hoopX < margin) {
        hoopX = margin;
        hoopDir = 1;
      } else if (hoopX > w - margin) {
        hoopX = w - margin;
        hoopDir = -1;
      }
    }

    // 3. Bonus Floating Star Ring
    if (bonusRing.active && !bonusRing.collected) {
      bonusRing.pulse += 0.07 * dt;
      const pulseR = bonusRing.r + Math.sin(bonusRing.pulse) * 3;
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(bonusRing.x, bonusRing.y, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#bae6fd';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+2', bonusRing.x, bonusRing.y + 4);
      ctx.restore();
    }

    // 4. Backboard & Rim (Back Layer)
    const rimOffsetY = rimShakeTimer > 0 ? Math.sin(rimShakeTimer * 1.5) * 2 : 0;
    if (rimShakeTimer > 0) rimShakeTimer -= dt;

    const boardW = 148;
    const boardH = 94;
    const boardX = hoopX - boardW / 2;
    const boardY = hoopY - 76;

    // Support Pole
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(hoopX - 8, boardY - 60, 16, 65);

    // Glass Backboard
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(boardX, boardY, boardW, boardH, 10);
    ctx.fill();
    ctx.stroke();

    // Inner Shooter's Square
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.strokeRect(hoopX - 25, hoopY - 40, 50, 34);
    ctx.restore();

    const rimLeftX = hoopX - hoopW / 2;
    const rimRightX = hoopX + hoopW / 2;
    const rimY = hoopY + rimOffsetY;

    // Back Rim Bar (drawn behind ball when ball is falling through)
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(rimLeftX, rimY);
    ctx.lineTo(rimRightX, rimY);
    ctx.stroke();

    // 5. Ball Physics & Collisions
    if (ball.active && running) {
      ball.prevX = ball.x;
      ball.prevY = ball.y;

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.vy += GRAVITY * dt;
      ball.angle += ball.spin * dt;

      // Record Motion Trail
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 12) ball.trail.shift();

      // Side Wall Bounces (keeps tricky bank angles alive)
      if (ball.x - ball.r < 0) {
        ball.x = ball.r;
        ball.vx = Math.abs(ball.vx) * 0.72;
      } else if (ball.x + ball.r > w) {
        ball.x = w - ball.r;
        ball.vx = -Math.abs(ball.vx) * 0.72;
      }

      // Bonus Ring Collection
      if (bonusRing.active && !bonusRing.collected) {
        const distRing = Math.hypot(ball.x - bonusRing.x, ball.y - bonusRing.y);
        if (distRing < ball.r + bonusRing.r) {
          bonusRing.collected = true;
          score += 2;
          updateHUD();
          spawnParticles(bonusRing.x, bonusRing.y, '#38bdf8', 16);
          addFloatingText('BONUS +2!', bonusRing.x, bonusRing.y - 20, '#38bdf8');
          if (typeof AudioFX !== 'undefined') AudioFX.coin();
        }
      }

      // Backboard Top & Side Edge Deflection (when ball approaches from above/behind)
      if (
        ball.vy > 0 &&
        ball.prevY + ball.r <= boardY &&
        ball.y + ball.r >= boardY &&
        ball.x >= boardX &&
        ball.x <= boardX + boardW
      ) {
        ball.y = boardY - ball.r;
        ball.vy = -ball.vy * 0.55;
        ball.touchedBoard = true;
      }

      // Rim Left & Right Edge Collisions
      collideCirclePoint(rimLeftX, rimY, 0.62);
      collideCirclePoint(rimRightX, rimY, 0.62);

      // Score Detection (Crossing the rim plane downward inside the hoop)
      if (
        !ball.scored &&
        ball.vy > 0 &&
        ball.prevY <= rimY + 4 &&
        ball.y >= rimY &&
        ball.x > rimLeftX + 6 &&
        ball.x < rimRightX - 6
      ) {
        ball.scored = true;
        streak++;
        if (streak > maxStreak) maxStreak = streak;

        const isSwish = !ball.touchedRim && !ball.touchedBoard;
        const isBank = !ball.touchedRim && ball.touchedBoard;
        const fireMultiplier = streak >= 3 ? 2 : 1;
        const basePts = isSwish ? 2 : 1;
        const pointsEarned = basePts * fireMultiplier;

        score += pointsEarned;
        if (isSwish) swishCount++;

        if (score > bestScore) {
          bestScore = score;
          localStorage.setItem(HIGH_SCORE_KEY, String(bestScore));
        }

        // Dampen horizontal speed smoothly as ball drops through net
        ball.vx *= 0.45;
        netAnimTimer = 22;
        screenShake = isSwish ? 6 : 3;

        if (typeof AudioFX !== 'undefined') AudioFX.coin();

        if (isSwish) {
          spawnParticles(hoopX, rimY + 15, '#fde047', 26, 1.2);
          addFloatingText(`SWISH! +${pointsEarned}`, hoopX, rimY - 35, '#fde047', 1.2);
        } else if (isBank) {
          spawnParticles(hoopX, rimY + 15, '#fb923c', 18);
          addFloatingText(`BANK SHOT! +${pointsEarned}`, hoopX, rimY - 35, '#fb923c');
        } else {
          spawnParticles(hoopX, rimY + 15, '#4ade80', 14);
          addFloatingText(`+${pointsEarned}`, hoopX, rimY - 30, '#4ade80');
        }

        if (score % 5 === 0 && typeof addXP === 'function') {
          addXP(30, hoopX, rimY);
        }

        updateHUD();
      }

      // Out-of-bounds Reset / Miss Evaluation
      if (ball.y - ball.r > h + 30) {
        if (!ball.scored) {
          streak = 0;
          if (gameMode === 'classic') {
            misses++;
            if (typeof AudioFX !== 'undefined') AudioFX.lose();
            addFloatingText('MISS!', Math.max(60, Math.min(w - 60, ball.x)), h * 0.65, '#f43f5e');

            if (misses >= maxMisses) {
              triggerGameOver('Out of Lives!', `You reached ${maxMisses} misses. Solid effort!`);
            }
          } else {
            addFloatingText('STREAK LOST', Math.max(70, Math.min(w - 70, ball.x)), h * 0.65, '#94a3b8');
          }
          updateHUD();
          if (running) resetBall(false);
        } else if (running) {
          resetBall(true);
        }
      }
    }

    // 6. Aiming Trajectory Preview & Power Ring
    if (isHolding && !ball.active && running) {
      const simSpeed = 8.5 + aimPower * 15.5;
      let simX = ball.x;
      let simY = ball.y;
      let simVx = Math.cos(aimAngle) * simSpeed;
      let simVy = Math.sin(aimAngle) * simSpeed;

      ctx.save();
      for (let i = 1; i <= 34; i++) {
        simX += simVx;
        simY += simVy;
        simVy += GRAVITY;

        if (simX < ball.r || simX > w - ball.r) simVx *= -0.72;
        if (simY > h) break;

        if (i % 2 === 0) {
          const alpha = Math.max(0, 1 - i / 36);
          const dotRadius = Math.max(2, 5 - i * 0.08);
          ctx.beginPath();
          ctx.arc(simX, simY, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = streak >= 3 ? `rgba(251, 146, 60, ${alpha})` : `rgba(250, 204, 21, ${alpha})`;
          ctx.fill();
        }
      }

      // Power Gauge Arc around Ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * aimPower);
      ctx.strokeStyle = aimPower > 0.85 ? '#f43f5e' : '#facc15';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    // 7. Ball Motion Trail & Basketball Render
    if (ball.active && ball.trail.length > 1) {
      for (let i = 0; i < ball.trail.length; i++) {
        const pt = ball.trail[i];
        const ratio = i / ball.trail.length;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, ball.r * ratio * 0.85, 0, Math.PI * 2);
        ctx.fillStyle =
          streak >= 3
            ? `rgba(239, 68, 68, ${ratio * 0.35})`
            : `rgba(249, 115, 22, ${ratio * 0.25})`;
        ctx.fill();
      }
    }

    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.angle);

    // Fire Aura if Streak >= 3
    if (streak >= 3) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 24;
    } else {
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = ball.active ? 14 : 8;
    }

    const ballGrad = ctx.createRadialGradient(-6, -6, 3, 0, 0, ball.r);
    ballGrad.addColorStop(0, streak >= 3 ? '#fde047' : '#fb923c');
    ballGrad.addColorStop(0.65, '#ea580c');
    ballGrad.addColorStop(1, '#7c2d12');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
    ctx.fill();

    // Basketball Seams
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#431407';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-ball.r, 0);
    ctx.lineTo(ball.r, 0);
    ctx.moveTo(0, -ball.r);
    ctx.lineTo(0, ball.r);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-ball.r * 0.65, 0, ball.r * 0.75, -Math.PI * 0.38, Math.PI * 0.38);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ball.r * 0.65, 0, ball.r * 0.75, Math.PI * 0.62, Math.PI * 1.38);
    ctx.stroke();
    ctx.restore();

    // 8. Front Rim & Dynamic Net (drawn OVER ball so swishes pass inside the net!)
    ctx.save();
    let netSway = 0;
    let netStretch = 0;
    if (netAnimTimer > 0) {
      netSway = Math.sin(netAnimTimer * 0.85) * 14 * (netAnimTimer / 22);
      netStretch = Math.sin((netAnimTimer / 22) * Math.PI) * 10;
      netAnimTimer -= dt;
    }

    const netHeight = 48 + netStretch;
    const topL = rimLeftX + 5;
    const topR = rimRightX - 5;
    const botL = hoopX - 20 + netSway;
    const botR = hoopX + 20 + netSway;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Outer net ropes
    ctx.moveTo(topL, rimY);
    ctx.lineTo(botL, rimY + netHeight);
    ctx.moveTo(topR, rimY);
    ctx.lineTo(botR, rimY + netHeight);

    // Cross-hatch diamond mesh
    const cols = 4;
    for (let i = 0; i < cols; i++) {
      const t1 = i / cols;
      const t2 = (i + 1) / cols;
      const xTop1 = topL + (topR - topL) * t1;
      const xTop2 = topL + (topR - topL) * t2;
      const xBot1 = botL + (botR - botL) * t1;
      const xBot2 = botL + (botR - botL) * t2;

      ctx.moveTo(xTop1, rimY);
      ctx.lineTo(xBot2, rimY + netHeight);
      ctx.moveTo(xTop2, rimY);
      ctx.lineTo(xBot1, rimY + netHeight);
    }
    ctx.stroke();

    // Front Rim Bar & Caps
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rimLeftX, rimY);
    ctx.lineTo(rimRightX, rimY);
    ctx.stroke();
    ctx.restore();

    // 9. Particles & Floating Score Popups
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.15 * dt;
      p.life -= p.decay * dt;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= 0.022 * dt;
      if (ft.life <= 0) {
        floatingTexts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = `900 ${Math.round(16 * ft.scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(ft.text, ft.x + 1.5, ft.y + 1.5);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();

    if (running) {
      raf = requestAnimationFrame(loop);
    }
  }

  updateLayoutDimensions();
  updateHUD();
  raf = requestAnimationFrame(loop);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}