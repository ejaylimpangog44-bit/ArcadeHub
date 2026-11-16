const SONG_ALBUM = [
  { name: 'Classical Masterpiece (Fur Elise)', melody: [64, 63, 64, 63, 64, 59, 62, 60, 57] },
  { name: 'Canon in D (Classical)', melody: [67, 66, 65, 64, 62, 60, 62, 64] },
  { name: 'Faded - Alan Walker', melody: [60, 63, 65, 67, 68, 67, 65, 63] },
  { name: 'Believer - Imagine Dragons', melody: [55, 58, 60, 62, 60, 58, 55] },
  { name: 'Sunflower - Post Malone & Swae Lee', melody: [62, 65, 67, 69, 67, 65, 62] },
  { name: 'Stay - The Kid LAROI & Justin Bieber', melody: [60, 62, 65, 67, 65, 62, 60] },
  { name: 'Señorita - Shawn Mendes & Camila Cabello', melody: [65, 67, 69, 72, 69, 67, 65] },
  { name: 'Bad Guy - Billie Eilish', melody: [58, 60, 62, 60, 58, 53] },
  { name: 'Blinding Lights - The Weeknd', melody: [60, 62, 65, 67, 65, 62, 60, 57] },
  { name: 'Levitating - Dua Lipa', melody: [64, 67, 71, 69, 67, 64] },
  { name: 'As It Was - Harry Styles', melody: [67, 65, 62, 60, 62, 65, 67] },
  { name: 'Anti-Hero - Taylor Swift', melody: [60, 60, 62, 65, 62, 60, 58] },
  { name: 'Flowers - Miley Cyrus', melody: [62, 65, 69, 67, 65, 62] },
  { name: 'Vampire - Olivia Rodrigo', melody: [65, 64, 62, 60, 57, 60, 62] },
  { name: 'Cupid - FIFTY FIFTY', melody: [60, 62, 64, 67, 64, 62, 60] }
];

function initPianoTiles(stage) {
  const bgm = document.getElementById('bgm-audio');
  const wasBgmPlaying = bgm && !bgm.paused;
  if (bgm && wasBgmPlaying) bgm.pause();

  stage.innerHTML = `
    <div class="w-full h-full flex flex-col items-center justify-between px-3 py-2 select-none overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-2 max-w-lg w-full z-10">
        <select id="piano-song-select" class="px-3 py-1.5 rounded-xl bg-indigo-950/90 border border-indigo-400/40 text-indigo-200 font-bold text-xs outline-none cursor-pointer">
          ${SONG_ALBUM.map((s, idx) => `<option value="${idx}">🎵 ${s.name}</option>`).join('')}
        </select>
        <span id="pt-score" class="px-3 py-1.5 rounded-full bg-indigo-950/90 border border-indigo-400/40 text-indigo-200 font-black text-xs">SCORE: 0</span>
      </div>

      <div class="relative w-[min(92vw,380px)] flex-1 my-2 rounded-3xl overflow-hidden border-2 border-indigo-400/40 bg-slate-950 shadow-2xl">
        <canvas id="pt-canvas" class="w-full h-full block touch-none"></canvas>
      </div>

      <div class="text-[11px] text-indigo-200/70 text-center z-10">Tap falling tiles directly anywhere on screen • Speed scales with score</div>
    </div>
  `;

  const canvas = document.getElementById('pt-canvas');
  const ctx = canvas.getContext('2d');
  
  let parentEl = canvas.parentElement;
  let w = canvas.width = parentEl ? parentEl.clientWidth || 360 : 360;
  let h = canvas.height = parentEl ? parentEl.clientHeight || 540 : 540;

  const onResize = () => {
    if (!canvas.parentElement) return;
    w = canvas.width = canvas.parentElement.clientWidth || 360;
    h = canvas.height = canvas.parentElement.clientHeight || 540;
  };
  window.addEventListener('resize', onResize);

  let currentSongIdx = 0;
  let score = 0, combo = 0, noteIdx = 0, alive = true, running = true;
  let tiles = [];
  let spawnTimer = 0;

  document.getElementById('piano-song-select')?.addEventListener('change', (e) => {
    currentSongIdx = Number(e.target.value);
    resetGame();
  });

  function resetGame() {
    score = 0; combo = 0; noteIdx = 0; alive = true; running = true;
    tiles = [];
    spawnTimer = 0;
  }

  function spawnTile() {
    const col = Math.floor(Math.random() * 4);
    tiles.push({
      col,
      y: -120,
      height: 85,
      hit: false,
      missed: false
    });
  }

  let raf;
  function loop() {
    if (canvas.parentElement) {
      const cw = canvas.parentElement.clientWidth;
      const ch = canvas.parentElement.clientHeight;
      if (cw && ch && (canvas.width !== cw || canvas.height !== ch)) {
        w = canvas.width = cw;
        h = canvas.height = ch;
      }
    }

    ctx.clearRect(0, 0, w, h);
    const colWidth = w / 4;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * colWidth, 0);
      ctx.lineTo(i * colWidth, h);
      ctx.stroke();
    }

    if (running && alive) {
      spawnTimer++;
      const spawnInterval = Math.max(30, 75 - Math.floor(score / 15) * 4);
      if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        spawnTile();
      }

      const speed = 3.8 + Math.min(8.5, score * 0.07);

      tiles.forEach(t => {
        if (!t.hit) {
          t.y += speed;
        }

        if (!t.hit && !t.missed && t.y > h) {
          t.missed = true;
          alive = false;
          running = false;
          AudioFX.lose();
          if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
          window.ArcadeHero?.awardGameScore('piano-tiles', score);
        }
      });

      tiles = tiles.filter(t => !t.missed && !t.hit);
    }

    tiles.forEach(t => {
      const x = t.col * colWidth + 4;
      const tileW = colWidth - 8;

      ctx.fillStyle = '#0f172a';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(x, t.y, tileW, t.height, 10);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('TAP', x + tileW / 2, t.y + 48);
    });

    if (!running && !alive) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '900 26px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Note Missed / Wrong Tap!', w / 2, h / 2 - 20);
      ctx.font = '700 15px Inter';
      ctx.fillStyle = '#fde047';
      ctx.fillText(`Final Score: ${score} Notes — Tap to Retry`, w / 2, h / 2 + 20);
    }

    raf = requestAnimationFrame(loop);
  }
  loop();

  canvas.onpointerdown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const colWidth = w / 4;
    const tappedCol = Math.floor(clientX / colWidth);

    if (!alive) {
      resetGame();
      return;
    }

    let hitFound = false;
    tiles.forEach(t => {
      if (!t.hit && !t.missed && t.col === tappedCol) {
        if (clientY >= t.y - 20 && clientY <= t.y + t.height + 20) {
          hitFound = true;
          t.hit = true;
          score++;
          combo++;
          const activeMelody = SONG_ALBUM[currentSongIdx].melody;
          AudioFX.note(activeMelody[noteIdx % activeMelody.length]);
          noteIdx++;
          document.getElementById('pt-score').textContent = `SCORE: ${score}`;
          if (score % 10 === 0) addXP(15, w / 2, h * 0.3, `${score} STREAK!`);
        }
      }
    });

    if (!hitFound) {
      alive = false;
      running = false;
      AudioFX.lose();
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      window.ArcadeHero?.awardGameScore('piano-tiles', score);
    }
  };

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    if (bgm && wasBgmPlaying) {
      bgm.play().catch(() => {});
    }
  };
}
