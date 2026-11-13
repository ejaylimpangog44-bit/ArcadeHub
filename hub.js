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
// SCORE MANAGER & HUB STATS
// ===================================================
const ScoreManager = {
    getStats(gameKey) {
        const data = localStorage.getItem(`arcadehub_${gameKey}`);
        return data ? JSON.parse(data) : { highScore: 0, gamesPlayed: 0 };
    },
    saveScore(gameKey, score) {
        const stats = this.getStats(gameKey);
        stats.gamesPlayed += 1;
        if (score > stats.highScore) stats.highScore = score;
        localStorage.setItem(`arcadehub_${gameKey}`, JSON.stringify(stats));
        updateHubActivityStats();
        return stats;
    }
};

function updateHubActivityStats() {
    const allGameKeys = ['snake', 'towerstack', 'uno', 'airhockey', 'mole', 'dino', 'carracing', 'brickbreaker', 'pianotiles', 'fruitslasher', 'sr', 'solitaire', 'scatter', 'blackjack', 'highlow', 'tictactoe', 'guess', 'wordscape'];
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
        { key: 'uno', name: 'UNO Battle', icon: '🌈' },
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
        return;
    }

    if (checkInappropriate(inputVal)) {
        errorEl.textContent = "This name contains inappropriate words. Please choose another.";
        errorEl.style.display = 'block';
        return;
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
    'stickman-container': { objective: "Clear obstacles in this high-speed endless runner.", controls: "Press Space/Up Arrow to Jump/Double Jump, Down Arrow to Slide." }
};

// ===================================================
// AUDIO MANAGER & SETTINGS DRAWER
// ===================================================
class ArcadeAudioManager {
    constructor() { this.audioCtx = null; this.isMuted = false; this.volume = 0.4; }
    initContext() {
        if (!this.audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; this.audioCtx = new AC(); }
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    }
    playTone(freq, duration = 0.1, type='triangle') {
        if (this.isMuted) return;
        this.initContext();
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        osc.type = type; osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(this.volume * 0.25, now);
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
        switch (type) {
            case 'click': osc.type='square'; osc.frequency.setValueAtTime(400,now); gain.gain.setValueAtTime(this.volume*.15,now); gain.gain.exponentialRampToValueAtTime(.001,now+.04); osc.start(now); osc.stop(now+.04); break;
            case 'move': osc.type='triangle'; osc.frequency.setValueAtTime(300,now); osc.frequency.exponentialRampToValueAtTime(500,now+.06); gain.gain.setValueAtTime(this.volume*.2,now); gain.gain.exponentialRampToValueAtTime(.001,now+.06); osc.start(now); osc.stop(now+.06); break;
            case 'score': osc.type='sine'; osc.frequency.setValueAtTime(587.33,now); osc.frequency.setValueAtTime(880,now+.08); gain.gain.setValueAtTime(this.volume*.3,now); gain.gain.exponentialRampToValueAtTime(.001,now+.2); osc.start(now); osc.stop(now+.2); break;
            case 'powerup': osc.type='sine'; osc.frequency.setValueAtTime(400,now); osc.frequency.exponentialRampToValueAtTime(1200,now+.2); gain.gain.setValueAtTime(this.volume*.3,now); gain.gain.exponentialRampToValueAtTime(.001,now+.25); osc.start(now); osc.stop(now+.25); break;
            case 'win': osc.type='triangle'; osc.frequency.setValueAtTime(523.25,now); osc.frequency.setValueAtTime(659.25,now+.1); osc.frequency.setValueAtTime(783.99,now+.2); osc.frequency.setValueAtTime(1046.50,now+.3); gain.gain.setValueAtTime(this.volume*.4,now); gain.gain.exponentialRampToValueAtTime(.001,now+.5); osc.start(now); osc.stop(now+.5); break;
            case 'gameover': osc.type='sawtooth'; osc.frequency.setValueAtTime(250,now); osc.frequency.exponentialRampToValueAtTime(70,now+.35); gain.gain.setValueAtTime(this.volume*.35,now); gain.gain.exponentialRampToValueAtTime(.001,now+.35); osc.start(now); osc.stop(now+.35); break;
        }
    }
}

const audio = new ArcadeAudioManager();

function toggleAudioSetting() {
    audio.isMuted = !audio.isMuted;
    const btn = document.getElementById('audio-toggle-switch');
    if (audio.isMuted) { btn.textContent = "MUTED"; btn.classList.remove('active'); }
    else { btn.textContent = "ENABLED"; btn.classList.add('active'); audio.playSFX('click'); }
}
function updateVolume(val) { audio.volume = parseFloat(val); audio.playSFX('click'); }
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
    const dCard = document.getElementById('daily-hub-card');
    if (dCard) dCard.style.display = 'block';
    const gBanner = document.getElementById('gotd-hero-banner');
    if (gBanner && sessionStorage.getItem('gotd_dismissed') !== 'true') gBanner.classList.add('visible');

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
};

function openGame(containerId) {
    document.querySelector('header').style.display = 'none';
    const pCard = document.getElementById('player-profile-card');
    if (pCard) pCard.style.display = 'none';
    const dCard = document.getElementById('daily-hub-card');
    if (dCard) dCard.style.display = 'none';
    const gBanner = document.getElementById('gotd-hero-banner');
    if (gBanner) gBanner.classList.remove('visible');
    
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
        if (containerId === 'uno-container') startUnoGame();
        if (containerId === 'airhockey-container') startAirHockeyGame();
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
            audio.playSFX('win');
            alert(`🎉 LEVEL UP! You reached Level ${newLvl}: ${LEVEL_TITLES[newLvl - 1]}!`);
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
}; // <--- FIXED: Added missing closing brace for ProgressionManager

