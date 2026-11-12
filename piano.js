// ===================================================
// PIANO TILES PRO ENGINE (CAROUSEL, MODES, HOLD TILES & SCORE POPUPS)
// ===================================================
const pianoAlbums = [
    {
        id: 'odeToJoy',
        title: 'Ode to Joy',
        artist: 'Beethoven',
        icon: '🎻',
        gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        notes: [330,330,349,392,392,349,330,294,262,262,294,330,330,294,294]
    },
    {
        id: 'twinkle',
        title: 'Twinkle Star',
        artist: 'Mozart',
        icon: '🌟',
        gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
        notes: [262,262,392,392,440,440,392,349,349,330,330,294,294,262]
    },
    {
        id: 'furElise',
        title: 'Für Elise',
        artist: 'Beethoven',
        icon: '🎹',
        gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
        notes: [659,622,659,622,659,493,587,523,440,262,330,440,493,330,415,493,523]
    },
    {
        id: 'canonInD',
        title: 'Canon in D',
        artist: 'Pachelbel',
        icon: '🎼',
        gradient: 'linear-gradient(135deg, #10b981, #059669)',
        notes: [587,440,493,370,392,294,392,440,587,523,587,493,523,440,493,392]
    },
    {
        id: 'turkishMarch',
        title: 'Turkish March',
        artist: 'Mozart',
        icon: '⚡',
        gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
        notes: [493,440,415,440,523,587,523,493,523,659,698,659,622,659,987,880,830,880,987]
    },
    {
        id: 'jingleBells',
        title: 'Jingle Bells',
        artist: 'Holiday Mix',
        icon: '🔔',
        gradient: 'linear-gradient(135deg, #ef4444, #16a34a)',
        notes: [330,330,330,330,330,330,330,392,262,294,330,349,349,349,349,349,330,330,330,330,294,294,330,294,392]
    },
    {
        id: 'happyBirthday',
        title: 'Birthday Tune',
        artist: 'Classic',
        icon: '🎂',
        gradient: 'linear-gradient(135deg, #f97316, #eab308)',
        notes: [262,262,294,262,349,330,262,262,294,262,392,349,262,262,523,440,349,330,294,466,466,440,349,392,349]
    },
    {
        id: 'swanLake',
        title: 'Swan Lake',
        artist: 'Tchaikovsky',
        icon: '🦢',
        gradient: 'linear-gradient(135deg, #6366f1, #a855f7)',
        notes: [659,440,493,523,587,659,523,659,523,659,440,523,440,349,523,440]
    }
];

let currentSongKey = 'odeToJoy';
let currentNoteIndex = 0;
let pianoGameMode = 'endless'; // 'endless' or 'timed'
let pianoTimeLeft = 60;
let pianoTimerInterval = null;

let pianoCanvas, pianoCtx;
let pianoRunning = false;
let pianoScore = 0;
let pianoStreak = 0;
let pianoAnimId;
let pianoTiles = [];
let pianoFloatingScores = [];
let activeHoldTile = null;
let pianoSpeed = 3.8;

