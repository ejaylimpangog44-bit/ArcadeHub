// Universal Fullscreen Toggle matching your Hub implementation
function toggleFullScreen() {
    const docEl = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

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
    easy: { size: 75, interval: 1200 },
    normal: { size: 55, interval: 900 },
    hard: { size: 40, interval: 650 },
    insane: { size: 28, interval: 450 }
};

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    if (viewId === 'stats-view') renderStatsHistory();
}

function selectMode(mode, element) {
    currentMode = mode;
    document.querySelectorAll('.mode-select-pill').forEach(c => c.classList.remove('active'));
    element.classList.add('active');
}

function startSession() {
    // Automatically trigger fullscreen on mobile/desktop when starting a session via button tap
    const docEl = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
        }
    }

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
    
    const arena = document.getElementById('game-arena');
    if (!('ontouchstart' in window)) {
        arena.requestPointerLock();
    }

    container.onclick = (e) => {
        if (e.target === container) {
            misses++;
            totalShots++;
            currentStreak = 0;
            updateHUD();
        }
    };

    gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('hud-timer').textContent = `${timeLeft}s`;
        if (timeLeft <= 0) endSession();
    }, 1000);

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

    const maxX = container.clientWidth - cfg.size - 40;
    const maxY = container.clientHeight - cfg.size - 40;
    const randomX = Math.floor(Math.random() * Math.max(50, maxX)) + 20;
    
    // Leave a safe buffer at the top so targets never spawn behind the HUD bar
    const randomY = Math.floor(Math.random() * Math.max(50, maxY - 80)) + 70;

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
    document.getElementById('pause-modal').classList.add('active');
}

function resumeGame() {
    document.getElementById('pause-modal').classList.remove('active');
    if (!('ontouchstart' in window)) {
        document.getElementById('game-arena').requestPointerLock();
    }
    gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('hud-timer').textContent = `${timeLeft}s`;
        if (timeLeft <= 0) endSession();
    }, 1000);
}

function quitToMenu() {
    document.getElementById('pause-modal').classList.remove('active');
    switchView('main-menu');
}

function endSession() {
    clearInterval(gameTimer);
    document.exitPointerLock();
    
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
    const STORAGE_KEY = "arcadehub_aimlabs";
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
    const STORAGE_KEY = "arcadehub_aimlabs";
    const list = document.getElementById('history-list');
    let data;
    try {
        data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch(e) { data = null; }

    if (!data || !data.sessions || data.sessions.length === 0) {
        list.innerHTML = '<p style="color:#64748b; text-align:center; font-size:0.8rem;">No trial logs recorded.</p>';
        return;
    }

    let html = `
        <div style="margin-bottom:12px; padding:8px 12px; background:#ffffff; border-radius:8px; font-size:0.75rem; border:1px solid #e2e8f0;">
            <strong>Benchmarks:</strong> High Score: ${data.records.bestScore} | Best Acc: ${data.records.bestAccuracy}% | Best React: ${data.records.fastestReaction || 0}ms
        </div>
    `;

    html += data.sessions.map(s => `
        <div style="display:flex; justify-content:space-between; padding:8px 4px; border-bottom:1px solid #e2e8f0; font-size:0.75rem;">
            <span><strong style="color:#0284c7;">${s.mode.toUpperCase()}</strong> (${s.difficulty})</span>
            <span>Score: <strong>${s.score}</strong> | Acc: <strong>${s.accuracy}%</strong></span>
        </div>
    `).join('');

    list.innerHTML = html;
}