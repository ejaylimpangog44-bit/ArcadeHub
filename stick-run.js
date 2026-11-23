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
  `;

  const overlay = document.createElement('div');
  overlay.id = 'sr-gameover-overlay';
  overlay.className = 'hidden pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center bg-slate-950/35';
  overlay.innerHTML = `
    <div class="px-6 py-5 rounded-3xl bg-slate-950/85 border border-amber-400/40 shadow-2xl flex flex-col items-center gap-2">
      <div id="sr-final-score" class="text-2xl sm:text-3xl font-black text-white tracking-tight">Run Score: 0</div>
      <div id="sr-best-score" class="text-xs font-extrabold text-amber-300 uppercase tracking-wider">Best: 0</div>
      <div class="text-xs font-bold text-slate-300 mt-1">Swipe Up or Press Space to Run Again</div>
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
  let pointerStart = null;
  let gestureTriggered = false;

  const runner = {
    x: 72,
    y: 0,
    vy: 0,
    grounded: true,
    onBoxTop: false,
    sliding: false,
    slideTimer: 0,
    slideBlend: 0,
    airJumpsLeft: 1,
    flipAngle: 0,
    flipping: false,
    flipDir: 1
  };

  let obstacles = [];
  let particles = [];
  let trickBanner = null;

  function getObstacleBoxes(ob) {
    if (Array.isArray(ob.boxes)) return ob.boxes;
    if (ob.box) return [ob.box];
    return [];
  }

  function getObstacleSaws(ob) {
    if (Array.isArray(ob.saws)) return ob.saws;
    if (ob.saw) return [ob.saw];
    return [];
  }

  function syncHud() {
    const scoreEl = document.getElementById('sr-score-pill');
    const finalEl = document.getElementById('sr-final-score');
    const bestEl = document.getElementById('sr-best-score');
    if (scoreEl) scoreEl.textContent = `🏃 RUN: ${score}`;
    if (finalEl) finalEl.textContent = `Run Score: ${score}`;
    if (bestEl) bestEl.textContent = `Best: ${Math.max(bestScore, score)}`;
    overlay.classList.toggle('hidden', !gameOver);
  }

  function showTrickLabel(text) {
    trickBanner = {
      text,
      life: 0.85,
      yOffset: 0
    };
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
    const deltaGround = Math.round(viewH * 0.72) - prevGround;
    groundY = Math.round(viewH * 0.72);
    runner.x = Math.max(52, Math.min(110, Math.round(viewW * 0.18)));

    if (runner.grounded) {
      runner.y = runner.onBoxTop ? runner.y + deltaGround : groundY;
    } else {
      runner.y = Math.min(groundY, runner.y + deltaGround);
    }

    obstacles.forEach((ob) => {
      getObstacleBoxes(ob).forEach((box) => {
        if (typeof box.offsetFromGround === 'number') {
          box.y = groundY - box.offsetFromGround - box.h;
        } else {
          box.y = groundY - box.h;
        }
      });
      getObstacleSaws(ob).forEach((saw) => {
        saw.cy = groundY - saw.elev;
      });
    });
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
    pointerStart = null;
    gestureTriggered = false;
    obstacles = [];
    particles = [];
    trickBanner = null;
    runner.vy = 0;
    runner.y = groundY;
    runner.grounded = true;
    runner.onBoxTop = false;
    runner.sliding = false;
    runner.slideTimer = 0;
    runner.slideBlend = 0;
    runner.airJumpsLeft = 1;
    runner.flipAngle = 0;
    runner.flipping = false;
    syncHud();
    if (typeof AudioFX !== 'undefined') AudioFX.click();
  }

  function emitSparks(x, y, count = 6, color = '#fef08a') {
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        vx: -70 - Math.random() * 110,
        vy: -35 - Math.random() * 95,
        life: 0.35 + Math.random() * 0.15,
        color
      });
    }
  }

  function triggerSwipeUp() {
    if (!active) return;
    if (gameOver) {
      resetRun();
      return;
    }

    runner.sliding = false;
    runner.slideTimer = 0;

    if (runner.grounded) {
      const launchedFromBox = runner.onBoxTop;
      runner.vy = -670;
      runner.grounded = false;
      runner.onBoxTop = false;
      runner.airJumpsLeft = 1;
      runner.flipping = false;
      runner.flipAngle = 0;
      runner.flipDir = launchedFromBox ? 1 : 0;
      if (typeof AudioFX !== 'undefined') AudioFX.jump();
      emitSparks(runner.x, runner.y - 2, 7, launchedFromBox ? '#67e8f9' : '#fef08a');
      return;
    }

    if (runner.airJumpsLeft > 0) {
      runner.airJumpsLeft--;
      runner.vy = -620;
      if (runner.flipDir === 1) {
        runner.flipping = true;
        runner.flipAngle = 0;
        score += 15;
        syncHud();
        showTrickLabel('FRONT FLIP! +15');
        if (typeof AudioFX !== 'undefined') {
          if (typeof AudioFX.coin === 'function') AudioFX.coin();
          else if (typeof AudioFX.jump === 'function') AudioFX.jump();
        }
        if (typeof addXP === 'function') {
          addXP(15, runner.x + 20, runner.y - 65, 'FRONT FLIP +15 XP');
        }
        emitSparks(runner.x, runner.y - 24, 12, '#fde047');
      } else {
        runner.flipping = false;
        runner.flipAngle = 0;
        if (typeof AudioFX !== 'undefined') AudioFX.jump();
        emitSparks(runner.x, runner.y - 12, 7, '#bae6fd');
      }
    }
  }

  function triggerSwipeDown() {
    if (!active || gameOver) return;

    runner.flipping = false;
    runner.flipAngle = 0;

    if (!runner.grounded) {
      runner.vy = Math.max(runner.vy + 420, 560);
      runner.sliding = true;
      runner.slideTimer = 0.45;
      emitSparks(runner.x, runner.y - 16, 5, '#bae6fd');
      return;
    }

    if (!runner.sliding) {
      runner.sliding = true;
      runner.slideTimer = 0.55;
      if (typeof AudioFX !== 'undefined') AudioFX.click();
      emitSparks(runner.x - 12, runner.y - 2, 6, '#86efac');
    } else {
      runner.slideTimer = Math.max(runner.slideTimer, 0.45);
    }
  }

  function createVerticalTripleBoxes(startX) {
    const specs = [
      { w: 46, h: 36, offsetFromGround: 0 },
      { w: 50, h: 38, offsetFromGround: 36 },
      { w: 54, h: 42, offsetFromGround: 74 }
    ];
    return specs.map((spec) => ({
      x: startX + (54 - spec.w) * 0.5,
      y: groundY - spec.offsetFromGround - spec.h,
      w: spec.w,
      h: spec.h,
      offsetFromGround: spec.offsetFromGround,
      landedAwarded: false
    }));
  }

  function spawnObstacle() {
    const roll = Math.random();
    const startX = viewW + 28;

    if (roll < 0.22) {
      const boxes = createVerticalTripleBoxes(startX);
      const stackTopElev = 116;
      obstacles.push({
        kind: 'triple-saw-combo',
        boxes,
        saws: [
          {
            x: startX + 27,
            cy: groundY - (stackTopElev + 74),
            elev: stackTopElev + 74,
            r: 20,
            angle: 0
          },
          {
            x: startX + 94,
            cy: groundY - 22,
            elev: 22,
            r: 19,
            angle: 0
          }
        ]
      });
    } else if (roll < 0.46) {
      obstacles.push({
        kind: 'triple-stack',
        boxes: createVerticalTripleBoxes(startX),
        saws: []
      });
    } else if (roll < 0.72) {
      const w = 52;
      const h = 42;
      obstacles.push({
        kind: 'combo',
        box: {
          x: startX,
          y: groundY - h,
          w,
          h,
          offsetFromGround: 0,
          landedAwarded: false
        },
        saw: {
          x: startX + w + 34,
          cy: groundY - 22,
          elev: 22,
          r: 20,
          angle: 0
        }
      });
    } else if (roll < 0.88) {
      const tall = Math.random() < 0.45;
      const w = tall ? 46 : 54;
      const h = tall ? 52 : 36;
      obstacles.push({
        kind: 'box',
        box: {
          x: startX,
          y: groundY - h,
          w,
          h,
          offsetFromGround: 0,
          landedAwarded: false
        },
        saw: null
      });
    } else {
      const highSaw = Math.random() < 0.45;
      const elev = highSaw ? 46 : 20;
      obstacles.push({
        kind: 'saw',
        box: null,
        saw: {
          x: startX,
          cy: groundY - elev,
          elev,
          r: 21,
          angle: 0
        }
      });
    }
  }

  function endRun() {
    if (gameOver) return;
    gameOver = true;
    runner.sliding = false;
    runner.slideTimer = 0;
    runner.slideBlend = 0;
    runner.flipping = false;
    runner.flipAngle = 0;
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

  function drawSlidePose() {
    const t = runner.slideBlend;
    const bounce = Math.sin(runPhase * 1.4) * 1.1;

    ctx.save();
    ctx.translate(runner.x, runner.y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const headX = -15 * t;
    const headY = -14 * t + bounce * 0.5;
    const shoulderX = -9 * t;
    const shoulderY = -11 * t + bounce * 0.4;
    const hipX = 7 * t;
    const hipY = -7 * t + bounce * 0.3;

    const straightFootX = 24 * t;
    const straightFootY = -2;

    const bentKneeX = 12 * t;
    const bentKneeY = -15 * t;
    const bentFootX = 5 * t;
    const bentFootY = -2;

    const elbowX = 4 * t;
    const elbowY = -16 * t;
    const handX = 11 * t;
    const handY = -6 * t;

    ctx.beginPath();
    ctx.arc(headX, headY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(hipX, hipY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-3 * t, -10 * t);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(straightFootX, straightFootY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(bentKneeX, bentKneeY);
    ctx.lineTo(bentFootX, bentFootY);
    ctx.stroke();

    ctx.restore();
  }

  function drawStickRunner() {
    if (runner.slideBlend > 0.05 && runner.grounded) {
      drawSlidePose();
      return;
    }

    const hipY = -24;
    const shoulderY = -44;
    const headY = -55;

    let frontLegX = 0;
    let frontLegY = -2;
    let backLegX = 0;
    let backLegY = -2;
    let frontArmX = 0;
    let frontArmY = -30;
    let backArmX = 0;
    let backArmY = -30;
    let torsoLean = 0;
    let stretchY = 1;

    if (runner.grounded) {
      const swing = Math.sin(runPhase) * 13;
      frontLegX = swing;
      frontLegY = -2 - Math.max(0, Math.cos(runPhase)) * 4;
      backLegX = -swing;
      backLegY = -2 - Math.max(0, -Math.cos(runPhase)) * 4;
      frontArmX = -swing * 0.85;
      frontArmY = -30 + Math.sin(runPhase) * 4;
      backArmX = swing * 0.85;
      backArmY = -30 - Math.sin(runPhase) * 4;
      torsoLean = 0.1;
    } else if (runner.flipping) {
      frontLegX = 10;
      frontLegY = -13;
      backLegX = -10;
      backLegY = -13;
      frontArmX = -9;
      frontArmY = -36;
      backArmX = 9;
      backArmY = -36;
    } else if (runner.vy < -150) {
      frontLegX = 13;
      frontLegY = -17;
      backLegX = -12;
      backLegY = -8;
      frontArmX = 12;
      frontArmY = -52;
      backArmX = -13;
      backArmY = -32;
      torsoLean = 0.16;
      stretchY = 1.05;
    } else if (runner.vy <= 170) {
      frontLegX = 9;
      frontLegY = -12;
      backLegX = -12;
      backLegY = -14;
      frontArmX = 14;
      frontArmY = -43;
      backArmX = -14;
      backArmY = -39;
      torsoLean = 0.05;
    } else {
      frontLegX = 14;
      frontLegY = -4;
      backLegX = -8;
      backLegY = -15;
      frontArmX = -11;
      frontArmY = -47;
      backArmX = 12;
      backArmY = -32;
      torsoLean = -0.07;
      stretchY = 0.96;
    }

    ctx.save();
    ctx.translate(runner.x, runner.y - 26);
    if (runner.flipping || runner.flipAngle !== 0) {
      ctx.rotate(runner.flipAngle);
    }
    ctx.rotate(torsoLean);
    ctx.scale(1, stretchY);
    ctx.translate(0, 26);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.arc(0, headY, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = runner.flipping ? '#fde047' : '#f8fafc';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, headY + 8.5);
    ctx.lineTo(0, hipY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(frontArmX, frontArmY);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(backArmX, backArmY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(frontLegX, frontLegY);
    ctx.moveTo(0, hipY);
    ctx.lineTo(backLegX, backLegY);
    ctx.stroke();
    ctx.restore();
  }

  function drawSawblade(saw) {
    ctx.save();
    ctx.translate(saw.x, saw.cy);
    ctx.rotate(saw.angle);

    const teeth = 10;
    const outerR = saw.r + 4;
    const innerR = saw.r - 3;

    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const rad = i % 2 === 0 ? outerR : innerR;
      const ang = (i * Math.PI) / teeth;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, saw.r * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#991b1b';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
    ctx.restore();
  }

  function drawBox(box) {
    ctx.save();
    ctx.fillStyle = '#991b1b';
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.w, box.h, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
    ctx.fillRect(box.x + 3, box.y, Math.max(0, box.w - 6), 4);
    ctx.restore();
  }

  function drawObstacles() {
    obstacles.forEach((ob) => {
      getObstacleBoxes(ob).forEach((box) => drawBox(box));
      getObstacleSaws(ob).forEach((saw) => drawSawblade(saw));
    });

    particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color || '#fef08a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (trickBanner && trickBanner.life > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, trickBanner.life * 1.4);
      ctx.font = '900 15px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.lineWidth = 4;
      const by = runner.y - 78 - trickBanner.yOffset;
      ctx.strokeText(trickBanner.text, runner.x + 12, by);
      ctx.fillText(trickBanner.text, runner.x + 12, by);
      ctx.restore();
    }
  }

  function obstacleRightEdge(ob) {
    let right = -Infinity;
    getObstacleBoxes(ob).forEach((box) => {
      right = Math.max(right, box.x + box.w);
    });
    getObstacleSaws(ob).forEach((saw) => {
      right = Math.max(right, saw.x + saw.r + 6);
    });
    return right;
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

      if (runner.sliding && runner.grounded) {
        runner.slideTimer -= dt;
        if (runner.slideTimer <= 0) {
          runner.sliding = false;
        }
      }

      const targetBlend = runner.sliding && runner.grounded ? 1 : 0;
      runner.slideBlend += (targetBlend - runner.slideBlend) * Math.min(1, dt * 18);

      const prevY = runner.y;
      let activeBox = null;
      const allBoxes = obstacles.flatMap((ob) => getObstacleBoxes(ob));

      if (runner.grounded && runner.onBoxTop) {
        activeBox = allBoxes.find(
          (box) =>
            runner.x + 10 >= box.x &&
            runner.x - 10 <= box.x + box.w &&
            Math.abs(runner.y - box.y) <= 8
        );
        if (activeBox) {
          activeBox.x -= speed * dt;
          runner.y = activeBox.y;
          if (runner.x - 10 > activeBox.x + activeBox.w) {
            runner.grounded = false;
            runner.onBoxTop = false;
            runner.vy = 40;
            runner.airJumpsLeft = 1;
            runner.flipDir = 0;
          }
        } else {
          runner.grounded = false;
          runner.onBoxTop = false;
          runner.vy = 40;
          runner.airJumpsLeft = 1;
          runner.flipDir = 0;
        }
      }

      if (!runner.grounded) {
        runner.vy += 1750 * dt;
        runner.y += runner.vy * dt;

        if (runner.flipping) {
          runner.flipAngle += dt * 13.5;
          if (runner.flipAngle >= Math.PI * 2) {
            runner.flipAngle = 0;
            runner.flipping = false;
          }
        }

        if (runner.vy >= 0) {
          const hitLeft = runner.x - 10;
          const hitRight = runner.x + 10;
          const landedBox = allBoxes.find((box) => {
            const withinX = hitRight > box.x + 3 && hitLeft < box.x + box.w - 3;
            const crossedTop = prevY <= box.y + 10 && runner.y >= box.y;
            return withinX && crossedTop;
          });

          if (landedBox) {
            runner.y = landedBox.y;
            runner.vy = 0;
            runner.grounded = true;
            runner.onBoxTop = true;
            runner.airJumpsLeft = 1;
            runner.flipping = false;
            runner.flipAngle = 0;
            runner.flipDir = 1;
            if (runner.slideTimer > 0) runner.sliding = true;
            if (!landedBox.landedAwarded) {
              landedBox.landedAwarded = true;
              score += 5;
              syncHud();
              showTrickLabel('BOX TOP! DOUBLE SWIPE TO FLIP');
            }
            emitSparks(runner.x, runner.y, 5, '#67e8f9');
          }
        }

        if (!runner.grounded && runner.y >= groundY) {
          runner.y = groundY;
          runner.vy = 0;
          runner.grounded = true;
          runner.onBoxTop = false;
          runner.airJumpsLeft = 1;
          runner.flipping = false;
          runner.flipAngle = 0;
          runner.flipDir = 0;
          if (runner.slideTimer > 0) runner.sliding = true;
        }
      } else if (!runner.onBoxTop) {
        runner.y = groundY;
      }

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnObstacle();
        spawnTimer = Math.max(0.9, 1.62 - (speed - 340) / 520) + Math.random() * 0.35;
      }

      const isLowSlide = runner.sliding && runner.grounded;
      const hitLeft = isLowSlide ? runner.x - 20 : runner.x - 10;
      const hitRight = isLowSlide ? runner.x + 22 : runner.x + 10;
      const hitTop = isLowSlide ? runner.y - 18 : runner.y - 52;
      const hitBottom = runner.y - 3;
      const runnerCenterX = (hitLeft + hitRight) * 0.5;
      const runnerCenterY = (hitTop + hitBottom) * 0.5;
      const runnerHalfW = (hitRight - hitLeft) * 0.5;
      const runnerHalfH = (hitBottom - hitTop) * 0.5;

      for (const ob of obstacles) {
        const obBoxes = getObstacleBoxes(ob);
        for (const box of obBoxes) {
          if (box !== activeBox) {
            box.x -= speed * dt;
          }
        }
        const obSaws = getObstacleSaws(ob);
        for (const saw of obSaws) {
          saw.x -= speed * dt;
          saw.angle += dt * 11;
        }

        for (const box of obBoxes) {
          if (runner.grounded && runner.onBoxTop && box === activeBox) continue;
          const boxOverlap =
            hitRight > box.x + 4 &&
            hitLeft < box.x + box.w - 4 &&
            hitBottom > box.y + 8 &&
            hitTop < box.y + box.h;
          if (boxOverlap) {
            endRun();
            break;
          }
        }
        if (gameOver) break;

        for (const saw of obSaws) {
          const dx = Math.abs(saw.x - runnerCenterX);
          const dy = Math.abs(saw.cy - runnerCenterY);
          const hitR = saw.r - 3;
          if (dx <= runnerHalfW + hitR && dy <= runnerHalfH + hitR) {
            const closestX = Math.max(runnerCenterX - runnerHalfW, Math.min(saw.x, runnerCenterX + runnerHalfW));
            const closestY = Math.max(runnerCenterY - runnerHalfH, Math.min(saw.cy, runnerCenterY + runnerHalfH));
            const distSq = (saw.x - closestX) ** 2 + (saw.cy - closestY) ** 2;
            if (distSq <= hitR ** 2) {
              endRun();
              break;
            }
          }
        }
        if (gameOver) break;
      }

      obstacles = obstacles.filter((ob) => obstacleRightEdge(ob) > -60);
    }

    if (trickBanner) {
      trickBanner.life -= dt;
      trickBanner.yOffset += dt * 24;
      if (trickBanner.life <= 0) trickBanner = null;
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
    pointerStart = { x: e.clientX, y: e.clientY };
    gestureTriggered = false;
  }

  function onPointerMove(e) {
    if (!active || !pointerStart || gestureTriggered) return;
    const dy = e.clientY - pointerStart.y;
    const dx = e.clientX - pointerStart.x;
    if (Math.abs(dy) > 20 && Math.abs(dy) > Math.abs(dx) * 0.8) {
      gestureTriggered = true;
      if (dy < 0) {
        triggerSwipeUp();
      } else {
        triggerSwipeDown();
      }
      pointerStart = { x: e.clientX, y: e.clientY };
    }
  }

  function onPointerUp() {
    pointerStart = null;
    gestureTriggered = false;
  }

  function onKeyDown(e) {
    if (!active || e.repeat) return;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      triggerSwipeUp();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      triggerSwipeDown();
    }
  }

  window.addEventListener('resize', resize);
  window.addEventListener('keydown', onKeyDown);
  stage.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

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
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  };
};