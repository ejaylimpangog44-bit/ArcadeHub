/**
 * ============================================================================
 * MYTHIC SURVIVORS (ARCADEHUB EDITION)
 * Separated Modular Script (mythic.js)
 * ============================================================================
 */

// --- WEB AUDIO SYNTHESIZER ---
class SoundFX {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    playTone(freq, type, duration, vol = 0.12, slideTo = null) {
        if (this.muted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            if (slideTo) {
                osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
            }
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }
    hit(isCrit = false) {
        if (isCrit) {
            this.playTone(320, 'sawtooth', 0.11, 0.14, 95);
        } else {
            this.playTone(170, 'triangle', 0.07, 0.09, 65);
        }
    }
    gem() {
        this.playTone(680 + Math.random() * 220, 'sine', 0.09, 0.07, 1180);
    }
    slash() {
        this.playTone(260, 'sine', 0.12, 0.08, 80);
    }
    levelUp() {
        if (this.muted || !this.ctx) return;
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((n, idx) => {
            setTimeout(() => this.playTone(n, 'triangle', 0.22, 0.14), idx * 65);
        });
    }
    playerHurt() {
        this.playTone(130, 'sawtooth', 0.18, 0.16, 48);
    }
}
const sfx = new SoundFX();

// --- ABILITY DEFINITIONS ---
const ABILITY_CATALOG = [
    {
        id: 'crimson_cleave',
        name: 'Crimson Cleave',
        theme: 'gold',
        maxStars: 5,
        iconSvg: `<svg viewBox="0 0 64 64" class="w-full h-full"><defs><radialGradient id="gCleave" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="100%" stop-color="#7f1d1d"/></radialGradient></defs><rect width="64" height="64" rx="10" fill="url(#gCleave)"/><path d="M14 48 C18 20, 46 14, 52 18 C44 26, 30 34, 22 50 Z" fill="#fca5a5" stroke="#450a0a" stroke-width="2.5"/><path d="M18 46 L48 16" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
        evolveFrom: '⚔️',
        evolveTo: '🩸',
        getDesc: (lvl) => {
            const dmg = 140 + lvl * 45;
            const area = 100 + lvl * 15;
            return `Slashes a wide crimson arc every <span class="text-[#5eff45] font-extrabold">1.2</span> secs, dealing <span class="text-[#ff5252] font-extrabold">${dmg}%</span> damage (${area}% size)`;
        }
    },
    {
        id: 'nightfall_flip',
        name: 'Nightfall Flip',
        theme: 'green',
        maxStars: 5,
        iconSvg: `<svg viewBox="0 0 64 64" class="w-full h-full"><defs><radialGradient id="gNight" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#22c55e"/><stop offset="100%" stop-color="#052e16"/></radialGradient></defs><rect width="64" height="64" rx="10" fill="url(#gNight)"/><circle cx="34" cy="24" r="9" fill="#111" stroke="#86efac" stroke-width="1.5"/><path d="M24 34 Q34 26 44 36 L38 46 L26 42 Z" fill="#18181b" stroke="#4ade80" stroke-width="1.5"/><polygon points="12,30 22,27 19,34" fill="#86efac"/><polygon points="10,40 21,37 18,44" fill="#4ade80"/><polygon points="16,49 26,44 24,52" fill="#bbf7d0"/></svg>`,
        evolveFrom: '🗡️',
        evolveTo: '☠️',
        getDesc: (lvl) => {
            const count = 4 + lvl * 2;
            const dmg = 140 + lvl * 40;
            return `Backflips and throws <span class="text-[#5eff45] font-extrabold">${count}</span> poison daggers every <span class="text-[#5eff45] font-extrabold">3.5</span> secs, dealing <span class="text-[#ff5252] font-extrabold">${dmg}%</span> damage`;
        }
    },
    {
        id: 'crit_chance',
        name: 'Crit Chance Buff',
        theme: 'gold',
        maxStars: 5,
        iconSvg: `<svg viewBox="0 0 64 64" class="w-full h-full"><defs><radialGradient id="gCrit" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#b45309"/></radialGradient></defs><rect width="64" height="64" rx="10" fill="url(#gCrit)"/><circle cx="32" cy="32" r="17" fill="none" stroke="#78350f" stroke-width="5"/><circle cx="32" cy="32" r="17" fill="none" stroke="#facc15" stroke-width="2.5"/><line x1="32" y1="8" x2="32" y2="56" stroke="#78350f" stroke-width="4"/><line x1="8" y1="32" x2="56" y2="32" stroke="#78350f" stroke-width="4"/><polygon points="32,19 35,29 45,32 35,35 32,45 29,35 19,32 29,29" fill="#fff"/></svg>`,
        evolveFrom: '🎯',
        evolveTo: '💥',
        getDesc: (lvl) => {
            const pct = (lvl + 1) * 15;
            return `Increases base critical chance by <span class="text-[#5eff45] font-extrabold">15%</span> (Total: <span class="text-[#ff5252] font-extrabold">${pct}%</span>, Max: 100)`;
        }
    },
    {
        id: 'reaper_spiral',
        name: 'Reaper Spiral',
        theme: 'gold',
        maxStars: 5,
        iconSvg: `<svg viewBox="0 0 64 64" class="w-full h-full"><defs><radialGradient id="gReap" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#4c1d95"/><stop offset="100%" stop-color="#090d16"/></radialGradient></defs><rect width="64" height="64" rx="10" fill="url(#gReap)"/><path d="M18 22 C30 10, 50 18, 46 34 C43 44, 28 46, 24 36" fill="none" stroke="#c084fc" stroke-width="4.5" stroke-linecap="round"/><path d="M46 42 C34 54, 14 46, 18 30 C21 20, 36 18, 40 28" fill="none" stroke="#a855f7" stroke-width="4" stroke-linecap="round"/></svg>`,
        evolveFrom: '🌙',
        evolveTo: '🌀',
        getDesc: (lvl) => {
            const scythes = 1 + lvl;
            const dmg = 100 + lvl * 25;
            return `Spawns <span class="text-[#5eff45] font-extrabold">${scythes}</span> spectral scythes every <span class="text-[#5eff45] font-extrabold">5</span> secs, spinning outward and dealing <span class="text-[#ff5252] font-extrabold">${dmg}%</span> damage`;
        }
    },
    {
        id: 'chain_lightning',
        name: 'Storm Arc',
        theme: 'green',
        maxStars: 5,
        iconSvg: `<svg viewBox="0 0 64 64" class="w-full h-full"><defs><radialGradient id="gStorm" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0c4a6e"/></radialGradient></defs><rect width="64" height="64" rx="10" fill="url(#gStorm)"/><polygon points="36,10 18,34 31,34 26,54 46,28 33,28" fill="#fef08a" stroke="#0369a1" stroke-width="2"/></svg>`,
        evolveFrom: '⚡',
        evolveTo: '🌩️',
        getDesc: (lvl) => {
            const bounces = 2 + lvl;
            const dmg = 130 + lvl * 35;
            return `Strikes nearby foes with lightning jumping <span class="text-[#5eff45] font-extrabold">${bounces}</span> times for <span class="text-[#ff5252] font-extrabold">${dmg}%</span> damage`;
        }
    },
    {
        id: 'magnet_vitality',
        name: 'Soul Magnet',
        theme: 'green',
        maxStars: 5,
        iconSvg: `<svg viewBox="0 0 64 64" class="w-full h-full"><defs><radialGradient id="gMag" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#064e3b"/></radialGradient></defs><rect width="64" height="64" rx="10" fill="url(#gMag)"/><path d="M20 18 V34 A12 12 0 0 0 44 34 V18" fill="none" stroke="#f43f5e" stroke-width="8" stroke-linecap="butt"/><rect x="16" y="14" width="8" height="7" fill="#e2e8f0"/><rect x="40" y="14" width="8" height="7" fill="#e2e8f0"/></svg>`,
        evolveFrom: '🧲',
        evolveTo: '💎',
        getDesc: (lvl) => {
            const range = 40 + lvl * 25;
            return `Expands gem pickup radius by <span class="text-[#5eff45] font-extrabold">+${range}%</span> and restores <span class="text-[#5eff45] font-extrabold">25%</span> max HP immediately`;
        }
    }
];

// --- CANVAS & LANDSCAPE ORIENTATION HELPERS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;

function isPortraitRotated() {
    return window.innerHeight > window.innerWidth;
}

function resizeCanvas() {
    if (isPortraitRotated()) {
        // Swap dimensions to match the CSS-rotated 100vh x 100vw landscape wrapper
        width = window.innerHeight;
        height = window.innerWidth;
    } else {
        width = window.innerWidth;
        height = window.innerHeight;
    }
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 60));
resizeCanvas();

