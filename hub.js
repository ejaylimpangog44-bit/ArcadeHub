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
    const allGameKeys = ['snake', 'mole', 'dino', 'carracing', 'brickbreaker', 'pianotiles', 'fruitslasher', 'sr', 'solitaire', 'scatter', 'blackjack', 'highlow', 'tictactoe', 'guess', 'wordscape'];
    let totalPlayed = 0;
    let totalHighScoresSet = 0;

    allGameKeys.forEach(k => {
        const st = ScoreManager.getStats(k);
        totalPlayed += st.gamesPlayed;
        if(st.highScore > 0) totalHighScoresSet++;
    });

    document.getElementById('stat-games-played').textContent = totalPlayed;
    document.getElementById('stat-achievements').textContent = totalHighScoresSet;
    renderTrophiesPanel();
}

function renderTrophiesPanel() {
    const container = document.getElementById('trophies-list-container');
    if (!container) return;
    container.innerHTML = '';

    const games = [
        { key: 'snake', name: 'Snake Evolution', icon: '🐍' },
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
    document.querySelector('.welcome-banner').style.display = 'flex';

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
    document.querySelector('.welcome-banner').style.display = 'none';
    
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
    }, 50);
}

function generateQRCode() {
    const targetUrl = window.location.href || "https://arcadehubgames-july12.vercel.app/";
    document.getElementById('current-url-text').textContent = targetUrl;
    document.getElementById('qr-code-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(targetUrl)}`;
}

// ===================================================
// BACKGROUND MUSIC (BGM) MANAGER - FINAL FIX
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
    let bgm = document.getElementById("background-audio");

    if (!bgm) {
        bgm = document.createElement("audio");
        bgm.id = "background-audio";
        bgm.src = "Https://github.com/ejaylimpangog44-bit/ArcadeHub/releases/download/v1.0.0/bgm.mp3";
        bgm.loop = true;
        bgm.volume = 0.5;
        bgm.preload = "auto";
        document.body.appendChild(bgm);
    }

    // Restore previous playback position
    const savedTime = localStorage.getItem("bgm_current_time");
    if (savedTime) {
        bgm.currentTime = parseFloat(savedTime);
    }

    const startBGM = () => {
        if (bgm.paused) {
            bgm.play().then(() => {
                console.log("BGM started successfully.");
            }).catch(err => {
                console.log("BGM play prevented by browser policy:", err);
            });
        }
    };

    // Try playing immediately
    startBGM();

    // Unlock audio on the very first user tap, click, or key press anywhere
    const unlockAudio = () => {
        startBGM();
        document.removeEventListener("click", unlockAudio);
        document.removeEventListener("touchstart", unlockAudio);
        document.removeEventListener("keydown", unlockAudio);
    };

    document.addEventListener("click", unlockAudio);
    document.addEventListener("touchstart", unlockAudio);
    document.addEventListener("keydown", unlockAudio);

    // Save playback position continuously
    setInterval(() => {
        if (!bgm.paused) {
            localStorage.setItem("bgm_current_time", bgm.currentTime);
        }
    }, 1000);
});
