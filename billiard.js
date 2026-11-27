window.initBilliardPool = function initBilliardPool(stage, meta = {}) {
  if (!stage) return () => {};

  const PLAYER_NAME_KEY = 'arcade_hub_player_name';
  const ENTER_FS_FROM_HUB_KEY = 'arcade_hub_enter_fullscreen_on_billiard';
  const INITIAL_GATE_SEEN_KEY = 'arcade_hub_initial_gate_checked';
  const HUB_KEEP_FS_KEY = 'arcade_hub_keep_fullscreen';
  const HUB_AUTO_LANDSCAPE_FS_KEY = 'arcade_hub_auto_landscape_fs';

  let destroyed = false;
  let leavingToHub = false;
  let rafId = null;

  stage.innerHTML = `
    <div id="billiard-runner-root" style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;background:#071312;color:#f8fafc;overflow:hidden;user-select:none;touch-action:none;">
      <div id="top-hud" class="pool-hud" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 14px;background:rgba(15,23,42,0.88);border-bottom:1px solid rgba(255,255,255,0.1);flex-wrap:wrap;z-index:5;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div id="badge-p1" style="padding:4px 10px;border-radius:8px;background:rgba(255,255,255,0.08);font-weight:700;font-size:12px;">
            <span id="p1-name">P1</span> (<span id="p1-group">OPEN</span>)
          </div>
          <div id="badge-p2" style="padding:4px 10px;border-radius:8px;background:rgba(255,255,255,0.08);font-weight:700;font-size:12px;">
            <span id="p2-name">🤖 AI</span> (<span id="p2-group">OPEN</span>)
          </div>
        </div>

        <div id="hud-mode-label" style="font-size:12px;font-weight:700;color:#5eead4;">🎱 8-BALL • 🤖 AI</div>
        <div id="rack-tray" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;"></div>

        <div style="display:flex;align-items:center;gap:8px;">
          <div id="timer-box" style="padding:4px 8px;border-radius:6px;background:rgba(0,0,0,0.35);font-family:monospace;font-size:12px;font-weight:700;">
            <span id="timer-text">01:00</span>
          </div>
          <button id="btn-open-spin-modal" type="button" style="padding:5px 9px;border-radius:7px;border:1px solid rgba(255,255,255,0.18);background:#1e293b;color:#f8fafc;font-size:12px;cursor:pointer;">
            Spin: <span id="spin-readout">CENTER</span>
            <span id="spin-dot" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#ef4444;margin-left:4px;"></span>
          </button>
          <button id="btn-settings" type="button" style="padding:5px 9px;border-radius:7px;border:1px solid rgba(255,255,255,0.18);background:#1e293b;color:#f8fafc;font-size:12px;cursor:pointer;">⚙️</button>
          <button id="btn-setup-hub" type="button" style="padding:5px 9px;border-radius:7px;border:1px solid rgba(255,255,255,0.18);background:#334155;color:#f8fafc;font-size:12px;cursor:pointer;">Hub</button>
        </div>
      </div>

      <div style="position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;gap:10px;padding:6px 10px;">
        <div id="power-rail" style="width:36px;height:140px;border-radius:10px;background:rgba(15,23,42,0.9);border:1px solid rgba(255,255,255,0.15);position:relative;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:6px 0;cursor:pointer;">
          <span style="font-size:10px;font-weight:700;" id="power-pct">0%</span>
          <div style="position:relative;width:8px;flex:1;margin:4px 0;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden;">
            <div id="power-fill" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(to top,#10b981,#f59e0b,#ef4444);"></div>
          </div>
          <div id="power-grip" style="position:absolute;top:4%;left:4px;right:4px;height:10px;border-radius:4px;background:#fbbf24;pointer-events:none;"></div>
        </div>

        <div id="table-wrap" style="flex:1;width:100%;height:100%;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;">
          <canvas id="pool-canvas" style="display:block;max-width:100%;max-height:100%;"></canvas>
        </div>

        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <button id="btn-aim-ccw" type="button" style="width:34px;height:28px;border-radius:6px;border:1px solid rgba(255,255,255,0.18);background:#1e293b;color:#f8fafc;cursor:pointer;">↺</button>
          <div id="aim-wheel" style="width:34px;height:100px;border-radius:10px;background:rgba(15,23,42,0.9);border:1px solid rgba(255,255,255,0.15);overflow:hidden;position:relative;cursor:ns-resize;">
            <div class="aim-ticks" style="width:100%;height:100%;background-image:repeating-linear-gradient(to bottom,rgba(255,255,255,0.35) 0 1px,transparent 1px 10px);"></div>
          </div>
          <button id="btn-aim-cw" type="button" style="width:34px;height:28px;border-radius:6px;border:1px solid rgba(255,255,255,0.18);background:#1e293b;color:#f8fafc;cursor:pointer;">↻</button>
        </div>
      </div>

      <div id="ball-in-hand-hint" style="display:none;position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.9);padding:5px 12px;border-radius:999px;font-size:12px;border:1px solid rgba(94,234,212,0.4);pointer-events:none;">
        Ball in Hand — Drag cue ball to place
      </div>

      <div id="turn-modal-toast" class="hidden" style="position:absolute;top:54px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.94);border:1px solid rgba(251,191,36,0.5);padding:6px 14px;border-radius:999px;font-size:13px;font-weight:700;z-index:15;pointer-events:none;"></div>
      <div id="pocket-anim-badge" class="hidden" style="position:absolute;top:54px;right:16px;background:rgba(15,23,42,0.94);border:1px solid rgba(52,211,153,0.5);padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;z-index:15;pointer-events:none;"></div>

      <div id="spin-modal" class="hidden" style="position:fixed;inset:0;background:rgba(2,6,23,0.72);display:flex;align-items:center;justify-content:center;z-index:40;">
        <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:16px;width:230px;text-align:center;">
          <div style="font-weight:700;margin-bottom:8px;">Cue Spin (<span id="spin-modal-readout">CENTER</span>)</div>
          <div id="spin-modal-pad" style="position:relative;width:130px;height:130px;margin:0 auto 12px;border-radius:50%;background:#f8fafc;border:3px solid #334155;cursor:pointer;">
            <div id="spin-modal-dot" style="position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#ef4444;pointer-events:none;"></div>
          </div>
          <div style="display:flex;gap:8px;justify-content:center;">
            <button id="btn-modal-reset-spin" type="button" style="padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:#1e293b;color:#f8fafc;cursor:pointer;">Reset</button>
            <button id="btn-close-spin-modal" type="button" style="padding:6px 12px;border-radius:8px;border:none;background:#0d9488;color:#fff;font-weight:700;cursor:pointer;">Done</button>
          </div>
        </div>
      </div>

      <div id="setup-modal" class="hidden" style="position:fixed;inset:0;background:rgba(2,6,23,0.78);display:flex;align-items:center;justify-content:center;z-index:40;">
        <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:18px;width:280px;text-align:center;">
          <h3 style="margin:0 0 12px;">Billiard Setup</h3>
          <button id="btn-start-match" type="button" style="width:100%;padding:8px 12px;border-radius:8px;border:none;background:#0d9488;color:#fff;font-weight:700;cursor:pointer;margin-bottom:8px;">Start Rack</button>
          <button id="btn-gameover-hub" type="button" style="width:100%;padding:7px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:#1e293b;color:#f8fafc;cursor:pointer;">Back to Hub</button>
        </div>
      </div>

      <div id="gameover-modal" class="hidden" style="position:fixed;inset:0;background:rgba(2,6,23,0.82);display:flex;align-items:center;justify-content:center;z-index:45;">
        <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:18px;width:290px;text-align:center;">
          <h3 id="winner-title" style="margin:0 0 6px;">Match Over</h3>
          <p id="winner-reason" style="margin:0 0 14px;font-size:13px;color:#cbd5e1;"></p>
          <button id="btn-rematch" type="button" style="width:100%;padding:8px 12px;border-radius:8px;border:none;background:#0d9488;color:#fff;font-weight:700;cursor:pointer;margin-bottom:8px;">Play Again</button>
          <button id="btn-new-match" type="button" style="width:100%;padding:7px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:#1e293b;color:#f8fafc;cursor:pointer;">Match Setup</button>
        </div>
      </div>

      <div id="settings-modal" class="hidden" style="position:fixed;inset:0;background:rgba(2,6,23,0.82);display:flex;align-items:center;justify-content:center;z-index:50;">
        <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:16px;width:320px;max-height:90vh;overflow:auto;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <strong>Pool Settings</strong>
            <button id="btn-close-settings" type="button" style="background:none;border:none;color:#f8fafc;font-size:16px;cursor:pointer;">✕</button>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;">
            <button id="btn-open-mode-modal" type="button" style="display:flex;justify-content:space-between;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.14);background:#1e293b;color:#f8fafc;cursor:pointer;">
              <span>Mode</span><strong id="val-mode-summary">🎱 8-Ball</strong>
            </button>
            <button id="btn-open-opponent-modal" type="button" style="display:flex;justify-content:space-between;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.14);background:#1e293b;color:#f8fafc;cursor:pointer;">
              <span>Opponent</span><strong id="val-opponent-summary">🤖 AI</strong>
            </button>
            <button id="btn-open-diff-modal" type="button" style="display:flex;justify-content:space-between;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.14);background:#1e293b;color:#f8fafc;cursor:pointer;">
              <span>AI Difficulty</span><strong id="val-diff-summary">⚡ Pro</strong>
            </button>

            <div id="opt-tap-aim" style="display:flex;justify-content:space-between;align-items:center;">
              <span>Tap to Aim</span>
              <div>
                <button class="seg-btn active" data-val="on" type="button">On</button>
                <button class="seg-btn" data-val="off" type="button">Off</button>
              </div>
            </div>

            <div id="opt-guide" style="display:flex;justify-content:space-between;align-items:center;">
              <span>Aim Guide</span>
              <div>
                <button class="seg-btn active" data-val="full" type="button">Full</button>
                <button class="seg-btn" data-val="short" type="button">Short</button>
                <button class="seg-btn" data-val="off" type="button">Off</button>
              </div>
            </div>

            <div id="opt-sfx" style="display:flex;justify-content:space-between;align-items:center;">
              <span>Sound & Haptics</span>
              <div>
                <button class="seg-btn active" data-val="on" type="button">On</button>
                <button class="seg-btn" data-val="off" type="button">Off</button>
              </div>
            </div>

            <label>Sensitivity <span id="sens-val">0.45×</span>
              <input id="slider-sens" type="range" min="0.15" max="1.2" step="0.05" value="0.45" style="width:100%;">
            </label>
            <label>Fine Aim <span id="fine-val">0.20×</span>
              <input id="slider-fine" type="range" min="0.05" max="0.8" step="0.05" value="0.20" style="width:100%;">
            </label>

            <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
              <button id="btn-dock-restart" type="button" style="flex:1;padding:6px;border-radius:7px;border:1px solid rgba(255,255,255,0.18);background:#1e293b;color:#f8fafc;cursor:pointer;">Restart</button>
              <button id="btn-dock-fs" type="button" style="flex:1;padding:6px;border-radius:7px;border:1px solid rgba(255,255,255,0.18);background:#1e293b;color:#f8fafc;cursor:pointer;">Fullscreen</button>
              <button id="btn-dock-hub" type="button" style="flex:1;padding:6px;border-radius:7px;border:1px solid rgba(255,255,255,0.18);background:#334155;color:#f8fafc;cursor:pointer;">Hub</button>
            </div>
            <div style="display:flex;gap:8px;margin-top:6px;">
              <button id="btn-save-settings" type="button" style="flex:1;padding:7px;border-radius:8px;border:none;background:#0d9488;color:#fff;font-weight:700;cursor:pointer;">Save</button>
              <button id="btn-dock-done" type="button" style="flex:1;padding:7px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:#1e293b;color:#f8fafc;cursor:pointer;">Done</button>
            </div>
          </div>
        </div>
      </div>

      <div id="mode-modal" class="hidden" style="position:fixed;inset:0;background:rgba(2,6,23,0.85);display:flex;align-items:center;justify-content:center;z-index:55;">
        <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:14px;width:250px;text-align:center;">
          <div style="font-weight:700;margin-bottom:10px;">Game Mode</div>
          <div id="modal-opt-mode" style="display:flex;gap:8px;justify-content:center;margin-bottom:12px;">
            <button class="choice-tile active" data-val="8ball" type="button">🎱 8-Ball</button>
            <button class="choice-tile" data-val="9ball" type="button">🟡 9-Ball</button>
          </div>
          <div style="display:flex;gap:8px;">
            <button id="btn-close-mode-modal" type="button" style="flex:1;padding:6px;border-radius:7px;background:#1e293b;color:#fff;border:none;cursor:pointer;">Cancel</button>
            <button id="btn-apply-mode-modal" type="button" style="flex:1;padding:6px;border-radius:7px;background:#0d9488;color:#fff;border:none;cursor:pointer;">Apply</button>
          </div>
        </div>
      </div>

      <div id="opponent-modal" class="hidden" style="position:fixed;inset:0;background:rgba(2,6,23,0.85);display:flex;align-items:center;justify-content:center;z-index:55;">
        <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:14px;width:250px;text-align:center;">
          <div style="font-weight:700;margin-bottom:10px;">Opponent</div>
          <div id="modal-opt-opponent" style="display:flex;gap:8px;justify-content:center;margin-bottom:12px;">
            <button class="choice-tile active" data-val="ai" type="button">🤖 AI</button>
            <button class="choice-tile" data-val="pvp" type="button">👥 2P PVP</button>
          </div>
          <div style="display:flex;gap:8px;">
            <button id="btn-close-opponent-modal" type="button" style="flex:1;padding:6px;border-radius:7px;background:#1e293b;color:#fff;border:none;cursor:pointer;">Cancel</button>
            <button id="btn-apply-opponent-modal" type="button" style="flex:1;padding:6px;border-radius:7px;background:#0d9488;color:#fff;border:none;cursor:pointer;">Apply</button>
          </div>
        </div>
      </div>

      <div id="diff-modal" class="hidden" style="position:fixed;inset:0;background:rgba(2,6,23,0.85);display:flex;align-items:center;justify-content:center;z-index:55;">
        <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:14px;width:270px;text-align:center;">
          <div style="font-weight:700;margin-bottom:10px;">AI Difficulty</div>
          <div id="modal-opt-diff" style="display:flex;gap:6px;justify-content:center;margin-bottom:12px;">
            <button class="choice-tile" data-val="easy" type="button">🌱 Easy</button>
            <button class="choice-tile active" data-val="medium" type="button">⚡ Pro</button>
            <button class="choice-tile" data-val="hard" type="button">👑 Boss</button>
          </div>
          <div style="display:flex;gap:8px;">
            <button id="btn-close-diff-modal" type="button" style="flex:1;padding:6px;border-radius:7px;background:#1e293b;color:#fff;border:none;cursor:pointer;">Cancel</button>
            <button id="btn-apply-diff-modal" type="button" style="flex:1;padding:6px;border-radius:7px;background:#0d9488;color:#fff;border:none;cursor:pointer;">Apply</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const root = stage.querySelector('#billiard-runner-root');
  const $ = (id) => root?.querySelector(`#${id}`) || null;

  const canvas = $('pool-canvas');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  function markGateHandledOnce() {
    try {
      sessionStorage.setItem(INITIAL_GATE_SEEN_KEY, '1');
    } catch (_) {}
  }

  const BilliardLandscapeGuard = (() => {
    let initialized = false;
    const timers = new Set();

    function trackTimeout(fn, ms) {
      const id = setTimeout(() => {
        timers.delete(id);
        if (!destroyed && !leavingToHub) fn();
      }, ms);
      timers.add(id);
      return id;
    }

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
      if (destroyed || leavingToHub) return;
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

    function exitFullscreenSafe() {
      try {
        if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitFullscreenElement && typeof document.webkitExitFullscreen === 'function') {
          document.webkitExitFullscreen();
        }
      } catch (_) {}
    }

    function isFullscreenActive() {
      return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    }

    function requestFullscreenSafe(forceToggle = false) {
      if (destroyed || leavingToHub) return;
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
      if (destroyed || leavingToHub) return;
      markGateHandledOnce();
      document.documentElement.dataset.isLandscape = isLandscapeNow() ? 'true' : 'false';
      tryLockLandscape();
    }

    const onFirstGesture = () => {
      if (destroyed || leavingToHub) return;
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

    const onResize = () => {
      if (destroyed || leavingToHub) return;
      sync();
      trackTimeout(resizeTable, 40);
    };

    const onOrientationChange = () => {
      if (destroyed || leavingToHub) return;
      sync();
      trackTimeout(() => {
        tryLockLandscape();
        sync();
        resizeTable();
      }, 180);
    };

    const onFullscreenChange = () => {
      if (destroyed || leavingToHub) return;
      sync();
      trackTimeout(resizeTable, 80);
    };

    const onScreenOrientationChange = () => {
      if (destroyed || leavingToHub) return;
      tryLockLandscape();
      sync();
    };

    function init() {
      markGateHandledOnce();
      if (initialized) {
        sync();
        return;
      }
      initialized = true;
      sync();

      document.addEventListener('pointerdown', onFirstGesture, true);
      document.addEventListener('click', onFirstGesture, true);
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onOrientationChange);
      document.addEventListener('fullscreenchange', onFullscreenChange);
      document.addEventListener('webkitfullscreenchange', onFullscreenChange);
      if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
        screen.orientation.addEventListener('change', onScreenOrientationChange);
      }
    }

    function teardown() {
      timers.forEach(id => clearTimeout(id));
      timers.clear();
      document.removeEventListener('pointerdown', onFirstGesture, true);
      document.removeEventListener('click', onFirstGesture, true);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrientationChange);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      if (screen.orientation && typeof screen.orientation.removeEventListener === 'function') {
        screen.orientation.removeEventListener('change', onScreenOrientationChange);
      }
    }

    return {
      init,
      teardown,
      sync,
      isLandscapeNow,
      isPortraitNow,
      isFullscreenActive,
      tryLockLandscape,
      releaseOrientationLock,
      exitFullscreenSafe,
      requestFullscreenSafe
    };
  })();

  const BALL_COLORS = {
    0: '#f8fafc', 1: '#facc15', 2: '#2563eb', 3: '#dc2626', 4: '#7c3aed',
    5: '#f97316', 6: '#16a34a', 7: '#991b1b', 8: '#111827', 9: '#facc15',
    10: '#2563eb', 11: '#dc2626', 12: '#7c3aed', 13: '#f97316', 14: '#16a34a',
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

    phase: 'AIMING',
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
    aiPullInterval: null,
    turnToastTimer: null,
    turnToastFadeTimer: null,
    pocketAnimTimer: null,
    pocketAnimFadeTimer: null,
    shotFollowupTimer: null,
    autoReturnTimer: null
  };

  let W = 800, H = 400;
  let rail = 34;
  let playX = 34, playY = 34, playW = 732, playH = 332;
  let ballR = 11;
  let pocketR = 20;
  let pockets = [];

  let audioCtx = null;
  function playTone(freq, type, dur, vol) {
    if (!state.sfx || destroyed) return;
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
    } catch (_) {}
  }

  function haptic(ms) {
    if (state.sfx && !destroyed && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (_) {}
    }
  }

  function clearPendingTimers() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
    clearInterval(state.aiPullInterval);
    state.aiPullInterval = null;
    clearTimeout(state.shotFollowupTimer);
    state.shotFollowupTimer = null;
    clearTimeout(state.turnToastTimer);
    state.turnToastTimer = null;
    clearTimeout(state.turnToastFadeTimer);
    state.turnToastFadeTimer = null;
    clearTimeout(state.pocketAnimTimer);
    state.pocketAnimTimer = null;
    clearTimeout(state.pocketAnimFadeTimer);
    state.pocketAnimFadeTimer = null;
    clearTimeout(state.autoReturnTimer);
    state.autoReturnTimer = null;
  }

  function applySpaciousLayoutSpacing() {
    const wrap = $('table-wrap');
    if (wrap) {
      wrap.style.padding = '12px 16px';
      wrap.style.boxSizing = 'border-box';
    }
    const hud = $('top-hud') || root?.querySelector('.pool-hud');
    if (hud) {
      hud.style.gap = '12px';
      hud.style.padding = '8px 14px';
    }
  }

  function resizeTable() {
    if (destroyed) return;
    applySpaciousLayoutSpacing();
    const wrap = $('table-wrap');
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
    const toast = $('turn-modal-toast');
    if (!toast || destroyed) return;
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
      if (!destroyed) toast.classList.add('fading');
    }, 1050);

    state.turnToastTimer = setTimeout(() => {
      if (!destroyed) toast.classList.add('hidden', 'fading');
    }, 1550);
  }

  function showPocketedAnimation(ballNum) {
    const badge = $('pocket-anim-badge');
    if (!badge || destroyed) return;
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

    badge.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:${chipBg};color:${chipColor};font-size:10px;font-weight:900;">${chipText}</span><span>${label}</span>`;
    badge.classList.remove('hidden', 'fading');

    state.pocketAnimFadeTimer = setTimeout(() => {
      if (!destroyed) badge.classList.add('fading');
    }, 1150);

    state.pocketAnimTimer = setTimeout(() => {
      if (!destroyed) badge.classList.add('hidden', 'fading');
    }, 1750);
  }

  function getSavedPlayerName() {
    try {
      const saved = localStorage.getItem(PLAYER_NAME_KEY) || localStorage.getItem('playerName');
      if (saved && saved.trim()) return saved.trim();
    } catch (_) {}
    const domName = $('p1-name')?.textContent;
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
    const name = meta.playerName || getSavedPlayerName();
    persistPlayerName(name);
    const p1El = $('p1-name');
    if (p1El) p1El.textContent = name.slice(0, 12);
  }

  function goToHubLobby() {
    leavingToHub = true;
    state.phase = 'MENU';
    clearPendingTimers();
    const currentName = $('p1-name')?.textContent || getSavedPlayerName();
    persistPlayerName(currentName);

    BilliardLandscapeGuard.releaseOrientationLock();
    BilliardLandscapeGuard.exitFullscreenSafe();

    try {
      sessionStorage.setItem(INITIAL_GATE_SEEN_KEY, '1');
      sessionStorage.removeItem(ENTER_FS_FROM_HUB_KEY);
      sessionStorage.removeItem(HUB_KEEP_FS_KEY);
      sessionStorage.removeItem(HUB_AUTO_LANDSCAPE_FS_KEY);
      sessionStorage.removeItem('arcade_hub_from_billiard');
      sessionStorage.setItem('arcade_hub_skip_power', '1');
      sessionStorage.setItem('arcade_hub_target_lobby', '1');
    } catch (_) {}

    haptic(10);

    if (typeof window.openHubHome === 'function') {
      window.openHubHome();
    } else if (typeof window.returnToHub === 'function') {
      window.returnToHub();
    }
  }

  function syncSettingsSummaries() {
    const modeSum = $('val-mode-summary');
    const oppSum = $('val-opponent-summary');
    const diffSum = $('val-diff-summary');
    const diffTrigger = $('btn-open-diff-modal');

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
    div.style.cssText = `width:14px;height:14px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:#0f172a;opacity:${!b || b.pocketed ? '0.25' : '1'};background:${
      n > 8 ? `radial-gradient(circle, #fff 45%, ${BALL_COLORS[n]} 48%)` : BALL_COLORS[n]
    };`;
    if (n === 8) div.style.color = '#fff';
    div.textContent = n;
    return div;
  }

  function appendDividerEl(tray) {
    const div = document.createElement('div');
    div.style.cssText = 'width:1px;height:12px;background:rgba(255,255,255,0.2);margin:0 2px;';
    tray.appendChild(div);
  }

  function updateHUD() {
    const b1 = $('badge-p1');
    const b2 = $('badge-p2');
    if (b1) b1.style.outline = state.turn === 1 ? '2px solid #2dd4bf' : 'none';
    if (b2) b2.style.outline = state.turn === 2 ? '2px solid #2dd4bf' : 'none';

    const p2El = $('p2-name');
    if (p2El) p2El.textContent = state.opponent === 'ai' ? '🤖 AI' : '👥 P2';
    const modeEl = $('hud-mode-label');
    if (modeEl) {
      modeEl.textContent =
        (state.mode === '8ball' ? '🎱 8-BALL' : '🟡 9-BALL') + ' • ' + (state.opponent === 'ai' ? '🤖 AI' : '👥 PVP');
    }

    const g1 = $('p1-group');
    const g2 = $('p2-group');
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

    const tray = $('rack-tray');
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

    const hintEl = $('ball-in-hand-hint');
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
      if (destroyed || leavingToHub || state.phase === 'MENU' || state.phase === 'GAME_OVER') {
        clearInterval(state.timerInterval);
        return;
      }
      if (state.phase === 'SHOOTING') return;
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
    const textEl = $('timer-text');
    const boxEl = $('timer-box');
    if (textEl) {
      textEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }
    if (boxEl) {
      boxEl.style.color = state.timerSeconds <= 15 ? '#f87171' : '#f8fafc';
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
    clearPendingTimers();
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
      const diamondCols = [[1], [2, 3], [4, 9, 5], [6, 7], [8]];
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
    if (state.mode === '9ball') return ballNum === getLowestTargetNumber();
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
    clearPendingTimers();
    playTone(587, 'triangle', 0.45, 0.25);
    haptic([40, 40, 80]);
    const winnerLabel = (winnerNum === 2 && state.opponent === 'ai')
      ? '🤖 AI Wins!'
      : `🏆 P${winnerNum} Wins!`;
    const titleEl = $('winner-title');
    const reasonEl = $('winner-reason');
    const modalEl = $('gameover-modal');
    if (titleEl) titleEl.textContent = winnerLabel;
    if (reasonEl) reasonEl.textContent = reason;
    if (modalEl) modalEl.classList.remove('hidden');
  }

  function maybeTriggerAI() {
    clearTimeout(state.aiTimer);
    clearInterval(state.aiPullInterval);
    if (destroyed || leavingToHub || state.opponent !== 'ai' || state.turn !== 2) return;
    if (state.phase !== 'AIMING' && state.phase !== 'BALL_IN_HAND') return;

    state.aiTimer = setTimeout(() => {
      if (destroyed || leavingToHub || state.opponent !== 'ai' || state.turn !== 2) return;
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
      state.aiPullInterval = setInterval(() => {
        if (destroyed || leavingToHub) {
          clearInterval(state.aiPullInterval);
          return;
        }
        pullStep += 0.12;
        state.takoPull = Math.min(targetPull, pullStep);
        updatePowerUI();
        if (state.takoPull >= targetPull) {
          clearInterval(state.aiPullInterval);
          state.aiPullInterval = null;
          state.shotFollowupTimer = setTimeout(() => {
            if (!destroyed && !leavingToHub) shootCueBall();
          }, 180);
        }
      }, 35);
    }, 850);
  }

  function render() {
    if (destroyed || leavingToHub) return;

    if (W > 0 && H > 0) {
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
      const dy = playY + playH * 0.5;
      drawDiamond(rail * 0.45, dy);
      drawDiamond(W - rail * 0.45, dy);

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

      if ((state.phase === 'AIMING' || state.phase === 'BALL_IN_HAND') && state.guideMode !== 'off') {
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
        if (!b.pocketed) drawBall(b);
      });

      if (state.phase === 'AIMING' || state.phase === 'BALL_IN_HAND') {
        const cue = getCueBall();
        if (cue && !cue.pocketed) {
          drawTako(cue, state.aimAngle, state.takoPull);
        }
      }

      stepPhysics();
    }

    if (!destroyed && !leavingToHub) {
      rafId = requestAnimationFrame(render);
    }
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

  const powerRail = $('power-rail');
  let railDragging = false;
  let railStartY = 0;

  function updatePowerUI() {
    const pct = Math.round(state.takoPull * 100);
    const fillEl = $('power-fill');
    const gripEl = $('power-grip');
    const pctEl = $('power-pct');
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

  const aimWheel = $('aim-wheel');
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

  $('btn-aim-ccw')?.addEventListener('click', () => {
    if (!isUserTurn()) return;
    state.aimAngle -= 0.008 * state.fineAimSpeed * 3;
    haptic(8);
  });

  $('btn-aim-cw')?.addEventListener('click', () => {
    if (!isUserTurn()) return;
    state.aimAngle += 0.008 * state.fineAimSpeed * 3;
    haptic(8);
  });

  const spinDot = $('spin-dot');
  const spinReadout = $('spin-readout');
  const spinModal = $('spin-modal');
  const spinModalPad = $('spin-modal-pad');
  const spinModalDot = $('spin-modal-dot');
  const spinModalReadout = $('spin-modal-readout');
  let modalSpinDragging = false;

  function formatSpinLabel() {
    if (Math.abs(state.spin.x) < 0.12 && Math.abs(state.spin.y) < 0.12) return 'CENTER';
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
    clearTimeout(state.autoReturnTimer);
    modalSpinDragging = false;
    spinModal?.classList.add('hidden');
  }

  function scheduleAutoReturnToGame() {
    clearTimeout(state.autoReturnTimer);
    state.autoReturnTimer = setTimeout(() => {
      if (!destroyed) closeSpinModalNow();
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

  $('btn-open-spin-modal')?.addEventListener('click', () => {
    if (!isUserTurn()) return;
    clearTimeout(state.autoReturnTimer);
    updateSpinUI();
    spinModal?.classList.remove('hidden');
  });

  $('btn-close-spin-modal')?.addEventListener('click', closeSpinModalNow);

  $('btn-modal-reset-spin')?.addEventListener('click', () => {
    state.spin = { x: 0, y: 0 };
    updateSpinUI();
    haptic(10);
    scheduleAutoReturnToGame();
  });

  if (spinModalPad) {
    spinModalPad.addEventListener('pointerdown', (e) => {
      if (!isUserTurn()) return;
      clearTimeout(state.autoReturnTimer);
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
    const row = $(id);
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
    const wrap = $(containerId);
    if (!wrap) return;
    wrap.querySelectorAll('.choice-tile').forEach(tile => {
      tile.classList.toggle('active', tile.dataset.val === activeVal);
    });
  }

  function bindChoiceTiles(containerId, onSelect) {
    const wrap = $(containerId);
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

  $('btn-open-mode-modal')?.addEventListener('click', () => {
    draftMode = state.mode;
    syncChoiceTiles('modal-opt-mode', draftMode);
    $('mode-modal')?.classList.remove('hidden');
  });
  $('btn-close-mode-modal')?.addEventListener('click', () => {
    $('mode-modal')?.classList.add('hidden');
  });
  $('btn-apply-mode-modal')?.addEventListener('click', () => {
    const changed = state.mode !== draftMode;
    state.mode = draftMode;
    $('mode-modal')?.classList.add('hidden');
    updateHUD();
    if (changed && state.phase !== 'MENU') setupRack();
  });

  $('btn-open-opponent-modal')?.addEventListener('click', () => {
    draftOpponent = state.opponent;
    syncChoiceTiles('modal-opt-opponent', draftOpponent);
    $('opponent-modal')?.classList.remove('hidden');
  });
  $('btn-close-opponent-modal')?.addEventListener('click', () => {
    $('opponent-modal')?.classList.add('hidden');
  });
  $('btn-apply-opponent-modal')?.addEventListener('click', () => {
    state.opponent = draftOpponent;
    $('opponent-modal')?.classList.add('hidden');
    updateHUD();
    maybeTriggerAI();
  });

  $('btn-open-diff-modal')?.addEventListener('click', () => {
    draftDiff = state.aiDiff;
    syncChoiceTiles('modal-opt-diff', draftDiff);
    $('diff-modal')?.classList.remove('hidden');
  });
  $('btn-close-diff-modal')?.addEventListener('click', () => {
    $('diff-modal')?.classList.add('hidden');
  });
  $('btn-apply-diff-modal')?.addEventListener('click', () => {
    state.aiDiff = draftDiff;
    $('diff-modal')?.classList.add('hidden');
    updateHUD();
  });

  bindSegRow('opt-tap-aim', val => { state.tapToAim = (val === 'on'); });
  bindSegRow('opt-guide', val => { state.guideMode = val; });
  bindSegRow('opt-sfx', val => { state.sfx = (val === 'on'); });

  $('btn-start-match')?.addEventListener('click', () => {
    markGateHandledOnce();
    try { sessionStorage.removeItem(ENTER_FS_FROM_HUB_KEY); } catch (_) {}
    BilliardLandscapeGuard.requestFullscreenSafe(false);
    BilliardLandscapeGuard.tryLockLandscape();
    BilliardLandscapeGuard.sync();
    $('setup-modal')?.classList.add('hidden');
    setupRack();
    setTimeout(() => { if (!destroyed) resizeTable(); }, 120);
  });

  $('btn-new-match')?.addEventListener('click', () => {
    clearPendingTimers();
    state.phase = 'MENU';
    $('setup-modal')?.classList.remove('hidden');
  });

  $('btn-rematch')?.addEventListener('click', () => {
    markGateHandledOnce();
    BilliardLandscapeGuard.requestFullscreenSafe(false);
    BilliardLandscapeGuard.tryLockLandscape();
    BilliardLandscapeGuard.sync();
    $('gameover-modal')?.classList.add('hidden');
    setupRack();
    setTimeout(() => { if (!destroyed) resizeTable(); }, 120);
  });

  function closeSettingsModal() {
    $('settings-modal')?.classList.add('hidden');
  }

  $('btn-settings')?.addEventListener('click', () => {
    syncSettingsSummaries();
    $('settings-modal')?.classList.remove('hidden');
  });
  $('btn-close-settings')?.addEventListener('click', closeSettingsModal);
  $('btn-save-settings')?.addEventListener('click', closeSettingsModal);
  $('btn-dock-done')?.addEventListener('click', closeSettingsModal);

  $('btn-dock-hub')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeSettingsModal();
    goToHubLobby();
  });

  $('btn-dock-restart')?.addEventListener('click', () => {
    closeSettingsModal();
    setupRack();
    setTimeout(() => { if (!destroyed) resizeTable(); }, 80);
  });

  $('btn-dock-fs')?.addEventListener('click', () => {
    BilliardLandscapeGuard.requestFullscreenSafe(true);
    BilliardLandscapeGuard.tryLockLandscape();
    BilliardLandscapeGuard.sync();
    haptic(10);
    setTimeout(() => { if (!destroyed) resizeTable(); }, 120);
  });

  $('btn-setup-hub')?.addEventListener('click', (e) => {
    e.preventDefault();
    goToHubLobby();
  });

  $('btn-gameover-hub')?.addEventListener('click', (e) => {
    e.preventDefault();
    goToHubLobby();
  });

  window.goToArcadeHub = goToHubLobby;
  window.toggleBilliardFullscreen = () => {
    BilliardLandscapeGuard.requestFullscreenSafe(true);
    BilliardLandscapeGuard.tryLockLandscape();
    BilliardLandscapeGuard.sync();
  };

  const sliderSens = $('slider-sens');
  const sliderFine = $('slider-fine');
  sliderSens?.addEventListener('input', () => {
    state.aimSensitivity = parseFloat(sliderSens.value);
    const valEl = $('sens-val');
    if (valEl) valEl.textContent = state.aimSensitivity.toFixed(2) + '×';
  });
  sliderFine?.addEventListener('input', () => {
    state.fineAimSpeed = parseFloat(sliderFine.value);
    const valEl = $('fine-val');
    if (valEl) valEl.textContent = state.fineAimSpeed.toFixed(2) + '×';
  });

  BilliardLandscapeGuard.init();
  syncSettingsSummaries();
  syncPlayerNameFromHub();
  setupRack();
  rafId = requestAnimationFrame(render);

  return function cleanupBilliardPool() {
    destroyed = true;
    leavingToHub = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    clearPendingTimers();
    BilliardLandscapeGuard.teardown();
    if (audioCtx && typeof audioCtx.close === 'function') {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    stage.innerHTML = '';
  };
};