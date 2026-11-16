function initZombieSurvival(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span id="zs-score" class="px-4 py-1.5 rounded-full bg-black/60 border border-emerald-400/40 text-emerald-300 font-black text-sm">🧟 KILLS: 0</span>
        <span id="zs-weapon" class="px-3 py-1.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-300 font-bold text-xs">🔫 PISTOL (LVL 1)</span>
        <span id="zs-hp" class="px-4 py-1.5 rounded-full bg-black/60 border border-rose-400/40 text-rose-300 font-black text-sm">❤️ 100</span>
      </div>
      <canvas id="zs-canvas" class="w-full h-full block touch-none cursor-crosshair"></canvas>
    </div>
  `;
  const canvas = document.getElementById('zs-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = stage.clientWidth;
  let h = canvas.height = stage.clientHeight;

  let player = { x: w / 2, y: h / 2, hp: 100, maxHp: 100, speed: 3.5, weaponLvl: 1 };
  let zombies = [], bullets = [], loot = [], kills = 0, alive = true, shootTimer = 0, raf;
  let keys = { w: false, a: false, s: false, d: false };

  window.addEventListener('keydown', e => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = true;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = true;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = true;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = false;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = false;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = false;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = false;
  });

  canvas.onpointermove = (e) => {
    player.x = e.offsetX;
    player.y = e.offsetY;
  };

  function loop() {
    ctx.clearRect(0, 0, w, h);

    if (alive) {
      if (keys.w) player.y = Math.max(30, player.y - player.speed);
      if (keys.s) player.y = Math.min(h - 30, player.y + player.speed);
      if (keys.a) player.x = Math.max(30, player.x - player.speed);
      if (keys.d) player.x = Math.min(w - 30, player.x + player.speed);

      shootTimer++;
      if (shootTimer >= Math.max(10, 28 - player.weaponLvl * 4)) {
        shootTimer = 0;
        let target = null;
        let minDist = Infinity;
        zombies.forEach(z => {
          let d = Math.hypot(z.x - player.x, z.y - player.y);
          if (d < minDist) { minDist = d; target = z; }
        });
        if (target) {
          const angle = Math.atan2(target.y - player.y, target.x - player.x);
          bullets.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 11, vy: Math.sin(angle) * 11 });
          if (typeof AudioFX !== 'undefined') AudioFX.hit();
        }
      }

      // Spawn zombies strictly outside screen borders (no more spawn-camping!)
      if (Math.random() < 0.035) {
        const isBoss = kills > 0 && kills % 15 === 0 && !zombies.some(z => z.isBoss);
        const side = Math.floor(Math.random() * 4);
        let sx, sy;
        if (side === 0) { sx = -50; sy = Math.random() * h; }
        else if (side === 1) { sx = w + 50; sy = Math.random() * h; }
        else if (side === 2) { sx = Math.random() * w; sy = -50; }
        else { sx = Math.random() * w; sy = h + 50; }

        zombies.push({
          x: sx,
          y: sy,
          hp: isBoss ? 30 : 3,
          maxHp: isBoss ? 30 : 3,
          speed: isBoss ? 1.1 : 1.7 + Math.random() * 0.7,
          isBoss,
          r: isBoss ? 32 : 18
        });
      }
    }

    // Draw Loot Boxes
    loot.forEach(l => {
      ctx.font = '22px Inter';
      ctx.fillText('📦', l.x, l.y);
      if (Math.hypot(l.x - player.x, l.y - player.y) < 30) {
        l.collected = true;
        player.weaponLvl = Math.min(5, player.weaponLvl + 1);
        player.hp = Math.min(player.maxHp, player.hp + 30);
        document.getElementById('zs-weapon').textContent = `🔫 GUN LVL ${player.weaponLvl}`;
        document.getElementById('zs-hp').textContent = `❤️ ${Math.floor(player.hp)}`;
        if (typeof AudioFX !== 'undefined') AudioFX.coin();
      }
    });
    loot = loot.filter(l => !l.collected);

    // Draw Bullets & Collisions
    bullets.forEach(b => {
      b.x += b.vx; b.y += b.vy;
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();

      zombies.forEach(z => {
        if (!z.dead && Math.hypot(b.x - z.x, b.y - z.y) < z.r) {
          z.hp--;
          b.dead = true;
          if (z.hp <= 0) {
            z.dead = true;
            kills++;
            document.getElementById('zs-score').textContent = `🧟 KILLS: ${kills}`;
            if (Math.random() < 0.4) loot.push({ x: z.x, y: z.y });
          }
        }
      });
    });
    bullets = bullets.filter(b => !b.dead && b.x > 0 && b.x < w && b.y > 0 && b.y < h);
    zombies = zombies.filter(z => !z.dead);

    // Update & Draw Zombies
    zombies.forEach(z => {
      const angle = Math.atan2(player.y - z.y, player.x - z.x);
      z.x += Math.cos(angle) * z.speed;
      z.y += Math.sin(angle) * z.speed;

      ctx.font = z.isBoss ? '38px Inter' : '26px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.isBoss ? '👹' : '🧟', z.x, z.y);

      if (Math.hypot(z.x - player.x, z.y - player.y) < z.r + 14) {
        player.hp -= z.isBoss ? 1.2 : 0.5;
        document.getElementById('zs-hp').textContent = `❤️ ${Math.max(0, Math.floor(player.hp))}`;
        if (player.hp <= 0 && alive) {
          alive = false;
          if (typeof AudioFX !== 'undefined') AudioFX.lose();
        }
      }
    });

    // Draw Stickman Runner Player
    ctx.font = '32px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏃', player.x, player.y);

    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 28px Inter';
      ctx.fillText(`Overrun! Total Kills: ${kills}`, w / 2, h / 2 - 15);
      ctx.font = '700 15px Inter';
      ctx.fillStyle = '#fde047';
      ctx.fillText('Tap to Restart Survival', w / 2, h / 2 + 20);
      canvas.onpointerdown = () => {
        player.hp = 100; kills = 0; zombies = []; bullets = []; loot = []; alive = true; player.weaponLvl = 1;
        document.getElementById('zs-score').textContent = `🧟 KILLS: 0`;
        document.getElementById('zs-weapon').textContent = `🔫 PISTOL (LVL 1)`;
        document.getElementById('zs-hp').textContent = `❤️ 100`;
      };
    }

    raf = requestAnimationFrame(loop);
  }
  loop();

  return () => { cancelAnimationFrame(raf); };
}
