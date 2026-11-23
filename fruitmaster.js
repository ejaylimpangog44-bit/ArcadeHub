window.initFruitMaster = function initFruitMaster(stage) {
  let active = true;

  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        <span id="fm-score" class="px-4 py-1.5 rounded-full bg-black/60 border border-emerald-400/40 text-emerald-300 font-black text-sm shadow">🍉 SLICED: 0</span>
        <div id="fm-boosters" class="flex items-center gap-1.5"></div>
        <span id="fm-lives" class="px-4 py-1.5 rounded-full bg-black/60 border border-rose-400/40 text-rose-300 font-black text-sm shadow">❤️❤️❤️</span>
      </div>
      <canvas id="fm-canvas" class="w-full h-full block touch-none cursor-crosshair"></canvas>
    </div>
  `;

  const canvas = document.getElementById('fm-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  const FRUITS = [
    { icon: '🍉', pts: 10 },
    { icon: '🍍', pts: 15 },
    { icon: '🍊', pts: 10 },
    { icon: '🍎', pts: 10 },
    { icon: '🥝', pts: 12 },
    { icon: '🍓', pts: 12 }
  ];

  let items = [], slicedHalves = [], slashes = [], splashes = [], score = 0, lives = 3, running = true, pointerDown = false;
  let screenShake = 0;
  let freezeTimer = 0;
  let doubleTimer = 0;
  let boomFlash = 0;

  const onResize = () => {
    if (!active) return;
    w = canvas.width = stage.clientWidth;
    h = canvas.height = stage.clientHeight;
  };
  window.addEventListener('resize', onResize);

  function spawnWave() {
    if (!active || !running) return;
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const isBomb = Math.random() < 0.16;
      const isFreeze = !isBomb && Math.random() < 0.08;
      const isDouble = !isBomb && !isFreeze && Math.random() < 0.08;

      let icon = '💣';
      let pts = 0;
      if (!isBomb) {
        if (isFreeze) icon = '❄️';
        else if (isDouble) icon = '2️⃣';
        else {
          const f = FRUITS[Math.floor(Math.random() * FRUITS.length)];
          icon = f.icon;
          pts = f.pts;
        }
      }

      items.push({
        x: w * (0.2 + Math.random() * 0.6),
        y: h + 40,
        vx: (Math.random() - 0.5) * 5.5,
        vy: -(12 + Math.random() * 4.5),
        r: 32,
        icon,
        isBomb,
        isFreeze,
        isDouble,
        pts,
        sliced: false,
        rot: 0,
        vRot: (Math.random() - 0.5) * 0.1
      });
    }
  }
  const spawner = setInterval(spawnWave, 1100);

  function handleSlice(x, y) {
    if (!active || !running) return;
    slashes.push({ x, y, life: 1 });
    items.forEach(it => {
      if (!it.sliced && Math.hypot(it.x - x, it.y - y) < it.r + 18) {
        it.sliced = true;
        if (it.isBomb) {
          lives--;
          screenShake = 30;
          boomFlash = 25;
          if (navigator.vibrate) navigator.vibrate([220, 80, 220]);
          AudioFX.hit();
          const livesEl = document.getElementById('fm-lives');
          if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, lives)) || '💀';

          for (let k = 0; k < 24; k++) {
            splashes.push({
              x: it.x, y: it.y,
              vx: (Math.random() - 0.5) * 16,
              vy: (Math.random() - 0.5) * 16,
              life: 1,
              color: ['#ef4444', '#f97316', '#eab308', '#1e293b'][k % 4]
            });
          }

          if (lives <= 0) {
            running = false;
            window.ArcadeHero?.awardGameScore('fruit-master', score);
          }
        } else {
          AudioFX.slice();
          if (it.isFreeze) {
            freezeTimer = 240;
            screenShake = 8;
            spawnPopup('❄️ FREEZE!', x, y, '#38bdf8');
          } else if (it.isDouble) {
            doubleTimer = 300;
            screenShake = 10;
            spawnPopup('2️⃣ 2X POINTS!', x, y, '#fde047');
          } else {
            const earned = it.pts * (doubleTimer > 0 ? 2 : 1);
            score += earned;
            const scoreEl = document.getElementById('fm-score');
            if (scoreEl) scoreEl.textContent = `🍉 SLICED: ${score}`;
            if (doubleTimer > 0) spawnPopup(`+${earned} (2x!)`, x, y, '#fde047');
            if (score % 60 === 0) addXP(20, x, y, '+20 XP!');
          }

          slicedHalves.push({
            x: it.x, y: it.y,
            vx1: -3 - Math.random() * 3, vy1: -4 - Math.random() * 2,
            vx2: 3 + Math.random() * 3, vy2: -4 - Math.random() * 2,
            icon: it.icon,
            rot1: 0, rot2: 0,
            vRot1: -0.15, vRot2: 0.15,
            life: 1
          });

          for (let k = 0; k < 12; k++) {
            splashes.push({
              x: it.x, y: it.y,
              vx: (Math.random() - 0.5) * 11,
              vy: (Math.random() - 0.5) * 11,
              life: 1,
              color: it.isFreeze ? '#38bdf8' : it.isDouble ? '#fde047' : ['#f43f5e', '#facc15', '#4ade80', '#fb923c'][k % 4]
            });
          }
        }
      }
    });
  }

  const onPointerDown = (e) => { pointerDown = true; handleSlice(e.offsetX, e.offsetY); };
  const onPointerMove = (e) => { if (pointerDown) handleSlice(e.offsetX, e.offsetY); };
  const onPointerUp = () => { pointerDown = false; };
  const onRestartClick = () => {
    if (!active) return;
    score = 0; lives = 3; items = []; slicedHalves = []; splashes = []; running = true;
    const scoreEl = document.getElementById('fm-score');
    const livesEl = document.getElementById('fm-lives');
    if (scoreEl) scoreEl.textContent = '🍉 SLICED: 0';
    if (livesEl) livesEl.textContent = '❤️❤️❤️';
    canvas.removeEventListener('click', onRestartClick);
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);

  let raf;
  function loop() {
    if (!active) return;
    ctx.save();

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (freezeTimer > 0) {
      bgGrad.addColorStop(0, '#0284c7');
      bgGrad.addColorStop(1, '#0369a1');
    } else if (doubleTimer > 0) {
      bgGrad.addColorStop(0, '#c2410c');
      bgGrad.addColorStop(1, '#7c2d12');
    } else {
      bgGrad.addColorStop(0, '#064e3b');
      bgGrad.addColorStop(1, '#022c22');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    if (screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
      screenShake--;
    }

    if (freezeTimer > 0) freezeTimer--;
    if (doubleTimer > 0) doubleTimer--;
    if (boomFlash > 0) boomFlash--;

    if (freezeTimer > 0) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 14;
      ctx.strokeRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fillRect(0, 0, w, h);
    }

    if (doubleTimer > 0) {
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.55)';
      ctx.lineWidth = 16;
      ctx.strokeRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
      ctx.fillRect(0, 0, w, h);
    }

    if (boomFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${boomFlash / 30})`;
      ctx.fillRect(0, 0, w, h);
    }

    const boosterEl = document.getElementById('fm-boosters');
    if (boosterEl) {
      let html = '';
      if (freezeTimer > 0) html += `<span class="px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 font-bold text-xs animate-pulse">❄️ FREEZE (${Math.ceil(freezeTimer / 60)}s)</span>`;
      if (doubleTimer > 0) html += `<span class="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs animate-pulse">🔥 2X FIRE (${Math.ceil(doubleTimer / 60)}s)</span>`;
      boosterEl.innerHTML = html;
    }

    const timeScale = freezeTimer > 0 ? 0.4 : 1.0;

    splashes.forEach(s => {
      s.x += s.vx * timeScale;
      s.y += s.vy * timeScale;
      s.life -= 0.012;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0, s.life * 0.75);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    splashes = splashes.filter(s => s.life > 0);

    ctx.font = '36px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    slicedHalves.forEach(sh => {
      sh.x += sh.vx1 * timeScale;
      sh.y += sh.vy1 * timeScale;
      sh.vy1 += 0.3 * timeScale;
      sh.rot1 += sh.vRot1;

      sh.x2 = (sh.x2 || sh.x) + sh.vx2 * timeScale;
      sh.y2 = (sh.y2 || sh.y) + sh.vy2 * timeScale;
      sh.vy2 = (sh.vy2 || 0) + 0.3 * timeScale;
      sh.rot2 = (sh.rot2 || 0) + sh.vRot2;
      sh.life -= 0.025;

      ctx.save();
      ctx.globalAlpha = Math.max(0, sh.life);
      ctx.save();
      ctx.translate(sh.x, sh.y);
      ctx.rotate(sh.rot1);
      ctx.fillText(sh.icon, 0, 0);
      ctx.restore();
      ctx.save();
      ctx.translate(sh.x2, sh.y2);
      ctx.rotate(sh.rot2);
      ctx.fillText(sh.icon, 0, 0);
      ctx.restore();
      ctx.restore();
    });
    slicedHalves = slicedHalves.filter(sh => sh.life > 0);

    ctx.font = '46px Inter';
    items.forEach(it => {
      it.x += it.vx * timeScale;
      it.y += it.vy * timeScale;
      it.vy += 0.22 * timeScale;
      it.rot += it.vRot;

      if (!it.sliced) {
        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.rotate(it.rot);
        ctx.fillText(it.icon, 0, 0);
        ctx.restore();
      }
    });
    items = items.filter(it => it.y < h + 80 && !it.sliced);

    if (slashes.length > 1) {
      ctx.strokeStyle = doubleTimer > 0 ? '#f97316' : '#38bdf8';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      slashes.forEach((pt, idx) => {
        pt.life -= 0.08;
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    }
    slashes = slashes.filter(s => s.life > 0);

    if (!running) {
      ctx.fillStyle = 'rgba(2, 44, 34, 0.9)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 32px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Dojo Game Over!', w / 2, h / 2 - 25);
      ctx.font = '700 18px Inter';
      ctx.fillStyle = '#fde047';
      ctx.fillText(`Final Score: ${score} — Tap to Play Again`, w / 2, h / 2 + 15);
      canvas.removeEventListener('click', onRestartClick);
      canvas.addEventListener('click', onRestartClick);
    }

    ctx.restore();
    raf = requestAnimationFrame(loop);
  }
  loop();

  return () => {
    active = false;
    running = false;
    clearInterval(spawner);
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('click', onRestartClick);
  };
};