const _origSaveScore = ScoreManager.saveScore.bind(ScoreManager);
ScoreManager.saveScore = function(gameKey, score) {
    const res = _origSaveScore(gameKey, score);
    ProgressionManager.awardGameXP(gameKey, score);
    return res;
};

// ===================================================
// GAME OF THE DAY (2X XP HERO BANNER)
// ===================================================
const GOTD_POOL = [
    { key: "towerstack", id: "towerstack-container", name: "Tower Stack", icon: "🏗️", desc: "Stack blocks to the sky for 2X XP today!" },
    { key: "snake", id: "snakegame-container", name: "Cyber Snake", icon: "🐍", desc: "Collect glowing orbs & power-ups for 2X XP!" },
    { key: "uno", id: "uno-container", name: "UNO Battle", icon: "🌈", desc: "Outsmart the AI in UNO for 2X XP!" },
    { key: "airhockey", id: "airhockey-container", name: "Air Hockey", icon: "🏒", desc: "Score 7 goals on the neon rink for 2X XP!" },
    { key: "pianotiles", id: "piano-container", name: "Piano Tiles", icon: "🎹", desc: "Hit every rhythm tile for 2X XP!" }
];

function getGameOfTheDay() {
    const dayIndex = Math.floor(Date.now() / 86400000);
    return GOTD_POOL[dayIndex % GOTD_POOL.length];
}

function showGotdBanner() {
    if (sessionStorage.getItem("gotd_dismissed") === "true") return;
    const gotd = getGameOfTheDay();
    const banner = document.getElementById("gotd-hero-banner");
    if (!banner) return;
    document.getElementById("gotd-icon").textContent = gotd.icon;
    document.getElementById("gotd-title").textContent = gotd.name;
    document.getElementById("gotd-desc").textContent = gotd.desc;
    document.getElementById("gotd-play-btn").onclick = () => {
        const inst = gameInstructionsMap[gotd.id] || { objective: gotd.desc, controls: "Tap controls to play." };
        showGameInstructions(gotd.id, gotd.name, gotd.icon, inst);
    };
    banner.classList.add("visible");
}

function closeGotdBanner() {
    audio.playSFX('click');
    sessionStorage.setItem("gotd_dismissed", "true");
    document.getElementById("gotd-hero-banner").classList.remove("visible");
}

// ===================================================
// RANDOM DAILY CHALLENGES & LOGIN STREAK
// ===================================================
const CHALLENGE_TEMPLATES = [
    { id: "c_stack", gameKey: "towerstack", text: "Stack 15+ blocks in Tower Stack", target: 15, type: "score", rewardXP: 350, unlockBorder: "border-daily-champ" },
    { id: "c_snake", gameKey: "snake", text: "Score 80+ in Cyber Snake", target: 80, type: "score", rewardXP: 300, unlockBorder: null },
    { id: "c_uno", gameKey: "uno", text: "Win 1 match of UNO Battle", target: 1, type: "play", rewardXP: 400, unlockBorder: "border-daily-champ" },
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

        const pill = document.getElementById("hub-streak-pill");
        if (pill) pill.textContent = `🔥 ${streak} Day Streak`;
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
        const list = document.getElementById("daily-challenges-list");
        const listModal = document.getElementById("daily-challenges-list-modal");
        const subtitle = document.getElementById("daily-card-subtitle");
        let streak = localStorage.getItem("arcadehub_streak") || "1";

        const quests = JSON.parse(localStorage.getItem("arcadehub_daily_quests") || "[]");
        const html = quests.map(q => `
            <div class="challenge-item ${q.done ? 'completed' : ''}" style="display: flex; justify-content: space-between; align-items: center; background: rgba(17,24,39,0.8); border: 1px solid var(--border); padding: 8px 12px; border-radius: 8px; margin-bottom: 6px;">
                <div>
                    <div style="font-size:12px; font-weight:700; color:#fff;">${q.done ? '✅' : '🎯'} ${q.text}</div>
                    <div style="font-size:10px; color:var(--text-muted);">Progress: ${Math.min(q.progress, q.target)}/${q.target}</div>
                </div>
                <span class="challenge-reward-tag" style="font-size: 10px; font-weight: 800; color: #facc15;">${q.done ? 'CLAIMED' : `+${q.rewardXP} XP${q.unlockBorder ? ' + Border' : ''}`}</span>
            </div>
        `).join('');

        if (list) list.innerHTML = html;
        if (listModal) listModal.innerHTML = html;
        if (subtitle) subtitle.textContent = `${streak} Day Streak • Tap to view active quests`;
        
        const modalStreakPill = document.getElementById("hub-streak-pill-modal");
        if (modalStreakPill) modalStreakPill.textContent = `🔥 ${streak} Day Streak`;
    }
}; // <--- FIXED: Added missing closing brace for DailyChallengeManager

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
    document.getElementById('daily-quests-modal').classList.add('active');
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
    _origSaveCustomNameAndEnter();
    ProgressionManager.updateUI();
    DailyChallengeManager.init();
    setTimeout(showGotdBanner, 350);
};

window.addEventListener("load", () => {
    ProgressionManager.updateUI();
    DailyChallengeManager.init();
});