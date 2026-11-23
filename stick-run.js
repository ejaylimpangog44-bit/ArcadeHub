window.initStickRun = function initStickRun(stage) {
  let active = true;
  let rafId = null;

  const canvas = document.createElement('canvas');
  canvas.className = 'w-full h-full block touch-none';
  stage.innerHTML = '';

  const hud = document.createElement('div');
  hud.className = 'pointer-events-none absolute top-3 left-3 right-14 z-10 flex items-center justify-between gap-2';
  hud.innerHTML = `
    <div id="sr-score-pill" class="px-3.5 py-1.5 rounded-full bg-slate-950/75 border border-sky-400/35 text-sky-200 font-extrabold text-xs tracking-wide shadow">
      🏃 RUN: 0
    </div>
    <div id="sr-hint-pill" class="px-3.5 py-1.5 rounded-full bg-slate-950/70 border border-white/15 text-slate-200 font-bold text-[11px] tracking-wide shadow">
      TAP OR SPACE TO JUMP
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.id = 'sr-gameover-overlay';
  overlay.className = 'hidden pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center bg-slate-950/35';
  overlay.innerHTML = `
    <div class="px-6 py-5 rounded-3xl bg-slate-950/85 border border-amber-400/40 shadow-2xl flex flex-col items-center gap-2">
      <div id="sr-final-score" class="text-2xl sm:text-3xl font-black text-white tracking-tight">Run Score: 0</div>
      <div id="sr-best-score" class="text-xs font-extrabold text-amber-300 uppercase tracking-wider">Best: 0</div>
      <div class="text-xs font-bold text-slate-300 mt-1">Tap or Press Space to Run Again</div>
    </div>
  `;

  stage.appendChild(canvas);
  stage.appendChild(hud);
  stage.appendChild(overlay);

  const ctx = canvas.getContext('2d');
  let viewW = 0;
  let viewH = 0;
  let groundY = 0;

  let score = 0;
  let bestScore = window.SupabaseDB?.getBestLocalScore ? window.SupabaseDB.getBestLocalScore('stickrun') : 0;
  let speed = 340;
  let gameOver = false;
  let scoreSubmitted = false;
  let runPhase = 0;
  let spawnTimer = 0.9;
  let scoreAccumulator = 0;

  const runner = {
    x: 72,
    y: 0,
    vy: 0,
    radius: 18,
    grounded: true
  };

  let obstacles = [];
  let particles = [];

  function syncHud() {
    const scoreEl = document.getElementById('sr-score-pill');
    const finalEl = document.getElementById('sr-final-score');
    const bestEl = document.getElementById('sr-best-score');
    if (scoreEl) scoreEl.textContent = `🏃 RUN: ${score}`;
    if (finalEl) finalEl.textContent = `Run Score: ${score}`;
    if (bestEl) bestEl.textContent = `Best: ${Math.max(bestScore, score)}`;
    overlay.classList.toggle('hidden', !gameOver);
  }

  function resize() {
    if (!active) return;
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewW = Math.max(280, Math.floor(rect.width || window.innerWidth));
    viewH = Math.max(360, Math.floor(rect.height || window.innerHeight));

    canvas.width = Math.floor(viewW * dpr);
    canvas.height = Math.floor(viewH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const prevGround = groundY || viewH * 0.72;
    groundY = Math.round(viewH * 0.72);
    runner.x = Math.max(52, Math.min(110, Math.round(viewW * 0.18)));

    if (runner.grounded) {
      runner.y = groundY;
    } else {
      runner.y = Math.min(groundY, runner.y + (groundY - prevGround));
    }
  }

  function resetRun() {
    if (!active) return;
    score = 0;
    speed = 340;
    gameOver = false;
    scoreSubmitted = false;
    runPhase = 0;
    spawnTimer = 0.85;
    scoreAccumulator = 0;
    obstacles = [];
    particles = [];
    runner.vy = 0;
    runner.y = groundY;
    runner.grounded = true;
    syncHud();
    if (typeof AudioFX !== 'undefined') AudioFX.click();
  }

  function triggerJumpOrRestart() {
    if (!active) return;
    if (gameOver) {
      resetRun();
      return;
    }
    if (runner.grounded) {
      runner.vy = -660;
      runner.grounded = false;
      if (typeof AudioFX !== 'undefined') AudioFX.jump();
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: runner.x,
          y: groundY - 2,
          vx: -60 - Math.random() * 90,
          vy: -30 - Math.random() * 80,
          life: 0.35 + Math.random() * 0.15
        });
      }
    }
  }

  function spawnObstacle() {
    const tall = Math.random() < 0.38;
    const w = tall ? 24 : 30;
    const h = tall ? 46 : 30;
    obstacles.push({
      x: viewW + 24,
      y: groundY - h,
      w,
      h
    });
  }

  function endRun() {
    if (gameOver) return;
    gameOver = true;
    syncHud();
    if (typeof AudioFX !== 'undefined') AudioFX.lose();

    if (!scoreSubmitted && score > 0) {
      scoreSubmitted = true;
      if (score > bestScore) bestScore = score;
      if (typeof addXP === 'function') {
        addXP(Math.min(60, Math.max(10, score)), viewW * 0.5, viewH * 0.32, `+${Math.min(60, Math.max(10, score))} XP`);
      }
      window.ArcadeHero?.awardGameScore('stickrun', score);
      syncHud();
    }
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#0ea5e9');
    sky.addColorStop(0.62, '#38bdf8');
    sky.addColorStop(1, '#bae6fd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, viewW, groundY);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    const cloudShift = (performance.now() * 0.025) % (viewW + 180);
    [0, 220, 440].forEach((offset, idx) => {
      const cx = viewW - ((cloudShift + offset) % (viewW + 180)) + 90;
      const cy = Math.max(64, groundY * (0.2 + idx * 0.12));
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.arc(cx + 20, cy - 6, 28, 0, Math.PI * 2);
      ctx.arc(cx + 44, cy, 22, 0, Math.PI * 2);
      ctx.fill();
    });

    const turf = ctx.createLinearGradient(0, groundY, 0, viewH);
    turf.addColorStop(0, '#15803d');
    turf.addColorStop(0.18, '#166534');
    turf.addColorStop(1, '#052e16');
    ctx.fillStyle = turf;
    ctx.fillRect(0, groundY, viewW, viewH - groundY);

    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, groundY, viewW, 5);
  }

  function drawStickRunner() {
    const hipY = runner.y - 24;
    const shoulderY = runner.y - 44;
    const headY = runner.y - 55;
    const swing = runner.grounded ? Math.sin(runPhase) * 12 : 8;

    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.arc(runner.x, headY, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(runner.x, headY + 8.5);
    ctx.lineTo(runner.x, hipY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(runner.x, shoulderY);
    ctx.lineTo(runner.x - swing * 0.8, hipY + 2);
    ctx.moveTo(runner.x, shoulderY);
    ctx.lineTo(runner.x + swing * 0.8, hipY + 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(runner.x, hipY);
    ctx.lineTo(runner.x - swing, runner.y - 2);
    ctx.moveTo(runner.x, hipY);
    ctx.lineTo(runner.x + swing, runner.y - 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawObstacles() {
    obstacles.forEach((ob) => {
      ctx.save();
      ctx.fillStyle = '#991b1b';
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(ob.x, ob.y, ob.w, ob.h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  const getDeltaSec = window.GameLoopGuard
    ? window.GameLoopGuard.createDeltaStep(0.05)
    : (() => {
        let prev = performance.now();
        return (now = performance.now()) => {
          const dt = Math.min((now - prev) / 1000, 0.05);
          prev = now;
          return dt > 0 ? dt : 0;
        };
      })();

  function step(now) {
    if (!active) return;
    const dt = getDeltaSec(now);

    if (!gameOver) {
      speed = Math.min(680, speed + dt * 9);
      runPhase += dt * (speed * 0.045);

      scoreAccumulator += dt * 10;
      if (scoreAccumulator >= 1) {
        const gained = Math.floor(scoreAccumulator);
        score += gained;
        scoreAccumulator -= gained;
        syncHud();
      }

      if (!runner.grounded) {
        runner.vy += 1750 * dt;
        runner.y += runner.vy * dt;
        if (runner.y >= groundY) {
          runner.y = groundY;
          runner.vy = 0;
          runner.grounded = true;
        }
      } else {
        runner.y = groundY;
      }

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnObstacle();
        spawnTimer = Math.max(0.72, 1.45 - (speed - 340) / 520) + Math.random() * 0.35;
      }

      const hitLeft = runner.x - 10;
      const hitRight = runner.x + 10;
      const hitTop = runner.y - 52;
      const hitBottom = runner.y - 4;

      obstacles.forEach((ob) => {
        ob.x -= speed * dt;
        const overlaps =
          hitRight > ob.x + 3 &&
          hitLeft < ob.x + ob.w - 3 &&
          hitBottom > ob.y + 3 &&
          hitTop < ob.y + ob.h;
        if (overlaps) {
          endRun();
        }
      });

      obstacles = obstacles.filter((ob) => ob.x + ob.w > -40);
    }

    particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
      p.life -= dt;
    });
    particles = particles.filter((p) => p.life > 0);

    drawBackground();
    drawObstacles();
    drawStickRunner();

    const nextRaf = requestAnimationFrame(step);
    rafId = window.GameLoopGuard ? window.GameLoopGuard.trackRaf(nextRaf) : nextRaf;
  }

  function onPointerDown(e) {
    if (!active) return;
    if (e.target.closest('button')) return;
    triggerJumpOrRestart();
  }

  function onKeyDown(e) {
    if (!active) return;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      triggerJumpOrRestart();
    }
  }

  window.addEventListener('resize', resize);
  window.addEventListener('keydown', onKeyDown);
  stage.addEventListener('pointerdown', onPointerDown);

  resize();
  syncHud();
  const initialRaf = requestAnimationFrame(step);
  rafId = window.GameLoopGuard ? window.GameLoopGuard.trackRaf(initialRaf) : initialRaf;

  return () => {
    active = false;
    if (rafId !== null) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onKeyDown);
    stage.removeEventListener('pointerdown', onPointerDown);
  };
};