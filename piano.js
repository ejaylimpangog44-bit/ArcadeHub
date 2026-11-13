/**
 * Magic Tiles 3 Style Engine with Song Album Carousel
 * ArcadeHub Piano Tiles Pro
 */

const pianoAlbums = [
  {
    id: 'symphony5',
    title: 'Symphony No. 5',
    artist: 'Beethoven',
    icon: '🎻',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    notes: [
      { f: 392.00, len: 1 }, { f: 392.00, len: 1 }, { f: 392.00, len: 1 }, { f: 311.13, len: 2.2 },
      { f: 349.23, len: 1 }, { f: 349.23, len: 1 }, { f: 349.23, len: 1 }, { f: 293.66, len: 2.2 },
      { f: 392.00, len: 1 }, { f: 392.00, len: 1 }, { f: 392.00, len: 1 }, { f: 311.13, len: 1 },
      { f: 415.30, len: 1 }, { f: 415.30, len: 1 }, { f: 415.30, len: 1 }, { f: 392.00, len: 2.0 }
    ]
  },
  {
    id: 'odeToJoy',
    title: 'Ode to Joy',
    artist: 'Beethoven',
    icon: '🎶',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    notes: [
      { f: 330, len: 1 }, { f: 330, len: 1 }, { f: 349, len: 1 }, { f: 392, len: 1 },
      { f: 392, len: 1 }, { f: 349, len: 1 }, { f: 330, len: 1 }, { f: 294, len: 1 },
      { f: 262, len: 1 }, { f: 262, len: 1 }, { f: 294, len: 1 }, { f: 330, len: 1 },
      { f: 330, len: 1.5 }, { f: 294, len: 0.5 }, { f: 294, len: 2.0 }
    ]
  },
  {
    id: 'twinkle',
    title: 'Twinkle Star',
    artist: 'Mozart',
    icon: '🌟',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    notes: [
      { f: 262, len: 1 }, { f: 262, len: 1 }, { f: 392, len: 1 }, { f: 392, len: 1 },
      { f: 440, len: 1 }, { f: 440, len: 1 }, { f: 392, len: 2.0 }, { f: 349, len: 1 },
      { f: 349, len: 1 }, { f: 330, len: 1 }, { f: 330, len: 1 }, { f: 294, len: 1 },
      { f: 294, len: 1 }, { f: 262, len: 2.0 }
    ]
  },
  {
    id: 'furElise',
    title: 'Für Elise',
    artist: 'Beethoven',
    icon: '🎹',
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    notes: [
      { f: 659, len: 1 }, { f: 622, len: 1 }, { f: 659, len: 1 }, { f: 622, len: 1 },
      { f: 659, len: 1 }, { f: 493, len: 1 }, { f: 587, len: 1 }, { f: 523, len: 1 },
      { f: 440, len: 2.0 }, { f: 262, len: 1 }, { f: 330, len: 1 }, { f: 440, len: 1 },
      { f: 493, len: 2.0 }, { f: 330, len: 1 }, { f: 415, len: 1 }, { f: 493, len: 1 }
    ]
  },
  {
    id: 'canonInD',
    title: 'Canon in D',
    artist: 'Pachelbel',
    icon: '🎼',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    notes: [
      { f: 587, len: 1 }, { f: 440, len: 1 }, { f: 493, len: 1 }, { f: 370, len: 1 },
      { f: 392, len: 1 }, { f: 294, len: 1 }, { f: 392, len: 1 }, { f: 440, len: 1 },
      { f: 587, len: 1 }, { f: 523, len: 1 }, { f: 493, len: 1 }, { f: 440, len: 1 }
    ]
  }
];

class MagicPianoGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId) || document.body;
    this.currentSongId = pianoAlbums[0].id;
    this.setupDOM();
    this.initAudio();
    this.resetState();
    this.bindEvents();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  setupDOM() {
    this.container.innerHTML = `
      <div id="mt3-wrapper" class="mt3-theme-green">
        <!-- Top HUD -->
        <div class="mt3-hud">
          <div class="mt3-progress-track">
            <div class="mt3-progress-fill" id="mt3-progress-fill"></div>
            <div class="mt3-milestones">
              <span class="mt3-star" data-idx="0">★</span>
              <span class="mt3-star" data-idx="1">★</span>
              <span class="mt3-star" data-idx="2">★</span>
              <span class="mt3-crown" data-idx="3">👑</span>
              <span class="mt3-crown" data-idx="4">👑</span>
              <span class="mt3-crown" data-idx="5">👑</span>
            </div>
          </div>
          <div class="mt3-score-box">
            <span class="mt3-coin">S</span>
            <span id="mt3-score">0</span>
          </div>
          <div id="mt3-judgment" class="mt3-judgment"></div>
          <button id="mt3-autoplay-btn" class="mt3-pill-btn">Auto-Play: OFF</button>
        </div>

        <!-- Game Canvas -->
        <canvas id="mt3-canvas"></canvas>

        <!-- Start / Game Over Overlay with Album Carousel -->
        <div id="mt3-overlay" class="mt3-overlay">
          <h1 id="mt3-title">PIANO TILES</h1>
          <p id="mt3-subtitle">Select a Song Album Below</p>
          
          <!-- Song Album Carousel -->
          <div class="piano-album-carousel-wrapper">
            <button class="carousel-nav-btn" id="carousel-left" aria-label="Previous Song">‹</button>
            <div class="piano-album-carousel" id="piano-album-carousel"></div>
            <button class="carousel-nav-btn" id="carousel-right" aria-label="Next Song">›</button>
          </div>

          <button id="mt3-start-btn" class="mt3-play-btn">TAP TO PLAY</button>
          <div class="mt3-controls-hint">Keys: <b>D</b> &nbsp; <b>F</b> &nbsp; <b>J</b> &nbsp; <b>K</b> &nbsp; or Tap Lanes</div>
        </div>
      </div>
    `;

    this.wrapper = document.getElementById('mt3-wrapper');
    this.canvas = document.getElementById('mt3-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.scoreEl = document.getElementById('mt3-score');
    this.judgmentEl = document.getElementById('mt3-judgment');
    this.progressFill = document.getElementById('mt3-progress-fill');
    this.overlay = document.getElementById('mt3-overlay');
    this.titleEl = document.getElementById('mt3-title');
    this.subtitleEl = document.getElementById('mt3-subtitle');
    this.startBtn = document.getElementById('mt3-start-btn');
    this.autoPlayBtn = document.getElementById('mt3-autoplay-btn');

    this.renderCarousel();
    this.resize();
  }

  renderCarousel() {
    const carousel = document.getElementById('piano-album-carousel');
    if (!carousel) return;
    carousel.innerHTML = '';

    pianoAlbums.forEach(album => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `album-card ${album.id === this.currentSongId ? 'active' : ''}`;
      card.dataset.songId = album.id;
      card.onclick = () => {
        this.currentSongId = album.id;
        document.querySelectorAll('.album-card').forEach(c => {
          c.classList.toggle('active', c.dataset.songId === album.id);
        });
      };

      card.innerHTML = `
        <div class="album-cover" style="background: ${album.gradient};">${album.icon}</div>
        <div class="album-meta">
          <div class="album-title">${album.title}</div>
          <div class="album-artist">${album.artist}</div>
        </div>
      `;
      carousel.appendChild(card);
    });
  }

  resize() {
    const rect = this.wrapper.getBoundingClientRect();
    this.width = rect.width || 400;
    this.height = rect.height || 720;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.laneWidth = this.width / 4;
    this.hitLineY = this.height * 0.78;
  }

  initAudio() {
    this.audioCtx = null;
  }

  playNote(freq, duration = 0.25) {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    gain.gain.setValueAtTime(0.22, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  resetState() {
    this.isPlaying = false;
    this.autoPlay = false;
    this.score = 0;
    this.combo = 0;
    this.speed = 460;
    this.tiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.heldLanes = [null, null, null, null];
    this.laneFlash = [0, 0, 0, 0];
    this.lastTimestamp = 0;
    this.spawnTimer = 0;
    this.noteIndex = 0;
    this.updateHUD();
  }

  startGame() {
    this.resetState();
    this.isPlaying = true;
    this.overlay.classList.add('hidden');
    this.wrapper.className = 'mt3-theme-green';
    document.querySelectorAll('.mt3-milestones span').forEach(el => el.classList.remove('active'));
    this.spawnTile();
  }

  gameOver() {
    this.isPlaying = false;
    this.playNote(130.81, 0.5);
    this.titleEl.textContent = 'GAME OVER';
    const activeAlbum = pianoAlbums.find(a => a.id === this.currentSongId) || pianoAlbums[0];
    this.subtitleEl.textContent = `${activeAlbum.title} • Score: ${this.score}`;
    this.startBtn.textContent = 'PLAY AGAIN';
    this.overlay.classList.remove('hidden');
  }

  getCurrentMelody() {
    const album = pianoAlbums.find(a => a.id === this.currentSongId) || pianoAlbums[0];
    return album.notes;
  }

  spawnTile() {
    const melody = this.getCurrentMelody();
    const note = melody[this.noteIndex % melody.length];
    this.noteIndex++;

    const prevLane = this.tiles.length ? this.tiles[this.tiles.length - 1].lane : -1;
    let lane = Math.floor(Math.random() * 4);
    if (lane === prevLane) lane = (lane + 1) % 4;

    const isHold = note.len > 1.5;
    const tileHeight = isHold ? 220 : 135;

    this.tiles.push({
      lane,
      y: -tileHeight,
      height: tileHeight,
      isHold,
      freq: note.f,
      hit: false,
      holding: false,
      holdProgress: 0,
      holdTickTimer: 0
    });

    if (isHold && Math.random() < 0.35) {
      const secondLane = (lane + 2) % 4;
      this.tiles.push({
        lane: secondLane,
        y: -tileHeight,
        height: tileHeight,
        isHold: true,
        freq: note.f * 1.25,
        hit: false,
        holding: false,
        holdProgress: 0,
        holdTickTimer: 0
      });
    }
  }

  triggerJudgment(text, points, lane) {
    this.score += points;
    this.combo++;
    this.judgmentEl.textContent = text;
    this.judgmentEl.classList.remove('pop');
    void this.judgmentEl.offsetWidth;
    this.judgmentEl.classList.add('pop');

    this.floatingTexts.push({
      x: lane * this.laneWidth + this.laneWidth / 2,
      y: this.hitLineY - 30,
      text: `+${points}`,
      alpha: 1
    });

    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: lane * this.laneWidth + this.laneWidth / 2,
        y: this.hitLineY,
        vx: (Math.random() - 0.5) * 240,
        vy: (Math.random() - 0.8) * 240,
        alpha: 1,
        size: Math.random() * 5 + 3
      });
    }

    this.updateHUD();
  }

  updateHUD() {
    this.scoreEl.textContent = this.score;

    const pct = Math.min(100, (this.score / 900) * 100);
    this.progressFill.style.width = `${pct}%`;

    const thresholds = [100, 220, 350, 500, 680, 850];
    document.querySelectorAll('.mt3-milestones span').forEach((el, idx) => {
      if (this.score >= thresholds[idx]) el.classList.add('active');
    });

    if (this.score >= 600 && !this.wrapper.classList.contains('mt3-theme-gold')) {
      this.wrapper.classList.remove('mt3-theme-green');
      this.wrapper.classList.add('mt3-theme-gold');
    }

    this.speed = 460 + Math.min(260, this.score * 0.25);
  }

  handleLanePress(lane) {
    if (!this.isPlaying) return;
    this.laneFlash[lane] = 1;

    const target = this.tiles.find(
      t => t.lane === lane && !t.hit && t.y + t.height >= this.hitLineY - 110 && t.y <= this.hitLineY + 90
    );

    if (!target) {
      this.gameOver();
      return;
    }

    const tileBottom = target.y + target.height;
    const dist = Math.abs(tileBottom - this.hitLineY);

    let rating = 'COOL';
    let pts = 10;
    if (dist < 45) {
      rating = 'PERFECT';
      pts = 21;
    } else if (dist < 85) {
      rating = 'GREAT';
      pts = 15;
    }

    target.hit = true;
    this.playNote(target.freq, target.isHold ? 0.55 : 0.25);
    this.triggerJudgment(rating, pts, lane);

    if (target.isHold) {
      target.holding = true;
      this.heldLanes[lane] = target;
    }
  }

  handleLaneRelease(lane) {
    const heldTile = this.heldLanes[lane];
    if (heldTile) {
      heldTile.holding = false;
      this.heldLanes[lane] = null;
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    this.startBtn.addEventListener('click', () => this.startGame());

    document.getElementById('carousel-left').addEventListener('click', () => {
      document.getElementById('piano-album-carousel').scrollBy({ left: -140, behavior: 'smooth' });
    });
    document.getElementById('carousel-right').addEventListener('click', () => {
      document.getElementById('piano-album-carousel').scrollBy({ left: 140, behavior: 'smooth' });
    });

    this.autoPlayBtn.addEventListener('click', () => {
      this.autoPlay = !this.autoPlay;
      this.autoPlayBtn.textContent = `Auto-Play: ${this.autoPlay ? 'ON' : 'OFF'}`;
      this.autoPlayBtn.classList.toggle('active', this.autoPlay);
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.autoPlay) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const lane = Math.floor(x / this.laneWidth);
      if (lane >= 0 && lane < 4) this.handleLanePress(lane);
    });

    window.addEventListener('pointerup', () => {
      for (let i = 0; i < 4; i++) this.handleLaneRelease(i);
    });

    const keyMap = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3 };
    window.addEventListener('keydown', (e) => {
      if (e.repeat || this.autoPlay) return;
      if (e.code in keyMap) this.handleLanePress(keyMap[e.code]);
    });

    window.addEventListener('keyup', (e) => {
      if (e.code in keyMap) this.handleLaneRelease(keyMap[e.code]);
    });
  }

  update(dt) {
    if (!this.isPlaying) return;

    this.spawnTimer += dt * this.speed;
    if (this.spawnTimer >= 155) {
      this.spawnTimer = 0;
      this.spawnTile();
    }

    for (let i = this.tiles.length - 1; i >= 0; i--) {
      const t = this.tiles[i];
      t.y += this.speed * dt;

      if (this.autoPlay && !t.hit && t.y + t.height >= this.hitLineY) {
        this.handleLanePress(t.lane);
      }

      if (t.isHold && t.holding) {
        const filledPx = Math.min(t.height, (t.y + t.height) - this.hitLineY);
        t.holdProgress = Math.max(0, Math.min(1, filledPx / t.height));
        t.holdTickTimer += dt;
        if (t.holdTickTimer >= 0.14) {
          t.holdTickTimer = 0;
          this.score += 4;
          this.updateHUD();
          this.floatingTexts.push({
            x: t.lane * this.laneWidth + this.laneWidth / 2,
            y: this.hitLineY - 20,
            text: '+4',
            alpha: 1
          });
        }
        if (t.holdProgress >= 1) {
          t.holding = false;
          this.heldLanes[t.lane] = null;
        }
      }

      if (!t.hit && t.y > this.height) {
        this.gameOver();
        return;
      }

      if (t.y > this.height + 100) {
        this.tiles.splice(i, 1);
      }
    }

    for (let i = 0; i < 4; i++) {
      if (this.laneFlash[i] > 0) this.laneFlash[i] = Math.max(0, this.laneFlash[i] - dt * 4);
    }

    this.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 2.2;
    });
    this.particles = this.particles.filter(p => p.alpha > 0);

    this.floatingTexts.forEach(ft => {
      ft.y -= 55 * dt;
      ft.alpha -= dt * 1.6;
    });
    this.floatingTexts = this.floatingTexts.filter(ft => ft.alpha > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < 4; i++) {
      const x = i * this.laneWidth;
      if (this.laneFlash[i] > 0) {
        const grad = ctx.createLinearGradient(0, this.hitLineY - 220, 0, this.hitLineY);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(1, `rgba(255, 255, 255, ${0.32 * this.laneFlash[i]})`);
        ctx.fillStyle = grad;
        ctx.fillRect(x, this.hitLineY - 220, this.laneWidth, 220);
      }

      if (i > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.height);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.hitLineY);
    ctx.lineTo(this.width, this.hitLineY);
    ctx.stroke();

    for (const t of this.tiles) {
      const x = t.lane * this.laneWidth + 3;
      const w = this.laneWidth - 6;

      if (t.isHold) {
        ctx.save();
        ctx.fillStyle = '#0ea5e9';
        ctx.beginPath();
        ctx.roundRect(x, t.y, w, t.height, [36, 36, 12, 12]);
        ctx.fill();

        if (t.holdProgress > 0) {
          const fillH = t.height * t.holdProgress;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.roundRect(x, t.y + t.height - fillH, w, fillH, 12);
          ctx.fill();
        }

        const cx = x + w / 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, t.y + 34);
        ctx.lineTo(cx, t.y + t.height - 26);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, t.y + t.height - 24, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = t.hit ? 'rgba(15, 23, 42, 0.25)' : '#090d16';
        ctx.beginPath();
        ctx.roundRect(x, t.y, w, t.height, 8);
        ctx.fill();

        if (!t.hit) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.fillRect(x + 4, t.y + 4, w - 8, 6);
        }
      }
    }

    for (const p of this.particles) {
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = '800 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      ctx.fillStyle = `rgba(255, 255, 255, ${ft.alpha})`;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
  }

  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000 || 0);
    this.lastTimestamp = timestamp;
    this.update(dt);
    this.draw();
    requestAnimationFrame(this.loop);
  }
}

// Mount automatically into #piano-mount
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('piano-mount')) {
    window.pianoGame = new MagicPianoGame('piano-mount');
  }
});