// Convert screen touch coordinates into rotated landscape coordinates
function getGameCoords(clientX, clientY) {
    if (isPortraitRotated()) {
        return {
            x: clientY,
            y: window.innerWidth - clientX
        };
    }
    return { x: clientX, y: clientY };
}

// --- GAME STATE ---
const state = {
    running: false,
    paused: false,
    gameOver: false,
    elapsedTime: 0,
    lastTimestamp: 0,
    kills: 0,
    gold: 0,
    gemsCount: 0,
    level: 1,
    xp: 0,
    xpToNext: 100,
    screenShake: 0,
    camera: { x: 0, y: 0 },
    abilities: {
        crimson_cleave: 1
    }
};

// --- PLAYER ENTITY ---
const player = {
    x: 0,
    y: 0,
    radius: 16,
    speed: 215,
    hp: 100,
    maxHp: 100,
    facingAngle: 0,
    walkCycle: 0,
    hurtTimer: 0,
    baseDamage: 48,
    critChance: 0.15,
    critMult: 2.2,
    magnetRadius: 95,
    cooldowns: {
        crimson_cleave: 0.4,
        nightfall_flip: 1.5,
        reaper_spiral: 2.0,
        chain_lightning: 1.8
    },
    slashAnim: 0
};

// --- INPUT HANDLING ---
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

const joystick = {
    active: false,
    originX: 0,
    originY: 0,
    currX: 0,
    currY: 0,
    dx: 0,
    dy: 0,
    maxDist: 52
};

canvas.addEventListener('pointerdown', (e) => {
    if (!state.running || state.paused || state.gameOver) return;
    const pos = getGameCoords(e.clientX, e.clientY);
    joystick.active = true;
    joystick.originX = pos.x;
    joystick.originY = pos.y;
    joystick.currX = pos.x;
    joystick.currY = pos.y;
    joystick.dx = 0;
    joystick.dy = 0;
});

window.addEventListener('pointermove', (e) => {
    if (!joystick.active) return;
    const pos = getGameCoords(e.clientX, e.clientY);
    joystick.currX = pos.x;
    joystick.currY = pos.y;
    const diffX = joystick.currX - joystick.originX;
    const diffY = joystick.currY - joystick.originY;
    const dist = Math.hypot(diffX, diffY);
    if (dist > 4) {
        const clamped = Math.min(dist, joystick.maxDist);
        joystick.dx = (diffX / dist) * (clamped / joystick.maxDist);
        joystick.dy = (diffY / dist) * (clamped / joystick.maxDist);
    } else {
        joystick.dx = 0;
        joystick.dy = 0;
    }
});

