// ===================================================
// SUPABASE & LEADERBOARD INTEGRATION
// ===================================================
const SUPABASE_URL = 'https://nrlfudwhnncycjcyupgt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TFyTpbQI_sWvPT4G6HEpmQ_ANYNTYfW';

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function submitScore(gameName, playerName, score) {
  const activePlayer = localStorage.getItem("arcadehub_player_name") || playerName || "Player";
  const { data, error } = await window.supabaseClient
    .from('high_scores')
    .insert([
      { game_name: gameName, player_name: activePlayer, score: score }
    ]);

  if (error) {
    console.error('Error saving score:', error);
  } else {
    console.log('Score saved successfully!', data);
    if (score >= 1000) {
        triggerLeaderboardRolloutBanner();
    }
  }
}

function triggerLeaderboardRolloutBanner() {
    const banner = document.getElementById('leaderboard-rollout-banner');
    if (banner) {
        banner.classList.add('active');
        setTimeout(() => {
            banner.classList.remove('active');
        }, 6000);
    }
}

function openSettingsToTrophies() {
    const banner = document.getElementById('leaderboard-rollout-banner');
    if (banner) banner.classList.remove('active');
    openSettingsDrawer();
    switchSettingsTab('trophies');
}

// ===================================================
// SERVICE WORKER & ROBOT COMPANION
// ===================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}

window.addEventListener('mousemove', (e) => {
    updateRobotEyes(e.clientX, e.clientY);
});

window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        updateRobotEyes(e.touches[0].clientX, e.touches[0].clientY);
    }
});

function updateRobotEyes(mouseX, mouseY) {
    const robot = document.getElementById('robot-companion');
    if (!robot || !robot.classList.contains('visible')) return;

    const leftPupil = document.getElementById('left-pupil');
    const rightPupil = document.getElementById('right-pupil');
    if (!leftPupil || !rightPupil) return;

    const leftRect = leftPupil.getBoundingClientRect();
    const rightRect = rightPupil.getBoundingClientRect();

    movePupil(leftPupil, leftRect, mouseX, mouseY);
    movePupil(rightPupil, rightRect, mouseX, mouseY);
}

function movePupil(pupil, rect, mouseX, mouseY) {
    const eyeCenterX = rect.left + rect.width / 2;
    const eyeCenterY = rect.top + rect.height / 2;

    const angle = Math.atan2(mouseY - eyeCenterY, mouseX - eyeCenterX);
    const maxDist = 5;
    const distance = Math.min(maxDist, Math.hypot(mouseX - eyeCenterX, mouseY - eyeCenterY) / 15);
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;

    pupil.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
}

// ===================================================
// SCORE MANAGER & HUB STATS (NAME-SCOPED)
// ===================================================
const ScoreManager = {
    getActivePlayer() {
        return localStorage.getItem("arcadehub_player_name") || "Player";
    },
    getStats(gameKey) {
        const playerName = this.getActivePlayer();
        const data = localStorage.getItem(`arcadehub_${playerName}_${gameKey}`);
        return data ? JSON.parse(data) : { highScore: 0, gamesPlayed: 0 };
    },
    saveScore(gameKey, score) {
        const playerName = this.getActivePlayer();
        const stats = this.getStats(gameKey);
        stats.gamesPlayed += 1;
        if (score > stats.highScore) stats.highScore = score;
        localStorage.setItem(`arcadehub_${playerName}_${gameKey}`, JSON.stringify(stats));
        updateHubActivityStats();
        return stats;
    }
};

function updateHubActivityStats() {
    const allGameKeys = ['snake', 'towerstack', 'chess', 'dama', 'airhockey', 'mole', 'dino', 'carracing', 'brickbreaker', 'pianotiles', 'fruitslasher', 'sr', 'solitaire', 'scatter', 'blackjack', 'highlow', 'tictactoe', 'guess', 'wordscape'];
    let totalPlayed = 0;
    let totalHighScoresSet = 0;

    allGameKeys.forEach(k => {
        const st = ScoreManager.getStats(k);
        totalPlayed += st.gamesPlayed;
        if(st.highScore > 0) totalHighScoresSet++;
    });

    document.getElementById('stat-games-played').textContent = totalPlayed;
    document.getElementById('stat-achievements').textContent = totalHighScoresSet;
    const xpStatEl = document.getElementById('stat-total-xp');
    if (xpStatEl && typeof ProgressionManager !== 'undefined') xpStatEl.textContent = ProgressionManager.getXP().toLocaleString();
    renderTrophiesPanel();
}

