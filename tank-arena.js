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
    let gameOver = false;
    const keys = {};
    const walls = [
      { x: 240, y: 120, w: 36, h: 130 },
      { x: 620, y: 290, w: 36, h: 130 },
      { x: 420, y: 210, w: 60, h: 120 }
    ];

    const player = { x: 120, y: H / 2, angle: 0, hp: 5 };
    const bullets = [];
    const enemies = Array.from({ length: 4 }, (_, i) => ({
      x: 680 + (i % 2) * 110,
      y: 110 + i * 95,
      angle: Math.PI,
      cooldown: 60 + i * 25,
      alive: true
    }));

    function spawnEnemy() {
      enemies.push({
        x: 650 + Math.random() * 180,
        y: 70 + Math.random() * (H - 140),
        angle: Math.PI,
        cooldown: 75,
        alive: true
      });
    }

    function fireBullet(x, y, angle, fromPlayer) {
      bullets.push({
        x: x + Math.cos(angle) * 22,
        y: y + Math.sin(angle) * 22,
        vx: Math.cos(angle) * 7.2,
        vy: Math.sin(angle) * 7.2,
        bounces: 2,
        fromPlayer
      });
    }

    function onKeyDown(e) {
      keys[e.code] = true;
      if (e.code === 'Space' && !gameOver) {
        fireBullet(player.x, player.y, player.angle, true);
      }
    }
    function onKeyUp(e) { keys[e.code] = false; }
    function onPointerDown(e) {
      if (gameOver) return;
      const rect = canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * W;
      const my = ((e.clientY - rect.top) / rect.height) * H;
      player.angle = Math.atan2(my - player.y, mx - player.x);
      fireBullet(player.x, player.y, player.angle, true);
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onPointerDown);

    function hitsWall(x, y, r = 6) {
      return walls.some((w) => x + r > w.x && x - r < w.x + w.w && y + r > w.y && y - r < w.y + w.h);
    }

    function update() {
      if (gameOver) return;
      const speed = 3.6;
      let nx = player.x;
      let ny = player.y;
      if (keys['KeyW'] || keys['ArrowUp']) ny -= speed;
      if (keys['KeyS'] || keys['ArrowDown']) ny += speed;
      if (keys['KeyA'] || keys['ArrowLeft']) nx -= speed;
      if (keys['KeyD'] || keys['ArrowRight']) nx += speed;
      nx = Math.max(24, Math.min(W - 24, nx));
      ny = Math.max(24, Math.min(H - 24, ny));
      if (!hitsWall(nx, player.y, 16)) player.x = nx;
      if (!hitsWall(player.x, ny, 16)) player.y = ny;

      enemies.forEach((en) => {
        if (!en.alive) return;
        en.angle = Math.atan2(player.y - en.y, player.x - en.x);
        en.cooldown -= 1;
        if (en.cooldown <= 0) {
          fireBullet(en.x, en.y, en.angle, false);
          en.cooldown = 110;
        }
      });

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        const nextX = b.x + b.vx;
        const nextY = b.y + b.vy;

        if (nextX < 8 || nextX > W - 8 || hitsWall(nextX, b.y, 4)) {
          b.vx *= -1;
          b.bounces -= 1;
        } else {
          b.x = nextX;
        }

        if (nextY < 8 || nextY > H - 8 || hitsWall(b.x, nextY, 4)) {
          b.vy *= -1;
          b.bounces -= 1;
        } else {
          b.y = nextY;
        }

        if (b.bounces < 0) {
          bullets.splice(i, 1);
          continue;
        }

        if (b.fromPlayer) {
          const hitEnemy = enemies.find((en) => en.alive && Math.hypot(en.x - b.x, en.y - b.y) < 20);
          if (hitEnemy) {
            hitEnemy.alive = false;
            bullets.splice(i, 1);
            score += 100;
            opts.onScore && opts.onScore(score);
            spawnEnemy();
          }
        } else if (Math.hypot(player.x - b.x, player.y - b.y) < 18) {
          bullets.splice(i, 1);
          player.hp -= 1;
          if (player.hp <= 0) {
            gameOver = true;
            opts.onGameOver && opts.onGameOver(score);
          }
        }
      }
    }

    function draw() {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      walls.forEach((w) => {
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      });

      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-14, -14, 28, 28);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(0, -4, 22, 8);
      ctx.restore();

      enemies.forEach((en) => {
        if (!en.alive) return;
        ctx.save();
        ctx.translate(en.x, en.y);
        ctx.rotate(en.angle);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-14, -14, 28, 28);
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(0, -4, 20, 8);
        ctx.restore();
      });

      bullets.forEach((b) => {
        ctx.fillStyle = b.fromPlayer ? '#fde047' : '#fb7185';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`SCORE: ${score}   HP: ${player.hp}   (WASD + Click/Space)`, 18, 28);

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 32px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`TANK DESTROYED — SCORE: ${score}`, W / 2, H / 2);
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
        canvas.removeEventListener('pointerdown', onPointerDown);
      }
    };
  }

  window.ArcadeHubGames['tank-arena'] = { name: 'Tank Arena (2D Ricochet)', mount };
})();