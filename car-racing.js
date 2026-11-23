window.initCarRacing = function initCarRacing(stage) {
  let active = true;

  stage.innerHTML = `
    <div class="relative w-full h-full">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span id="cr-score" class="px-4 py-1.5 rounded-full bg-black/60 border border-pink-400/40 text-pink-200 font-black text-sm">🏎️ DIST: 0m</span>
        <span class="px-3 py-1 rounded-full bg-black/60 border border-cyan-400/30 text-cyan-200 text-xs font-bold">TAP LEFT / RIGHT OR ◀ ▶</span>
      </div>
      <canvas id="cr-canvas" class="w-full h-full block touch-none"></canvas>
    </div>
  `;

  const canvas = document.getElementById('cr-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let lane = 1, traffic = [], coins = [], dist = 0, stripeY = 0, alive = true, raf;

  function reset() {
    if (!active) return;
    lane = 1; traffic = []; coins = []; dist = 0; alive = true;
  }

  function shiftLane(dir) {
    if (!active) return;
    if (!alive) { reset(); return; }
    lane = Math.max(0, Math.min(2, lane + dir));
    AudioFX.click();
  }

  const onPointerDown = (e) => {
    if (!active) return;
    if (e.offsetX < w / 2) shiftLane(-1);
    else shiftLane(1);
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  const onKey = (e) => {
    if (!active) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') shiftLane(-1);
    if (e.key === 'ArrowRight' || e.key === 'd') shiftLane(1);
  };
  window.addEventListener('keydown', onKey);
  const onResize = () => {
    if (!active) return;
    w = canvas.width = stage.clientWidth;
    h = canvas.height = stage.clientHeight;
  };
  window.addEventListener('resize', onResize);

  function loop() {
    if (!active) return;
    ctx.clearRect(0, 0, w, h);
    const roadW = Math.min(360, w * 0.82);
    const roadX = (w - roadW) / 2;
    const laneW = roadW / 3;

    ctx.fillStyle = '#11131f';
    ctx.fillRect(roadX, 0, roadW, h);
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 4;
    ctx.strokeRect(roadX, -5, roadW, h + 10);

    if (alive) stripeY = (stripeY + 9 + Math.min(8, dist / 400)) % 60;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.setLineDash([28, 32]);
    ctx.lineDashOffset = -stripeY;
    ctx.lineWidth = 3;
    [1, 2].forEach(i => {
      ctx.beginPath();
      ctx.moveTo(roadX + laneW * i, 0);
      ctx.lineTo(roadX + laneW * i, h);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    const speed = 6.5 + Math.min(8, dist / 350);

    if (alive) {
      dist += 1;
      if (dist % 10 === 0) {
        const scoreEl = document.getElementById('cr-score');
        if (scoreEl) scoreEl.textContent = `🏎️ DIST: ${Math.floor(dist / 5)}m`;
      }
      if (Math.random() < 0.032) {
        const l = Math.floor(Math.random() * 3);
        if (!traffic.some(t => t.y < 140)) {
          traffic.push({ lane: l, y: -70, color: ['#38bdf8', '#facc15', '#a855f7'][l] });
        }
      }
      if (Math.random() < 0.025) {
        coins.push({ lane: Math.floor(Math.random() * 3), y: -40 });
      }
    }

    const playerX = roadX + lane * laneW + laneW / 2;
    const playerY = h - 95;

    coins.forEach(c => {
      if (alive) c.y += speed;
      const cx = roadX + c.lane * laneW + laneW / 2;
      ctx.font = '26px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('🪙', cx, c.y);
      if (alive && c.lane === lane && Math.abs(c.y - playerY) < 42) {
        c.collected = true;
        AudioFX.coin();
        addXP(10, cx, playerY - 20, '+10 XP');
      }
    });
    coins = coins.filter(c => c.y < h + 40 && !c.collected);

    traffic.forEach(t => {
      if (alive) t.y += speed * 0.85;
      const tx = roadX + t.lane * laneW + laneW / 2;
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.roundRect(tx - 20, t.y - 34, 40, 68, 10);
      ctx.fill();
      if (alive && t.lane === lane && Math.abs(t.y - playerY) < 58) {
        alive = false;
        AudioFX.lose();
        window.ArcadeHero?.awardGameScore('car-racing', Math.floor(dist / 5));
      }
    });
    traffic = traffic.filter(t => t.y < h + 90);

    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(playerX - 21, playerY - 36, 42, 72, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(playerX - 14, playerY - 14, 28, 22);

    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.68)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 30px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`Crash at ${Math.floor(dist / 5)}m!`, w / 2, h / 2 - 12);
      ctx.font = '700 16px Inter';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Tap Screen to Race Again', w / 2, h / 2 + 22);
    }

    raf = requestAnimationFrame(loop);
  }
  loop();

  return () => {
    active = false;
    alive = false;
    cancelAnimationFrame(raf);
    canvas.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  };
};