window.addEventListener('pointerup', () => {
    joystick.active = false;
    joystick.dx = 0;
    joystick.dy = 0;
});

// --- ENTITY POOLS ---
let enemies = [];
let projectiles = [];
let gems = [];
let floatingTexts = [];
let particles = [];
let slashEffects = [];
let lightningBolts = [];
let spawnTimer = 0;

// --- PROCEDURAL GROUND PATCHES ---
const groundPatches = [];
for (let i = 0; i < 90; i++) {
    groundPatches.push({
        x: (Math.random() - 0.5) * 3200,
        y: (Math.random() - 0.5) * 3200,
        rx: 45 + Math.random() * 110,
        ry: 35 + Math.random() * 85,
        rot: Math.random() * Math.PI,
        color: Math.random() > 0.45 ? 'rgba(138, 128, 38, 0.24)' : 'rgba(68, 76, 24, 0.28)'
    });
}

// --- HELPER: SPAWN FLOATING DAMAGE NUMBER ---
function spawnDamageNumber(x, y, amount, isCrit = false, isHeal = false) {
    floatingTexts.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y - 14,
        text: isHeal ? `+${amount}` : `${Math.round(amount)}`,
        vy: -55,
        life: 0.78,
        maxLife: 0.78,
        isCrit,
        isHeal
    });
}

// --- HELPER: SPAWN HIT PARTICLES ---
function spawnParticles(x, y, color, count = 6, speed = 130) {
    for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = (0.35 + Math.random() * 0.65) * speed;
        particles.push({
            x,
            y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            size: 2.5 + Math.random() * 3.5,
            color,
            life: 0.32 + Math.random() * 0.22,
            maxLife: 0.54
        });
    }
}

// --- SPAWN ENEMY ARCHETYPES ---
function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = Math.max(width, height) * 0.62 + 60;
    const ex = player.x + Math.cos(angle) * spawnDist;
    const ey = player.y + Math.sin(angle) * spawnDist;

    const timeFactor = 1 + state.elapsedTime / 45;
    const roll = Math.random();

    if (roll < 0.16 && state.elapsedTime > 5) {
        enemies.push({
            type: 'brute',
            x: ex,
            y: ey,
            radius: 28,
            speed: 62 + Math.min(25, state.elapsedTime * 0.2),
            hp: 260 * timeFactor,
            maxHp: 260 * timeFactor,
            damage: 24,
            xpValue: 45,
            goldChance: 0.65,
            hitFlash: 0,
            wobble: Math.random() * 10
        });
    } else if (roll < 0.52) {
        enemies.push({
            type: 'walker',
            x: ex,
            y: ey,
            radius: 15,
            speed: 88 + Math.min(40, state.elapsedTime * 0.35),
            hp: 65 * timeFactor,
            maxHp: 65 * timeFactor,
            damage: 12,
            xpValue: 18,
            goldChance: 0.22,
            hitFlash: 0,
            wobble: Math.random() * 10
        });
    } else {
        enemies.push({
            type: 'runner',
            x: ex,
            y: ey,
            radius: 13.5,
            speed: 122 + Math.min(55, state.elapsedTime * 0.45),
            hp: 38 * timeFactor,
            maxHp: 38 * timeFactor,
            damage: 9,
            xpValue: 14,
            goldChance: 0.15,
            hitFlash: 0,
            wobble: Math.random() * 10
        });
    }
}

// --- DAMAGE ENEMY LOGIC ---
function damageEnemy(enemy, baseDmg, knockbackAngle = null, knockForce = 80) {
    const isCrit = Math.random() < player.critChance;
    const rawDmg = baseDmg * (isCrit ? player.critMult : 1) * (0.9 + Math.random() * 0.25);
    const displayNum = Math.round(rawDmg * 18);

    enemy.hp -= rawDmg;
    enemy.hitFlash = 0.1;

    if (knockbackAngle !== null) {
        const resist = enemy.type === 'brute' ? 0.25 : 1;
        enemy.x += Math.cos(knockbackAngle) * knockForce * resist * 0.16;
        enemy.y += Math.sin(knockbackAngle) * knockForce * resist * 0.16;
    }

    spawnDamageNumber(enemy.x, enemy.y, displayNum, isCrit);
    spawnParticles(enemy.x, enemy.y, isCrit ? '#ff3b3b' : '#b91c1c', isCrit ? 8 : 4, 120);
    sfx.hit(isCrit);

    if (enemy.hp <= 0) {
        killEnemy(enemy);
    }
}

function killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    state.kills++;
    if (enemy.type === 'brute') {
        state.screenShake = Math.max(state.screenShake, 7);
    }
    spawnParticles(enemy.x, enemy.y, '#991b1b', enemy.type === 'brute' ? 16 : 8, 165);

    gems.push({
        x: enemy.x,
        y: enemy.y,
        kind: 'xp',
        value: enemy.xpValue,
        vy: -40,
        bob: Math.random() * Math.PI * 2
    });

    if (Math.random() < enemy.goldChance) {
        gems.push({
            x: enemy.x + (Math.random() - 0.5) * 18,
            y: enemy.y + (Math.random() - 0.5) * 18,
            kind: Math.random() < 0.15 ? 'purple' : 'gold',
            value: 1,
            vy: -50,
            bob: Math.random() * Math.PI * 2
        });
    }
}

// --- FIND NEAREST ENEMY ---
function getNearestEnemy(maxRange = 650) {
    let best = null;
    let bestDist = maxRange;
    for (const e of enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < bestDist) {
            bestDist = d;
            best = e;
        }
    }
    return best;
}

