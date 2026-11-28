(function () {
  window.ArcadeHubGames = window.ArcadeHubGames || {};

  function mount(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width || 900;
    const H = canvas.height || 540;
    canvas.width = W;
    canvas.height = H;

    const groundY = H - 80;
    let rafId = null;
    let score = 0;
    let combo = 0;
    let hp = 5;
    let gameOver = false;
    let slashTimer = 0;
    let spawnTimer = 45;
    const keys = {};
    const enemies = [];

    const player = { x: W / 2, y: groundY, facing: 1 };

    function slash() {
      if (gameOver) return;
      slashTimer = 10;
      for (let i = enemies.length - 1; i >= 0; i--) {
        const en = enemies[i];
        const dx = en.x - player.x;
        if (Math.abs(dx) < 105 && Math.sign(dx || 1) === player.facing) {
          enemies.splice(i, 1);
          combo += 1;
          score += 50 * Math.min(5, combo);
          opts.onScore && opts.onScore(score);
        }
      }
    }

    function onKeyDown(e) {
      keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'KeyJ') slash();
    }
    function onKeyUp(e) { keys[e.code] = false; }
    function onPointerDown(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * W;
      player.facing = mx >= player.x ? 1 : -1;
      slash();
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onPointerDown);

    function update() {
      if (gameOver) return;
      if (keys['KeyA'] || keys['ArrowLeft']) {
        player.x = Math.max(40, player.x - 5.5);
        player.facing = -1;
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        player.x = Math.min(W - 40, player.x + 5.5);
        player.facing = 1;
      }
      if (slashTimer > 0) slashTimer -= 1;

      spawnTimer -= 1;
      if (spawnTimer <= 0) {
        const side = Math.random() < 0.5 ? -1 : 1;
        enemies.push({
          x: side === -1 ? -20 : W + 20,
          y: groundY,
          speed: 2.4 + Math.min(3.2, score * 0.002)
        });
        spawnTimer = Math.max(24, 65 - Math.floor(score / 120));
      }

      for (let i = enemies.length - 1; i >= 0; i--) {
        const en = enemies[i];
        const dir = Math.sign(player.x - en.x);
        en.x += dir * en.speed;
        if (Math.abs(en.x - player.x) < 26) {
          enemies.splice(i, 1);
          combo = 0;
          hp -= 1;
          if (hp <= 0) {
            gameOver = true;
            opts.onGameOver && opts.onGameOver(score);
          }
        }
      }
    }

    function draw() {
      ctx.fillStyle = '#0b0914';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(W * 0.72, 130, 68, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, groundY, W, H - groundY);

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(player.x - 10, player.y - 44, 20, 44);
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(player.x - 12, player.y - 46, 24, 6);

      if (slashTimer > 0) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(player.x, player.y - 22, 85, player.facing === 1 ? -0.6 : Math.PI - 0.6, player.facing === 1 ? 0.6 : Math.PI + 0.6);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      enemies.forEach((en) => {
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(en.x - 10, en.y - 38, 20, 38);
      });

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`SCORE: ${score}   COMBO: x${Math.max(1, combo)}   HP: ${hp}`, 18, 28);

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fb7185';
        ctx.font = 'bold 32px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`FALLEN RONIN — SCORE: ${score}`, W / 2, H / 2);
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

  window.ArcadeHubGames['shadow-ronin'] = { name: 'Shadow Ronin', mount };
})();