function renderPianoAlbumCarousel() {
    const carousel = document.getElementById('piano-album-carousel');
    if (!carousel) return;
    carousel.innerHTML = '';

    pianoAlbums.forEach(album => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `album-card ${album.id === currentSongKey ? 'active' : ''}`;
        card.dataset.songId = album.id;
        card.onclick = () => selectPianoAlbum(album.id);

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

function scrollPianoAlbum(direction) {
    audio.playSFX('click');
    const carousel = document.getElementById('piano-album-carousel');
    if (!carousel) return;
    carousel.scrollBy({ left: direction * 135, behavior: 'smooth' });
}

function selectPianoAlbum(songId) {
    audio.playSFX('click');
    currentSongKey = songId;
    document.querySelectorAll('.album-card').forEach(c => {
        c.classList.toggle('active', c.dataset.songId === songId);
    });
    const activeCard = document.querySelector(`.album-card[data-song-id="${songId}"]`);
    if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    startPianoGame();
}

function setPianoMode(mode, btn) {
    audio.playSFX('click');
    pianoGameMode = mode;
    document.getElementById('piano-mode-endless').classList.toggle('active', mode === 'endless');
    document.getElementById('piano-mode-timed').classList.toggle('active', mode === 'timed');
    startPianoGame();
}

function initPianoCanvas() {
    pianoCanvas = document.getElementById('piano-canvas');
    if (pianoCanvas) {
        pianoCtx = pianoCanvas.getContext('2d');

        pianoCanvas.onmousedown = (e) => handlePianoPress(e.clientX, e.clientY);
        pianoCanvas.onmouseup = () => handlePianoRelease();
        pianoCanvas.onmouseleave = () => handlePianoRelease();

        pianoCanvas.ontouchstart = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handlePianoPress(touch.clientX, touch.clientY);
        };
        pianoCanvas.ontouchend = (e) => {
            e.preventDefault();
            handlePianoRelease();
        };
    }
}

function startPianoGame() {
    audio.playSFX('click');
    document.getElementById('piano-gameover-overlay').style.display = 'none';
    initPianoCanvas();
    if (!pianoCtx) return;

    if (pianoTimerInterval) clearInterval(pianoTimerInterval);

    pianoRunning = true;
    pianoScore = 0;
    pianoStreak = 0;
    pianoSpeed = 3.8;
    pianoTiles = [];
    pianoFloatingScores = [];
    activeHoldTile = null;
    currentNoteIndex = 0;

    document.getElementById('piano-score').textContent = 0;
    document.getElementById('piano-high').textContent = ScoreManager.getStats('pianotiles').highScore;

    const modeStatBox = document.getElementById('piano-mode-stat-box');
    if (pianoGameMode === 'timed') {
        pianoTimeLeft = 60;
        modeStatBox.innerHTML = `Time ⏱️ <span id="piano-time-val">60s</span>`;
        pianoTimerInterval = setInterval(() => {
            if (!pianoRunning || isGamePaused) return;
            pianoTimeLeft--;
            const tEl = document.getElementById('piano-time-val');
            if (tEl) tEl.textContent = `${pianoTimeLeft}s`;
            if (pianoTimeLeft <= 0) {
                endPianoGame("TIME'S UP! ⏱️");
            }
        }, 1000);
    } else {
        modeStatBox.innerHTML = `Streak 🔥 <span id="piano-streak">0</span>`;
    }

    for (let i = 0; i < 4; i++) {
        spawnPianoTile(-i * 95);
    }

    cancelAnimationFrame(pianoAnimId);
    pianoLoop();
}

function getCurrentSongNotes() {
    const album = pianoAlbums.find(a => a.id === currentSongKey) || pianoAlbums[0];
    return album.notes;
}

function spawnPianoTile(yPos) {
    const lane = Math.floor(Math.random() * 4);
    const isLong = Math.random() < 0.25;
    const notes = getCurrentSongNotes();
    const noteFreq = notes[currentNoteIndex % notes.length];

    pianoTiles.push({
        lane,
        y: yPos,
        height: isLong ? 145 : 85,
        isLong,
        clicked: false,
        holding: false,
        holdProgress: 0, // 0 to 1
        frequency: noteFreq
    });
    currentNoteIndex++;
}

function spawnFloatingScore(x, y, text, color) {
    pianoFloatingScores.push({
        x,
        y,
        text,
        color,
        alpha: 0,
        phase: 'in', // 'in' -> 'out'
        life: 0
    });
}

function handlePianoPress(clientX, clientY) {
    if (!pianoRunning || isGamePaused) return;
    const rect = pianoCanvas.getBoundingClientRect();
    const clickX = (clientX - rect.left) * (pianoCanvas.width / rect.width);
    const clickY = (clientY - rect.top) * (pianoCanvas.height / rect.height);
    const laneWidth = pianoCanvas.width / 4;
    const tappedLane = Math.floor(clickX / laneWidth);
    let hit = false;

    for (let t of pianoTiles) {
        if (!t.clicked && !t.holding && t.lane === tappedLane && clickY >= t.y && clickY <= t.y + t.height) {
            hit = true;
            const centerX = t.lane * laneWidth + laneWidth / 2;
            const centerY = Math.max(40, Math.min(pianoCanvas.height - 40, clickY));

            if (t.isLong) {
                t.holding = true;
                activeHoldTile = t;
                audio.playTone(t.frequency, 0.45, 'sine');
            } else {
                t.clicked = true;
                pianoScore += 15;
                pianoStreak++;
                audio.playTone(t.frequency, 0.18, 'sine');
                spawnFloatingScore(centerX, centerY, '+15', '#38bdf8');
                updatePianoHUD();
            }
            break;
        }
    }

    if (!hit) {
        endPianoGame('MISSED TILE! 💀');
    }
}

function handlePianoRelease() {
    if (!activeHoldTile || !pianoRunning) return;
    const t = activeHoldTile;
    activeHoldTile = null;

    if (!t.clicked) {
        t.holding = false;
        t.clicked = true;
        const laneWidth = pianoCanvas.width / 4;
        const centerX = t.lane * laneWidth + laneWidth / 2;
        const centerY = Math.max(40, t.y + t.height / 2);

        if (t.holdProgress >= 0.75) {
            pianoScore += 50;
            pianoStreak++;
            audio.playSFX('score');
            spawnFloatingScore(centerX, centerY, '+50', '#facc15');
        } else {
            // Partial hold awards +15 instead of failing the player
            pianoScore += 15;
            pianoStreak++;
            spawnFloatingScore(centerX, centerY, '+15', '#38bdf8');
        }
        updatePianoHUD();
    }
}

function updatePianoHUD() {
    document.getElementById('piano-score').textContent = pianoScore;
    if (pianoGameMode === 'endless') {
        const streakEl = document.getElementById('piano-streak');
        if (streakEl) streakEl.textContent = pianoStreak;
        // Gradually increase speed in endless mode
        pianoSpeed = Math.min(7.5, 3.8 + Math.floor(pianoScore / 150) * 0.25);
    }
}

function pianoLoop() {
    if (!pianoRunning) return;
    if (isGamePaused) {
        pianoAnimId = requestAnimationFrame(pianoLoop);
        return;
    }

    pianoCtx.fillStyle = '#0b0f19';
    pianoCtx.fillRect(0, 0, pianoCanvas.width, pianoCanvas.height);

    const laneWidth = pianoCanvas.width / 4;
    pianoCtx.strokeStyle = 'rgba(255,255,255,.08)';
    pianoCtx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        pianoCtx.beginPath();
        pianoCtx.moveTo(i * laneWidth, 0);
        pianoCtx.lineTo(i * laneWidth, pianoCanvas.height);
        pianoCtx.stroke();
    }

    pianoTiles.forEach(t => {
        t.y += pianoSpeed;

        // Progress active hold tile
        if (t.holding && !t.clicked) {
            t.holdProgress = Math.min(1, t.holdProgress + (pianoSpeed / t.height) * 1.15);
            if (t.holdProgress >= 1) {
                t.holding = false;
                t.clicked = true;
                activeHoldTile = null;
                pianoScore += 50;
                pianoStreak++;
                audio.playSFX('score');
                const centerX = t.lane * laneWidth + laneWidth / 2;
                const centerY = Math.max(40, t.y + t.height / 2);
                spawnFloatingScore(centerX, centerY, '+50', '#facc15');
                updatePianoHUD();
            }
        }

        if (!t.clicked) {
            const x = t.lane * laneWidth + 4;
            const w = laneWidth - 8;

            if (t.isLong) {
                // Base gradient for hold tile
                const grad = pianoCtx.createLinearGradient(x, t.y, x, t.y + t.height);
                grad.addColorStop(0, '#a855f7');
                grad.addColorStop(1, '#38bdf8');
                pianoCtx.fillStyle = grad;
                pianoCtx.beginPath();
                pianoCtx.roundRect(x, t.y, w, t.height, 8);
                pianoCtx.fill();

                // Live hold fill overlay from bottom up
                if (t.holdProgress > 0) {
                    const fillH = t.height * t.holdProgress;
                    pianoCtx.fillStyle = 'rgba(250, 204, 21, 0.85)';
                    pianoCtx.beginPath();
                    pianoCtx.roundRect(x, t.y + (t.height - fillH), w, fillH, 8);
                    pianoCtx.fill();
                }

                // Hold indicator badge
                pianoCtx.fillStyle = '#0b0f19';
                pianoCtx.font = '800 10px Outfit, sans-serif';
                pianoCtx.textAlign = 'center';
                pianoCtx.fillText('HOLD +50', x + w / 2, t.y + t.height - 12);
            } else {
                pianoCtx.fillStyle = '#ffffff';
                pianoCtx.beginPath();
                pianoCtx.roundRect(x, t.y, w, t.height, 6);
                pianoCtx.fill();
            }
        }
    });

    // Check missed tiles
    for (let t of pianoTiles) {
        if (!t.clicked && !t.holding && t.y > pianoCanvas.height) {
            endPianoGame('MISSED TILE! 💀');
            return;
        }
    }

    // Spawn next tile seamlessly
    const topTileY = pianoTiles.length > 0 ? Math.min(...pianoTiles.map(t => t.y)) : 0;
    if (topTileY > -10) {
        spawnPianoTile(topTileY - 95);
    }
    pianoTiles = pianoTiles.filter(t => t.y < pianoCanvas.height + 160);

    // Render Pop-In & Fade-Out Score Effects (+15 / +50)
    pianoFloatingScores.forEach(fs => {
        fs.life++;
        fs.y -= 1.25;

        if (fs.phase === 'in') {
            fs.alpha += 0.18;
            if (fs.alpha >= 1) {
                fs.alpha = 1;
                if (fs.life > 14) fs.phase = 'out';
            }
        } else {
            fs.alpha -= 0.045;
        }

        if (fs.alpha > 0) {
            pianoCtx.save();
            pianoCtx.globalAlpha = Math.max(0, fs.alpha);
            const scale = fs.phase === 'in' ? 0.8 + (fs.alpha * 0.35) : 1.15;
            pianoCtx.translate(fs.x, fs.y);
            pianoCtx.scale(scale, scale);

            pianoCtx.font = '900 22px Outfit, sans-serif';
            pianoCtx.textAlign = 'center';
            pianoCtx.textBaseline = 'middle';
            pianoCtx.shadowColor = fs.color;
            pianoCtx.shadowBlur = 12;
            pianoCtx.fillStyle = fs.color;
            pianoCtx.fillText(fs.text, 0, 0);
            pianoCtx.restore();
        }
    });
    pianoFloatingScores = pianoFloatingScores.filter(fs => fs.alpha > 0);

    if (pianoRunning) {
        pianoAnimId = requestAnimationFrame(pianoLoop);
    }
}

function endPianoGame(reasonTitle = 'MISSED TILE! 💀') {
    pianoRunning = false;
    activeHoldTile = null;
    if (pianoTimerInterval) clearInterval(pianoTimerInterval);

    if (reasonTitle.includes("TIME'S UP")) {
        audio.playSFX('win');
    } else {
        audio.playSFX('gameover');
    }

    const titleEl = document.getElementById('piano-gameover-title');
    if (titleEl) {
        titleEl.textContent = reasonTitle;
        titleEl.style.color = reasonTitle.includes("TIME'S UP") ? '#10b981' : '#ef4444';
    }

    const album = pianoAlbums.find(a => a.id === currentSongKey);
    const songLabel = album ? album.title : '';
    document.getElementById('piano-final-msg').textContent = `${songLabel} • Score: ${pianoScore} | Streak: ${pianoStreak}`;
    document.getElementById('piano-gameover-overlay').style.display = 'flex';

    const stats = ScoreManager.saveScore('pianotiles', pianoScore);
    submitScore('Piano Tiles', 'TestPlayer', pianoScore);
    document.getElementById('piano-high').textContent = stats.highScore;
}