// --- TRIGGER PLAYER ABILITIES ---
function updateAbilities(dt) {
    // 1. Crimson Cleave
    if (state.abilities.crimson_cleave) {
        const lvl = state.abilities.crimson_cleave;
        player.cooldowns.crimson_cleave -= dt;
        if (player.cooldowns.crimson_cleave <= 0) {
            player.cooldowns.crimson_cleave = Math.max(0.55, 1.25 - lvl * 0.1);
            const target = getNearestEnemy(260);
            const aimAngle = target ? Math.atan2(target.y - player.y, target.x - player.x) : player.facingAngle;
            player.facingAngle = aimAngle;
            player.slashAnim = 0.22;

            const reach = 105 + lvl * 18;
            const arcHalf = 1.15;
            const dmgMult = 1.4 + lvl * 0.45;

            slashEffects.push({
                x: player.x,
                y: player.y,
                angle: aimAngle,
                radius: reach,
                life: 0.22,
                maxLife: 0.22
            });
            sfx.slash();

            for (const e of enemies) {
                if (e.dead) continue;
                const dist = Math.hypot(e.x - player.x, e.y - player.y);
                if (dist <= reach + e.radius) {
                    const angToEnemy = Math.atan2(e.y - player.y, e.x - player.x);
                    let diff = Math.abs(Math.atan2(Math.sin(angToEnemy - aimAngle), Math.cos(angToEnemy - aimAngle)));
                    if (diff <= arcHalf || dist < 38) {
                        damageEnemy(e, player.baseDamage * dmgMult, aimAngle, 120);
                    }
                }
            }
        }
    }

    // 2. Nightfall Flip
    if (state.abilities.nightfall_flip) {
        const lvl = state.abilities.nightfall_flip;
        player.cooldowns.nightfall_flip -= dt;
        if (player.cooldowns.nightfall_flip <= 0) {
            player.cooldowns.nightfall_flip = Math.max(1.6, 3.5 - lvl * 0.28);
            const target = getNearestEnemy(500);
            const baseAngle = target ? Math.atan2(target.y - player.y, target.x - player.x) : player.facingAngle;
            const count = 4 + lvl * 2;
            const spread = 0.72;
            const dmgMult = 1.4 + lvl * 0.4;

            for (let i = 0; i < count; i++) {
                const frac = count === 1 ? 0 : (i / (count - 1)) - 0.5;
                const ang = baseAngle + frac * spread;
                projectiles.push({
                    kind: 'dagger',
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(ang) * 460,
                    vy: Math.sin(ang) * 460,
                    angle: ang,
                    radius: 8,
                    damage: player.baseDamage * dmgMult,
                    life: 1.15,
                    pierce: 1 + Math.floor(lvl / 3)
                });
            }
            sfx.slash();
        }
    }

    // 3. Reaper Spiral
    if (state.abilities.reaper_spiral) {
        const lvl = state.abilities.reaper_spiral;
        player.cooldowns.reaper_spiral -= dt;
        if (player.cooldowns.reaper_spiral <= 0) {
            player.cooldowns.reaper_spiral = Math.max(2.6, 5.0 - lvl * 0.35);
            const count = 1 + lvl;
            const dmgMult = 1.0 + lvl * 0.25;
            for (let i = 0; i < count; i++) {
                const startAng = (Math.PI * 2 * i) / count;
                projectiles.push({
                    kind: 'scythe',
                    orbitAngle: startAng,
                    orbitRadius: 24,
                    spinSelf: 0,
                    x: player.x,
                    y: player.y,
                    radius: 17,
                    damage: player.baseDamage * dmgMult,
                    life: 3.2,
                    hitCooldowns: new Map()
                });
            }
        }
    }

    // 4. Storm Arc
    if (state.abilities.chain_lightning) {
        const lvl = state.abilities.chain_lightning;
        player.cooldowns.chain_lightning -= dt;
        if (player.cooldowns.chain_lightning <= 0) {
            player.cooldowns.chain_lightning = Math.max(1.1, 2.4 - lvl * 0.2);
            const first = getNearestEnemy(360);
            if (first) {
                const bounces = 2 + lvl;
                const dmgMult = 1.3 + lvl * 0.35;
                const hitSet = new Set();
                let currTarget = first;
                let prevX = player.x;
                let prevY = player.y;

                for (let b = 0; b < bounces && currTarget; b++) {
                    hitSet.add(currTarget);
                    lightningBolts.push({
                        x1: prevX,
                        y1: prevY,
                        x2: currTarget.x,
                        y2: currTarget.y,
                        life: 0.18
                    });
                    damageEnemy(currTarget, player.baseDamage * dmgMult, null, 0);
                    prevX = currTarget.x;
                    prevY = currTarget.y;

                    let nextTarget = null;
                    let nextDist = 220;
                    for (const cand of enemies) {
                        if (cand.dead || hitSet.has(cand)) continue;
                        const d = Math.hypot(cand.x - prevX, cand.y - prevY);
                        if (d < nextDist) {
                            nextDist = d;
                            nextTarget = cand;
                        }
                    }
                    currTarget = nextTarget;
                }
            }
        }
    }
}

