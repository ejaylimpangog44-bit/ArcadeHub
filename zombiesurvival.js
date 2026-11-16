function initZombieSurvival(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      <div class="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span id="zs-score" class="px-4 py-1.5 rounded-full bg-black/60 border border-emerald-400/40 text-emerald-300 font-black text-sm">🧟 KILLS: 0</span>
        <span id="zs-weapon" class="px-3 py-1.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-300 font-bold text-xs">🔫 PISTOL (LVL 1)</span>
        <span id="zs-hp" class="px-4 py-1.5 rounded-full bg-black/60 border border-rose-400/40 text-rose-300 font-black text-sm">❤️ 100</span>
      </div>
      <canvas id="zs-canvas" class="absolute inset-0 w-full h-full block touch-none cursor-crosshair"></canvas>
    </div>
  `;
  const canvas = document.getElementById('zs-canvas');
  const ctx = canvas.getContext('2d');
  
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;

  let player = { x: w / 2, y: h / 2, hp: 100, maxHp: 100, speed: 4, weaponLvl: 1, vx: 0, vy: 0 };
  let zombies = [], bullets = [], loot = [], kills = 0, alive = true, shootTimer = 0, animTick = 0, raf;
  let keys = { w: false, a: false, s: false, d: false };
  let lastX = player.x, lastY = player.y;

  const onResize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', onResize);

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
      let targetX = player.x;
      let targetY = player.y;

      if (keys.w) targetY = Math.max(40, player.y - player.speed);
      if (keys.s) targetY = Math.min(h - 40, player.y + player.speed);
      if (keys.a) targetX = Math.max(40, player.x - player.speed);
      if (keys.d) targetX = Math.min(w - 40, player.x + player.speed);

      player.vx = targetX - lastX;
      player.vy = targetY - lastY;
      player.x = targetX;
      player.y = targetY;
      lastX = player.x;
      lastY = player.y;

      if (Math.hypot(player.vx, player.vy) > 0.3) {
        animTick += 0.25;
      }

      shootTimer++;
      let nearestZombie = null;
      let minDist = Infinity;
      zombies.forEach(z => {
        let d = Math.hypot(z.x - player.x, z.y - player.y);
        if (d < minDist) { minDist = d; nearestZombie = z; }
      });

      if (shootTimer >= Math.max(10, 26 - player.weaponLvl * 4)) {
        shootTimer = 0;
        if (nearestZombie) {
          const angle = Math.atan2(nearestZombie.y - player.y, nearestZombie.x - player.x);
          bullets.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12 });
          if (typeof AudioFX !== 'undefined') AudioFX.hit();
        }
      }

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
          hp: isBoss ? 35 : 3,
          maxHp: isBoss ? 35 : 3,
          speed: isBoss ? 1.1 : 1.7 + Math.random() * 0.7,
          isBoss,
          r: isBoss ? 32 : 18
        });
      }
    }

    // Draw Loot
    loot.forEach(l => {
      ctx.font = '22px Inter';
      ctx.fillText('📦', l.x, l.y);
      if (Math.hypot(l.x - player.x, l.y - player.y) < 35) {
        l.collected = true;
        player.weaponLvl = Math.min(5, player.weaponLvl + 1);
        player.hp = Math.min(player.maxHp, player.hp + 30);
        document.getElementById('zs-weapon').textContent = `🔫 GUN LVL ${player.weaponLvl}`;
        document.getElementById('zs-hp').textContent = `❤️ ${Math.floor(player.hp)}`;
        if (typeof AudioFX !== 'undefined') AudioFX.coin();
      }
    });
    loot = loot.filter(l => !l.collected);

    // Draw Bullets
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

    // --- DRAW ANIMATED STICKMAN WITH RED HEADBAND & PISTOL ---
    ctx.save();
    ctx.translate(player.x, player.y);
    const aimAngle = nearestZombie ? Math.atan2(nearestZombie.y - player.y, nearestZombie.x - player.x) : 0;

    // Head & Red Headband
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, -14, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ef4444'; // Red headband
    ctx.fillRect(-8, -17, 16, 4);

    // Torso
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // Running Legs (animated with Math.sin)
    const legCycle = Math.sin(animTick) * 12;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-8 + legCycle, 24);
    ctx.moveTo(0, 10);
    ctx.lineTo(8 - legCycle, 24);
    ctx.stroke();

    // Arms & Pistol pointing at zombies
    ctx.save();
    ctx.rotate(aimAngle);
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(16, -2);
    ctx.stroke();
    // Gun barrel
    ctx.fillStyle = '#fde047';
    ctx.fillRect(14, -5, 8, 4);
    ctx.restore();

    ctx.restore();

    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 28px Inter';
      ctx.textAlign = 'center';
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

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}
