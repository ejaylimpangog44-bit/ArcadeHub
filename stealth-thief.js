(function () {
  window.ArcadeHubGames = window.ArcadeHubGames || {};

  function mount(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width || 900;
    const H = canvas.height || 540;
    canvas.width = W;
    canvas.height = H;

    let rafId = null;
    let score = 0;
    let caught = false;
    const keys = {};
    const player = { x: 80, y: H / 2, hasLoot: false };
    const loot = { x: W - 110, y: H / 2 };
    const guard = { x: W / 2, y: 120, dir: 1, angle: Math.PI / 2 };

    function resetRound() {
      player.x = 80;
      player.y = H / 2;
      player.hasLoot = false;
      caught = false;
    }

    function onKeyDown(e) { keys[e.code] = true; }
    function onKeyUp(e) { keys[e.code] = false; }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function update() {
      if (caught) return;
      const spd = 4;
      if (keys['KeyW'] || keys['ArrowUp']) player.y = Math.max(24, player.y - spd);
      if (keys['KeyS'] || keys['ArrowDown']) player.y = Math.min(H - 24, player.y + spd);
      if (keys['KeyA'] || keys['ArrowLeft']) player.x = Math.max(24, player.x - spd);
      if (keys['KeyD'] || keys['ArrowRight']) player.x = Math.min(W - 24, player.x + spd);

      guard.y += guard.dir * 2.5;
      if (guard.y < 90 || guard.y > H - 90) guard.dir *= -1;
      guard.angle = guard.dir === 1 ? Math.PI * 0.45 : -Math.PI * 0.45;

      if (!player.hasLoot && Math.hypot(player.x - loot.x, player.y - loot.y) < 28) {
        player.hasLoot = true;
      }
      if (player.hasLoot && player.x < 110) {
        score += 200;
        opts.onScore && opts.onScore(score);
        resetRound();
      }

      const dx = player.x - guard.x;
      const dy = player.y - guard.y;
      const dist = Math.hypot(dx, dy);
      const angToPlayer = Math.atan2(dy, dx);
      let diff = Math.abs(angToPlayer - guard.angle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;

      if (dist < 190 && diff < 0.42) {
        caught = true;
        opts.onGameOver && opts.onGameOver(score);
      }
    }

    function draw() {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(34, 197, 94, 0.14)';
      ctx.fillRect(30, 40, 90, H - 80);

      ctx.fillStyle = player.hasLoot ? '#475569' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(loot.x, loot.y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y);
      ctx.arc(guard.x, guard.y, 190, guard.angle - 0.42, guard.angle + 0.42);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(player.x, player.y, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`SCORE: ${score}   LOOT: ${player.hasLoot ? 'RETURN TO LEFT ZONE' : 'GRAB RIGHT GEM'}`, 18, 28);

      if (caught) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 32px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SPOTTED! FINAL SCORE: ${score}`, W / 2, H / 2);
        ctx.textAlign = 'left';
      }
    }

    function loop() {
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    return {
      destroy() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      }
    };
  }

  window.ArcadeHubGames['stealth-thief'] = { name: 'Stealth Thief (Laser Heist)', mount };
})();