// --- LEVEL UP & ABILITY CARD MODAL ---
function triggerLevelUp() {
    state.paused = true;
    sfx.levelUp();

    const modal = document.getElementById('levelUpModal');
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';

    const available = ABILITY_CATALOG.filter(ab => (state.abilities[ab.id] || 0) < ab.maxStars);
    const pool = available.length >= 3 ? [...available] : [...ABILITY_CATALOG];
    pool.sort(() => Math.random() - 0.5);
    const choices = pool.slice(0, 3);

    choices.forEach((ab, idx) => {
        const currentLvl = state.abilities[ab.id] || 0;
        const nextStarCount = Math.min(ab.maxStars, currentLvl + 1);
        const isNew = currentLvl === 0;
        const isGreen = ab.theme === 'green';

        let starsHtml = '';
        for (let s = 1; s <= 5; s++) {
            if (s <= nextStarCount) {
                starsHtml += `<svg class="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#ffdf2b] drop-shadow-[0_1.5px_0_rgba(0,0,0,0.9)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
            } else {
                starsHtml += `<svg class="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#2a2e22] drop-shadow-[0_1px_0_rgba(0,0,0,0.8)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
            }
        }

        const wrapper = document.createElement('div');
        wrapper.className = `relative flex flex-col items-center ${isGreen ? 'card-beam-green' : 'card-beam-gold'} pt-2 pb-4 rounded-t-xl animate-pop-in`;
        wrapper.style.animationDelay = `${idx * 65}ms`;

        wrapper.innerHTML = `
            <div class="ability-card ${isGreen ? 'card-green' : 'card-gold'} w-full flex-1 flex flex-col items-center pb-10 sm:pb-12 shadow-2xl">
                <div class="${isGreen ? 'card-green-header' : 'card-gold-header'} w-full py-1.5 sm:py-2 px-1 text-center shadow-md">
                    <h3 class="text-white font-extrabold text-xs sm:text-lg leading-tight text-outline-sm truncate">
                        ${ab.name}
                    </h3>
                </div>

                <div class="flex items-center justify-center gap-0.5 mt-2 mb-1">
                    ${starsHtml}
                </div>

                <div class="relative my-1">
                    <div class="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl p-1 ${isGreen ? 'bg-[#36f546] shadow-[0_0_16px_rgba(54,245,70,0.65)]' : 'bg-[#ffd88a] shadow-[0_0_16px_rgba(255,216,138,0.5)]'} border-2 border-black/60">
                        ${ab.iconSvg}
                    </div>
                    <div class="absolute -bottom-2.5 inset-x-0 flex justify-center">
                        <span class="px-2 py-0.5 rounded-full bg-black/70 text-[#4eff36] font-black text-[10px] sm:text-xs text-outline-sm tracking-wide">
                            ${isNew ? 'New!' : `Lv.${nextStarCount}`}
                        </span>
                    </div>
                </div>

                <p class="mt-3.5 px-2 sm:px-3.5 text-center text-white font-bold text-[11px] sm:text-sm leading-snug text-outline-sm">
                    ${ab.getDesc(currentLvl)}
                </p>
            </div>

            <div class="mt-2 flex flex-col items-center">
                <span class="text-white font-extrabold text-[10px] sm:text-xs text-outline-sm mb-1">Evolves:</span>
                <div class="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-white/15">
                    <span class="text-xs sm:text-base">${ab.evolveFrom}</span>
                    <span class="text-[#4eff36] font-black text-xs sm:text-sm">➔</span>
                    <span class="text-xs sm:text-base">${ab.evolveTo}</span>
                </div>
            </div>
        `;

        wrapper.addEventListener('click', () => selectAbility(ab.id));
        container.appendChild(wrapper);
    });

    modal.classList.remove('hidden');
}

function selectAbility(id) {
    state.abilities[id] = (state.abilities[id] || 0) + 1;

    if (id === 'crit_chance') {
        player.critChance = Math.min(1.0, player.critChance + 0.15);
    } else if (id === 'magnet_vitality') {
        player.magnetRadius += 42;
        const healAmt = Math.round(player.maxHp * 0.25);
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
        spawnDamageNumber(player.x, player.y, healAmt, false, true);
    }

    updateActiveSlotsHUD();
    document.getElementById('levelUpModal').classList.add('hidden');
    state.paused = false;
    state.lastTimestamp = performance.now();
}

// --- UPDATE TOP-LEFT ACTIVE SKILL SLOTS ---
function updateActiveSlotsHUD() {
    const bar = document.getElementById('activeSlotsBar');
    bar.innerHTML = '';
    Object.entries(state.abilities).forEach(([id, lvl]) => {
        const ab = ABILITY_CATALOG.find(a => a.id === id);
        if (!ab) return;
        const slot = document.createElement('div');
        slot.className = 'relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden border border-white/30 bg-stone-900 shadow';
        slot.innerHTML = `
            ${ab.iconSvg}
            <span class="absolute bottom-0 right-0.5 text-[9px] font-black text-amber-300 text-outline-sm">${lvl}</span>
        `;
        bar.appendChild(slot);
    });
}

