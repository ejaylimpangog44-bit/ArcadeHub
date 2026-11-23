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

  let pointerStartX = 0;
  let pointerStartY = 0;
  let swipeTriggered = false;

  const runner = {
    x: 72,
    y: 0,
    vy: 0,
    grounded: true,
    onBoxTop: false,
    sliding: false,
    slideTimer: 0,
    airJumpsLeft: 1,
    flipAngle: 0,
    flipping: false,
    flipDir: 1
  };

  let obstacles = [];
  let particles = [];
  let trickBanner = null;

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
      if (ob.type === 'box') {
        ob.y = groundY - ob.h;
      } else if (ob.type === 'saw') {
        ob.cy = groundY - ob.elev;
      } else if (ob.type === 'combo-overhead') {
        ob.box.y = groundY - ob.box.h;
        ob.saw.cy = groundY - ob.saw.elev;
      } else if (ob.type === 'combo-pair') {
        ob.box.y = groundY - ob.box.h;
        ob.saw.cy = groundY - ob.saw.elev;
      }
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
    obstacles = [];
    particles = [];
    trickBanner = null;
    runner.vy = 0;
    runner.y = groundY;
    runner.grounded = true;
    runner.onBoxTop = false;
    runner.sliding = false;
    runner.slideTimer = 0;
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

  function triggerJumpSwipe() {
    if (!active) return;
    if (gameOver) {
      resetRun();
      return;
    }

    runner.sliding = false;
    runner.slideTimer = 0;

    if (runner.grounded) {
      const launchedFromBox = runner.onBoxTop;
      runner.vy = -660;
      runner.grounded = false;
      runner.onBoxTop = false;
      runner.airJumpsLeft = 1;
      runner.flipping = false;
      runner.flipAngle = 0;
      runner.flipDir = launchedFromBox ? 1 : 0;
      if (typeof AudioFX !== 'undefined') AudioFX.jump();
      emitSparks(runner.x, runner.y - 2, 6, launchedFromBox ? '#67e8f9' : '#fef08a');
      return;
    }

    if (runner.airJumpsLeft > 0) {
      runner.airJumpsLeft--;
      runner.vy = -610;
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
        if (typeof AudioFX !== 'undefined') AudioFX.jump();
        emitSparks(runner.x, runner.y - 12, 6, '#bae6fd');
      }
    }
  }

  function triggerSlideSwipe() {
    if (!active || gameOver) return;
    runner.flipping = false;
    runner.flipAngle = 0;
    runner.sliding = true;
    runner.slideTimer = 0.55;

    if (!runner.grounded) {
      runner.vy = Math.max(runner.vy + 340, 460);
    }
    if (typeof AudioFX !== 'undefined') {
      if (typeof AudioFX.card === 'function') AudioFX.card();
      else if (typeof AudioFX.click === 'function') AudioFX.click();
    }
    emitSparks(runner.x - 6, runner.y - 2, 5, '#e2e8f0');
  }

  function spawnObstacle() {
    const roll = Math.random();
    const startX = viewW + 28;

    if (roll < 0.28) {
      const tall = Math.random() < 0.45;
      const w = tall ? 46 : 54;
      const h = tall ? 52 : 36;
      obstacles.push({
        type: 'box',
        x: startX,
        y: groundY - h,
        w,
        h,
        landedAwarded: false
      });
    } else if (roll < 0.52) {
      const lowSaw = Math.random() < 0.55;
      const r = 18;
      const elev = lowSaw ? 22 : 52;
      obstacles.push({
        type: 'saw',
        x: startX,
        cx: startX + r,
        cy: groundY - elev,
        r,
        elev,
        angle: 0
      });
    } else if (roll < 0.78) {
      const boxW = 54;
      const boxH = 34;
      const sawR = 17;
      const sawElev = 58;
      obstacles.push({
        type: 'combo-overhead',
        x: startX,
        box: {
          x: startX,
          y: groundY - boxH,
          w: boxW,
          h: boxH,
          landedAwarded: false
        },
        saw: {
          cx: startX + boxW + 34 + sawR,
          cy: groundY - sawElev,
          r: sawR,
          elev: sawElev,
          angle: 0
        }
      });
    } else {
      const boxW = 50;
      const boxH = 40;
      const sawR = 16;
      const sawElev = 20;
      obstacles.push({
        type: 'combo-pair',
        x: startX,
        box: {
          x: startX,
          y: groundY - boxH,
          w: boxW,
          h: boxH,
          landedAwarded: false
        },
        saw: {
          cx: startX + boxW + 78 + sawR,
          cy: groundY - sawElev,
          r: sawR,
          elev: sawElev,
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

  function drawStickRunner() {
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (runner.sliding && runner.grounded) {
      const headX = runner.x + 15;
      const headY = runner.y - 12;
      const hipX = runner.x - 4;
      const hipY = runner.y - 8;
      const footX = runner.x - 22;
      const footY = runner.y - 4;

      ctx.beginPath();
      ctx.arc(headX, headY, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(headX - 6, headY + 2);
      ctx.lineTo(hipX, hipY);
      ctx.lineTo(footX, footY);
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(footX + 5, footY - 3);
      ctx.moveTo(headX - 10, headY + 3);
      ctx.lineTo(headX - 20, headY + 6);
      ctx.stroke();

      ctx.restore();
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

    if (runner.grounded) {
      const swing = Math.sin(runPhase) * 12;
      frontLegX = swing;
      backLegX = -swing;
      frontArmX = -swing * 0.8;
      backArmX = swing * 0.8;
      torsoLean = 0.08;
    } else if (runner.flipping) {
      frontLegX = 9;
      frontLegY = -12;
      backLegX = -9;
      backLegY = -12;
      frontArmX = -8;
      frontArmY = -36;
      backArmX = 8;
      backArmY = -36;
    } else if (runner.vy < -140) {
      frontLegX = 11;
      frontLegY = -15;
      backLegX = -10;
      backLegY = -9;
      frontArmX = 11;
      frontArmY = -50;
      backArmX = -12;
      backArmY = -34;
      torsoLean = 0.14;
    } else if (runner.vy <= 160) {
      frontLegX = 8;
      frontLegY = -11;
      backLegX = -11;
      backLegY = -13;
      frontArmX = 13;
      frontArmY = -42;
      backArmX = -13;
      backArmY = -40;
      torsoLean = 0.05;
    } else {
      frontLegX = 13;
      frontLegY = -5;
      backLegX = -7;
      backLegY = -14;
      frontArmX = -10;
      frontArmY = -46;
      backArmX = 11;
      backArmY = -33;
      torsoLean = -0.06;
    }

    ctx.translate(runner.x, runner.y - 26);
    if (runner.flipping || runner.flipAngle !== 0) {
      ctx.rotate(runner.flipAngle);
    }
    ctx.rotate(torsoLean);
    ctx.translate(0, 26);

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

  function drawBoxEntity(box) {
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

  function drawSawEntity(saw) {
    const teeth = 10;
    const outerR = saw.r + 5;
    const innerR = saw.r - 3;

    ctx.save();
    ctx.translate(saw.cx, saw.cy);
    ctx.rotate(saw.angle);

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
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, saw.r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();

    ctx.restore();
  }

  function drawObstacles() {
    obstacles.forEach((ob) => {
      if (ob.type === 'box') {
        drawBoxEntity(ob);
      } else if (ob.type === 'saw') {
        drawSawEntity(ob);
      } else if (ob.type === 'combo-overhead' || ob.type === 'combo-pair') {
        drawBoxEntity(ob.box);
        drawSawEntity(ob.saw);
      }
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

  function hitsBox(box, hitLeft, hitRight, hitTop, hitBottom) {
    return (
      hitRight > box.x + 4 &&
      hitLeft < box.x + box.w - 4 &&
      hitBottom > box.y + 8 &&
      hitTop < box.y + box.h
    );
  }

  function hitsSaw(saw, hitLeft, hitRight, hitTop, hitBottom) {
    const closestX = Math.max(hitLeft, Math.min(saw.cx, hitRight));
    const closestY = Math.max(hitTop, Math.min(saw.cy, hitBottom));
    const dx = saw.cx - closestX;
    const dy = saw.cy - closestY;
    const effectiveR = saw.r * 0.86;
    return dx * dx + dy * dy < effectiveR * effectiveR;
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

      if (runner.sliding) {
        runner.slideTimer -= dt;
        if (runner.slideTimer <= 0 && runner.grounded) {
          runner.sliding = false;
        }
      }

      scoreAccumulator += dt * 10;
      if (scoreAccumulator >= 1) {
        const gained = Math.floor(scoreAccumulator);
        score += gained;
        scoreAccumulator -= gained;
        syncHud();
      }

      const prevY = runner.y;
      let activeBox = null;

      if (runner.grounded && runner.onBoxTop) {
        const allBoxes = [];
        obstacles.forEach((ob) => {
          if (ob.type === 'box') allBoxes.push(ob);
          else if (ob.type === 'combo-overhead' || ob.type === 'combo-pair') allBoxes.push(ob.box);
        });

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
          const candidateBoxes = [];
          obstacles.forEach((ob) => {
            if (ob.type === 'box') candidateBoxes.push(ob);
            else if (ob.type === 'combo-overhead' || ob.type === 'combo-pair') candidateBoxes.push(ob.box);
          });

          const landedBox = candidateBoxes.find((box) => {
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
            if (!landedBox.landedAwarded) {
              landedBox.landedAwarded = true;
              score += 5;
              syncHud();
              showTrickLabel('BOX TOP! SWIPE UP TO FLIP');
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
          if (runner.slideTimer <= 0) {
            runner.sliding = false;
          }
        }
      } else if (!runner.onBoxTop) {
        runner.y = groundY;
      }

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnObstacle();
        spawnTimer = Math.max(0.84, 1.56 - (speed - 340) / 500) + Math.random() * 0.35;
      }

      const isLowSlide = runner.sliding && runner.grounded;
      const hitLeft = isLowSlide ? runner.x - 18 : runner.x - 10;
      const hitRight = isLowSlide ? runner.x + 16 : runner.x + 10;
      const hitTop = isLowSlide ? runner.y - 18 : runner.y - 52;
      const hitBottom = runner.y - 4;

      for (const ob of obstacles) {
        if (ob.type === 'box') {
          if (ob !== activeBox) ob.x -= speed * dt;
          if (!(runner.grounded && runner.onBoxTop && ob === activeBox)) {
            if (hitsBox(ob, hitLeft, hitRight, hitTop, hitBottom)) {
              endRun();
              break;
            }
          }
        } else if (ob.type === 'saw') {
          ob.x -= speed * dt;
          ob.cx -= speed * dt;
          ob.angle += dt * 11;
          if (hitsSaw(ob, hitLeft, hitRight, hitTop, hitBottom)) {
            endRun();
            break;
          }
        } else if (ob.type === 'combo-overhead' || ob.type === 'combo-pair') {
          if (ob.box !== activeBox) {
            ob.box.x -= speed * dt;
          }
          ob.saw.cx -= speed * dt;
          ob.saw.angle += dt * 11;
          ob.x = Math.min(ob.box.x, ob.saw.cx - ob.saw.r);

          const skipBox = runner.grounded && runner.onBoxTop && ob.box === activeBox;
          if ((!skipBox && hitsBox(ob.box, hitLeft, hitRight, hitTop, hitBottom)) ||
              hitsSaw(ob.saw, hitLeft, hitRight, hitTop, hitBottom)) {
            endRun();
            break;
          }
        }
      }

      obstacles = obstacles.filter((ob) => {
        if (ob.type === 'box') return ob.x + ob.w > -60;
        if (ob.type === 'saw') return ob.cx + ob.r > -60;
        return Math.max(ob.box.x + ob.box.w, ob.saw.cx + ob.saw.r) > -60;
      });
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
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    swipeTriggered = false;
  }

  function onPointerMove(e) {
    if (!active || swipeTriggered) return;
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    const dx = e.clientX - pointerStartX;
    const dy = e.clientY - pointerStartY;
    const threshold = 24;

    if (Math.abs(dy) > threshold && Math.abs(dy) >= Math.abs(dx) * 0.85) {
      swipeTriggered = true;
      if (dy < 0) {
        triggerJumpSwipe();
      } else {
        triggerSlideSwipe();
      }
    }
  }

  function onPointerUp(e) {
    if (!active) return;
    if (swipeTriggered) {
      swipeTriggered = false;
      return;
    }
    if (gameOver && !e.target.closest('button')) {
      resetRun();
    }
  }

  function onKeyDown(e) {
    if (!active) return;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      triggerJumpSwipe();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      triggerSlideSwipe();
    }
  }

  window.addEventListener('resize', resize);
  window.addEventListener('keydown', onKeyDown);
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerUp);

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
    stage.removeEventListener('pointermove', onPointerMove);
    stage.removeEventListener('pointerup', onPointerUp);
  };
};