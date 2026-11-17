let currentMode = 'flick';
let currentDifficulty = 'normal';
let sessionDuration = 30;
let score = 0;
let hits = 0;
let totalShots = 0;
let misses = 0;
let centerHits = 0;
let currentStreak = 0;
let bestStreak = 0;
let timeLeft = 30;
let gameTimer = null;
let reactionTimes = [];

const DIFFICULTIES = {
    easy: { size: 70, interval: 1200 },
    normal: { size: 50, interval: 900 },
    hard: { size: 35, interval: 650 },
    insane: { size: 24, interval: 450 }
};

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    if (viewId === 'stats-view') renderStatsHistory();
}

function selectMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-card').forEach(c => c.style.borderColor = '#334155');
    event.currentTarget.style.borderColor = '#00f0ff';
}

function startSession() {
    currentDifficulty = document.getElementById('difficulty-select').value;
    sessionDuration = parseInt(document.getElementById('duration-select').value);
    
    score = 0;
    hits = 0;
    totalShots = 0;
    misses = 0;
    centerHits = 0;
    currentStreak = 0;
    bestStreak = 0;
    timeLeft = sessionDuration;
    reactionTimes = [];
    
    switchView('game-arena');
    
    const container = document.getElementById('target-container');
    container.innerHTML = '';
    
    // Desktop Pointer Lock support
    const arena = document.getElementById('game-arena');
    if (!('ontouchstart' in window)) {
        arena.requestPointerLock();
    }

    // Register missed clicks accurately relative to container
    container.onclick = (e) => {
        if (e.target === container) {
            misses++;
            totalShots++;
            currentStreak = 0;
            updateHUD();
        }
    };

    // Start Countdown
    gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('hud-timer').textContent = `${timeLeft}s`;
        if (timeLeft <= 0) endSession();
    }, 1000);

    // Initial spawns
    spawnTargetNode();
    if (currentMode === 'grid') {
        spawnTargetNode();
        spawnTargetNode();
    }
}

function spawnTargetNode() {
    if (timeLeft <= 0) return;
    
    const container = document.getElementById('target-container');
    const target = document.createElement('div');
    target.className = currentMode === 'precision' ? 'aim-target center-zone' : 'aim-target';
    
    const cfg = DIFFICULTIES[currentDifficulty];
    target.style.width = `${cfg.size}px`;
    target.style.height = `${cfg.size}px`;

    // Keep targets safely inside bounds
    const maxX = container.clientWidth - cfg.size - 40;
    const maxY = container.clientHeight - cfg.size - 40;
    const randomX = Math.floor(Math.random() * Math.max(50, maxX)) + 20;
    const randomY = Math.floor(Math.random() * Math.max(50, maxY)) + 20;

    target.style.left = `${randomX}px`;
    target.style.top = `${randomY}px`;

    const spawnTimestamp = Date.now();

    target.onclick = (e) => {
        e.stopPropagation();
        const reaction = Date.now() - spawnTimestamp;
        reactionTimes.push(reaction);
        
        hits++;
        totalShots++;
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;

        // Center zone bonus detection
        const rect = target.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const radius = cfg.size / 2;
        const distFromCenter = Math.hypot(clickX - radius, clickY - radius);
        
        if (distFromCenter <= radius * 0.4) {
            centerHits++;
            score += 200;
        } else {
            score += 100;
        }
        
        updateHUD();
        target.remove();
        
        spawnTargetNode();
        if (currentMode === 'grid' && container.children.length < 4) {
            spawnTargetNode();
        }
    };

    container.appendChild(target);
}

function updateHUD() {
    const accuracy = totalShots > 0 ? Math.round((hits / totalShots) * 100) : 100;
    document.getElementById('hud-score').textContent = `SCORE: ${score}`;
    document.getElementById('hud-accuracy').textContent = `ACCURACY: ${accuracy}%`;
    document.getElementById('hud-streak').textContent = `STREAK: ${currentStreak}`;
}

function pauseGame() {
    clearInterval(gameTimer);
    document.exitPointerLock();
    if(confirm("Game Paused. Resume?")) {
        if (!('ontouchstart' in window)) document.getElementById('game-arena').requestPointerLock();
        gameTimer = setInterval(() => {
            timeLeft--;
            document.getElementById('hud-timer').textContent = `${timeLeft}s`;
            if (timeLeft <= 0) endSession();
        }, 1000);
    } else {
        switchView('main-menu');
    }
}

function endSession() {
    clearInterval(gameTimer);
    document.exitPointerLock();
    
    const activeSeconds = sessionDuration - timeLeft;
    const accuracy = totalShots > 0 ? Number(((hits / totalShots) * 100).toFixed(1)) : 0;
    const avgReaction = reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a,b) => a+b, 0) / reactionTimes.length) : 0;

    document.getElementById('res-score').textContent = score;
    document.getElementById('res-accuracy').textContent = `${accuracy}%`;
    document.getElementById('res-hits').textContent = hits;
    document.getElementById('res-reaction').textContent = `${avgReaction}ms`;

    const sessionRecord = {
        id: `session_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        mode: currentMode,
        difficulty: currentDifficulty,
        duration: sessionDuration,
        score: score,
        hits: hits,
        accuracy: accuracy,
        reactionTime: avgReaction,
        bestStreak: bestStreak
    };

    saveSessionToLocalStorage(sessionRecord);
    switchView('results-view');
}

function saveSessionToLocalStorage(newSession) {
    const STORAGE_KEY = "arcadehub_flickpoint";
    let data;
    try {
        data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { sessions: [], records: { bestScore: 0, bestAccuracy: 0, fastestReaction: null, bestStreak: 0 } };
    } catch (e) {
        data = { sessions: [], records: { bestScore: 0, bestAccuracy: 0, fastestReaction: null, bestStreak: 0 } };
    }

    data.sessions.unshift(newSession);
    if (data.sessions.length > 50) data.sessions.pop();

    if (newSession.score > data.records.bestScore) data.records.bestScore = newSession.score;
    if (newSession.accuracy > data.records.bestAccuracy) data.records.bestAccuracy = newSession.accuracy;
    if (data.records.fastestReaction === null || (newSession.reactionTime > 0 && newSession.reactionTime < data.records.fastestReaction)) {
        data.records.fastestReaction = newSession.reactionTime;
    }
    if (newSession.bestStreak > data.records.bestStreak) data.records.bestStreak = newSession.bestStreak;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function renderStatsHistory() {
    const STORAGE_KEY = "arcadehub_flickpoint";
    const list = document.getElementById('history-list');
    let data;
    try {
        data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch(e) { data = null; }

    if (!data || !data.sessions || data.sessions.length === 0) {
        list.innerHTML = '<p style="color:#94a3b8; text-align:center;">No training sessions recorded yet.</p>';
        return;
    }

    let html = `
        <div style="margin-bottom:12px; padding:8px; background:#0f172a; border-radius:6px; font-size:0.8rem;">
            <strong>Personal Bests:</strong> Score: ${data.records.bestScore} | Acc: ${data.records.bestAccuracy}% | React: ${data.records.fastestReaction || 0}ms
        </div>
    `;

    html += data.sessions.map(s => `
        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #334155; font-size:0.8rem;">
            <span><strong style="color:#00f0ff;">${s.mode.toUpperCase()}</strong> (${s.difficulty})</span>
            <span>Score: <strong>${s.score}</strong> | Acc: <strong>${s.accuracy}%</strong></span>
        </div>
    `).join('');

    list.innerHTML = html;
}

function saveSettings() {
    // Optional placeholder for settings persistence
}