// --- MAIN SIMULATION UPDATE ---
function update(dt) {
    if (!state.running || state.paused || state.gameOver) return;

    state.elapsedTime += dt;
    if (state.screenShake > 0) state.screenShake = Math.max(0, state.screenShake - dt * 28);
    if (player.hurtTimer > 0) player.hurtTimer = Math.max(0, player.hurtTimer - dt);
    if (player.slashAnim > 0) player.slashAnim = Math.max(0, player.slashAnim - dt);

    let moveX = joystick.dx;
    let moveY = joystick.dy;

    if (keys['w'] || keys['arrowup']) moveY -= 1;
    if (keys['s'] || keys['arrowdown']) moveY += 1;
    if (keys['a'] || keys['arrowleft']) moveX -= 1;
    if (keys['d'] || keys['arrowright']) moveX += 1;

    const len = Math.hypot(moveX, moveY);
    if (len > 0.01) {
        const normX = moveX / Math.max(1, len);
        const normY = moveY / Math.max(1, len);
        player.x += normX * player.speed * dt;
        player.y += normY * player.speed * dt;
        player.facingAngle = Math.atan2(normY, normX);
        player.walkCycle += dt * 11;
    }

    state.camera.x = player.x - width / 2;
    state.camera.y = player.y - height / 2;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        const batch = 1 + Math.floor(state.elapsedTime / 14);
        for (let i = 0; i < Math.min(batch, 6); i++) {
            if (enemies.length < 160) spawnEnemy();
        }
        spawnTimer = Math.max(0.26, 1.05 - state.elapsedTime * 0.008);
    }

    updateAbilities(dt);

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.life -= dt;
        if (p.life <= 0) {
            projectiles.splice(i, 1);
            continue;
        }

        if (p.kind === 'dagger') {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            for (const e of enemies) {
                if (e.dead) continue;
                if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
                    damageEnemy(e, p.damage, p.angle, 65);
                    p.pierce--;
                    if (p.pierce <= 0) {
                        p.life = 0;
                        break;
                    }
                }
            }
        } else if (p.kind === 'scythe') {
            p.orbitAngle += 4.2 * dt;
            p.orbitRadius += 34 * dt;
            p.spinSelf += 14 * dt;
            p.x = player.x + Math.cos(p.orbitAngle) * p.orbitRadius;
            p.y = player.y + Math.sin(p.orbitAngle) * p.orbitRadius;

            for (const e of enemies) {
                if (e.dead) continue;
                const lastHit = p.hitCooldowns.get(e) || 0;
                if (lastHit <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
                    damageEnemy(e, p.damage, p.orbitAngle, 95);
                    p.hitCooldowns.set(e, 0.35);
                } else if (lastHit > 0) {
                    p.hitCooldowns.set(e, lastHit - dt);
                }
            }
        }
    }

    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.dead) continue;
        if (e.hitFlash > 0) e.hitFlash -= dt;
        e.wobble += dt * (e.type === 'brute' ? 4.5 : 8);

        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;

        let vx = (dx / dist) * e.speed;
        let vy = (dy / dist) * e.speed;

        for (let j = i + 1; j < enemies.length; j++) {
            const o = enemies[j];
            if (o.dead) continue;
            const sdx = e.x - o.x;
            const sdy = e.y - o.y;
            const minSep = e.radius + o.radius;
            const sdist = Math.hypot(sdx, sdy);
            if (sdist > 0 && sdist < minSep) {
                const push = (minSep - sdist) * 2.2;
                const nx = sdx / sdist;
                const ny = sdy / sdist;
                vx += nx * push;
                vy += ny * push;
                o.x -= nx * push * dt * 0.5;
                o.y -= ny * push * dt * 0.5;
            }
        }

        e.x += vx * dt;
        e.y += vy * dt;

        if (dist < e.radius + player.radius - 2 && player.hurtTimer <= 0) {
            player.hp -= e.damage;
            player.hurtTimer = 0.45;
            state.screenShake = 8;
            sfx.playerHurt();
            spawnParticles(player.x, player.y, '#ef4444', 8, 140);

            if (player.hp <= 0) {
                player.hp = 0;
                triggerGameOver();
                return;
            }
        }
    }
    enemies = enemies.filter(e => !e.dead);

    for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i];
        g.bob += dt * 5;
        if (g.vy < 0) {
            g.y += g.vy * dt;
            g.vy += 180 * dt;
        }

        const dx = player.x - g.x;
        const dy = player.y - g.y;
        const dist = Math.hypot(dx, dy);

        if (dist < player.magnetRadius) {
            const pullSpeed = 420 * (1 - dist / (player.magnetRadius * 1.35)) + 160;
            g.x += (dx / (dist || 1)) * pullSpeed * dt;
            g.y += (dy / (dist || 1)) * pullSpeed * dt;
        }

        if (dist < player.radius + 14) {
            if (g.kind === 'xp') {
                state.xp += g.value;
                sfx.gem();
                if (state.xp >= state.xpToNext) {
                    state.xp -= state.xpToNext;
                    state.level++;
                    state.xpToNext = Math.round(state.xpToNext * 1.28 + 35);
                    gems.splice(i, 1);
                    updateHUD();
                    triggerLevelUp();
                    return;
                }
            } else if (g.kind === 'gold') {
                state.gold += g.value;
                sfx.gem();
            } else if (g.kind === 'purple') {
                state.gemsCount += g.value;
                sfx.gem();
            }
            gems.splice(i, 1);
        }
    }

    for (let i = slashEffects.length - 1; i >= 0; i--) {
        slashEffects[i].life -= dt;
        if (slashEffects[i].life <= 0) slashEffects.splice(i, 1);
    }
    for (let i = lightningBolts.length - 1; i >= 0; i--) {
        lightningBolts[i].life -= dt;
        if (lightningBolts[i].life <= 0) lightningBolts.splice(i, 1);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) particles.splice(i, 1);
    }
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.vy *= 0.94;
        ft.life -= dt;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    updateHUD();
}

// --- UPDATE DOM HUD ELEMENTS ---
function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateHUD() {
    document.getElementById('hudLevel').textContent = state.level;
    const xpPct = Math.min(100, (state.xp / state.xpToNext) * 100);
    document.getElementById('hudXpFill').style.width = `${xpPct}%`;
    document.getElementById('hudKills').textContent = `× ${state.kills}`;
    document.getElementById('hudGold').textContent = state.gold;
    document.getElementById('hudGems').textContent = state.gemsCount;
    document.getElementById('hudTimer').textContent = formatTime(state.elapsedTime);
}

