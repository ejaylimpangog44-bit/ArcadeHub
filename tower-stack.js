window.initTowerStack = function initTowerStack(stage) {
  let active = true;

  stage.innerHTML = `
    <div class="relative w-full h-full">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span id="ts-score" class="px-4 py-1.5 rounded-full bg-black/50 border border-violet-400/40 text-violet-200 font-black text-sm">🏗️ FLOORS: 0</span>
        <span id="ts-combo" class="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-300/40 text-amber-300 font-bold text-xs">TAP TO DROP</span>
      </div>
      <canvas id="ts-canvas" class="w-full h-full block cursor-pointer"></canvas>
    </div>
  `;

  const canvas = document.getElementById('ts-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let stack = [], current = null, combo = 0, alive = true, raf;

  function reset() {
    if (!active) return;
    const baseW = Math.min(220, w * 0.45);
    stack = [{ x: (w - baseW) / 2, w: baseW, hue: 260 }];
    combo = 0; alive = true;
    spawnNext();
  }

  function spawnNext() {
    const top = stack[stack.length - 1];
    const dir = stack.length % 2 === 0 ? 1 : -1;
    current = {
      x: dir === 1 ? 20 : w - top.w - 20,
      w: top.w,
      vx: dir * (3.2 + Math.min(5, stack.length * 0.16)),
      hue: (260 + stack.length * 14) % 360
    };
  }

  function dropBlock() {
    if (!active) return;
    if (!alive) { reset(); return; }
    const top = stack[stack.length - 1];
    const diff = current.x - top.x;
    if (Math.abs(diff) >= top.w) {
      alive = false;
      AudioFX.lose();
      window.ArcadeHero?.awardGameScore('tower-stack', stack.length - 1);
      return;
    }

    if (Math.abs(diff) < 8) {
      combo++;
      current.x = top.x;
      current.w = Math.min(w * 0.55, top.w + (combo >= 3 ? 8 : 0));
      AudioFX.coin();
      spawnPopup(`PERFECT! ${combo}x`, w / 2, h * 0.42, '#fde047');
      addXP(15, w / 2, h * 0.35);
    } else {
      combo = 0;
      current.w = top.w - Math.abs(diff);
      if (diff <= 0) current.x = top.x;
      AudioFX.card();
    }

    stack.push({ x: current.x, w: current.w, hue: current.hue });
    const scoreEl = document.getElementById('ts-score');
    const comboEl = document.getElementById('ts-combo');
    if (scoreEl) scoreEl.textContent = `🏗️ FLOORS: ${stack.length - 1}`;
    if (comboEl) comboEl.textContent = combo > 0 ? `🔥 PERFECT ${combo}x` : 'TAP TO DROP';
    spawnNext();
  }

  canvas.addEventListener('pointerdown', dropBlock);
  const onKey = (e) => { if (!active) return; if (e.code === 'Space') { e.preventDefault(); dropBlock(); } };
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
    const blockH = 26;
    const camOffset = Math.max(0, (stack.length - 8) * blockH);

    stack.forEach((b, idx) => {
      const y = h - 70 - idx * blockH + camOffset;
      ctx.fillStyle = `hsl(${b.hue}, 80%, 60%)`;
      ctx.beginPath();
      ctx.roundRect(b.x, y, b.w, blockH - 2, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(b.x, y, b.w, 5);
    });

    if (alive && current) {
      current.x += current.vx;
      if (current.x <= 10 || current.x + current.w >= w - 10) current.vx *= -1;
      const y = h - 70 - stack.length * blockH + camOffset;
      ctx.fillStyle = `hsl(${current.hue}, 90%, 66%)`;
      ctx.beginPath();
      ctx.roundRect(current.x, y, current.w, blockH - 2, 6);
      ctx.fill();
    } else if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 30px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`Tower Height: ${stack.length - 1} Floors`, w / 2, h / 2 - 12);
      ctx.font = '700 16px Inter';
      ctx.fillStyle = '#fde047';
      ctx.fillText('Tap or Press Space to Rebuild', w / 2, h / 2 + 22);
    }

    raf = requestAnimationFrame(loop);
  }

  reset();
  loop();

  return () => {
    active = false;
    alive = false;
    cancelAnimationFrame(raf);
    canvas.removeEventListener('pointerdown', dropBlock);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  };
};