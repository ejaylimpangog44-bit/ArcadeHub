(() => {
  const canvas = document.getElementById('pool-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const PLAYER_NAME_KEY = 'arcade_hub_player_name';
  const ENTER_FS_FROM_HUB_KEY = 'arcade_hub_enter_fullscreen_on_billiard';
  const INITIAL_GATE_SEEN_KEY = 'arcade_hub_initial_gate_checked';

  function markGateHandledOnce() {
    try {
      sessionStorage.setItem(INITIAL_GATE_SEEN_KEY, '1');
    } catch (_) {}
  }

  const BilliardLandscapeGuard = (() => {
    let initialized = false;

    function isLandscapeNow() {
      const orientType = window.screen && window.screen.orientation && window.screen.orientation.type;
      if (typeof orientType === 'string') {
        if (orientType.startsWith('landscape')) return true;
        if (orientType.startsWith('portrait')) return false;
      }
      if (window.matchMedia) {
        if (window.matchMedia('(orientation: landscape)').matches) return true;
        if (window.matchMedia('(orientation: portrait)').matches) return false;
      }
      return window.innerWidth >= window.innerHeight;
    }

    function isPortraitNow() {
      return !isLandscapeNow();
    }

    function tryLockLandscape() {
      try {
        if (screen.orientation && typeof screen.orientation.lock === 'function') {
          screen.orientation.lock('landscape').catch(() => {});
        }
      } catch (_) {}
    }

    function releaseOrientationLock() {
      try {
        if (screen.orientation && typeof screen.orientation.unlock === 'function') {
          screen.orientation.unlock();
        }
      } catch (_) {}
    }

    function isFullscreenActive() {
      return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    }

    function requestFullscreenSafe(forceToggle = false) {
      const docEl = document.documentElement;
      const active = isFullscreenActive();
      try {
        if (forceToggle && active) {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          return;
        }
        if (!active) {
          if (docEl.requestFullscreen) {
            docEl.requestFullscreen({ navigationUI: 'hide' })
              .then(() => tryLockLandscape())
              .catch(() => {
                docEl.requestFullscreen().then(() => tryLockLandscape()).catch(() => {});
              });
          } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
            tryLockLandscape();
          }
        } else {
          tryLockLandscape();
        }
      } catch (_) {}
    }

    function sync() {
      markGateHandledOnce();
      document.documentElement.dataset.isLandscape = isLandscapeNow() ? 'true' : 'false';
      tryLockLandscape();
    }

    function bindAutoGestureLock() {
      const onFirstGesture = () => {
        markGateHandledOnce();
        try {
          sessionStorage.removeItem(ENTER_FS_FROM_HUB_KEY);
        } catch (_) {}
        requestFullscreenSafe(false);
        tryLockLandscape();
        sync();
        document.removeEventListener('pointerdown', onFirstGesture, true);
        document.removeEventListener('click', onFirstGesture, true);
      };

      document.addEventListener('pointerdown', onFirstGesture, true);
      document.addEventListener('click', onFirstGesture, true);
    }

    function init() {
      markGateHandledOnce();
      if (initialized) {
        sync();
        return;
      }
      initialized = true;
      sync();
      bindAutoGestureLock();

      window.addEventListener('resize', () => {
        sync();
        setTimeout(resizeTable, 40);
      });
      window.addEventListener('orientationchange', () => {
        sync();
        setTimeout(() => {
          tryLockLandscape();
          sync();
          resizeTable();
        }, 180);
      });
      document.addEventListener('fullscreenchange', () => {
        sync();
        setTimeout(resizeTable, 80);
      });
      document.addEventListener('webkitfullscreenchange', () => {
        sync();
        setTimeout(resizeTable, 80);
      });
      if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
        screen.orientation.addEventListener('change', () => {
          tryLockLandscape();
          sync();
        });
      }
    }

    return {
      init,
      sync,
      isLandscapeNow,
      isPortraitNow,
      isFullscreenActive,
      tryLockLandscape,
      releaseOrientationLock,
      requestFullscreenSafe
    };
  })();

  const BALL_COLORS = {
    0: '#f8fafc',
    1: '#facc15',
    2: '#2563eb',
    3: '#dc2626',
    4: '#7c3aed',
    5: '#f97316',
    6: '#16a34a',
    7: '#991b1b',
    8: '#111827',
    9: '#facc15',
    10: '#2563eb',
    11: '#dc2626',
    12: '#7c3aed',
    13: '#f97316',
    14: '#16a34a',
    15: '#991b1b'
  };

  const state = {
    mode: '8ball',
    opponent: 'ai',
    aiDiff: 'medium',
    tapToAim: true,
    aimSensitivity: 0.45,
    fineAimSpeed: 0.20,
    guideMode: 'full',
    sfx: true,

    phase: 'MENU',
    turn: 1,
    groups: { 1: null, 2: null },
    timerSeconds: 60,
    timerInterval: null,

    aimAngle: 0,
    takoPull: 0,
    spin: { x: 0, y: 0 },

    balls: [],
    pocketedThisShot: [],
    firstHitBall: null,
    railHitAfterContact: false,
    shotWasBreak: false,

    dragMode: null,
    pointerStart: { x: 0, y: 0 },
    pointerMoved: false,
    lastPointer: { x: 0, y: 0 },
    aiTimer: null,
    turnToastTimer: null,
    turnToastFadeTimer: null,
    pocketAnimTimer: null,
    pocketAnimFadeTimer: null
  };

  let W = 800, H = 400;
  let rail = 34;
  let playX = 34, playY = 34, playW = 732, playH = 332;
  let ballR = 11;
  let pocketR = 20;
  let pockets = [];

  let audioCtx = null;
  function playTone(freq, type, dur, vol) {
    if (!state.sfx) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.35), audioCtx.currentTime + dur);
      gain.gain.setValueAtTime(vol || 0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }

  function haptic(ms) {
    if (state.sfx && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  }

  function applySpaciousLayoutSpacing() {
    const wrap = document.getElementById('table-wrap');
    if (wrap) {
      wrap.style.padding = '12px 16px';
      wrap.style.boxSizing = 'border-box';
    }
    const hud = document.getElementById('top-hud') || document.querySelector('.pool-hud');
    if (hud) {
      hud.style.gap = '12px';
      hud.style.padding = '8px 14px';
    }
  }

  function resizeTable() {
    applySpaciousLayoutSpacing();
    const wrap = document.getElementById('table-wrap');
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 100 || rect.height < 100) return;

    const padX = Math.max(24, Math.round(rect.width * 0.032));
    const padY = Math.max(20, Math.round(rect.height * 0.045));
    const availW = Math.max(120, rect.width - padX * 2);
    const availH = Math.max(80, rect.height - padY * 2);

    const targetRatio = 2.0;
    let cw = availW;
    let ch = cw / targetRatio;
    if (ch > availH) {
      ch = availH;
      cw = ch * targetRatio;
    }

    const oldPlayX = playX, oldPlayY = playY, oldPlayW = playW, oldPlayH = playH;

    W = Math.max(160, Math.floor(cw));
    H = Math.max(80, Math.floor(ch));
    canvas.width = W;
    canvas.height = H;

    rail = Math.max(24, Math.round(H * 0.095));
    playX = rail;
    playY = rail;
    playW = Math.max(60, W - rail * 2);
    playH = Math.max(40, H - rail * 2);
    ballR = Math.max(8, Math.round(playH * 0.0325));
    pocketR = Math.round(ballR * 1.82);

    pockets = [
      { x: playX + 2, y: playY + 2 },
      { x: playX + playW / 2, y: playY - 2 },
      { x: playX + playW - 2, y: playY + 2 },
      { x: playX + 2, y: playY + playH - 2 },
      { x: playX + playW / 2, y: playY + playH + 2 },
      { x: playX + playW - 2, y: playY + playH - 2 }
    ];

    if (state.balls.length > 0 && oldPlayW > 0 && oldPlayH > 0) {
      state.balls.forEach(b => {
        const nx = (b.x - oldPlayX) / oldPlayW;
        const ny = (b.y - oldPlayY) / oldPlayH;
        b.x = playX + nx * playW;
        b.y = playY + ny * playH;
      });
    }
  }

  function showTurnModal(customText) {
    const toast = document.getElementById('turn-modal-toast');
    if (!toast) return;
    clearTimeout(state.turnToastTimer);
    clearTimeout(state.turnToastFadeTimer);

    const text = customText || (
      state.turn === 1
        ? "Player 1's Turn"
        : (state.opponent === 'ai' ? "AI's Turn" : "Player 2's Turn")
    );
    toast.textContent = text;
    toast.classList.remove('hidden', 'fading');

    state.turnToastFadeTimer = setTimeout(() => {
      toast.classList.add('fading');
    }, 1050);

    state.turnToastTimer = setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('fading');
    }, 1550);
  }

  function showPocketedAnimation(ballNum) {
    const badge = document.getElementById('pocket-anim-badge');
    if (!badge) return;
    clearTimeout(state.pocketAnimTimer);
    clearTimeout(state.pocketAnimFadeTimer);

    const label = ballNum === 0
      ? 'Cue Ball Scratch'
      : (ballNum === 8 ? '8-Ball Pocketed!' : `Ball #${ballNum} Pocketed`);

    const chipBg = ballNum > 8
      ? `radial-gradient(circle, #fff 45%, ${BALL_COLORS[ballNum]} 48%)`
      : (BALL_COLORS[ballNum] || '#f8fafc');
    const chipColor = ballNum === 8 ? '#fff' : '#0f172a';
    const chipText = ballNum === 0 ? '•' : String(ballNum);

    badge.innerHTML = `<span class="pocket-anim-chip" style="background:${chipBg};color:${chipColor};">${chipText}</span><span>${label}</span>`;
    badge.classList.remove('hidden', 'fading');

    state.pocketAnimFadeTimer = setTimeout(() => {
      badge.classList.add('fading');
    }, 1150);

    state.pocketAnimTimer = setTimeout(() => {
      badge.classList.add('hidden');
      badge.classList.remove('fading');
    }, 1750);
  }

  function getSavedPlayerName() {
    try {
      const saved = localStorage.getItem(PLAYER_NAME_KEY) || localStorage.getItem('playerName');
      if (saved && saved.trim()) return saved.trim();
    } catch (_) {}
    const domName = document.getElementById('p1-name')?.textContent;
    return (domName && domName.trim()) || 'P1';
  }

  function persistPlayerName(name) {
    const clean = String(name || '').trim();
    if (!clean) return;
    window.playerName = clean;
    try {
      localStorage.setItem(PLAYER_NAME_KEY, clean);
    } catch (_) {}
  }

  function syncPlayerNameFromHub() {
    const name = getSavedPlayerName();
    persistPlayerName(name);
    const p1El = document.getElementById('p1-name');
    if (p1El) p1El.textContent = name.slice(0, 12);
  }

  function goToHubLobby() {
    state.phase = 'MENU';
    clearInterval(state.timerInterval);
    clearTimeout(state.aiTimer);
    const currentName = document.getElementById('p1-name')?.textContent || getSavedPlayerName();
    persistPlayerName(currentName);

    try {
      sessionStorage.setItem(INITIAL_GATE_SEEN_KEY, '1');
      sessionStorage.removeItem(ENTER_FS_FROM_HUB_KEY);
      sessionStorage.setItem('arcade_hub_skip_power', '1');
      sessionStorage.setItem('arcade_hub_target_lobby', '1');
      sessionStorage.setItem('arcade_hub_from_billiard', '1');
      sessionStorage.setItem('arcade_hub_keep_fullscreen', '1');
      sessionStorage.setItem('arcade_hub_auto_landscape_fs', '1');
    } catch (_) {}

    BilliardLandscapeGuard.releaseOrientationLock();
    haptic(10);
    window.location.href = './index.html?hub=true';
  }

  function refreshSettingsAudioButtonLabel() {
    const audioFsBtn = document.getElementById('btn-settings-audio-fs');
    if (audioFsBtn) {
      audioFsBtn.textContent = `🔊 ${state.sfx ? 'ON' : 'OFF'} • ⛶ FS`;
    }
  }

  function ensureSettingsHubAndAudioControls() {
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal) return;

    if (document.getElementById('btn-settings-hub')) {
      refreshSettingsAudioButtonLabel();
      return;
    }

    const actionsContainer = settingsModal.querySelector('.modal-card') || settingsModal;

    const row = document.createElement('div');
    row.id = 'settings-audio-hub-row';
    row.style.cssText = 'display:flex;gap:10px;margin-top:6px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.12);';

    const audioFsBtn = document.createElement('button');
    audioFsBtn.type = 'button';
    audioFsBtn.id = 'btn-settings-audio-fs';
    audioFsBtn.style.cssText = 'flex:1;padding:9px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.08);color:#f8fafc;font-weight:700;font-size:12px;cursor:pointer;';
    audioFsBtn.addEventListener('click', () => {
      state.sfx = !state.sfx;
      const sfxRow = document.getElementById('opt-sfx');
      if (sfxRow) {
        sfxRow.querySelectorAll('.seg-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.val === (state.sfx ? 'on' : 'off'));
        });
      }
      BilliardLandscapeGuard.requestFullscreenSafe(true);
      BilliardLandscapeGuard.tryLockLandscape();
      refreshSettingsAudioButtonLabel();
      haptic(10);
      setTimeout(resizeTable, 120);
    });

    const backHubBtn = document.createElement('button');
    backHubBtn.type = 'button';
    backHubBtn.id = 'btn-settings-hub';
    backHubBtn.textContent = '🏠 Hub';
    backHubBtn.style.cssText = 'flex:1;padding:9px 10px;border-radius:10px;border:1px solid rgba(244,114,182,0.35);background:rgba(236,72,153,0.18);color:#f9a8d4;font-weight:800;font-size:12px;cursor:pointer;';
    backHubBtn.addEventListener('click', (e) => {
      e.preventDefault();
      settingsModal.classList.add('hidden');
      goToHubLobby();
    });

    row.appendChild(audioFsBtn);
    row.appendChild(backHubBtn);
    actionsContainer.appendChild(row);
    refreshSettingsAudioButtonLabel();
  }

  function syncSettingsSummaries() {
    const modeSum = document.getElementById('val-mode-summary');
    const oppSum = document.getElementById('val-opponent-summary');
    const diffSum = document.getElementById('val-diff-summary');
    const diffTrigger = document.getElementById('btn-open-diff-modal');

    if (modeSum) modeSum.textContent = state.mode === '8ball' ? '🎱 8-Ball' : '🟡 9-Ball';
    if (oppSum) oppSum.textContent = state.opponent === 'ai' ? '🤖 AI' : '👥 2P PVP';
    if (diffSum) {
      diffSum.textContent = state.aiDiff === 'easy' ? '🌱 Easy' : (state.aiDiff === 'hard' ? '👑 Boss' : '⚡ Pro');
    }
    if (diffTrigger) {
      diffTrigger.style.display = state.opponent === 'ai' ? 'flex' : 'none';
    }
  }

  function createMiniBallEl(n) {
    const b = state.balls.find(item => item.num === n);
    const div = document.createElement('div');
    div.className = 'mini-ball' + (!b || b.pocketed ? ' pocketed' : '');
    div.style.background = n > 8
      ? `radial-gradient(circle, #fff 45%, ${BALL_COLORS[n]} 48%)`
      : BALL_COLORS[n];
    if (n === 8) div.style.color = '#fff';
    div.textContent = n;
    return div;
  }

  function appendDividerEl(tray) {
    const div = document.createElement('div');
    div.className = 'tray-divider';
    tray.appendChild(div);
  }

  function updateHUD() {
    const b1 = document.getElementById('badge-p1');
    const b2 = document.getElementById('badge-p2');
    if (b1) b1.classList.toggle('active', state.turn === 1);
    if (b2) b2.classList.toggle('active', state.turn === 2);

    const p2El = document.getElementById('p2-name');
    if (p2El) p2El.textContent = state.opponent === 'ai' ? '🤖 AI' : '👥 P2';
    const modeEl = document.getElementById('hud-mode-label');
    if (modeEl) {
      modeEl.textContent =
        (state.mode === '8ball' ? '🎱 8-BALL' : '🟡 9-BALL') + ' • ' + (state.opponent === 'ai' ? '🤖 AI' : '👥 PVP');
    }

    const g1 = document.getElementById('p1-group');
    const g2 = document.getElementById('p2-group');
    if (g1 && g2) {
      if (state.mode === '9ball') {
        const lowest = getLowestTargetNumber();
        g1.textContent = lowest ? '#' + lowest : 'DONE';
        g2.textContent = lowest ? '#' + lowest : 'DONE';
      } else {
        g1.textContent = state.groups[1] ? state.groups[1].toUpperCase() : 'OPEN';
        g2.textContent = state.groups[2] ? state.groups[2].toUpperCase() : 'OPEN';
      }
    }

    const tray = document.getElementById('rack-tray');
    if (tray) {
      tray.innerHTML = '';
      if (state.mode === '8ball' && state.groups[1] && state.groups[2]) {
        const p1Nums = state.groups[1] === 'solids' ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15];
        const p2Nums = state.groups[2] === 'solids' ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15];
        p1Nums.forEach(n => tray.appendChild(createMiniBallEl(n)));
        appendDividerEl(tray);
        tray.appendChild(createMiniBallEl(8));
        appendDividerEl(tray);
        p2Nums.forEach(n => tray.appendChild(createMiniBallEl(n)));
      } else {
        const maxBall = state.mode === '8ball' ? 15 : 9;
        for (let n = 1; n <= maxBall; n++) {
          tray.appendChild(createMiniBallEl(n));
        }
      }
    }

    const hintEl = document.getElementById('ball-in-hand-hint');
    if (hintEl) {
      hintEl.style.display = state.phase === 'BALL_IN_HAND' ? 'block' : 'none';
    }
    syncSettingsSummaries();
  }

  function startTurnTimer() {
    clearInterval(state.timerInterval);
    state.timerSeconds = 60;
    renderTimer();
    state.timerInterval = setInterval(() => {
      if (state.phase === 'MENU' || state.phase === 'GAME_OVER' || state.phase === 'SHOOTING') return;
      state.timerSeconds--;
      renderTimer();
      if (state.timerSeconds <= 0) {
        clearInterval(state.timerInterval);
        handleTimeoutFoul();
      }
    }, 1000);
  }

  function renderTimer() {
    const mins = Math.floor(Math.max(0, state.timerSeconds) / 60);
    const secs = Math.max(0, state.timerSeconds) % 60;
    const textEl = document.getElementById('timer-text');
    const boxEl = document.getElementById('timer-box');
    if (textEl) {
      textEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }
    if (boxEl) {
      boxEl.classList.toggle('warning', state.timerSeconds <= 15);
    }
  }

  function handleTimeoutFoul() {
    playTone(180, 'sawtooth', 0.35, 0.16);
    haptic(60);
    state.turn = state.turn === 1 ? 2 : 1;
    state.phase = 'BALL_IN_HAND';
    updateHUD();
    showTurnModal(state.turn === 1 ? "Player 1's Turn (Ball in Hand)" : (state.opponent === 'ai' ? "AI's Turn" : "Player 2's Turn (Ball in Hand)"));
    startTurnTimer();
    maybeTriggerAI();
  }

  function setupRack() {
    resizeTable();
    state.balls = [];
    state.groups = { 1: null, 2: null };
    state.turn = 1;
    state.spin = { x: 0, y: 0 };
    updateSpinUI();
    state.takoPull = 0;
    updatePowerUI();

    const cueX = playX + playW * 0.25;
    const cueY = playY + playH * 0.5;
    state.balls.push({ num: 0, x: cueX, y: cueY, vx: 0, vy: 0, pocketed: false });

    const apexX = playX + playW * 0.72;
    const apexY = playY + playH * 0.5;
    const spacing = ballR * 2.04;
    const rowDx = spacing * Math.cos(Math.PI / 6);

    if (state.mode === '8ball') {
      const order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
      let idx = 0;
      for (let col = 0; col < 5; col++) {
        const count = col + 1;
        const startY = apexY - ((count - 1) * spacing) / 2;
        for (let r = 0; r < count; r++) {
          state.balls.push({
            num: order[idx++],
            x: apexX + col * rowDx,
            y: startY + r * spacing,
            vx: 0,
            vy: 0,
            pocketed: false
          });
        }
      }
    } else {
      const diamondCols = [
        [1],
        [2, 3],
        [4, 9, 5],
        [6, 7],
        [8]
      ];
      diamondCols.forEach((colNums, colIdx) => {
        const startY = apexY - ((colNums.length - 1) * spacing) / 2;
        colNums.forEach((num, rIdx) => {
          state.balls.push({
            num,
            x: apexX + colIdx * rowDx,
            y: startY + rIdx * spacing,
            vx: 0,
            vy: 0,
            pocketed: false
          });
        });
      });
    }

    state.aimAngle = 0;
    state.phase = 'AIMING';
    state.shotWasBreak = true;
    updateHUD();
    showTurnModal("Player 1's Turn");
    startTurnTimer();
  }

  function getCueBall() {
    return state.balls.find(b => b.num === 0);
  }

  function getLowestTargetNumber() {
    let min = Infinity;
    state.balls.forEach(b => {
      if (!b.pocketed && b.num > 0 && b.num < min) min = b.num;
    });
    return min === Infinity ? null : min;
  }

  function isLegalTarget(ballNum) {
    if (ballNum === 0) return false;
    if (state.mode === '9ball') {
      return ballNum === getLowestTargetNumber();
    }
    const myGroup = state.groups[state.turn];
    if (!myGroup) return ballNum !== 8;
    const remainingGroup = state.balls.some(b => !b.pocketed && (
      myGroup === 'solids' ? (b.num >= 1 && b.num <= 7) : (b.num >= 9 && b.num <= 15)
    ));
    if (!remainingGroup) return ballNum === 8;
    return myGroup === 'solids' ? (ballNum >= 1 && ballNum <= 7) : (ballNum >= 9 && ballNum <= 15);
  }

  function computeTrajectory() {
    const cue = getCueBall();
    if (!cue || cue.pocketed) return null;

    const dx = Math.cos(state.aimAngle);
    const dy = Math.sin(state.aimAngle);
    let minDist = 2000;
    let hitBall = null;
    let hitWallNormal = null;

    if (dx > 0.0001) {
      const t = (playX + playW - ballR - cue.x) / dx;
      if (t > 0 && t < minDist) { minDist = t; hitWallNormal = { x: -1, y: 0 }; }
    } else if (dx < -0.0001) {
      const t = (playX + ballR - cue.x) / dx;
      if (t > 0 && t < minDist) { minDist = t; hitWallNormal = { x: 1, y: 0 }; }
    }
    if (dy > 0.0001) {
      const t = (playY + playH - ballR - cue.y) / dy;
      if (t > 0 && t < minDist) { minDist = t; hitWallNormal = { x: 0, y: -1 }; }
    } else if (dy < -0.0001) {
      const t = (playY + ballR - cue.y) / dy;
      if (t > 0 && t < minDist) { minDist = t; hitWallNormal = { x: 0, y: 1 }; }
    }

    const rSum = ballR * 2;
    state.balls.forEach(b => {
      if (b.num === 0 || b.pocketed) return;
      const ocX = cue.x - b.x;
      const ocY = cue.y - b.y;
      const proj = ocX * dx + ocY * dy;
      if (proj > 0) return;
      const perpSq = (ocX * ocX + ocY * ocY) - proj * proj;
      if (perpSq < rSum * rSum) {
        const thc = Math.sqrt(rSum * rSum - perpSq);
        const t = -proj - thc;
        if (t > 0 && t < minDist) {
          minDist = t;
          hitBall = b;
          hitWallNormal = null;
        }
      }
    });

    const ghostX = cue.x + dx * minDist;
    const ghostY = cue.y + dy * minDist;

    let targetDir = null;
    let cueDeflectDir = null;

    if (hitBall) {
      const nx = (hitBall.x - ghostX) / rSum;
      const ny = (hitBall.y - ghostY) / rSum;
      targetDir = { x: nx, y: ny };

      const dot = dx * nx + dy * ny;
      let tx = dx - dot * nx;
      let ty = dy - dot * ny;
      const tLen = Math.hypot(tx, ty);
      if (tLen > 0.01) {
        tx /= tLen;
        ty /= tLen;
        const followBias = -state.spin.y * 0.45;
        const sideBias = state.spin.x * 0.25;
        const perpX = -ty, perpY = tx;
        let cdx = tx + nx * followBias + perpX * sideBias;
        let cdy = ty + ny * followBias + perpY * sideBias;
        const cLen = Math.hypot(cdx, cdy) || 1;
        cueDeflectDir = { x: cdx / cLen, y: cdy / cLen };
      }
    } else if (hitWallNormal) {
      const dot = dx * hitWallNormal.x + dy * hitWallNormal.y;
      cueDeflectDir = {
        x: dx - 2 * dot * hitWallNormal.x,
        y: dy - 2 * dot * hitWallNormal.y
      };
    }

    return { cue, ghostX, ghostY, hitBall, targetDir, cueDeflectDir };
  }

  function shootCueBall() {
    const cue = getCueBall();
    if (!cue || state.takoPull < 0.06) {
      state.takoPull = 0;
      updatePowerUI();
      return;
    }

    const maxSpeed = 23.5;
    const speed = (0.14 + state.takoPull * 0.86) * maxSpeed;
    const squirtAngle = state.spin.x * 0.028 * state.takoPull;
    const finalAngle = state.aimAngle + squirtAngle;

    cue.vx = Math.cos(finalAngle) * speed;
    cue.vy = Math.sin(finalAngle) * speed;
    cue.spinX = state.spin.x;
    cue.spinY = state.spin.y;

    state.pocketedThisShot = [];
    state.firstHitBall = null;
    state.railHitAfterContact = false;
    state.phase = 'SHOOTING';
    state.takoPull = 0;
    updatePowerUI();

    playTone(260 + speed * 14, 'triangle', 0.14, 0.22);
    haptic(25);
  }

  function stepPhysics() {
    if (state.phase !== 'SHOOTING') return;

    const subSteps = 4;
    const friction = Math.pow(0.9865, 1 / subSteps);
    let anyMoving = false;

    for (let step = 0; step < subSteps; step++) {
      for (let i = 0; i < state.balls.length; i++) {
        const b = state.balls[i];
        if (b.pocketed) continue;

        b.x += b.vx / subSteps;
        b.y += b.vy / subSteps;

        if (b.num === 0 && (b.spinY || b.spinX)) {
          const spd = Math.hypot(b.vx, b.vy);
          if (spd > 0.2) {
            const ux = b.vx / spd;
            const uy = b.vy / spd;
            b.vx += (-uy * b.spinX * 0.014 + ux * (-b.spinY) * 0.018) / subSteps;
            b.vy += (ux * b.spinX * 0.014 + uy * (-b.spinY) * 0.018) / subSteps;
            b.spinX *= 0.992;
            b.spinY *= 0.992;
          }
        }

        b.vx *= friction;
        b.vy *= friction;

        if (Math.hypot(b.vx, b.vy) < 0.045) {
          b.vx = 0;
          b.vy = 0;
        } else {
          anyMoving = true;
        }

        for (let p = 0; p < pockets.length; p++) {
          const pk = pockets[p];
          if (Math.hypot(b.x - pk.x, b.y - pk.y) < pocketR * 0.92) {
            b.pocketed = true;
            b.vx = 0;
            b.vy = 0;
            state.pocketedThisShot.push(b.num);
            showPocketedAnimation(b.num);
            playTone(130, 'sine', 0.26, 0.24);
            haptic(35);
            break;
          }
        }
        if (b.pocketed) continue;

        let hitRail = false;
        if (b.x - ballR < playX) {
          b.x = playX + ballR;
          b.vx = Math.abs(b.vx) * 0.84;
          hitRail = true;
        } else if (b.x + ballR > playX + playW) {
          b.x = playX + playW - ballR;
          b.vx = -Math.abs(b.vx) * 0.84;
          hitRail = true;
        }
        if (b.y - ballR < playY) {
          b.y = playY + ballR;
          b.vy = Math.abs(b.vy) * 0.84;
          hitRail = true;
        } else if (b.y + ballR > playY + playH) {
          b.y = playY + playH - ballR;
          b.vy = -Math.abs(b.vy) * 0.84;
          hitRail = true;
        }
        if (hitRail) {
          if (state.firstHitBall !== null) state.railHitAfterContact = true;
          if (step === 0) playTone(165, 'sine', 0.06, 0.06);
        }
      }

      for (let i = 0; i < state.balls.length; i++) {
        const a = state.balls[i];
        if (a.pocketed) continue;
        for (let j = i + 1; j < state.balls.length; j++) {
          const b = state.balls[j];
          if (b.pocketed) continue;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          const minD = ballR * 2;

          if (dist > 0 && dist < minD) {
            if (state.firstHitBall === null) {
              if (a.num === 0) state.firstHitBall = b.num;
              else if (b.num === 0) state.firstHitBall = a.num;
            }

            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = (minD - dist) * 0.5;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;

            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const velAlongNormal = rvx * nx + rvy * ny;

            if (velAlongNormal < 0) {
              const restitution = 0.94;
              const impulse = -(1 + restitution) * velAlongNormal * 0.5;
              a.vx -= impulse * nx;
              a.vy -= impulse * ny;
              b.vx += impulse * nx;
              b.vy += impulse * ny;

              if (a.num === 0 && a.spinY) {
                a.vx += nx * (-a.spinY) * 1.1;
                a.vy += ny * (-a.spinY) * 1.1;
                a.spinY *= 0.4;
              } else if (b.num === 0 && b.spinY) {
                b.vx += (-nx) * (-b.spinY) * 1.1;
                b.vy += (-ny) * (-b.spinY) * 1.1;
                b.spinY *= 0.4;
              }

              const impact = Math.min(1, Math.abs(velAlongNormal) / 14);
              if (impact > 0.08) playTone(520 + impact * 420, 'sine', 0.05, impact * 0.14);
            }
          }
        }
      }
    }

    if (!anyMoving) {
      evaluateShotOutcome();
    }
  }

  function evaluateShotOutcome() {
    const scratched = state.pocketedThisShot.includes(0);
    const objectPocketed = state.pocketedThisShot.filter(n => n !== 0);
    const otherPlayer = state.turn === 1 ? 2 : 1;

    if (scratched) {
      const cue = getCueBall();
      if (cue) {
        cue.pocketed = false;
        cue.x = playX + playW * 0.25;
        cue.y = playY + playH * 0.5;
      }
    }

    if (state.mode === '9ball') {
      const ninePocketed = objectPocketed.includes(9);
      const foul = scratched || state.firstHitBall === null;
      if (ninePocketed && !foul) {
        endMatch(state.turn, '9-Ball pocketed legally!');
        return;
      }
      if (ninePocketed && foul) {
        const nine = state.balls.find(b => b.num === 9);
        if (nine) {
          nine.pocketed = false;
          nine.x = playX + playW * 0.72;
          nine.y = playY + playH * 0.5;
        }
      }
      if (foul) {
        state.turn = otherPlayer;
        state.phase = 'BALL_IN_HAND';
      } else if (objectPocketed.length > 0) {
        state.phase = 'AIMING';
      } else {
        state.turn = otherPlayer;
        state.phase = 'AIMING';
      }
    } else {
      const eightPocketed = objectPocketed.includes(8);
      const myGroup = state.groups[state.turn];
      const hadClearedGroup = myGroup && !state.balls.some(b =>
        !b.pocketed && b.num !== 8 && (myGroup === 'solids' ? b.num <= 7 : b.num >= 9)
      );

      if (eightPocketed) {
        if (scratched || !hadClearedGroup) {
          endMatch(otherPlayer, `Player ${state.turn} pocketed the 8-Ball early / fouled!`);
        } else {
          endMatch(state.turn, '8-Ball pocketed cleanly for the win!');
        }
        return;
      }

      let foul = scratched || state.firstHitBall === null;
      if (!foul && !state.shotWasBreak && myGroup) {
        const hitSolids = state.firstHitBall >= 1 && state.firstHitBall <= 7;
        const hitStripes = state.firstHitBall >= 9 && state.firstHitBall <= 15;
        if (hadClearedGroup) {
          if (state.firstHitBall !== 8) foul = true;
        } else if ((myGroup === 'solids' && !hitSolids) || (myGroup === 'stripes' && !hitStripes)) {
          foul = true;
        }
      }

      if (!foul && !state.shotWasBreak && !state.groups[1] && objectPocketed.length > 0) {
        const firstScored = objectPocketed[0];
        if (firstScored >= 1 && firstScored <= 7) {
          state.groups[state.turn] = 'solids';
          state.groups[otherPlayer] = 'stripes';
        } else if (firstScored >= 9 && firstScored <= 15) {
          state.groups[state.turn] = 'stripes';
          state.groups[otherPlayer] = 'solids';
        }
      }

      let keepTurn = false;
      if (!foul && objectPocketed.length > 0) {
        const updatedGroup = state.groups[state.turn];
        if (!updatedGroup) {
          keepTurn = true;
        } else {
          keepTurn = objectPocketed.some(n =>
            updatedGroup === 'solids' ? (n >= 1 && n <= 7) : (n >= 9 && n <= 15)
          );
        }
      }

      if (foul) {
        state.turn = otherPlayer;
        state.phase = 'BALL_IN_HAND';
      } else if (keepTurn) {
        state.phase = 'AIMING';
      } else {
        state.turn = otherPlayer;
        state.phase = 'AIMING';
      }
    }

    state.shotWasBreak = false;
    state.spin = { x: 0, y: 0 };
    updateSpinUI();
    updateHUD();
    showTurnModal();
    startTurnTimer();
    maybeTriggerAI();
  }

  function endMatch(winnerNum, reason) {
    state.phase = 'GAME_OVER';
    clearInterval(state.timerInterval);
    playTone(587, 'triangle', 0.45, 0.25);
    haptic([40, 40, 80]);
    const winnerLabel = (winnerNum === 2 && state.opponent === 'ai')
      ? '🤖 AI Wins!'
      : `🏆 P${winnerNum} Wins!`;
    const titleEl = document.getElementById('winner-title');
    const reasonEl = document.getElementById('winner-reason');
    const modalEl = document.getElementById('gameover-modal');
    if (titleEl) titleEl.textContent = winnerLabel;
    if (reasonEl) reasonEl.textContent = reason;
    if (modalEl) modalEl.classList.remove('hidden');
  }

  function maybeTriggerAI() {
    clearTimeout(state.aiTimer);
    if (state.opponent !== 'ai' || state.turn !== 2) return;
    if (state.phase !== 'AIMING' && state.phase !== 'BALL_IN_HAND') return;

    state.aiTimer = setTimeout(() => {
      const cue = getCueBall();
      if (!cue) return;

      if (state.phase === 'BALL_IN_HAND') {
        const targets = state.balls.filter(b => !b.pocketed && isLegalTarget(b.num));
        if (targets.length > 0) {
          const t = targets[0];
          cue.x = Math.max(playX + ballR * 2, Math.min(playX + playW - ballR * 2, t.x - playW * 0.18));
          cue.y = Math.max(playY + ballR * 2, Math.min(playY + playH - ballR * 2, t.y));
        }
        state.phase = 'AIMING';
        updateHUD();
      }

      const legalTargets = state.balls.filter(b => !b.pocketed && isLegalTarget(b.num));
      let bestAngle = Math.atan2((playY + playH / 2) - cue.y, (playX + playW * 0.72) - cue.x);
      let bestScore = -Infinity;

      legalTargets.forEach(t => {
        pockets.forEach(pk => {
          const toPkX = pk.x - t.x;
          const toPkY = pk.y - t.y;
          const distPk = Math.hypot(toPkX, toPkY) || 1;
          const ghostX = t.x - (toPkX / distPk) * (ballR * 2);
          const ghostY = t.y - (toPkY / distPk) * (ballR * 2);
          const shotAngle = Math.atan2(ghostY - cue.y, ghostX - cue.x);

          const cutCos = Math.cos(shotAngle) * (toPkX / distPk) + Math.sin(shotAngle) * (toPkY / distPk);
          if (cutCos > 0.15) {
            const score = cutCos * 120 - distPk * 0.15;
            if (score > bestScore) {
              bestScore = score;
              bestAngle = shotAngle;
            }
          }
        });
      });

      const jitterMap = { easy: 0.11, medium: 0.045, hard: 0.012 };
      const jitter = (Math.random() - 0.5) * (jitterMap[state.aiDiff] || 0.045);
      state.aimAngle = bestAngle + jitter;

      let pullStep = 0;
      const targetPull = state.shotWasBreak ? 0.92 : (0.48 + Math.random() * 0.28);
      const pullAnim = setInterval(() => {
        pullStep += 0.12;
        state.takoPull = Math.min(targetPull, pullStep);
        updatePowerUI();
        if (state.takoPull >= targetPull) {
          clearInterval(pullAnim);
          setTimeout(() => shootCueBall(), 180);
        }
      }, 35);
    }, 850);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    const frameGrad = ctx.createLinearGradient(0, 0, W, H);
    frameGrad.addColorStop(0, '#5c2d16');
    frameGrad.addColorStop(0.5, '#3e1d0d');
    frameGrad.addColorStop(1, '#2b1207');
    ctx.fillStyle = frameGrad;
    roundRect(ctx, 0, 0, W, H, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, W - 2, H - 2, 15);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    for (let i = 1; i <= 3; i++) {
      const dx = playX + (playW * i) / 4;
      drawDiamond(dx, rail * 0.45);
      drawDiamond(dx, H - rail * 0.45);
    }
    for (let i = 1; i <= 1; i++) {
      const dy = playY + playH * 0.5;
      drawDiamond(rail * 0.45, dy);
      drawDiamond(W - rail * 0.45, dy);
    }

    const feltGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 20, W * 0.5, H * 0.5, W * 0.65);
    feltGrad.addColorStop(0, '#0f766e');
    feltGrad.addColorStop(0.65, '#0d5c56');
    feltGrad.addColorStop(1, '#083f3b');
    ctx.fillStyle = feltGrad;
    ctx.fillRect(playX, playY, playW, playH);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(playX + playW * 0.25, playY);
    ctx.lineTo(playX + playW * 0.25, playY + playH);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(playX + playW * 0.72, playY + playH * 0.5, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 4;
    ctx.strokeRect(playX, playY, playW, playH);

    pockets.forEach(pk => {
      ctx.beginPath();
      ctx.arc(pk.x, pk.y, pocketR + 3, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pk.x, pk.y, pocketR, 0, Math.PI * 2);
      ctx.fillStyle = '#030712';
      ctx.fill();
    });

    if (state.phase === 'AIMING' || state.phase === 'BALL_IN_HAND') {
      const traj = computeTrajectory();
      if (traj) {
        const { cue, ghostX, ghostY, hitBall, targetDir, cueDeflectDir } = traj;

        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.moveTo(cue.x, cue.y);
        if (state.guideMode === 'short') {
          const shortDist = Math.min(Math.hypot(ghostX - cue.x, ghostY - cue.y), 140);
          ctx.lineTo(cue.x + Math.cos(state.aimAngle) * shortDist, cue.y + Math.sin(state.aimAngle) * shortDist);
        } else {
          ctx.lineTo(ghostX, ghostY);
        }
        ctx.stroke();
        ctx.restore();

        if (state.guideMode === 'full') {
          ctx.beginPath();
          ctx.arc(ghostX, ghostY, ballR, 0, Math.PI * 2);
          ctx.strokeStyle = hitBall ? 'rgba(251, 191, 36, 0.85)' : 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          if (hitBall && targetDir) {
            const legal = isLegalTarget(hitBall.num);
            ctx.beginPath();
            ctx.moveTo(hitBall.x, hitBall.y);
            ctx.lineTo(hitBall.x + targetDir.x * 95, hitBall.y + targetDir.y * 95);
            ctx.strokeStyle = legal ? '#34d399' : '#f87171';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }

          if (cueDeflectDir) {
            ctx.beginPath();
            ctx.moveTo(ghostX, ghostY);
            ctx.lineTo(ghostX + cueDeflectDir.x * 65, ghostY + cueDeflectDir.y * 65);
            ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
            ctx.lineWidth = 1.8;
            ctx.stroke();
          }
        }
      }
    }

    state.balls.forEach(b => {
      if (b.pocketed) return;
      drawBall(b);
    });

    if (state.phase === 'AIMING' || state.phase === 'BALL_IN_HAND') {
      const cue = getCueBall();
      if (cue && !cue.pocketed) {
        drawTako(cue, state.aimAngle, state.takoPull);
      }
    }

    stepPhysics();
    requestAnimationFrame(render);
  }

  function drawBall(b) {
    ctx.beginPath();
    ctx.arc(b.x + 2.5, b.y + 3, ballR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(b.x, b.y, ballR, 0, Math.PI * 2);
    ctx.clip();

    if (b.num === 0) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(b.x - ballR, b.y - ballR, ballR * 2, ballR * 2);
      ctx.beginPath();
      ctx.arc(b.x + state.spin.x * ballR * 0.45, b.y + state.spin.y * ballR * 0.45, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    } else if (b.num >= 9) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(b.x - ballR, b.y - ballR, ballR * 2, ballR * 2);
      ctx.fillStyle = BALL_COLORS[b.num];
      ctx.fillRect(b.x - ballR, b.y - ballR * 0.56, ballR * 2, ballR * 1.12);
    } else {
      ctx.fillStyle = BALL_COLORS[b.num];
      ctx.fillRect(b.x - ballR, b.y - ballR, ballR * 2, ballR * 2);
    }

    const shine = ctx.createRadialGradient(
      b.x - ballR * 0.35, b.y - ballR * 0.35, 1,
      b.x, b.y, ballR
    );
    shine.addColorStop(0, 'rgba(255,255,255,0.65)');
    shine.addColorStop(0.45, 'rgba(255,255,255,0.08)');
    shine.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = shine;
    ctx.fillRect(b.x - ballR, b.y - ballR, ballR * 2, ballR * 2);

    if (b.num > 0) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, ballR * 0.46, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = `900 ${Math.max(8, Math.round(ballR * 0.72))}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(b.num), b.x, b.y + 0.5);
    }

    ctx.restore();
  }

  function drawTako(cue, angle, pull) {
    const backDirX = -Math.cos(angle);
    const backDirY = -Math.sin(angle);
    const pullOffset = ballR + 8 + pull * 105;
    const stickLen = Math.min(240, playW * 0.36);

    const tipX = cue.x + backDirX * pullOffset;
    const tipY = cue.y + backDirY * pullOffset;
    const buttX = tipX + backDirX * stickLen;
    const buttY = tipY + backDirY * stickLen;

    ctx.save();
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(tipX + 4, tipY + 6);
    ctx.lineTo(buttX + 4, buttY + 6);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 7;
    ctx.stroke();

    const shaftGrad = ctx.createLinearGradient(tipX, tipY, buttX, buttY);
    shaftGrad.addColorStop(0, '#fde68a');
    shaftGrad.addColorStop(0.45, '#d97706');
    shaftGrad.addColorStop(0.48, '#1e293b');
    shaftGrad.addColorStop(1, '#451a03');

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(buttX, buttY);
    ctx.strokeStyle = shaftGrad;
    ctx.lineWidth = 6.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(tipX, tipY, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    if (pull > 0.04) {
      ctx.beginPath();
      ctx.arc(cue.x, cue.y, ballR + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pull);
      ctx.strokeStyle = pull > 0.78 ? '#ef4444' : (pull > 0.45 ? '#f59e0b' : '#10b981');
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawDiamond(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-2.5, -2.5, 5, 5);
    ctx.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function isUserTurn() {
    if (state.phase !== 'AIMING' && state.phase !== 'BALL_IN_HAND') return false;
    if (state.opponent === 'ai' && state.turn === 2) return false;
    return true;
  }

  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (W / rect.width),
      y: (clientY - rect.top) * (H / rect.height)
    };
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!isUserTurn()) return;
    canvas.setPointerCapture(e.pointerId);
    const pos = getCanvasCoords(e);
    state.pointerStart = pos;
    state.pointerMoved = false;
    state.lastPointer = pos;
    const cue = getCueBall();
    if (!cue) return;

    if (state.phase === 'BALL_IN_HAND' && Math.hypot(pos.x - cue.x, pos.y - cue.y) < ballR * 2.6) {
      state.dragMode = 'PLACE_CUE';
      return;
    }

    const backX = -Math.cos(state.aimAngle);
    const backY = -Math.sin(state.aimAngle);
    const tipX = cue.x + backX * (ballR + 8);
    const tipY = cue.y + backY * (ballR + 8);
    const buttX = tipX + backX * Math.min(240, playW * 0.36);
    const buttY = tipY + backY * Math.min(240, playW * 0.36);

    if (distToSegment(pos.x, pos.y, tipX, tipY, buttX, buttY) < 28) {
      state.dragMode = 'TAKO_PULL';
      return;
    }

    state.dragMode = 'AIM';
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!state.dragMode || !isUserTurn()) return;
    const pos = getCanvasCoords(e);
    if (Math.hypot(pos.x - state.pointerStart.x, pos.y - state.pointerStart.y) > 5) {
      state.pointerMoved = true;
    }
    const cue = getCueBall();
    if (!cue) return;

    if (state.dragMode === 'PLACE_CUE') {
      const nx = Math.max(playX + ballR, Math.min(playX + playW - ballR, pos.x));
      const ny = Math.max(playY + ballR, Math.min(playY + playH - ballR, pos.y));
      const overlaps = state.balls.some(b =>
        b.num !== 0 && !b.pocketed && Math.hypot(b.x - nx, b.y - ny) < ballR * 2.05
      );
      if (!overlaps) {
        cue.x = nx;
        cue.y = ny;
      }
      return;
    }

    if (state.dragMode === 'TAKO_PULL') {
      const backX = -Math.cos(state.aimAngle);
      const backY = -Math.sin(state.aimAngle);
      const relX = pos.x - cue.x;
      const relY = pos.y - cue.y;
      const proj = relX * backX + relY * backY - (ballR + 12);
      state.takoPull = Math.max(0, Math.min(1, proj / 120));
      updatePowerUI();
      return;
    }

    if (state.dragMode === 'AIM') {
      const prevAng = Math.atan2(state.lastPointer.y - cue.y, state.lastPointer.x - cue.x);
      const currAng = Math.atan2(pos.y - cue.y, pos.x - cue.x);
      let delta = currAng - prevAng;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      state.aimAngle += delta * state.aimSensitivity;
      state.lastPointer = pos;
    }
  });

  canvas.addEventListener('pointerup', () => {
    if (state.dragMode === 'TAKO_PULL') {
      if (state.takoPull >= 0.06) {
        if (state.phase === 'BALL_IN_HAND') state.phase = 'AIMING';
        shootCueBall();
      } else {
        state.takoPull = 0;
        updatePowerUI();
      }
    } else if (state.dragMode === 'AIM' && state.tapToAim && !state.pointerMoved) {
      const cue = getCueBall();
      if (cue && !cue.pocketed && Math.hypot(state.pointerStart.x - cue.x, state.pointerStart.y - cue.y) > ballR) {
        state.aimAngle = Math.atan2(state.pointerStart.y - cue.y, state.pointerStart.x - cue.x);
        haptic(8);
      }
    }
    state.dragMode = null;
    state.pointerMoved = false;
  });

  const powerRail = document.getElementById('power-rail');
  let railDragging = false;
  let railStartY = 0;

  function updatePowerUI() {
    const pct = Math.round(state.takoPull * 100);
    const fillEl = document.getElementById('power-fill');
    const gripEl = document.getElementById('power-grip');
    const pctEl = document.getElementById('power-pct');
    if (fillEl) fillEl.style.height = pct + '%';
    if (gripEl) gripEl.style.top = (4 + state.takoPull * 72) + '%';
    if (pctEl) pctEl.textContent = pct + '%';
  }

  if (powerRail) {
    powerRail.addEventListener('pointerdown', (e) => {
      if (!isUserTurn()) return;
      powerRail.setPointerCapture(e.pointerId);
      railDragging = true;
      railStartY = e.clientY;
    });

    powerRail.addEventListener('pointermove', (e) => {
      if (!railDragging || !isUserTurn()) return;
      const dy = e.clientY - railStartY;
      const h = powerRail.getBoundingClientRect().height || 130;
      state.takoPull = Math.max(0, Math.min(1, dy / (h * 0.78)));
      updatePowerUI();
    });

    powerRail.addEventListener('pointerup', () => {
      if (!railDragging) return;
      railDragging = false;
      if (state.takoPull >= 0.06) {
        if (state.phase === 'BALL_IN_HAND') state.phase = 'AIMING';
        shootCueBall();
      } else {
        state.takoPull = 0;
        updatePowerUI();
      }
    });
  }

  const aimWheel = document.getElementById('aim-wheel');
  const aimTicks = aimWheel ? aimWheel.querySelector('.aim-ticks') : null;
  let wheelDragging = false;
  let wheelLastY = 0;
  let tickOffset = 0;

  if (aimWheel) {
    aimWheel.addEventListener('pointerdown', (e) => {
      if (!isUserTurn()) return;
      aimWheel.setPointerCapture(e.pointerId);
      wheelDragging = true;
      wheelLastY = e.clientY;
    });

    aimWheel.addEventListener('pointermove', (e) => {
      if (!wheelDragging || !isUserTurn()) return;
      const dy = e.clientY - wheelLastY;
      wheelLastY = e.clientY;
      state.aimAngle += dy * 0.008 * state.fineAimSpeed;
      tickOffset += dy;
      if (aimTicks) aimTicks.style.backgroundPositionY = tickOffset + 'px';
    });

    aimWheel.addEventListener('pointerup', () => { wheelDragging = false; });
  }

  document.getElementById('btn-aim-ccw')?.addEventListener('click', () => {
    if (!isUserTurn()) return;
    state.aimAngle -= 0.008 * state.fineAimSpeed * 3;
    haptic(8);
  });

  document.getElementById('btn-aim-cw')?.addEventListener('click', () => {
    if (!isUserTurn()) return;
    state.aimAngle += 0.008 * state.fineAimSpeed * 3;
    haptic(8);
  });

  // Cue Spin Modal Overlay (opens on tap, applies spin, auto-returns to game screen)
  const spinDot = document.getElementById('spin-dot');
  const spinReadout = document.getElementById('spin-readout');
  const spinModal = document.getElementById('spin-modal');
  const spinModalPad = document.getElementById('spin-modal-pad');
  const spinModalDot = document.getElementById('spin-modal-dot');
  const spinModalReadout = document.getElementById('spin-modal-readout');
  let modalSpinDragging = false;
  let autoReturnTimer = null;

  function formatSpinLabel() {
    if (Math.abs(state.spin.x) < 0.12 && Math.abs(state.spin.y) < 0.12) {
      return 'CENTER';
    }
    const v = state.spin.y < -0.15 ? 'TOP' : (state.spin.y > 0.15 ? 'BACK' : '');
    const h = state.spin.x < -0.15 ? 'L' : (state.spin.x > 0.15 ? 'R' : '');
    return [v, h].filter(Boolean).join(' ') || 'CENTER';
  }

  function updateSpinUI() {
    const leftPct = (50 + state.spin.x * 36) + '%';
    const topPct = (50 + state.spin.y * 36) + '%';
    const label = formatSpinLabel();

    if (spinDot) {
      spinDot.style.left = leftPct;
      spinDot.style.top = topPct;
    }
    if (spinModalDot) {
      spinModalDot.style.left = leftPct;
      spinModalDot.style.top = topPct;
    }
    if (spinReadout) spinReadout.textContent = label;
    if (spinModalReadout) spinModalReadout.textContent = label;
  }

  function closeSpinModalNow() {
    clearTimeout(autoReturnTimer);
    modalSpinDragging = false;
    spinModal?.classList.add('hidden');
  }

  function scheduleAutoReturnToGame() {
    clearTimeout(autoReturnTimer);
    autoReturnTimer = setTimeout(() => {
      closeSpinModalNow();
    }, 240);
  }

  function applyModalSpinFromEvent(e) {
    if (!spinModalPad) return;
    const rect = spinModalPad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > maxR) {
      dx = (dx / d) * maxR;
      dy = (dy / d) * maxR;
    }
    state.spin.x = +(dx / maxR).toFixed(2);
    state.spin.y = +(dy / maxR).toFixed(2);
    updateSpinUI();
    haptic(10);
  }

  document.getElementById('btn-open-spin-modal')?.addEventListener('click', () => {
    if (!isUserTurn()) return;
    clearTimeout(autoReturnTimer);
    updateSpinUI();
    spinModal?.classList.remove('hidden');
  });

  document.getElementById('btn-close-spin-modal')?.addEventListener('click', closeSpinModalNow);

  document.getElementById('btn-modal-reset-spin')?.addEventListener('click', () => {
    state.spin = { x: 0, y: 0 };
    updateSpinUI();
    haptic(10);
    scheduleAutoReturnToGame();
  });

  if (spinModalPad) {
    spinModalPad.addEventListener('pointerdown', (e) => {
      if (!isUserTurn()) return;
      clearTimeout(autoReturnTimer);
      spinModalPad.setPointerCapture(e.pointerId);
      modalSpinDragging = true;
      applyModalSpinFromEvent(e);
    });

    spinModalPad.addEventListener('pointermove', (e) => {
      if (!modalSpinDragging || !isUserTurn()) return;
      applyModalSpinFromEvent(e);
    });

    spinModalPad.addEventListener('pointerup', () => {
      if (!modalSpinDragging) return;
      modalSpinDragging = false;
      scheduleAutoReturnToGame();
    });
  }

  function bindSegRow(id, callback) {
    const row = document.getElementById(id);
    if (!row) return;
    row.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        row.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        callback(btn.dataset.val);
      });
    });
  }

  let draftMode = state.mode;
  let draftOpponent = state.opponent;
  let draftDiff = state.aiDiff;

  function syncChoiceTiles(containerId, activeVal) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.querySelectorAll('.choice-tile').forEach(tile => {
      tile.classList.toggle('active', tile.dataset.val === activeVal);
    });
  }

  function bindChoiceTiles(containerId, onSelect) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.querySelectorAll('.choice-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        wrap.querySelectorAll('.choice-tile').forEach(t => t.classList.remove('active'));
        tile.classList.add('active');
        onSelect(tile.dataset.val);
      });
    });
  }

  bindChoiceTiles('modal-opt-mode', val => { draftMode = val; });
  bindChoiceTiles('modal-opt-opponent', val => { draftOpponent = val; });
  bindChoiceTiles('modal-opt-diff', val => { draftDiff = val; });

  document.getElementById('btn-open-mode-modal')?.addEventListener('click', () => {
    draftMode = state.mode;
    syncChoiceTiles('modal-opt-mode', draftMode);
    document.getElementById('mode-modal')?.classList.remove('hidden');
  });
  document.getElementById('btn-close-mode-modal')?.addEventListener('click', () => {
    document.getElementById('mode-modal')?.classList.add('hidden');
  });
  document.getElementById('btn-apply-mode-modal')?.addEventListener('click', () => {
    const changed = state.mode !== draftMode;
    state.mode = draftMode;
    document.getElementById('mode-modal')?.classList.add('hidden');
    updateHUD();
    if (changed && state.phase !== 'MENU') {
      setupRack();
    }
  });

  document.getElementById('btn-open-opponent-modal')?.addEventListener('click', () => {
    draftOpponent = state.opponent;
    syncChoiceTiles('modal-opt-opponent', draftOpponent);
    document.getElementById('opponent-modal')?.classList.remove('hidden');
  });
  document.getElementById('btn-close-opponent-modal')?.addEventListener('click', () => {
    document.getElementById('opponent-modal')?.classList.add('hidden');
  });
  document.getElementById('btn-apply-opponent-modal')?.addEventListener('click', () => {
    state.opponent = draftOpponent;
    document.getElementById('opponent-modal')?.classList.add('hidden');
    updateHUD();
    maybeTriggerAI();
  });

  document.getElementById('btn-open-diff-modal')?.addEventListener('click', () => {
    draftDiff = state.aiDiff;
    syncChoiceTiles('modal-opt-diff', draftDiff);
    document.getElementById('diff-modal')?.classList.remove('hidden');
  });
  document.getElementById('btn-close-diff-modal')?.addEventListener('click', () => {
    document.getElementById('diff-modal')?.classList.add('hidden');
  });
  document.getElementById('btn-apply-diff-modal')?.addEventListener('click', () => {
    state.aiDiff = draftDiff;
    document.getElementById('diff-modal')?.classList.add('hidden');
    updateHUD();
  });

  bindSegRow('opt-tap-aim', val => { state.tapToAim = (val === 'on'); });
  bindSegRow('opt-guide', val => { state.guideMode = val; });
  bindSegRow('opt-sfx', val => {
    state.sfx = (val === 'on');
    refreshSettingsAudioButtonLabel();
  });

  document.getElementById('btn-start-match')?.addEventListener('click', () => {
    markGateHandledOnce();
    try { sessionStorage.removeItem(ENTER_FS_FROM_HUB_KEY); } catch (_) {}
    BilliardLandscapeGuard.requestFullscreenSafe(false);
    BilliardLandscapeGuard.tryLockLandscape();
    BilliardLandscapeGuard.sync();
    document.getElementById('setup-modal')?.classList.add('hidden');
    setupRack();
    setTimeout(resizeTable, 120);
  });

  document.getElementById('btn-new-match')?.addEventListener('click', () => {
    clearInterval(state.timerInterval);
    clearTimeout(state.aiTimer);
    state.phase = 'MENU';
    document.getElementById('setup-modal')?.classList.remove('hidden');
  });

  document.getElementById('btn-rematch')?.addEventListener('click', () => {
    markGateHandledOnce();
    BilliardLandscapeGuard.requestFullscreenSafe(false);
    BilliardLandscapeGuard.tryLockLandscape();
    BilliardLandscapeGuard.sync();
    document.getElementById('gameover-modal')?.classList.add('hidden');
    setupRack();
    setTimeout(resizeTable, 120);
  });

  document.getElementById('btn-settings')?.addEventListener('click', () => {
    ensureSettingsHubAndAudioControls();
    syncSettingsSummaries();
    document.getElementById('settings-modal')?.classList.remove('hidden');
  });
  document.getElementById('btn-close-settings')?.addEventListener('click', () => {
    document.getElementById('settings-modal')?.classList.add('hidden');
  });
  document.getElementById('btn-save-settings')?.addEventListener('click', () => {
    document.getElementById('settings-modal')?.classList.add('hidden');
  });

  document.getElementById('btn-setup-hub')?.addEventListener('click', (e) => {
    e.preventDefault();
    goToHubLobby();
  });

  document.getElementById('btn-gameover-hub')?.addEventListener('click', (e) => {
    e.preventDefault();
    goToHubLobby();
  });

  window.goToArcadeHub = goToHubLobby;
  window.toggleBilliardFullscreen = () => {
    BilliardLandscapeGuard.requestFullscreenSafe(true);
    BilliardLandscapeGuard.tryLockLandscape();
    BilliardLandscapeGuard.sync();
  };

  const sliderSens = document.getElementById('slider-sens');
  const sliderFine = document.getElementById('slider-fine');
  sliderSens?.addEventListener('input', () => {
    state.aimSensitivity = parseFloat(sliderSens.value);
    const valEl = document.getElementById('sens-val');
    if (valEl) valEl.textContent = state.aimSensitivity.toFixed(2) + '×';
  });
  sliderFine?.addEventListener('input', () => {
    state.fineAimSpeed = parseFloat(sliderFine.value);
    const valEl = document.getElementById('fine-val');
    if (valEl) valEl.textContent = state.fineAimSpeed.toFixed(2) + '×';
  });

  BilliardLandscapeGuard.init();
  ensureSettingsHubAndAudioControls();
  syncSettingsSummaries();
  syncPlayerNameFromHub();
  resizeTable();
  requestAnimationFrame(render);
})();