// --- RENDERING PIPELINE ---
function render() {
    ctx.save();

    let shakeX = 0;
    let shakeY = 0;
    if (state.screenShake > 0) {
        shakeX = (Math.random() - 0.5) * state.screenShake * 2;
        shakeY = (Math.random() - 0.5) * state.screenShake * 2;
    }

    ctx.fillStyle = '#6f6c23';
    ctx.fillRect(0, 0, width, height);

    ctx.translate(-state.camera.x + shakeX, -state.camera.y + shakeY);

    const wrapSize = 3200;
    for (const p of groundPatches) {
        let px = ((p.x - player.x + wrapSize / 2) % wrapSize + wrapSize) % wrapSize - wrapSize / 2 + player.x;
        let py = ((p.y - player.y + wrapSize / 2) % wrapSize + wrapSize) % wrapSize - wrapSize / 2 + player.y;
        if (Math.abs(px - player.x) < width * 0.7 && Math.abs(py - player.y) < height * 0.7) {
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    const tile = 160;
    const startX = Math.floor((player.x - width * 0.6) / tile) * tile;
    const endX = player.x + width * 0.6;
    const startY = Math.floor((player.y - height * 0.6) / tile) * tile;
    const endY = player.y + height * 0.6;

    ctx.strokeStyle = 'rgba(42, 46, 12, 0.25)';
    ctx.lineWidth = 2;
    for (let gx = startX; gx <= endX; gx += tile) {
        for (let gy = startY; gy <= endY; gy += tile) {
            const hash = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453;
            const ox = (hash - Math.floor(hash)) * 90;
            const oy = ((hash * 1.7) - Math.floor(hash * 1.7)) * 90;
            ctx.beginPath();
            ctx.moveTo(gx + ox, gy + oy);
            ctx.lineTo(gx + ox - 3, gy + oy - 7);
            ctx.moveTo(gx + ox + 4, gy + oy);
            ctx.lineTo(gx + ox + 7, gy + oy - 6);
            ctx.stroke();
        }
    }

    for (const g of gems) {
        const floatY = g.y + Math.sin(g.bob) * 2.5;
        ctx.save();
        ctx.translate(g.x, floatY);

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        if (g.kind === 'xp') {
            ctx.fillStyle = '#22ff14';
            ctx.strokeStyle = '#093b05';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(6.5, 0);
            ctx.lineTo(0, 8);
            ctx.lineTo(-6.5, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#c4ffbf';
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(3, 0);
            ctx.lineTo(0, 2);
            ctx.lineTo(-3, 0);
            ctx.closePath();
            ctx.fill();
        } else if (g.kind === 'gold') {
            ctx.fillStyle = '#facc15';
            ctx.strokeStyle = '#713f12';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillStyle = '#e879f9';
            ctx.strokeStyle = '#581c87';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(7, 0);
            ctx.lineTo(0, 7);
            ctx.lineTo(-7, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    for (const e of enemies) {
        drawEnemy(e);
    }

    drawPlayer();

    for (const s of slashEffects) {
        const alpha = s.life / s.maxLife;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.strokeStyle = `rgba(220, 38, 38, ${alpha * 0.9})`;
        ctx.lineWidth = 16 * alpha;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, s.radius * 0.85, -1.05, 1.05);
        ctx.stroke();

        ctx.strokeStyle = `rgba(254, 202, 202, ${alpha})`;
        ctx.lineWidth = 5 * alpha;
        ctx.beginPath();
        ctx.arc(0, 0, s.radius * 0.92, -0.95, 0.95);
        ctx.stroke();
        ctx.restore();
    }

    for (const p of projectiles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.kind === 'dagger') {
            ctx.rotate(p.angle);
            ctx.fillStyle = '#4ade80';
            ctx.strokeStyle = '#052e16';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(11, 0);
            ctx.lineTo(-7, -4.5);
            ctx.lineTo(-4, 0);
            ctx.lineTo(-7, 4.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (p.kind === 'scythe') {
            ctx.rotate(p.spinSelf);
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 0, 15, -0.6, 2.1);
            ctx.stroke();
            ctx.strokeStyle = '#3b0764';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-12, 10);
            ctx.lineTo(12, -10);
            ctx.stroke();
        }
        ctx.restore();
    }

    for (const b of lightningBolts) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        const midX = (b.x1 + b.x2) / 2 + (Math.random() - 0.5) * 26;
        const midY = (b.y1 + b.y2) / 2 + (Math.random() - 0.5) * 26;
        ctx.lineTo(midX, midY);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
    }

    for (const pt of particles) {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    for (const ft of floatingTexts) {
        const alpha = Math.min(1, ft.life * 2);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = ft.isCrit ? '900 18px Fredoka, sans-serif' : '800 14px Fredoka, sans-serif';
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(ft.text, ft.x, ft.y);

        if (ft.isHeal) {
            ctx.fillStyle = '#4eff36';
        } else if (ft.isCrit) {
            ctx.fillStyle = '#fde047';
        } else {
            ctx.fillStyle = '#f5f5f4';
        }
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    }

    ctx.restore();

    if (joystick.active && state.running && !state.paused) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(joystick.originX, joystick.originY, joystick.maxDist, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const knobX = joystick.originX + joystick.dx * joystick.maxDist;
        const knobY = joystick.originY + joystick.dy * joystick.maxDist;
        ctx.fillStyle = 'rgba(255, 223, 56, 0.85)';
        ctx.beginPath();
        ctx.arc(knobX, knobY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// --- DRAW PLAYER ---
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 15, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const barW = 38;
    const barH = 5.5;
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    ctx.fillStyle = '#0f170a';
    ctx.fillRect(-barW / 2 - 1, -30 - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#22ee14';
    ctx.fillRect(-barW / 2, -30, barW * hpRatio, barH);

    ctx.save();
    const swingOffset = player.slashAnim > 0 ? Math.sin((player.slashAnim / 0.22) * Math.PI) * 1.6 : 0;
    ctx.rotate(player.facingAngle + Math.PI * 0.75 - swingOffset);
    ctx.fillStyle = '#5c1414';
    ctx.strokeStyle = '#140505';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(28, -2);
    ctx.lineTo(32, 0);
    ctx.lineTo(28, 3);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const step = Math.sin(player.walkCycle) * 3.5;
    ctx.fillStyle = '#f5f5f4';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-5, 11 + step * 0.5, 4, 0, Math.PI * 2);
    ctx.arc(5, 11 - step * 0.5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = player.hurtTimer > 0.25 ? '#ff5555' : '#efe7d6';
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-9, -4, 18, 15, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbd3a8';
    ctx.beginPath();
    ctx.arc(0, -9, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, -11, 8.8, Math.PI * 0.9, Math.PI * 2.15);
    ctx.lineTo(6, -7);
    ctx.lineTo(-6, -7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

// --- DRAW ENEMIES ---
function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);

    const sway = Math.sin(e.wobble) * 0.09;
    ctx.rotate(sway);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(0, e.radius * 0.85, e.radius * 0.9, e.radius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    const flash = e.hitFlash > 0;
    ctx.strokeStyle = '#121212';
    ctx.lineWidth = e.type === 'brute' ? 2.8 : 2.1;

    if (e.type === 'brute') {
        ctx.fillStyle = flash ? '#ffffff' : '#9c8b70';
        ctx.beginPath();
        ctx.roundRect(-29, -12, 13, 28, 6);
        ctx.roundRect(16, -12, 13, 28, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#b8a688';
        ctx.beginPath();
        ctx.roundRect(-20, -20, 40, 34, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#cbb99b';
        ctx.beginPath();
        ctx.arc(0, -17, 9.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    } else if (e.type === 'walker') {
        ctx.fillStyle = flash ? '#ffffff' : '#3b5978';
        ctx.beginPath();
        ctx.roundRect(-8, 4, 16, 10, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#b8c4a8';
        ctx.beginPath();
        ctx.roundRect(-10, -8, 20, 15, 5);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(-14, -6, 5, 13, 2.5);
        ctx.roundRect(9, -6, 5, 13, 2.5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#d6dfc2';
        ctx.beginPath();
        ctx.arc(0, -13, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillStyle = flash ? '#ffffff' : '#333942';
        ctx.beginPath();
        ctx.roundRect(-9, -8, 18, 20, 6);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(-13, -7, 5, 13, 2.5);
        ctx.roundRect(8, -7, 5, 13, 2.5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#4a525e';
        ctx.beginPath();
        ctx.arc(0, -13, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();
}

// --- GAME LOOP ---
function gameLoop(timestamp) {
    const dt = Math.min(0.05, (timestamp - state.lastTimestamp) / 1000 || 0.016);
    state.lastTimestamp = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// --- START, RESTART & GAME OVER HANDLERS ---
function startGame() {
    sfx.init();

    // 1. Request browser fullscreen first, then lock hardware orientation once active
    const docEl = document.documentElement;
    const requestFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen;

    if (requestFs) {
        requestFs.call(docEl).then(() => {
            resizeCanvas();
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').then(() => {
                    resizeCanvas();
                }).catch(() => {});
            }
        }).catch(() => {});
    }

    state.running = true;
    state.paused = false;
    state.gameOver = false;
    state.elapsedTime = 0;
    state.kills = 0;
    state.gold = 0;
    state.gemsCount = 0;
    state.level = 1;
    state.xp = 0;
    state.xpToNext = 100;
    state.abilities = { crimson_cleave: 1 };

    player.x = 0;
    player.y = 0;
    player.hp = 100;
    player.maxHp = 100;
    player.critChance = 0.15;
    player.magnetRadius = 95;
    player.cooldowns = {
        crimson_cleave: 0.3,
        nightfall_flip: 1.2,
        reaper_spiral: 1.5,
        chain_lightning: 1.5
    };

    enemies = [];
    projectiles = [];
    gems = [];
    floatingTexts = [];
    particles = [];
    slashEffects = [];
    lightningBolts = [];

    for (let i = 0; i < 12; i++) spawnEnemy();

    updateActiveSlotsHUD();
    updateHUD();

    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('levelUpModal').classList.add('hidden');

    resizeCanvas();
    state.lastTimestamp = performance.now();
}

function triggerGameOver() {
    state.gameOver = true;
    state.running = false;
    document.getElementById('statTime').textContent = formatTime(state.elapsedTime);
    document.getElementById('statLevel').textContent = state.level;
    document.getElementById('statKills').textContent = state.kills;
    document.getElementById('statGold').textContent = state.gold;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// --- RETURN TO HUB FUNCTION ---
function returnToHub() {
    window.location.href = 'index.html?hub=true';
}

document.getElementById('btnStartGame').addEventListener('click', startGame);
document.getElementById('btnRestartGame').addEventListener('click', startGame);

document.getElementById('btnMute').addEventListener('click', () => {
    sfx.init();
    sfx.muted = !sfx.muted;
    document.getElementById('iconSoundOn').classList.toggle('hidden', sfx.muted);
    document.getElementById('iconSoundOff').classList.toggle('hidden', !sfx.muted);
});

window.onload = function () {
    resizeCanvas();
    updateActiveSlotsHUD();
    state.lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
};