function renderTrophiesPanel() {
    const container = document.getElementById('trophies-list-container');
    if (!container) return;
    container.innerHTML = '';

    const games = [
        { key: 'snake', name: 'Cyber Snake', icon: '🐍' },
        { key: 'towerstack', name: 'Tower Stack', icon: '🏗️' },
        { key: 'chess', name: 'Chess Pro', icon: '♟️' },
        { key: 'dama', name: 'Pinoy Dama', icon: '🔴' },
        { key: 'airhockey', name: 'Air Hockey', icon: '🏒' },
        { key: 'dino', name: 'Dino Runner', icon: '🦖' },
        { key: 'carracing', name: 'Car Racing', icon: '🏎️' },
        { key: 'brickbreaker', name: 'Brick Breaker', icon: '🧱' },
        { key: 'pianotiles', name: 'Piano Tiles', icon: '🎹' },
        { key: 'fruitslasher', name: 'Fruit Master', icon: '🍉' },
        { key: 'sr', name: 'Stick Run', icon: '🏃‍♂️' },
        { key: 'solitaire', name: 'Speed Solitaire', icon: '🎴' },
        { key: 'blackjack', name: 'Blackjack 21', icon: '🃏' },
        { key: 'highlow', name: 'High-Low', icon: '🔼' },
        { key: 'tictactoe', name: 'Tic-Tac-Toe', icon: '❌' },
        { key: 'guess', name: 'Number Master', icon: '🔢' },
        { key: 'wordscape', name: 'Wordscape Pro', icon: '📝' },
        { key: 'mole', name: 'Whack-a-Mole', icon: '🔨' }
    ];

    games.forEach(g => {
        const st = ScoreManager.getStats(g.key);
        const item = document.createElement('div');
        item.style.cssText = 'background: rgba(17,24,39,0.9); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between;';
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">${g.icon}</span>
                <div>
                    <strong style="font-size: 12px; color: #fff; display: block;">${g.name}</strong>
                    <small style="font-size: 10px; color: var(--text-muted);">Played: ${st.gamesPlayed} times</small>
                </div>
            </div>
            <div style="text-align: right;">
                <span style="font-size: 13px; font-weight: 800; color: #facc15;">${st.highScore.toLocaleString()}</span>
                <small style="font-size: 9px; color: var(--text-muted); display: block;">Best Score</small>
            </div>
        `;
        container.appendChild(item);
    });
}

// ===================================================
// PLAYER NAME GENERATOR & VALIDATION
// ===================================================
const ADJECTIVES = ["Shadow", "Cyber", "Pixel", "Nova", "Vortex", "Phantom", "Blaze", "Neon", "Hyper", "Alpha", "Apex", "Turbo"];
const NOUNS = ["Knight", "Striker", "Runner", "Viper", "Echo", "Hunter", "Rider", "Titan", "Falcon", "Slayer", "Ninja"];
const BANNED_WORDS = ["badword", "admin", "moderator", "hack", "spam", "scam", "nigger", "fuck", "shit", "bitch", "cunt", "dick", "pussy"];

function generateRandomName() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    return `${adj}${noun}_${num}`;
}

function checkInappropriate(name) {
    const lower = name.toLowerCase();
    return BANNED_WORDS.some(b => lower.includes(b));
}

document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("arcadehub_player_name");
    if (saved) {
        document.getElementById("welcomeHeading").textContent = `Welcome, ${saved}!`;
    } else {
        document.getElementById("customNameInput").value = generateRandomName();
    }

    document.getElementById("randomNameBtn").addEventListener("click", () => {
        audio.playSFX('click');
        document.getElementById("customNameInput").value = generateRandomName();
        document.getElementById("customNameError").style.display = 'none';
    });
});

function openNamePromptModal() {
    audio.playSFX('click');
    const saved = localStorage.getItem("arcadehub_player_name") || generateRandomName();
    document.getElementById("customNameInput").value = saved;
    document.getElementById("customNameError").style.display = 'none';
    document.getElementById("name-prompt-modal").classList.add('active');
}

function saveCustomNameAndEnter() {
    audio.playSFX('click');
    const inputVal = document.getElementById("customNameInput").value.trim();
    const errorEl = document.getElementById("customNameError");

    if (inputVal.length < 3) {
        errorEl.textContent = "Name must be at least 3 characters long.";
        errorEl.style.display = 'block';
        return false;
    }

    if (checkInappropriate(inputVal)) {
        errorEl.textContent = "This name contains inappropriate words. Please choose another.";
        errorEl.style.display = 'block';
        return false;
    }

    localStorage.setItem("arcadehub_player_name", inputVal);
    document.getElementById("welcomeHeading").textContent = `Welcome, ${inputVal}!`;
    document.getElementById("name-prompt-modal").classList.remove('active');

    const splash = document.getElementById('splash-screen');
    if (splash && !splash.classList.contains('fade-out')) {
        splash.classList.add('fade-out');
        audio.playSFX('win');
        document.getElementById('robot-companion').classList.add('visible');
    }
    return true;
}

// ===================================================
// GAME INSTRUCTIONS & RECENTLY PLAYED
// ===================================================
let pendingGameId = '';
let pendingGameName = '';
let pendingGameIcon = '';

function showGameInstructions(containerId, gameName, icon, instructionObj) {
    audio.playSFX('click');
    pendingGameId = containerId;
    pendingGameName = gameName;
    pendingGameIcon = icon;

    let skippedGames = JSON.parse(localStorage.getItem('arcadehub_skipped_instructions') || '{}');
    let globalEnabled = localStorage.getItem('arcadehub_global_instructions') !== 'false';

    if (!globalEnabled || skippedGames[containerId]) {
        recordRecentGame(containerId, gameName, icon);
        openGame(containerId);
        return;
    }

    document.getElementById('inst-modal-title').textContent = `🎮 ${gameName}`;
    document.getElementById('inst-modal-icon').innerHTML = icon || '🕹️';
    
    let contentHTML = `
        <div style="margin-bottom: 10px;">
            <strong style="color: var(--primary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">Objective</strong>
            <p style="font-size: 0.9rem; color: var(--text-main); margin-top: 2px;">${instructionObj.objective}</p>
        </div>
        <div>
            <strong style="color: var(--primary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">Controls & Rules</strong>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 2px;">${instructionObj.controls}</p>
        </div>
    `;
    document.getElementById('inst-modal-content').innerHTML = contentHTML;
    document.getElementById('dont-show-checkbox').checked = false;
    document.getElementById('instruction-modal').classList.add('active');
}

function closeInstructionModal() {
    audio.playSFX('click');
    document.getElementById('instruction-modal').classList.remove('active');
}

function toggleDontShowAgain() {
    let cb = document.getElementById('dont-show-checkbox');
    cb.checked = !cb.checked;
}

function proceedToGame() {
    audio.playSFX('click');
    let cb = document.getElementById('dont-show-checkbox');
    if(cb.checked) {
        let skippedGames = JSON.parse(localStorage.getItem('arcadehub_skipped_instructions') || '{}');
        skippedGames[pendingGameId] = true;
        localStorage.setItem('arcadehub_skipped_instructions', JSON.stringify(skippedGames));
    }
    document.getElementById('instruction-modal').classList.remove('active');
    recordRecentGame(pendingGameId, pendingGameName, pendingGameIcon);
    openGame(pendingGameId);
}

function recordRecentGame(containerId, gameName, icon) {
    let recents = JSON.parse(localStorage.getItem('arcadehub_recent_games') || '[]');
    recents = recents.filter(g => g.id !== containerId);
    recents.unshift({ id: containerId, name: gameName, icon: icon });
    if(recents.length > 5) recents.pop();
    localStorage.setItem('arcadehub_recent_games', JSON.stringify(recents));
    renderRecentGames();
}

function renderRecentGames() {
    let recents = JSON.parse(localStorage.getItem('arcadehub_recent_games') || '[]');
    const section = document.getElementById('recently-played-section');
    const container = document.getElementById('recent-scroll-container');
    if(!section || !container) return;
    container.innerHTML = '';

    if(recents.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    recents.forEach(game => {
        let card = document.createElement('div');
        card.className = 'recent-card';
        card.onclick = () => {
            closeSettingsDrawer();
            let inst = gameInstructionsMap[game.id] || { objective: "Set a high score!", controls: "Tap controls to play." };
            showGameInstructions(game.id, game.name, game.icon, inst);
        };
        let iconHTML = game.icon || '🕹️';
        card.innerHTML = `<span style="font-size:22px; display:flex; align-items:center; justify-content:center;">${iconHTML}</span><span style="font-size:12px; font-weight:600; color:#e5e7eb;">${game.name}</span>`;
        container.appendChild(card);
    });
}

const gameInstructionsMap = {
    'solitaire-container': { objective: "Match cards in your tableau that are 1 rank higher or lower than the foundation card.", controls: "Tap playable cards to match before time runs out." },
    'scattercard-container': { objective: "Place your bet and roll the dice to earn spins, then spin the reels to land multipliers and win big coins!", controls: "Select bet, roll dice for spins, and hit spin." },
    'blackjack-container': { objective: "Get as close to 21 as possible without busting.", controls: "Hit for another card or Stand to hold your hand." },
    'highlow-container': { objective: "Predict whether the next card will be higher or lower.", controls: "Tap Higher or Lower buttons based on current card." },
    'tictactoe-container': { objective: "Align 3 or 4 matching symbols in a row.", controls: "Tap empty cells on the grid." },
    'guessgame-container': { objective: "Find the secret target number within given attempts.", controls: "Input number guesses and follow higher/lower hints." },
    'wordscape-container': { objective: "Connect letters to spell hidden target words.", controls: "Swipe your finger across the letter wheel." },
    'piano-container': { objective: "Tap falling white tiles (+15) and hold long tiles (+50) across multiple song albums in Endless or 60s Time Attack mode!", controls: "Tap normal tiles, press & hold long tiles until full." },
    'fruitslice-container': { objective: "Slice flying fruits across the screen to score points.", controls: "Swipe across fruits with your finger. Avoid 💣 bombs!" },
    'molegame-container': { objective: "Whack the cheeky hamsters as they pop out of holes.", controls: "Tap moles instantly when they appear." },
    'snakegame-container': { objective: "Guide the growing snake to eat glowing food pellets.", controls: "Use Arrow keys to steer." },
    'dinogame-container': { objective: "Sprint endlessly across the desert avoiding obstacles.", controls: "Press Space/Up Arrow to Jump, Down Arrow to Duck." },
    'carracing-container': { objective: "Steer your car at high speeds and collect power-ups.", controls: "Use Left/Right arrows to steer, Space/Up arrow for Nitro boost." },
    'frostgame-container': { objective: "Bounce the ball off your paddle to smash glowing bricks.", controls: "Drag your mouse or finger across the screen to move the paddle." },
    'stickman-container': { objective: "Clear obstacles in this high-speed endless runner.", controls: "Press Space/Up Arrow to Jump/Double Jump, Down Arrow to Slide." },
    'chess-container': { objective: "Capture the opponent's king through strategic checkmate.", controls: "Tap a piece to select, then tap a highlighted square to move." },
    'dama-container': { objective: "Capture all enemy pieces or trap them so they cannot move.", controls: "Tap your piece to select, jump diagonally over opponent pieces." }
};

// ===================================================
// SEARCH BAR & CATEGORY FILTERING
// ===================================================
function filterArcadeGames(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.game-card').forEach(card => {
        const name = card.getAttribute('data-name') || '';
        if(name.includes(q)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterCategory(category, btn) {
    audio.playSFX('click');
    document.querySelectorAll('#category-filter-bar .opt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.category-section').forEach(sec => {
        if(category === 'all' || sec.getAttribute('data-category') === category) {
            sec.style.display = 'block';
        } else {
            sec.style.display = 'none';
        }
    });
}

// ===================================================
// LUCKY SPIN COOLDOWN MANAGER (PHT TIMEZONE)
// ===================================================
const LuckySpinManager = {
    isAvailable() {
        const lastSpinDate = localStorage.getItem("arcadehub_last_spin_pht");
        const todayPHT = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
        return lastSpinDate !== todayPHT;
    },
    recordSpin() {
        const todayPHT = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
        localStorage.setItem("arcadehub_last_spin_pht", todayPHT);
        this.updateUIState();
    },
    updateUIState() {
        const btn1 = document.getElementById('modal-spin-wheel-btn');
        const btn2 = document.getElementById('spin-wheel-btn');
        const status1 = document.getElementById('modal-wheel-status');
        const status2 = document.getElementById('wheel-status');

        if (!this.isAvailable()) {
            const msLeft = getPHTTimeRemainingToMidnight();
            if (msLeft <= 0) {
                localStorage.removeItem("arcadehub_last_spin_pht");
                this.updateUIState();
                return;
            }
            
            const hours = Math.floor(msLeft / 3600000);
            const minutes = Math.floor((msLeft % 3600000) / 60000);
            const seconds = Math.floor((msLeft % 60000) / 1000);
            const timeStr = `${hours}h ${minutes}m ${seconds}s`;

            if (btn1) {
                btn1.disabled = true;
                btn1.style.opacity = '0.6';
                btn1.textContent = `${timeStr}`;
            }
            if (btn2) {
                btn2.disabled = true;
                btn2.style.opacity = '0.6';
                btn2.textContent = `${timeStr}`;
            }
            if (status1) status1.textContent = `Next spin available tomorrow at midnight (PHT)`;
            if (status2) status2.textContent = `Next spin available tomorrow at midnight (PHT)`;
        } else {
            if (btn1) {
                btn1.disabled = false;
                btn1.style.opacity = '1';
                btn1.textContent = 'SPIN LUCKY WHEEL ▶';
            }
            if (btn2) {
                btn2.disabled = false;
                btn2.style.opacity = '1';
                btn2.textContent = 'SPIN WHEEL ▶';
            }
            if (status1) status1.textContent = 'Spin for bonus XP & coins today!';
            if (status2) status2.textContent = 'Spin to win random XP or Coin bonuses!';
        }
    }
};

function getPHTTimeRemainingToMidnight() {
    const now = new Date();
    const options = { timeZone: 'Asia/Manila', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);
    let year, month, day, hour, minute, second;
    for (let p of parts) {
        if (p.type === 'year') year = parseInt(p.value);
        if (p.type === 'month') month = parseInt(p.value) - 1;
        if (p.type === 'day') day = parseInt(p.value);
        if (p.type === 'hour') hour = parseInt(p.value);
        if (p.type === 'minute') minute = parseInt(p.value);
        if (p.type === 'second') second = parseInt(p.value);
    }
    const currentPHTMs = Date.UTC(year, month, day, hour, minute, second);
    const nextMidnightPHTMs = Date.UTC(year, month, day + 1, 0, 0, 0);
    return nextMidnightPHTMs - currentPHTMs;
}

let luckySpinInterval = null;
function initLuckySpinTimer() {
    if (luckySpinInterval) clearInterval(luckySpinInterval);
    LuckySpinManager.updateUIState();
    luckySpinInterval = setInterval(() => {
        LuckySpinManager.updateUIState();
    }, 1000);
}

function openLuckySpinModal() {
    audio.playSFX('click');
    LuckySpinManager.updateUIState();
    document.getElementById('lucky-spin-modal').classList.add('active');
}

function closeLuckySpinModal() {
    audio.playSFX('click');
    document.getElementById('lucky-spin-modal').classList.remove('active');
}

function executeLuckySpin() {
    if (!LuckySpinManager.isAvailable()) return;
    audio.playSFX('powerup');
    const rewards = [
        { label: "+250 XP", xp: 250, icon: "⚡" },
        { label: "+500 XP", xp: 500, icon: "🔥" },
        { label: "+1,000 XP", xp: 1000, icon: "💎" },
        { label: "+150 XP", xp: 150, icon: "🎁" }
    ];
    let won = rewards[Math.floor(Math.random() * rewards.length)];
    document.getElementById('wheel-display').textContent = won.icon;
    document.getElementById('wheel-status').textContent = `🎉 You won ${won.label}!`;
    LuckySpinManager.recordSpin();
    ProgressionManager.addXP(won.xp);
}

function executeModalLuckySpin() {
    if (!LuckySpinManager.isAvailable()) return;
    audio.playSFX('powerup');
    const rewards = [
        { label: "+250 XP", xp: 250, icon: "⚡" },
        { label: "+500 XP", xp: 500, icon: "🔥" },
        { label: "+1,000 XP", xp: 1000, icon: "💎" },
        { label: "+150 XP", xp: 150, icon: "🎁" }
    ];
    let won = rewards[Math.floor(Math.random() * rewards.length)];
    document.getElementById('modal-wheel-display').textContent = won.icon;
    document.getElementById('modal-wheel-status').textContent = `🎉 You won ${won.label}!`;
    LuckySpinManager.recordSpin();
    ProgressionManager.addXP(won.xp);
}

// ===================================================
// LEADERBOARD & SHOP TABS NAVIGATION
// ===================================================
function openLeaderboardTab() {
    audio.playSFX('click');
    openSettingsDrawer();
    switchSettingsTab('trophies');
}

function openShopTab() {
    audio.playSFX('click');
    openCustomizeModal();
}

// ===================================================
// AUDIO MANAGER & SETTINGS DRAWER
// ===================================================
class ArcadeAudioManager {
    constructor() { 
        this.audioCtx = null; 
        this.isMuted = false; 
        this.masterVolume = 0.5;
        this.bgmVolume = 0.4;
        this.sfxVolume = 0.4; 
    }
    initContext() {
        if (!this.audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; this.audioCtx = new AC(); }
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    }
    updateBgmElement() {
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.volume = this.isMuted ? 0 : (this.masterVolume * this.bgmVolume);
        }
    }
    playTone(freq, duration = 0.1, type='triangle') {
        if (this.isMuted) return;
        this.initContext();
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        osc.type = type; osc.frequency.setValueAtTime(freq, now);
        const effectiveVol = this.masterVolume * this.sfxVolume;
        gain.gain.setValueAtTime(effectiveVol * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.start(now); osc.stop(now + duration);
    }
    playSFX(type) {
        if (this.isMuted) return;
        this.initContext();
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        const eff = this.masterVolume * this.sfxVolume;
        switch (type) {
            case 'click': osc.type='square'; osc.frequency.setValueAtTime(400,now); gain.gain.setValueAtTime(eff*.15,now); gain.gain.exponentialRampToValueAtTime(.001,now+.04); osc.start(now); osc.stop(now+.04); break;
            case 'move': osc.type='triangle'; osc.frequency.setValueAtTime(300,now); osc.frequency.exponentialRampToValueAtTime(500,now+.06); gain.gain.setValueAtTime(eff*.2,now); gain.gain.exponentialRampToValueAtTime(.001,now+.06); osc.start(now); osc.stop(now+.06); break;
            case 'score': osc.type='sine'; osc.frequency.setValueAtTime(587.33,now); osc.frequency.setValueAtTime(880,now+.08); gain.gain.setValueAtTime(eff*.3,now); gain.gain.exponentialRampToValueAtTime(.001,now+.2); osc.start(now); osc.stop(now+.2); break;
            case 'powerup': osc.type='sine'; osc.frequency.setValueAtTime(400,now); osc.frequency.exponentialRampToValueAtTime(1200,now+.2); gain.gain.setValueAtTime(eff*.3,now); gain.gain.exponentialRampToValueAtTime(.001,now+.25); osc.start(now); osc.stop(now+.25); break;
            case 'win': osc.type='triangle'; osc.frequency.setValueAtTime(523.25,now); osc.frequency.setValueAtTime(659.25,now+.1); osc.frequency.setValueAtTime(783.99,now+.2); osc.frequency.setValueAtTime(1046.50,now+.3); gain.gain.setValueAtTime(eff*.4,now); gain.gain.exponentialRampToValueAtTime(.001,now+.5); osc.start(now); osc.stop(now+.5); break;
            case 'gameover': osc.type='sawtooth'; osc.frequency.setValueAtTime(250,now); osc.frequency.exponentialRampToValueAtTime(70,now+.35); gain.gain.setValueAtTime(eff*.35,now); gain.gain.exponentialRampToValueAtTime(.001,now+.35); osc.start(now); osc.stop(now+.35); break;
        }
    }
}

const audio = new ArcadeAudioManager();

function toggleAudioSetting() {
    audio.isMuted = !audio.isMuted;
    audio.updateBgmElement();
    const btn = document.getElementById('audio-toggle-switch');
    if (audio.isMuted) { btn.textContent = "MUTED"; btn.classList.remove('active'); }
    else { btn.textContent = "ENABLED"; btn.classList.add('active'); audio.playSFX('click'); }
}

function updateMasterVolume(val) {
    audio.masterVolume = parseFloat(val);
    audio.updateBgmElement();
    audio.playSFX('click');
}

function updateBgmVolume(val) {
    audio.bgmVolume = parseFloat(val);
    audio.updateBgmElement();
}

function updateVolume(val) { 
    audio.sfxVolume = parseFloat(val); 
    audio.playSFX('click'); 
}

function setTheme(themeName) { audio.playSFX('click'); document.documentElement.className = themeName; localStorage.setItem("arcadehub_theme", themeName); }

function openSettingsDrawer() {
    audio.playSFX('click');
    document.getElementById('settings-drawer').classList.add('active');
    document.getElementById('drawer-backdrop').classList.add('active');
    renderRecentGames();
    renderTrophiesPanel();
}
function closeSettingsDrawer() {
    audio.playSFX('click');
    document.getElementById('settings-drawer').classList.remove('active');
    document.getElementById('drawer-backdrop').classList.remove('active');
}

function toggleInstructionPreference() {
    audio.playSFX('click');
    let current = localStorage.getItem('arcadehub_global_instructions') !== 'false';
    let next = !current;
    localStorage.setItem('arcadehub_global_instructions', next);
    const btn = document.getElementById('pref-instructions-toggle');
    if(next) { btn.textContent = "ENABLED"; btn.classList.add('active'); }
    else { btn.textContent = "DISABLED"; btn.classList.remove('active'); }
}

function switchSettingsTab(tabName) {
    audio.playSFX('move');
    ['audio','theme','trophies','prefs','share'].forEach(t => {
        const tabEl = document.getElementById(`tab-${t}`);
        const panelEl = document.getElementById(`panel-${t}`);
        if(tabEl) tabEl.classList.toggle('active', t===tabName);
        if(panelEl) panelEl.classList.toggle('active', t===tabName);
    });
    if(tabName === 'trophies') renderTrophiesPanel();
}

function toggleHubFullscreen() {
    audio.playSFX('click');
    if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// ===================================================
// PAUSE & NAVIGATION SYSTEM
// ===================================================
let isGamePaused = false;
function openPauseModal() {
    audio.playSFX('click');
    isGamePaused = true;
    document.getElementById('pause-modal').classList.add('active');
}
function resumeGame() {
    audio.playSFX('click');
    isGamePaused = false;
    document.getElementById('pause-modal').classList.remove('active');
}
function backToHubFromPause() {
    document.getElementById('pause-modal').classList.remove('active');
    isGamePaused = false;
    backToHub();
}

function backToHub() {
    audio.playSFX('click');
    if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});

    document.querySelector('header').style.display = 'flex';
    const pCard = document.getElementById('player-profile-card');
    if (pCard) pCard.style.display = 'flex';

    if (typeof snakeInterval !== 'undefined') clearInterval(snakeInterval);
    if (typeof dinoInterval !== 'undefined') clearInterval(dinoInterval);
    if (typeof moleTimer !== 'undefined') clearInterval(moleTimer);
    if (typeof reactionTimeout !== 'undefined') clearTimeout(reactionTimeout);
    if (typeof solTimer !== 'undefined') clearInterval(solTimer);
    if (typeof pianoTimerInterval !== 'undefined') clearInterval(pianoTimerInterval);

    if (typeof frostAnimId !== 'undefined') cancelAnimationFrame(frostAnimId);
    if (typeof fruitAnimId !== 'undefined') cancelAnimationFrame(fruitAnimId);
    if (typeof pianoAnimId !== 'undefined') cancelAnimationFrame(pianoAnimId);
    if (typeof carAnimId !== 'undefined') cancelAnimationFrame(carAnimId);
    if (typeof dinoAnimId !== 'undefined') cancelAnimationFrame(dinoAnimId);
    if (typeof srAnimId !== 'undefined') cancelAnimationFrame(srAnimId);
    if (typeof tsAnimId !== 'undefined') cancelAnimationFrame(tsAnimId);
    if (typeof ahAnimId !== 'undefined') cancelAnimationFrame(ahAnimId);
    if (typeof tsRunning !== 'undefined') tsRunning = false;
    if (typeof ahRunning !== 'undefined') ahRunning = false;

    if (typeof frostRunning !== 'undefined') frostRunning = false;
    if (typeof fruitRunning !== 'undefined') fruitRunning = false;
    if (typeof pianoRunning !== 'undefined') pianoRunning = false;
    if (typeof carRunning !== 'undefined') carRunning = false;
    if (typeof isDinoRunning !== 'undefined') isDinoRunning = false;
    if (typeof solRunning !== 'undefined') solRunning = false;
    if (typeof srRunning !== 'undefined') { srRunning = false; if(srBgMusicInterval) clearInterval(srBgMusicInterval); }

    document.querySelectorAll('.game-container').forEach(el => el.classList.remove('active'));
    document.getElementById('main-menu').classList.add('active');
    updateHubActivityStats();
    renderRecentGames();
}

window.onload = function() {
    generateQRCode();
    initSnakeCanvas(); initDinoCanvas(); initFrostCanvas(); initFruitCanvas(); initPianoCanvas(); initCarCanvas();
    const savedTheme = localStorage.getItem("arcadehub_theme") || "";
    if (savedTheme) document.documentElement.className = savedTheme;

    let globalInst = localStorage.getItem('arcadehub_global_instructions') !== 'false';
    const prefBtn = document.getElementById('pref-instructions-toggle');
    if(globalInst) { prefBtn.textContent = "ENABLED"; prefBtn.classList.add('active'); }
    else { prefBtn.textContent = "DISABLED"; prefBtn.classList.remove('active'); }

    updateHubActivityStats();
    renderRecentGames();
    renderTrophiesPanel();
    initLuckySpinTimer();
};

function openGame(containerId) {
    document.querySelector('header').style.display = 'none';
    const pCard = document.getElementById('player-profile-card');
    if (pCard) pCard.style.display = 'none';
    
    document.getElementById('main-menu').classList.remove('active');
    document.querySelectorAll('.game-container').forEach(el => el.classList.remove('active'));
    document.getElementById(containerId).classList.add('active');
    
    setTimeout(() => {
        if (containerId === 'snakegame-container') startSnakeGame();
        if (containerId === 'dinogame-container') startDinoGame();
        if (containerId === 'fruitslice-container') startFruitGame();
        if (containerId === 'frostgame-container') { initFrostCanvas(); startFrostGame(); }
        if (containerId === 'piano-container') { renderPianoAlbumCarousel(); startPianoGame(); }
        if (containerId === 'carracing-container') startCarGame();
        if (containerId === 'stickman-container') returnToSrMenu();
        if (containerId === 'solitaire-container') startSolitaireGame();
        if (containerId === 'scattercard-container') initScatterGame();
        if (containerId === 'blackjack-container') {
            let savedBal = localStorage.getItem('arcadehub_scatter_bal');
            if(savedBal !== null) bjBalance = parseInt(savedBal);
            document.getElementById('bj-balance').textContent = bjBalance.toLocaleString();
        }
        if (containerId === 'highlow-container') initHighLowGame();
        if (containerId === 'wordscape-container') startWordscapeGame();
        if (containerId === 'towerstack-container') startTowerStackGame();
        if (containerId === 'chess-container') startChessGame();
        if (containerId === 'dama-container') startDamaGame();
        if (containerId === 'airhockey-container') startAirHockeyGame();
        if (containerId === 'connectfour-container') startConnectFourGame();
    }, 50);
}

function generateQRCode() {
    const targetUrl = window.location.href || "https://arcadehubgames-july12.vercel.app/";
    document.getElementById('current-url-text').textContent = targetUrl;
    document.getElementById('qr-code-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(targetUrl)}`;
}


// ===================================================
// LEVEL 1-50 PROGRESSION, TITLES, AVATARS & BORDERS
// ===================================================
const LEVEL_TITLES = [
    "Arcade Newcomer", "Button Masher", "Coin Collector", "Pixel Rookie", "Cabinet Explorer",
    "Casual Contender", "Joystick Apprentice", "Score Chaser", "Neon Hopper", "Grid Runner",
    "Combo Starter", "Reflex Cadet", "Token Hustler", "Retro Enthusiast", "Arcade Regular",
    "High-Score Hunter", "Pattern Breaker", "Card Tactician", "Cyber Sprinter", "Rhythm Keeper",
    "Silver Challenger", "Arena Striker", "Puzzle Architect", "Turbo Drifter", "Quarter-Master",
    "Gold Contender", "Neon Tactician", "Streak Builder", "Arcade Veteran", "Precision Pro",
    "Platinum Ace", "Cyber Gladiator", "Leaderboard Threat", "Combo Virtuoso", "Shadow Strategist",
    "Diamond Prodigy", "Overdrive Master", "Grand Tactician", "Apex Challenger", "Mythic Contender",
    "Master of Reflexes", "Neon Sovereign", "Arcade Legend", "Cyber Warlord", "Supreme Champion",
    "Immortal Gamer", "Celestial Striker", "Arcade Overlord", "Grandmaster of Hub", "ARCADE GOD (MAX)"
];

const AVATAR_UNLOCKS = [
    { level: 1, icon: "🕹️", name: "Classic Stick" },
    { level: 3, icon: "👾", name: "Space Invader" },
    { level: 6, icon: "🦊", name: "Cozy Fox" },
    { level: 10, icon: "🤖", name: "Cyber Bot" },
    { level: 15, icon: "🐉", name: "Neon Dragon" },
    { level: 20, icon: "🥷", name: "Shadow Ninja" },
    { level: 25, icon: "🦄", name: "Prism Unicorn" },
    { level: 30, icon: "🛸", name: "UFO Pilot" },
    { level: 35, icon: "🔥", name: "Inferno Spirit" },
    { level: 40, icon: "⚡", name: "Volt Phantom" },
    { level: 45, icon: "👑", name: "Royal Crown" },
    { level: 50, icon: "🌌", name: "Celestial Deity" }
];

const BORDER_UNLOCKS = [
    { id: "border-rookie", level: 1, name: "Slate" },
    { id: "border-neon", level: 5, name: "Cyber Pulse" },
    { id: "border-emerald", level: 12, name: "Emerald Flash" },
    { id: "border-inferno", level: 22, name: "Inferno Sides" },
    { id: "border-galaxy", level: 35, name: "Galaxy Prism" },
    { id: "border-celestial", level: 50, name: "Lv.50 God Aura" },
    { id: "border-daily-champ", level: 99, name: "Quest Reward", special: true }
];

function getXPForLevel(lvl) {
    if (lvl <= 1) return 0;
    return Math.floor(Math.pow(lvl - 1, 3) * 12);
}

function getLevelFromXP(xp) {
    let lvl = 1;
    while (lvl < 50 && xp >= getXPForLevel(lvl + 1)) {
        lvl++;
    }
    return lvl;
}

const ProgressionManager = {
    getXP() {
        return parseInt(localStorage.getItem("arcadehub_total_xp") || "0", 10);
    },
    addXP(amount) {
        let oldXP = this.getXP();
        let oldLvl = getLevelFromXP(oldXP);
        let newXP = oldXP + Math.max(5, Math.floor(amount));
        localStorage.setItem("arcadehub_total_xp", newXP);
        let newLvl = getLevelFromXP(newXP);
        if (newLvl > oldLvl) {
            triggerLevelUpModal(`Level ${newLvl}: ${LEVEL_TITLES[newLvl - 1]}`);
        }
        this.updateUI();
    },
    awardGameXP(gameKey, score) {
        let baseXP = Math.min(450, Math.max(15, Math.floor(score * 0.25)));
        const gotd = getGameOfTheDay();
        if (gotd && gotd.key === gameKey) {
            baseXP *= 2;
        }
        this.addXP(baseXP);
        DailyChallengeManager.trackProgress(gameKey, score);
    },
    updateUI() {
        const xp = this.getXP();
        const lvl = getLevelFromXP(xp);
        const title = LEVEL_TITLES[lvl - 1] || "Arcade Legend";
        const currFloor = getXPForLevel(lvl);
        const nextFloor = lvl < 50 ? getXPForLevel(lvl + 1) : currFloor;
        const pct = lvl >= 50 ? 100 : Math.min(100, Math.max(4, ((xp - currFloor) / (nextFloor - currFloor)) * 100));

        const nameEl = document.getElementById("welcomeHeading");
        if (nameEl) nameEl.textContent = localStorage.getItem("arcadehub_player_name") || "Player";

        const miniLvlEl = document.getElementById("hub-level-mini");
        if (miniLvlEl) miniLvlEl.textContent = `LVL ${lvl}`;

        const customizeNameDisplay = document.getElementById("customize-name-display");
        if (customizeNameDisplay) customizeNameDisplay.textContent = localStorage.getItem("arcadehub_player_name") || "Player";

        const titleEl = document.getElementById("hub-player-title");
        if (titleEl) titleEl.textContent = `LVL ${lvl} • ${title}`;

        const lvlLabel = document.getElementById("hub-level-label");
        if (lvlLabel) lvlLabel.textContent = lvl >= 50 ? "MAX LEVEL (50)" : `Level ${lvl} / 50`;

        const xpText = document.getElementById("hub-xp-text");
        if (xpText) xpText.textContent = lvl >= 50 ? `${xp.toLocaleString()} XP (MAX)` : `${xp.toLocaleString()} / ${nextFloor.toLocaleString()} XP`;

        const fill = document.getElementById("hub-xp-fill");
        if (fill) fill.style.width = `${pct}%`;

        const xpStatEl = document.getElementById("stat-total-xp");
        if (xpStatEl) xpStatEl.textContent = xp.toLocaleString();

        const equippedAvatar = localStorage.getItem("arcadehub_avatar") || "🕹️";
        const equippedBorder = localStorage.getItem("arcadehub_border") || "border-rookie";
        const avEl = document.getElementById("hub-avatar-icon");
        const frameEl = document.getElementById("hub-avatar-frame");
        if (avEl) avEl.textContent = equippedAvatar;
        if (frameEl) frameEl.className = `avatar-frame ${equippedBorder}`;
    }
};

function triggerLevelUpModal(levelText) {
    const titleEl = document.getElementById('level-up-title-text');
    if (titleEl) titleEl.innerText = levelText;

    const modal = document.getElementById('level-up-modal');
    if (modal) modal.style.display = 'flex';

    if (typeof audio !== 'undefined' && typeof audio.playSFX === 'function') {
        audio.playSFX('win');
    }
}

function closeLevelUpModal() {
    const modal = document.getElementById('level-up-modal');
    if (modal) modal.style.display = 'none';
}

const _origSaveScore = ScoreManager.saveScore.bind(ScoreManager);
ScoreManager.saveScore = function(gameKey, score) {
    const res = _origSaveScore(gameKey, score);
    ProgressionManager.awardGameXP(gameKey, score);
    return res;
};

// ===================================================
// GAME OF THE DAY (2X XP DATA POOL)
// ===================================================
const GOTD_POOL = [
    { key: "towerstack", id: "towerstack-container", name: "Tower Stack", icon: "🏗️", desc: "Stack blocks to the sky for 2X XP today!" },
    { key: "chess", id: "chess-container", name: "Chess Pro", icon: "♟️", desc: "Checkmate opponents in Chess Pro for 2X XP!" },
    { key: "dama", id: "dama-container", name: "Pinoy Dama", icon: "🔴", desc: "Crown your pieces in Pinoy Dama for 2X XP!" },
    { key: "airhockey", id: "airhockey-container", name: "Air Hockey", icon: "🏒", desc: "Score 7 goals on the neon rink for 2X XP!" },
    { key: "pianotiles", id: "piano-container", name: "Piano Tiles", icon: "🎹", desc: "Hit every rhythm tile for 2X XP!" }
];

function getGameOfTheDay() {
    const dayIndex = Math.floor(Date.now() / 86400000);
    return GOTD_POOL[dayIndex % GOTD_POOL.length];
}

// ===================================================
// RANDOM DAILY CHALLENGES & LOGIN STREAK
// ===================================================
const CHALLENGE_TEMPLATES = [
    { id: "c_stack", gameKey: "towerstack", text: "Stack 15+ blocks in Tower Stack", target: 15, type: "score", rewardXP: 350, unlockBorder: "border-daily-champ" },
    { id: "c_chess", gameKey: "chess", text: "Win 1 match of Chess Pro", target: 1, type: "play", rewardXP: 400, unlockBorder: "border-daily-champ" },
    { id: "c_dama", gameKey: "dama", text: "Win 1 match of Pinoy Dama", target: 1, type: "play", rewardXP: 350, unlockBorder: null },
    { id: "c_hockey", gameKey: "airhockey", text: "Win an Air Hockey match", target: 1, type: "play", rewardXP: 350, unlockBorder: null },
    { id: "c_any3", gameKey: "ANY", text: "Play any 3 arcade games today", target: 3, type: "play", rewardXP: 250, unlockBorder: null }
];

const DailyChallengeManager = {
    init() {
        const today = new Date().toDateString();
        const lastLogin = localStorage.getItem("arcadehub_last_login");
        let streak = parseInt(localStorage.getItem("arcadehub_streak") || "0", 10);

        if (lastLogin !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            streak = (lastLogin === yesterday) ? streak + 1 : 1;
            localStorage.setItem("arcadehub_streak", streak);
            localStorage.setItem("arcadehub_last_login", today);

            const shuffled = [...CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 3);
            const dailyData = shuffled.map(c => ({ ...c, progress: 0, done: false }));
            localStorage.setItem("arcadehub_daily_quests", JSON.stringify(dailyData));
        }
        this.render();
    },
    trackProgress(gameKey, score) {
        let quests = JSON.parse(localStorage.getItem("arcadehub_daily_quests") || "[]");
        let updated = false;
        quests.forEach(q => {
            if (q.done) return;
            if (q.gameKey === "ANY" || q.gameKey === gameKey) {
                if (q.type === "play") q.progress += 1;
                if (q.type === "score" && score >= q.target) q.progress = q.target;
                if (q.progress >= q.target) {
                    q.done = true;
                    updated = true;
                    ProgressionManager.addXP(q.rewardXP);
                    if (q.unlockBorder) {
                        localStorage.setItem("arcadehub_unlocked_special_border", "true");
                    }
                }
            }
        });
        localStorage.setItem("arcadehub_daily_quests", JSON.stringify(quests));
        if (updated) audio.playSFX('win');
        this.render();
    },
    render() {
        const listModal = document.getElementById("modal-daily-challenges-list");
        let streak = localStorage.getItem("arcadehub_streak") || "1";

        const quests = JSON.parse(localStorage.getItem("arcadehub_daily_quests") || "[]");
        const html = quests.map(q => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(17,24,39,0.85); border: 1px solid var(--border); padding: 8px 10px; border-radius: 8px;">
                <div>
                    <div style="font-size:11px; font-weight:700; color:#fff;">${q.done ? '✅' : '🎯'} ${q.text}</div>
                    <div style="font-size:9px; color:var(--text-muted);">Progress: ${Math.min(q.progress, q.target)}/${q.target}</div>
                </div>
                <span style="font-size: 10px; font-weight: 800; color: #facc15;">${q.done ? 'CLAIMED' : `+${q.rewardXP} XP${q.unlockBorder ? ' + Border' : ''}`}</span>
            </div>
        `).join('');

        if (listModal) listModal.innerHTML = html;
        const modalStreakPill = document.getElementById("modal-hub-streak-pill");
        if (modalStreakPill) modalStreakPill.textContent = `🔥 ${streak} Day Streak`;
    }
};

// ===================================================
// WELCOME DAILY REWARDS POPUP MODAL & ENTRY TRIGGERS
// ===================================================
function openWelcomeDailyModal() {
    audio.playSFX('click');
    
    const gotd = getGameOfTheDay();
    const iconEl = document.getElementById("modal-gotd-icon");
    const titleEl = document.getElementById("modal-gotd-title");
    const descEl = document.getElementById("modal-gotd-desc");
    const playBtn = document.getElementById("modal-gotd-play-btn");

    if (iconEl) iconEl.textContent = gotd.icon;
    if (titleEl) titleEl.textContent = gotd.name;
    if (descEl) descEl.textContent = gotd.desc;
    if (playBtn) {
        playBtn.onclick = () => {
            closeWelcomeDailyModal();
            const inst = gameInstructionsMap[gotd.id] || { objective: gotd.desc, controls: "Tap controls to play." };
            showGameInstructions(gotd.id, gotd.name, gotd.icon, inst);
        };
    }

    DailyChallengeManager.render();
    LuckySpinManager.updateUIState();

    document.getElementById('welcome-daily-modal').classList.add('active');
}

function closeWelcomeDailyModal() {
    audio.playSFX('click');
    document.getElementById('welcome-daily-modal').classList.remove('active');
}

function openCustomizeModal() {
    audio.playSFX('click');
    const lvl = getLevelFromXP(ProgressionManager.getXP());
    const currAvatar = localStorage.getItem("arcadehub_avatar") || "🕹️";
    const currBorder = localStorage.getItem("arcadehub_border") || "border-rookie";
    const hasSpecial = localStorage.getItem("arcadehub_unlocked_special_border") === "true";

    const avGrid = document.getElementById("avatar-unlock-grid");
    avGrid.innerHTML = AVATAR_UNLOCKS.map(a => {
        const unlocked = lvl >= a.level;
        return `<div class="unlock-slot ${unlocked ? '' : 'locked'} ${currAvatar === a.icon ? 'selected' : ''}"
            onclick="${unlocked ? `equipAvatar('${a.icon}')` : ''}">
            <div>${a.icon}</div>
            <div style="font-size:9px; color:var(--text-muted); margin-top:2px;">${unlocked ? a.name : `Lv.${a.level}`}</div>
        </div>`;
    }).join('');

    const bGrid = document.getElementById("border-unlock-grid");
    bGrid.innerHTML = BORDER_UNLOCKS.map(b => {
        const unlocked = b.special ? hasSpecial : (lvl >= b.level);
        return `<div class="unlock-slot ${unlocked ? '' : 'locked'} ${currBorder === b.id ? 'selected' : ''}"
            onclick="${unlocked ? `equipBorder('${b.id}')` : ''}">
            <div class="avatar-frame ${b.id}" style="width:32px; height:32px; margin:0 auto; font-size:14px;">✨</div>
            <div style="font-size:9px; color:var(--text-muted); margin-top:4px;">${unlocked ? b.name : (b.special ? 'Quest' : `Lv.${b.level}`)}</div>
        </div>`;
    }).join('');

    document.getElementById("customize-modal").classList.add("active");
}

function openDailyQuestsModal() {
    audio.playSFX('click');
    openWelcomeDailyModal();
}

function closeDailyQuestsModal() {
    audio.playSFX('click');
    document.getElementById('daily-quests-modal').classList.remove('active');
}

function closeCustomizeModal() {
    audio.playSFX('click');
    document.getElementById("customize-modal").classList.remove("active");
}

function equipAvatar(icon) {
    audio.playSFX('score');
    localStorage.setItem("arcadehub_avatar", icon);
    ProgressionManager.updateUI();
    openCustomizeModal();
}

function equipBorder(borderId) {
    audio.playSFX('score');
    localStorage.setItem("arcadehub_border", borderId);
    ProgressionManager.updateUI();
    openCustomizeModal();
}

const _origSaveCustomNameAndEnter = saveCustomNameAndEnter;
saveCustomNameAndEnter = function() {
    const success = _origSaveCustomNameAndEnter();
    if (success !== false) {
        ProgressionManager.updateUI();
        DailyChallengeManager.init();
        setTimeout(openWelcomeDailyModal, 400);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const bgm = document.getElementById('bgm');
    if (!bgm) return;

    bgm.loop = true;

    const enableAudio = () => {
        bgm.play().then(() => {
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
            document.removeEventListener('keydown', enableAudio);
        }).catch(err => {
            console.log("Waiting for valid user gesture...", err);
        });
    };

    document.addEventListener('click', enableAudio);
    document.addEventListener('touchstart', enableAudio);
    document.addEventListener('keydown', enableAudio);
});

// ===================================================
// PAGE VISIBILITY API (PAUSE/RESUME BGM ON APP SWITCH)
// ===================================================
document.addEventListener('visibilitychange', () => {
    const bgm = document.getElementById('bgm');
    if (!bgm) return;

    if (document.hidden) {
        bgm.pause();
    } else {
        if (typeof audio !== 'undefined' && !audio.isMuted) {
            bgm.play().catch(() => {});
        }
    }
});

// ===================================================
// NEON AIR HOCKEY (FULL VERSION ENGINE WITH PVP)
// ===================================================
let ahCanvas, ahCtx, ahRunning = false, ahAnimId;
let ahPlayerScore = 0, ahAiScore = 0;
let ahPuck = { x: 140, y: 200, vx: 3, vy: 4, r: 12 };
let ahPlayer = { x: 140, y: 340, r: 22 };
let ahAi = { x: 140, y: 60, r: 22 };
let ahGameMode = 'ai';
let ahP2Keys = { up: false, down: false, left: false, right: false };

function setAhMode(mode) {
    if (typeof audio !== 'undefined') audio.playSFX('move');
    ahGameMode = mode;
    const btnAi = document.getElementById('ah-mode-ai');
    const btnPvp = document.getElementById('ah-mode-pvp');
    if (btnAi) btnAi.classList.toggle('active', mode === 'ai');
    if (btnPvp) btnPvp.classList.toggle('active', mode === 'pvp');
    
    const p2Label = document.getElementById('ah-p2-label');
    if (p2Label) p2Label.textContent = mode === 'pvp' ? 'PLAYER 2' : 'AI OPPONENT';
    
    startAirHockeyGame();
}

function initAirHockeyCanvas() {
    ahCanvas = document.getElementById('ah-canvas');
    if (!ahCanvas) return;
    ahCtx = ahCanvas.getContext('2d');

    const handleMove = (clientX, clientY) => {
        if (!ahRunning || isGamePaused) return;
        const rect = ahCanvas.getBoundingClientRect();
        const cx = (clientX - rect.left) * (ahCanvas.width / rect.width);
        const cy = (clientY - rect.top) * (ahCanvas.height / rect.height);
        
        ahPlayer.x = Math.max(ahPlayer.r, Math.min(280 - ahPlayer.r, cx));
        ahPlayer.y = Math.max(200 + ahPlayer.r, Math.min(400 - ahPlayer.r, cy));
    };

    const handleTouchMove = (e) => {
        if (!ahRunning || isGamePaused) return;
        const rect = ahCanvas.getBoundingClientRect();
        
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const cx = (touch.clientX - rect.left) * (ahCanvas.width / rect.width);
            const cy = (touch.clientY - rect.top) * (ahCanvas.height / rect.height);

            if (cy < 200 && ahGameMode === 'pvp') {
                ahAi.x = Math.max(ahAi.r, Math.min(280 - ahAi.r, cx));
                ahAi.y = Math.max(ahAi.r, Math.min(200 - ahAi.r, cy));
            } else if (cy >= 200) {
                ahPlayer.x = Math.max(ahPlayer.r, Math.min(280 - ahPlayer.r, cx));
                ahPlayer.y = Math.max(200 + ahPlayer.r, Math.min(400 - ahPlayer.r, cy));
            }
        }
        e.preventDefault();
    };

    ahCanvas.onmousemove = e => handleMove(e.clientX, e.clientY);
    ahCanvas.ontouchmove = handleTouchMove;
    ahCanvas.ontouchstart = handleTouchMove;
}

window.addEventListener('keydown', e => {
    if (!document.getElementById('airhockey-container')?.classList.contains('active') || isGamePaused) return;
    if (ahGameMode === 'pvp') {
        if (e.code === 'ArrowUp') { ahP2Keys.up = true; e.preventDefault(); }
        if (e.code === 'ArrowDown') { ahP2Keys.down = true; e.preventDefault(); }
        if (e.code === 'ArrowLeft') { ahP2Keys.left = true; e.preventDefault(); }
        if (e.code === 'ArrowRight') { ahP2Keys.right = true; e.preventDefault(); }
    }
});

window.addEventListener('keyup', e => {
    if (ahGameMode === 'pvp') {
        if (e.code === 'ArrowUp') ahP2Keys.up = false;
        if (e.code === 'ArrowDown') ahP2Keys.down = false;
        if (e.code === 'ArrowLeft') ahP2Keys.left = false;
        if (e.code === 'ArrowRight') ahP2Keys.right = false;
    }
});

function startAirHockeyGame() {
    audio.playSFX('click');
    const gameOverOverlay = document.getElementById('ah-gameover-overlay');
    if (gameOverOverlay) gameOverOverlay.style.display = 'none';
    
    initAirHockeyCanvas();
    if (!ahCtx) return;
    cancelAnimationFrame(ahAnimId);

    ahPlayerScore = 0;
    ahAiScore = 0;
    ahRunning = true;
    
    const p1ScoreEl = document.getElementById('ah-player-score');
    const p2ScoreEl = document.getElementById('ah-ai-score');
    if (p1ScoreEl) p1ScoreEl.textContent = 0;
    if (p2ScoreEl) p2ScoreEl.textContent = 0;
    
    resetAhPuck(1);
    ahLoop();
}

function resetAhPuck(dirY) {
    ahPuck = { x: 140, y: 200, vx: (Math.random() - 0.5) * 5, vy: 4.2 * dirY, r: 12 };
}

function resolveMalletCollision(mallet) {
    const dx = ahPuck.x - mallet.x;
    const dy = ahPuck.y - mallet.y;
    const dist = Math.hypot(dx, dy);
    const minDist = ahPuck.r + mallet.r;
    if (dist < minDist && dist > 0) {
        audio.playSFX('click');
        const nx = dx / dist;
        const ny = dy / dist;
        ahPuck.x = mallet.x + nx * (minDist + 1);
        ahPuck.y = mallet.y + ny * (minDist + 1);
        const speed = Math.min(10.5, Math.hypot(ahPuck.vx, ahPuck.vy) + 0.8);
        ahPuck.vx = nx * speed;
        ahPuck.vy = ny * speed;
    }
}

function ahLoop() {
    if (!ahRunning) return;
    if (isGamePaused) {
        ahAnimId = requestAnimationFrame(ahLoop);
        return;
    }

    if (ahGameMode === 'pvp') {
        const p2Speed = 5.5;
        if (ahP2Keys.up) ahAi.y = Math.max(ahAi.r, ahAi.y - p2Speed);
        if (ahP2Keys.down) ahAi.y = Math.min(200 - ahAi.r, ahAi.y + p2Speed);
        if (ahP2Keys.left) ahAi.x = Math.max(ahAi.r, ahAi.x - p2Speed);
        if (ahP2Keys.right) ahAi.x = Math.min(280 - ahAi.r, ahAi.x + p2Speed);
    } else {
        const targetX = ahPuck.y < 210 ? ahPuck.x : 140;
        const targetY = ahPuck.y < 180 ? Math.max(35, ahPuck.y - 10) : 60;
        ahAi.x += Math.sign(targetX - ahAi.x) * Math.min(4.2, Math.abs(targetX - ahAi.x));
        ahAi.y += Math.sign(targetY - ahAi.y) * Math.min(3.5, Math.abs(targetY - ahAi.y));
    }

    ahPuck.x += ahPuck.vx;
    ahPuck.y += ahPuck.vy;
    ahPuck.vx *= 0.996;
    ahPuck.vy *= 0.996;

    if (ahPuck.x - ahPuck.r < 0) { ahPuck.x = ahPuck.r; ahPuck.vx *= -1; audio.playSFX('move'); }
    if (ahPuck.x + ahPuck.r > 280) { ahPuck.x = 280 - ahPuck.r; ahPuck.vx *= -1; audio.playSFX('move'); }

    const inGoalX = ahPuck.x > 90 && ahPuck.x < 190;
    if (ahPuck.y - ahPuck.r < 0) {
        if (inGoalX) {
            ahPlayerScore++;
            const p1ScoreEl = document.getElementById('ah-player-score');
            if (p1ScoreEl) p1ScoreEl.textContent = ahPlayerScore;
            audio.playSFX('score');
            if (ahPlayerScore >= 7) return endAirHockey(true, 'P1');
            resetAhPuck(-1);
        } else {
            ahPuck.y = ahPuck.r;
            ahPuck.vy *= -1;
        }
    }
    if (ahPuck.y + ahPuck.r > 400) {
        if (inGoalX) {
            ahAiScore++;
            const p2ScoreEl = document.getElementById('ah-ai-score');
            if (p2ScoreEl) p2ScoreEl.textContent = ahAiScore;
            audio.playSFX('gameover');
            if (ahAiScore >= 7) return endAirHockey(false, ahGameMode === 'pvp' ? 'P2' : 'AI');
            resetAhPuck(1);
        } else {
            ahPuck.y = 400 - ahPuck.r;
            ahPuck.vy *= -1;
        }
    }

    resolveMalletCollision(ahPlayer);
    resolveMalletCollision(ahAi);

    ahCtx.fillStyle = '#090d16';
    ahCtx.fillRect(0, 0, 280, 400);

    ahCtx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ahCtx.lineWidth = 2;
    ahCtx.beginPath(); ahCtx.moveTo(0, 200); ahCtx.lineTo(280, 200); ahCtx.stroke();
    ahCtx.beginPath(); ahCtx.arc(140, 200, 42, 0, Math.PI * 2); ahCtx.stroke();

    ahCtx.fillStyle = '#ef4444'; ahCtx.fillRect(90, 0, 100, 5);
    ahCtx.fillStyle = '#38bdf8'; ahCtx.fillRect(90, 395, 100, 5);

    ahCtx.fillStyle = '#ef4444';
    ahCtx.beginPath(); ahCtx.arc(ahAi.x, ahAi.y, ahAi.r, 0, Math.PI * 2); ahCtx.fill();
    ahCtx.strokeStyle = '#fff'; ahCtx.lineWidth = 2; ahCtx.stroke();

    ahCtx.fillStyle = '#38bdf8';
    ahCtx.beginPath(); ahCtx.arc(ahPlayer.x, ahPlayer.y, ahPlayer.r, 0, Math.PI * 2); ahCtx.fill();
    ahCtx.strokeStyle = '#fff'; ahCtx.lineWidth = 2; ahCtx.stroke();

    ahCtx.shadowColor = '#facc15';
    ahCtx.shadowBlur = 12;
    ahCtx.fillStyle = '#facc15';
    ahCtx.beginPath(); ahCtx.arc(ahPuck.x, ahPuck.y, ahPuck.r, 0, Math.PI * 2); ahCtx.fill();
    ahCtx.shadowBlur = 0;

    ahAnimId = requestAnimationFrame(ahLoop);
}

function endAirHockey(playerWon, winnerName) {
    ahRunning = false;
    const titleEl = document.getElementById('ah-final-title');
    const msgEl = document.getElementById('ah-final-msg');
    const overlay = document.getElementById('ah-gameover-overlay');

    if (titleEl) {
        if (ahGameMode === 'pvp') {
            titleEl.textContent = `${winnerName === 'P1' ? 'PLAYER 1' : 'PLAYER 2'} WINS MATCH! 🏆`;
        } else {
            titleEl.textContent = playerWon ? "CHAMPIONSHIP WIN! 🏆" : "AI WINS MATCH! 🤖";
        }
    }
    if (msgEl) msgEl.textContent = `Final Score: ${ahPlayerScore} - ${ahAiScore}`;
    if (overlay) overlay.style.display = 'flex';
    
    if (playerWon || ahGameMode === 'pvp') {
        audio.playSFX('win');
        ScoreManager.saveScore('airhockey', ahPlayerScore * 25);
        if (typeof submitScore === 'function') submitScore('Air Hockey', 'Player', ahPlayerScore * 25);
    }
}


// ===================================================
// CHESS PRO ENGINE (VS AI & 2P LOCAL)
// ===================================================
let chessCanvas, chessCtx, chessGame = null, chessMode = 'ai';
let chessSelectedSquare = null;

function setChessMode(mode) {
    if (typeof audio !== 'undefined') audio.playSFX('move');
    chessMode = mode;
    document.getElementById('chess-mode-ai').classList.toggle('active', mode === 'ai');
    document.getElementById('chess-mode-pvp').classList.toggle('active', mode === 'pvp');
    startChessGame();
}

function startChessGame() {
    if (typeof audio !== 'undefined') audio.playSFX('click');
    chessCanvas = document.getElementById('chess-canvas');
    if (!chessCanvas) return;
    chessCtx = chessCanvas.getContext('2d');
    
    chessGame = {
        board: [
            ['r','n','b','q','k','b','n','r'],
            ['p','p','p','p','p','p','p','p'],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            ['P','P','P','P','P','P','P','P'],
            ['R','N','B','Q','K','B','N','R']
        ],
        turn: 'w',
        selected: null
    };

    chessCanvas.onclick = (e) => {
        const rect = chessCanvas.getBoundingClientRect();
        const x = Math.floor(((e.clientX - rect.left) / rect.width) * 8);
        const y = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
        handleChessClick(x, y);
    };

    renderChessBoard();
}

function handleChessClick(x, y) {
    if (chessMode === 'ai' && chessGame.turn === 'b') return;

    if (!chessGame.selected) {
        const piece = chessGame.board[y][x];
        if (piece && ((chessGame.turn === 'w' && piece === piece.toUpperCase()) || (chessGame.turn === 'b' && piece === piece.toLowerCase()))) {
            chessGame.selected = {x, y};
            if (typeof audio !== 'undefined') audio.playSFX('click');
            renderChessBoard();
        }
    } else {
        const sx = chessGame.selected.x;
        const sy = chessGame.selected.y;
        chessGame.board[y][x] = chessGame.board[sy][sx];
        chessGame.board[sy][sx] = null;
        chessGame.selected = null;
        chessGame.turn = chessGame.turn === 'w' ? 'b' : 'w';
        if (typeof audio !== 'undefined') audio.playSFX('move');
        renderChessBoard();

        if (chessMode === 'ai' && chessGame.turn === 'b') {
            setTimeout(chessAiMove, 500);
        }
    }
}

function chessAiMove() {
    let blackPieces = [];
    for (let r=0; r<8; r++) {
        for (let c=0; c<8; c++) {
            if (chessGame.board[r][c] && chessGame.board[r][c] === chessGame.board[r][c].toLowerCase()) {
                blackPieces.push({x: c, y: r});
            }
        }
    }
    if (blackPieces.length > 0) {
        let p = blackPieces[Math.floor(Math.random() * blackPieces.length)];
        let targetY = Math.min(7, p.y + 1);
        chessGame.board[targetY][p.x] = chessGame.board[p.y][p.x];
        chessGame.board[p.y][p.x] = null;
        chessGame.turn = 'w';
        if (typeof audio !== 'undefined') audio.playSFX('move');
        renderChessBoard();
    }
}

function renderChessBoard() {
    const symbols = { 'r':'♜','n':'♞','b':'♝','q':'♛','k':'♚','p':'♟','R':'♖','N':'♘','B':'♗','Q':'♕','K':'♔','P':'♙' };
    const sqSize = 40;
    chessCtx.clearRect(0, 0, 320, 320);

    for (let r=0; r<8; r++) {
        for (let c=0; c<8; c++) {
            chessCtx.fillStyle = (r + c) % 2 === 0 ? '#1e293b' : '#0f172a';
            chessCtx.fillRect(c * sqSize, r * sqSize, sqSize, sqSize);

            if (chessGame.selected && chessGame.selected.x === c && chessGame.selected.y === r) {
                chessCtx.fillStyle = 'rgba(56, 189, 248, 0.4)';
                chessCtx.fillRect(c * sqSize, r * sqSize, sqSize, sqSize);
            }

            const piece = chessGame.board[r][c];
            if (piece) {
                chessCtx.fillStyle = piece === piece.toUpperCase() ? '#f8fafc' : '#cbd5e1';
                chessCtx.font = '28px sans-serif';
                chessCtx.textAlign = 'center';
                chessCtx.textBaseline = 'middle';
                chessCtx.fillText(symbols[piece] || '', c * sqSize + sqSize/2, r * sqSize + sqSize/2);
            }
        }
    }
    document.getElementById('chess-turn-indicator').textContent = chessGame.turn === 'w' ? "White's Turn" : (chessMode === 'ai' ? "AI's Turn..." : "Black's Turn");
}


// ===================================================
// PINOY DAMA ENGINE (CAPTURES + HARD AI)
// ===================================================
let damaCanvas, damaCtx, damaGame = null, damaMode = 'ai', damaDiff = 'hard';
let damaCaptured = { w: 0, b: 0 };

function setDamaMode(mode) {
    if (typeof audio !== 'undefined') audio.playSFX('move');
    damaMode = mode;
    document.getElementById('dama-mode-ai').classList.toggle('active', mode === 'ai');
    document.getElementById('dama-mode-pvp').classList.toggle('active', mode === 'pvp');
    document.getElementById('dama-diff-box').style.display = mode === 'ai' ? 'flex' : 'none';
    startDamaGame();
}

function setDamaDifficulty(diff) {
    if (typeof audio !== 'undefined') audio.playSFX('click');
    damaDiff = diff;
    document.getElementById('dama-diff-easy').classList.toggle('active', diff === 'easy');
    document.getElementById('dama-diff-hard').classList.toggle('active', diff === 'hard');
}

function startDamaGame() {
    if (typeof audio !== 'undefined') audio.playSFX('click');
    damaCanvas = document.getElementById('dama-canvas');
    if (!damaCanvas) return;
    damaCtx = damaCanvas.getContext('2d');

    let board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 === 1) board[r][c] = 'b';
        }
    }
    for (let r = 5; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 === 1) board[r][c] = 'w';
        }
    }

    damaCaptured = { w: 0, b: 0 };
    damaGame = { board, turn: 'w', selected: null };

    damaCanvas.onclick = (e) => {
        const rect = damaCanvas.getBoundingClientRect();
        const x = Math.floor(((e.clientX - rect.left) / rect.width) * 8);
        const y = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
        handleDamaClick(x, y);
    };

    renderDamaBoard();
}

function handleDamaClick(x, y) {
    if (damaMode === 'ai' && damaGame.turn === 'b') return;

    if (!damaGame.selected) {
        if (damaGame.board[y][x] === damaGame.turn) {
            damaGame.selected = {x, y};
            if (typeof audio !== 'undefined') audio.playSFX('click');
            renderDamaBoard();
        }
    } else {
        const sx = damaGame.selected.x;
        const sy = damaGame.selected.y;
        const dx = x - sx;
        const dy = y - sy;
        
        if (damaGame.board[y][x] === null) {
            if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
                damaGame.board[y][x] = damaGame.board[sy][sx];
                damaGame.board[sy][sx] = null;
                finalizeDamaTurn();
            } else if (Math.abs(dx) === 2 && Math.abs(dy) === 2) {
                const mx = sx + dx / 2;
                const my = sy + dy / 2;
                const middlePiece = damaGame.board[my][mx];
                
                if (middlePiece && middlePiece !== damaGame.turn) {
                    damaGame.board[my][mx] = null;
                    damaGame.board[y][x] = damaGame.board[sy][sx];
                    damaGame.board[sy][sx] = null;
                    
                    if (damaGame.turn === 'w') damaCaptured.w++;
                    else damaCaptured.b++;

                    if (typeof audio !== 'undefined') audio.playSFX('powerup');
                    finalizeDamaTurn();
                } else {
                    damaGame.selected = null;
                    renderDamaBoard();
                }
            } else {
                damaGame.selected = null;
                renderDamaBoard();
            }
        } else {
            damaGame.selected = null;
            renderDamaBoard();
        }
    }
}

function finalizeDamaTurn() {
    damaGame.selected = null;
    damaGame.turn = damaGame.turn === 'w' ? 'b' : 'w';
    renderDamaBoard();

    if (damaMode === 'ai' && damaGame.turn === 'b') {
        setTimeout(damaAiMove, 600);
    }
}

function damaAiMove() {
    let blackPieces = [];
    let possibleJumps = [];
    let possibleSteps = [];

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (damaGame.board[r][c] === 'b') {
                blackPieces.push({x: c, y: r});
                
                const directions = [{dx: -1, dy: 1}, {dx: 1, dy: 1}, {dx: -2, dy: 2}, {dx: 2, dy: 2}, {dx: -2, dy: -2}, {dx: 2, dy: -2}, {dx: -1, dy: -1}, {dx: 1, dy: -1}];
                
                directions.forEach(d => {
                    const nx = c + d.dx;
                    const ny = r + d.dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8 && damaGame.board[ny][nx] === null) {
                        if (Math.abs(d.dx) === 2) {
                            const mx = c + d.dx / 2;
                            const my = r + d.dy / 2;
                            if (damaGame.board[my][mx] === 'w') {
                                possibleJumps.push({from: {x: c, y: r}, to: {x: nx, y: ny}, middle: {x: mx, y: my}});
                            }
                        } else if (damaDiff === 'hard') {
                            possibleSteps.push({from: {x: c, y: r}, to: {x: nx, y: ny}});
                        }
                    }
                });
            }
        }
    }

    if (possibleJumps.length > 0) {
        let move = possibleJumps[Math.floor(Math.random() * possibleJumps.length)];
        damaGame.board[move.middle.y][move.middle.x] = null;
        damaGame.board[move.to.y][move.to.x] = 'b';
        damaGame.board[move.from.y][move.from.x] = null;
        damaCaptured.b++;
        if (typeof audio !== 'undefined') audio.playSFX('powerup');
    } else if (possibleSteps.length > 0 && damaDiff === 'hard') {
        possibleSteps.sort((a, b) => b.to.y - a.to.y);
        let move = possibleSteps[0];
        damaGame.board[move.to.y][move.to.x] = damaGame.board[move.from.y][move.from.x];
        damaGame.board[move.from.y][move.from.x] = null;
        if (typeof audio !== 'undefined') audio.playSFX('move');
    } else if (blackPieces.length > 0) {
        let p = blackPieces[Math.floor(Math.random() * blackPieces.length)];
        let targetY = Math.min(7, p.y + 1);
        let targetX = p.x + (Math.random() > 0.5 ? 1 : -1);
        targetX = Math.max(0, Math.min(7, targetX));

        if (damaGame.board[targetY][targetX] === null) {
            damaGame.board[targetY][targetX] = 'b';
            damaGame.board[p.y][p.x] = null;
        }
        if (typeof audio !== 'undefined') audio.playSFX('move');
    }

    damaGame.turn = 'w';
    renderDamaBoard();
}

function renderDamaBoard() {
    const sqSize = 40;
    damaCtx.clearRect(0, 0, 320, 320);

    for (let r=0; r<8; r++) {
        for (let c=0; c<8; c++) {
            damaCtx.fillStyle = (r + c) % 2 === 0 ? '#334155' : '#0f172a';
            damaCtx.fillRect(c * sqSize, r * sqSize, sqSize, sqSize);

            if (damaGame.selected && damaGame.selected.x === c && damaGame.selected.y === r) {
                damaCtx.fillStyle = 'rgba(250, 204, 21, 0.4)';
                damaCtx.fillRect(c * sqSize, r * sqSize, sqSize, sqSize);
            }

            const piece = damaGame.board[r][c];
            if (piece) {
                damaCtx.fillStyle = piece === 'w' ? '#f8fafc' : '#ef4444';
                damaCtx.beginPath();
                damaCtx.arc(c * sqSize + sqSize/2, r * sqSize + sqSize/2, 14, 0, Math.PI * 2);
                damaCtx.fill();
                damaCtx.strokeStyle = '#000';
                damaCtx.lineWidth = 2;
                damaCtx.stroke();
            }
        }
    }

    document.getElementById('dama-white-captured').textContent = damaCaptured.w;
    document.getElementById('dama-black-captured').textContent = damaCaptured.b;
    document.getElementById('dama-turn-indicator').textContent = damaGame.turn === 'w' ? "White's Turn" : (damaMode === 'ai' ? "AI's Turn..." : "Black's Turn");
}
