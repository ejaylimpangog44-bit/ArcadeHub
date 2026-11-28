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

  function fillViewportContainer() {
    try {
      stage.style.position = 'fixed';
      stage.style.inset = '0';
      stage.style.width = '100vw';
      stage.style.height = '100dvh';
      stage.style.maxWidth = '100vw';
      stage.style.maxHeight = '100dvh';
      stage.style.margin = '0';
      stage.style.padding = '0';
      stage.style.overflow = 'hidden';
      stage.style.zIndex = '30';
      stage.style.background = '#071312';

      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      document.documentElement.style.width = '100%';
      document.documentElement.style.height = '100%';
      document.documentElement.style.overflow = 'hidden';

      if (document.body) {
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.overflow = 'hidden';
      }
    } catch (_) {}
  }

  fillViewportContainer();

  stage.innerHTML = `
    <div id="billiard-runner-root" style="position:relative;width:100vw;height:100dvh;display:flex;flex-direction:column;background:#071312;color:#f8fafc;overflow:hidden;user-select:none;touch-action:none;font-family:Inter,sans-serif;box-sizing:border-box;">
      <style>
        #billiard-runner-root, #billiard-runner-root * {
          box-sizing: border-box;
        }
        #billiard-runner-root .turn-overlay-modal {
          position:absolute;
          inset:0;
          display:flex;
          align-items:center;
          justify-content:center;
          background:rgba(2,6,23,0.42);
          backdrop-filter:blur(2px);
          z-index:26;
          pointer-events:none;
          opacity:1;
          transition:opacity 0.35s ease;
        }
        #billiard-runner-root .turn-overlay-modal.hidden {
          display:none;
        }
        #billiard-runner-root .turn-overlay-modal.fading {
          opacity:0;
        }
        #billiard-runner-root .turn-overlay-card {
          padding:12px 24px;
          border-radius:14px;
          background:linear-gradient(135deg,rgba(15,23,42,0.96),rgba(19,78,74,0.92));
          border:1px solid rgba(94,234,212,0.55);
          box-shadow:0 18px 40px rgba(0,0,0,0.65);
          text-align:center;
        }
        #billiard-runner-root .turn-overlay-title {
          font-size:18px;
          font-weight:900;
          letter-spacing:0.04em;
          color:#f8fafc;
        }
        #billiard-runner-root .turn-overlay-sub {
          margin-top:2px;
          font-size:10px;
          font-weight:700;
          color:#5eead4;
          text-transform:uppercase;
          letter-spacing:0.08em;
        }
        #billiard-runner-root #pocket-anim-badge {
          opacity:1;
          transition:opacity 0.35s ease, transform 0.35s ease;
        }
        #billiard-runner-root #pocket-anim-badge.hidden {
          display:none !important;
          opacity:0;
        }
        #billiard-runner-root #pocket-anim-badge.fading {
          opacity:0;
          transform:translateY(-4px);
        }
        #billiard-runner-root .player-name-pill {
          position:relative;
          display:flex;
          align-items:center;
          gap:4px;
          padding:5px 8px;
          border-radius:8px;
          background:rgba(15,23,42,0.92);
          border:1px solid rgba(255,255,255,0.14);
          font-weight:900;
          font-size:11px;
          white-space:nowrap;
          overflow:hidden;
          flex-shrink:0;
          transition:color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        #billiard-runner-root .player-name-pill .name-timer-bar {
          position:absolute;
          left:0;
          bottom:0;
          height:3px;
          width:0%;
          background:#22c55e;
          transition:width 0.25s linear, background-color 0.25s ease;
          pointer-events:none;
        }
        #billiard-runner-root .player-name-pill .name-label-text {
          position:relative;
          z-index:1;
          max-width:95px;
          overflow:hidden;
          text-overflow:ellipsis;
        }
        #billiard-runner-root .hud-center-cluster {
          display:flex;
          align-items:center;
          justify-content:center;
          gap:6px;
          flex-wrap:nowrap;
          min-width:0;
        }
        #billiard-runner-root .divider-drawer {
          display:flex;
          flex-direction:column;
          gap:3px;
          padding:4px 8px;
          border-radius:10px;
          background:rgba(15,23,42,0.88);
          border:1px solid rgba(255,255,255,0.12);
          min-width:220px;
          max-width:320px;
          flex-shrink:1;
        }
        #billiard-runner-root .divider-player-above {
          display:flex;
          align-items:center;
          justify-content:center;
          gap:6px;
          font-size:10px;
          font-weight:900;
          line-height:1.1;
          color:#fbbf24;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
          text-align:center;
        }
        #billiard-runner-root .divider-drawer-header {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:6px;
          font-size:9px;
          font-weight:800;
          line-height:1.1;
          white-space:nowrap;
          overflow:hidden;
        }
        #billiard-runner-root .divider-drawer-sides {
          display:flex;
          align-items:center;
          justify-content:space-between;
          width:100%;
          gap:5px;
          font-size:9px;
          font-weight:800;
          letter-spacing:0.03em;
        }
        #billiard-runner-root .side-solids {
          color:#38bdf8;
        }
        #billiard-runner-root .side-stripes {
          color:#f472b6;
        }
        #billiard-runner-root .side-center-tag {
          color:#e2e8f0;
          font-weight:900;
        }
        #billiard-runner-root .drawer-split-line {
          width:1px;
          height:9px;
          background:rgba(255,255,255,0.25);
          flex-shrink:0;
        }
        #billiard-runner-root .pocketed-row-stack {
          display:flex;
          align-items:center;
          gap:3px;
          min-height:18px;
          padding:2px 5px;
          border-radius:7px;
          background:rgba(2,6,23,0.65);
          border:1px dashed rgba(255,255,255,0.14);
          overflow-x:auto;
        }
        #billiard-runner-root .pocketed-empty-hint {
          font-size:9px;
          color:#64748b;
          font-weight:600;
          white-space:nowrap;
        }
        #billiard-runner-root .pocketed-chip {
          width:14px;
          height:14px;
          border-radius:50%;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          font-size:8px;
          font-weight:900;
          color:#0f172a;
          flex-shrink:0;
          box-shadow:0 2px 4px rgba(0,0,0,0.45);
          transition:transform 0.2s ease;
        }
        #billiard-runner-root .pocketed-chip.just-pocketed {
          transform:scale(1.15);
          outline:2px solid #34d399;
        }
        #billiard-runner-root .cockpit-card {
          background:rgba(15,23,42,0.88);
          border:1px solid rgba(255,255,255,0.12);
          border-radius:12px;
          padding:8px;
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:6px;
        }
        #billiard-runner-root .cockpit-label {
          font-size:9px;
          font-weight:800;
          letter-spacing:0.08em;
          color:#cbd5e1;
          text-transform:uppercase;
        }
        #billiard-runner-root .fine-step-strip {
          width:30px;
          height:88px;
          border-radius:8px;
          background:#020617;
          border:1px solid rgba(255,255,255,0.14);
          background-image:repeating-linear-gradient(
            to bottom,
            rgba(251,191,36,0.75) 0 2px,
            transparent 2px 10px
          );
          cursor:ns-resize;
        }
        #billiard-runner-root .choice-tile.active,
        #billiard-runner-root .seg-btn.active {
          background:#0d9488;
          color:#ffffff;
          border-color:#2dd4bf;
        }
        #billiard-runner-root .choice-tile,
        #billiard-runner-root .seg-btn {
          padding:5px 9px;
          border-radius:7px;
          border:1px solid rgba(255,255,255,0.16);
          background:#1e293b;
          color:#e2e8f0;
          font-size:11px;
          font-weight:700;
          cursor:pointer;
        }
      </style>

      <!-- Single-Row Top HUD: P1 + Divider Drawer + Opponent in Center -->
      <div id="top-hud" class="pool-hud" style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:5px 10px;background:rgba(15,23,42,0.94);border-bottom:1px solid rgba(255,255,255,0.1);flex-wrap:nowrap;min-height:44px;z-index:5;">
        <div style="flex:1;min-width:0;display:flex;align-items:center;justify-content:center;">
          <div class="hud-center-cluster">
            <div id="badge-p1" class="player-name-pill">
              <span id="p1-name" class="name-label-text">Player_701</span>
              <span id="p1-timer-bar" class="name-timer-bar"></span>
            </div>

            <!-- Divided Drawer: Names Above, Group in Center, Left = Solids / Right = Stripes -->
            <div id="divider-drawer" class="divider-drawer">
              <div id="drawer-player-title" class="divider-player-above">Player_701 vs AI</div>
              <div class="divider-drawer-header">
                <div id="drawer-group-split" class="divider-drawer-sides">
                  <span id="drawer-left-label" class="side-solids">LEFT: SOLIDS</span>
                  <span class="drawer-split-line"></span>
                  <span id="drawer-center-group" class="side-center-tag">OPEN</span>
                  <span class="drawer-split-line"></span>
                  <span id="drawer-right-label" class="side-stripes">RIGHT: STRIPES</span>
                </div>
              </div>
              <div id="pocketed-ball-row" class="pocketed-row-stack" aria-label="Pocketed Balls Row">
                <span class="pocketed-empty-hint">Pocketed balls stack here</span>
              </div>
            </div>

            <div id="badge-p2" class="player-name-pill">
              <span id="p2-icon" style="position:relative;z-index:1;">🤖</span>
              <span id="p2-name" class="name-label-text">AI</span>
              <span id="p2-timer-bar" class="name-timer-bar"></span>
            </div>
          </div>
        </div>

        <!-- Right Action Controls -->
        <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
          <div id="rack-tray" style="display:none;"></div>
          <button id="btn-new-rack-top" type="button" style="display:inline-flex;align-items:center;gap:3px;padding:5px 8px;border-radius:8px;border:1px solid rgba(255,255,255,0.16);background:#1e293b;color:#f8fafc;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap;">
            <span>↻</span><span>New</span>
          </button>
          <button id="btn-settings" type="button" style="display:inline-flex;align-items:center;gap:3px;padding:5px 8px;border-radius:8px;border:1px solid rgba(255,255,255,0.16);background:#1e293b;color:#f8fafc;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap;">
            <span>⚙</span><span>Settings</span>
          </button>
          <button id="btn-setup-hub" type="button" style="padding:5px 9px;border-radius:8px;border:1px solid rgba(255,255,255,0.16);background:#334155;color:#f8fafc;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap;">
            Hub
          </button>
        </div>
      </div>

      <!-- Main Cockpit + Full Table Area -->
      <div style="position:relative;flex:1;width:100%;min-height:0;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;">
        <!-- Left Panel: Cue Spin & Fine Aim -->
        <div style="display:flex;flex-direction:column;gap:8px;width:96px;flex-shrink:0;z-index:5;">
          <div class="cockpit-card">
            <div class="cockpit-label">CUE SPIN</div>
            <div id="cockpit-spin-pad" style="position:relative;width:52px;height:52px;border-radius:50%;background:#f8fafc;border:2px solid #475569;cursor:pointer;">
              <div style="position:absolute;left:50%;top:4px;bottom:4px;width:1px;background:rgba(15,23,42,0.2);transform:translateX(-50%);pointer-events:none;"></div>
              <div style="position:absolute;top:50%;left:4px;right:4px;height:1px;background:rgba(15,23,42,0.2);transform:translateY(-50%);pointer-events:none;"></div>
              <div id="spin-dot" style="position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:#ef4444;pointer-events:none;"></div>
            </div>
            <div id="spin-readout" style="font-size:9px;font-weight:800;letter-spacing:0.06em;color:#e2e8f0;">CENTER</div>
            <button id="btn-cockpit-reset-spin" type="button" style="width:100%;padding:4px 5px;border-radius:7px;border:1px solid rgba(255,255,255,0.16);background:#1e293b;color:#f8fafc;font-size:9px;font-weight:700;cursor:pointer;">
              Reset Spin
            </button>
          </div>

          <div class="cockpit-card">
            <div class="cockpit-label">FINE AIM</div>
            <div id="aim-wheel" class="fine-step-strip" title="Drag to fine-tune aim">
              <div class="aim-ticks" style="display:none;"></div>
            </div>
            <div style="display:flex;gap:6px;width:100%;justify-content:center;">
              <button id="btn-aim-ccw" type="button" style="flex:1;padding:3px 0;border-radius:6px;border:1px solid rgba(255,255,255,0.18);background:#1e293b;color:#f8fafc;font-weight:800;cursor:pointer;">-</button>
              <button id="btn-aim-cw" type="button" style="flex:1;padding:3px 0;border-radius:6px;border:1px solid rgba(255,255,255,0.18);background:#1e293b;color:#f8fafc;font-weight:800;cursor:pointer;">+</button>
            </div>
          </div>
        </div>

        <!-- Center Table -->
        <div style="position:relative;flex:1;width:100%;height:100%;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <div id="ai-thinking-banner" class="hidden" style="position:absolute;top:4px;left:50%;transform:translateX(-50%);padding:4px 12px;border-radius:999px;background:rgba(15,23,42,0.92);border:1px solid rgba(251,191,36,0.45);color:#fde68a;font-size:10px;font-weight:800;letter-spacing:0.06em;z-index:12;pointer-events:none;">
            🤖 AI THINKING...
          </div>

          <div id="table-wrap" style="flex:1;width:100%;height:100%;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;">
            <canvas id="pool-canvas" style="display:block;max-width:100%;max-height:100%;"></canvas>
          </div>
        </div>

        <!-- Right Panel: Tako Pull -->
        <div style="display:flex;flex-direction:column;align-items:center;width:68px;height:100%;max-height:320px;flex-shrink:0;z-index:5;">
          <div id="power-rail" style="width:100%;height:100%;border-radius:12px;background:rgba(15,23,42,0.88);border:1px solid rgba(255,255,255,0.12);position:relative;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:8px 6px;cursor:pointer;">
            <div style="font-size:9px;font-weight:800;letter-spacing:0.06em;color:#cbd5e1;text-align:center;">TAKO PULL</div>
            <div style="position:relative;width:10px;flex:1;margin:6px 0;background:rgba(255,255,255,0.12);border-radius:6px;overflow:hidden;">
              <div id="power-fill" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(to top,#10b981,#f59e0b,#ef4444);"></div>
            </div>
            <div id="power-grip" style="position:absolute;top:22%;left:12px;right:12px;height:18px;border-radius:6px;background:linear-gradient(180deg,#fbbf24,#d97706);box-shadow:0 3px 8px rgba(0,0,0,0.45);pointer-events:none;"></div>
            <span style="font-size:10px;font-weight:800;color:#f8fafc;" id="power-pct">0%</span>
          </div>
        </div>

        <!-- Turn Modal Overlay -->
        <div id="turn-modal-overlay" class="turn-overlay-modal hidden" role="dialog" aria-live="polite">
          <div class="turn-overlay-card">
            <div id="turn-overlay-title" class="turn-overlay-title">Player 1's Turn</div>
            <div id="turn-overlay-sub" class="turn-overlay-sub">8-Ball Rack</div>
          </div>
        </div>
      </div>

      <div id="ball-in-hand-hint" style="display:none;position:absolute;bottom:8px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.92);padding:4px 12px;border-radius:999px;font-size:11px;border:1px solid rgba(94,234,212,0.4);pointer-events:none;z-index:20;">
        Ball in Hand — Drag cue ball to place
      </div>

      <div id="turn-modal-toast" class="hidden" style="display:none;"></div>
      <div id="pocket-anim-badge" class="hidden" style="position:absolute;top:50px;right:84px;background:rgba(15,23,42,0.94);border:1px solid rgba(52,211,153,0.5);padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:6px;z-index:20;pointer-events:none;"></div>

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

      <!-- Minimal Winning Modal -->
      <div id="gameover-modal" class="hidden" style="position:fixed;inset:0;background:rgba(2,6,23,0.82);display:flex;align-items:center;justify-content:center;z-index:45;">
        <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:22px;width:240px;text-align:center;">
          <h3 id="winner-title" style="margin:0 0 14px;font-size:20px;font-weight:900;">You Win</h3>
          <button id="btn-rematch" type="button" style="width:100%;padding:9px 12px;border-radius:8px;border:none;background:#0d9488;color:#fff;font-weight:800;cursor:pointer;">Play again</button>
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
      fillViewportContainer();
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
      trackTimeout(() => resizeTable(true), 40);
    };

    const onOrientationChange = () => {
      if (destroyed || leavingToHub) return;
      sync();
      trackTimeout(() => {
        tryLockLandscape();
        sync();
        resizeTable(true);
      }, 180);
    };

    const onFullscreenChange = () => {
      if (destroyed || leavingToHub) return;
      sync();
      trackTimeout(() => resizeTable(true), 80);
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

  function getBallGroup(num) {
    if (num >= 1 && num <= 7) return 'solids';
    if (num >= 9 && num <= 15) return 'stripes';
    return null;
  }

  const TURN_DURATION = 60;

  const state = {
    mode: '8ball',
    opponent: 'ai',
    aiDiff: 'medium',
    tapToAim: true,
    aimSensitivity: 0.45,
    fineAimSpeed: 0.20,
    guideMode: 'full',
    sfx: true,

    matchCount: 0,
    phase: 'AIMING',
    turn: 1,
    groups: { 1: null, 2: null },
    pocketedStack: [],
    timerSeconds: TURN_DURATION,
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

  function hidePocketBadgeImmediately() {
    clearTimeout(state.pocketAnimTimer);
    clearTimeout(state.pocketAnimFadeTimer);
    const badge = $('pocket-anim-badge');
    if (badge) {
      badge.classList.add('hidden', 'fading');
      badge.innerHTML = '';
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
    fillViewportContainer();
    const wrap = $('table-wrap');
    if (wrap) {
      wrap.style.padding = '4px 6px';
      wrap.style.boxSizing = 'border-box';
    }
    const hud = $('top-hud') || root?.querySelector('.pool-hud');
    if (hud) {
      hud.style.gap = '6px';
      hud.style.padding = '5px 10px';
      hud.style.flexWrap = 'nowrap';
    }
  }

  function positionTriangleRackBalls() {
    const cue = getCueBall();
    const cueX = playX + playW * 0.25;
    const cueY = playY + playH * 0.5;
    if (cue) {
      cue.x = cueX;
      cue.y = cueY;
      cue.vx = 0;
      cue.vy = 0;
      cue.pocketed = false;
    }

    const apexX = playX + playW * 0.68;
    const apexY = playY + playH * 0.5;
    const spacing = ballR * 2.0;
    const rowDx = ballR * Math.sqrt(3);

    if (state.mode === '8ball') {
      const order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
      let idx = 0;
      for (let col = 0; col < 5; col++) {
        const count = col + 1;
        const startY = apexY - ((count - 1) * spacing) / 2;
        for (let r = 0; r < count; r++) {
          const num = order[idx++];
          const b = state.balls.find(ball => ball.num === num);
          if (b) {
            b.x = apexX + col * rowDx;
            b.y = startY + r * spacing;
            b.vx = 0;
            b.vy = 0;
            b.pocketed = false;
          }
        }
      }
    } else {
      const diamondCols = [[1], [2, 3], [4, 9, 5], [6, 7], [8]];
      diamondCols.forEach((colNums, colIdx) => {
        const startY = apexY - ((colNums.length - 1) * spacing) / 2;
        colNums.forEach((num, rIdx) => {
          const b = state.balls.find(ball => ball.num === num);
          if (b) {
            b.x = apexX + colIdx * rowDx;
            b.y = startY + rIdx * spacing;
            b.vx = 0;
            b.vy = 0;
            b.pocketed = false;
          }
        });
      });
    }
  }

  function buildRackBalls() {
    state.balls = [{ num: 0, x: 0, y: 0, vx: 0, vy: 0, pocketed: false, spinX: 0, spinY: 0 }];
    const nums = state.mode === '8ball'
      ? [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15]
      : [1, 2, 3, 4, 9, 5, 6, 7, 8];
    nums.forEach(num => {
      state.balls.push({ num, x: 0, y: 0, vx: 0, vy: 0, pocketed: false, spinX: 0, spinY: 0 });
    });
    positionTriangleRackBalls();
  }

  function resizeTable(preservePositions = true) {
    if (destroyed) return;
    applySpaciousLayoutSpacing();
    const wrap = $('table-wrap');
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 100 || rect.height < 80) return;

    const padX = Math.max(8, Math.round(rect.width * 0.012));
    const padY = Math.max(6, Math.round(rect.height * 0.015));
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

    rail = Math.max(22, Math.round(H * 0.092));
    playX = rail;
    playY = rail;
    playW = Math.max(60, W - rail * 2);
    playH = Math.max(40, H - rail * 2);
    ballR = Math.max(8, Math.round(playH * 0.0325));
    pocketR = Math.round(ballR * 1.9);

    pockets = [
      { x: playX + 2, y: playY + 2 },
      { x: playX + playW / 2, y: playY - 2 },
      { x: playX + playW - 2, y: playY + 2 },
      { x: playX + 2, y: playY + playH - 2 },
      { x: playX + playW / 2, y: playY + playH + 2 },
      { x: playX + playW - 2, y: playY + playH - 2 }
    ];

    if (state.shotWasBreak && state.balls.length > 0 && state.phase === 'AIMING') {
      positionTriangleRackBalls();
    } else if (preservePositions && state.balls.length > 0 && oldPlayW > 0 && oldPlayH > 0) {
      state.balls.forEach(b => {
        const nx = (b.x - oldPlayX) / oldPlayW;
        const ny = (b.y - oldPlayY) / oldPlayH;
        b.x = playX + nx * playW;
        b.y = playY + ny * playH;
      });
    }
  }

  function getP1Name() {
    return $('p1-name')?.textContent?.trim() || getSavedPlayerName() || 'Player 1';
  }

  function getP2Name() {
    return state.opponent === 'ai' ? 'AI' : 'Player 2';
  }

  function getActiveTurnName() {
    return state.turn === 1 ? getP1Name() : getP2Name();
  }

  function getRoundRobinSides() {
    if (state.matchCount % 2 === 0) {
      return { left: 'solids', right: 'stripes', p1: 'solids', p2: 'stripes' };
    }
    return { left: 'stripes', right: 'solids', p1: 'stripes', p2: 'solids' };
  }

  function getBreakerForMatch() {
    return state.matchCount % 2 === 0 ? 1 : 2;
  }

  function resetMatchGroups() {
    state.groups = { 1: null, 2: null };
  }

  function assignGroupToShooter(claimedGroup) {
    if (state.mode !== '8ball') return;
    if (!claimedGroup || state.groups[state.turn]) return;
    const otherGroup = claimedGroup === 'solids' ? 'stripes' : 'solids';
    const otherPlayer = state.turn === 1 ? 2 : 1;
    state.groups[state.turn] = claimedGroup;
    state.groups[otherPlayer] = otherGroup;
  }

  function maybeAssignGroupsFromPocketed(objectPocketed) {
    if (state.mode !== '8ball') return;
    if (state.groups[1] && state.groups[2]) return;

    const firstGroupBall = objectPocketed.find(n => (n >= 1 && n <= 7) || (n >= 9 && n <= 15));
    if (!firstGroupBall) return;

    assignGroupToShooter(getBallGroup(firstGroupBall));
  }

  function hasRemainingGroupBalls(playerNum) {
    const grp = state.groups[playerNum];
    if (!grp) return true;
    return state.balls.some(b => !b.pocketed && getBallGroup(b.num) === grp);
  }

  function isEightBallIllegalTarget(shooterTurn) {
    return state.mode === '8ball' && hasRemainingGroupBalls(shooterTurn);
  }

  function isOpponentGroupBall(ballNum, shooterTurn) {
    if (state.mode !== '8ball') return false;
    const shooterGroup = state.groups[shooterTurn];
    const hitGroup = getBallGroup(ballNum);
    return Boolean(shooterGroup && hitGroup && hitGroup !== shooterGroup);
  }

  function getTimerStageColor(remainingSec) {
    const ratio = Math.max(0, Math.min(1, remainingSec / TURN_DURATION));
    if (ratio > 0.6) return '#22c55e';      // green
    if (ratio > 0.35) return '#eab308';     // yellow
    if (ratio > 0.12) return '#f97316';     // orange
    return '#ef4444';                       // red
  }

  function renderNameTimerVisuals() {
    const b1 = $('badge-p1');
    const b2 = $('badge-p2');
    const bar1 = $('p1-timer-bar');
    const bar2 = $('p2-timer-bar');
    const elapsedPct = Math.max(0, Math.min(100, ((TURN_DURATION - state.timerSeconds) / TURN_DURATION) * 100));
    const stageColor = getTimerStageColor(state.timerSeconds);

    [
      { badge: b1, bar: bar1, playerNum: 1, activeAccent: '#f59e0b' },
      { badge: b2, bar: bar2, playerNum: 2, activeAccent: '#2dd4bf' }
    ].forEach(({ badge, bar, playerNum, activeAccent }) => {
      if (!badge || !bar) return;
      const isActive = state.turn === playerNum && state.phase !== 'GAME_OVER' && state.phase !== 'MENU';
      if (isActive) {
        badge.style.color = stageColor;
        badge.style.borderColor = stageColor;
        badge.style.boxShadow = `0 0 0 1px ${stageColor}, 0 0 10px ${stageColor}44`;
        bar.style.width = elapsedPct + '%';
        bar.style.backgroundColor = stageColor;
      } else {
        badge.style.color = '#f8fafc';
        badge.style.borderColor = playerNum === state.turn ? activeAccent : 'rgba(255,255,255,0.14)';
        badge.style.boxShadow = 'none';
        bar.style.width = '0%';
        bar.style.backgroundColor = '#22c55e';
      }
    });
  }

  function showTurnModal(customText, customSub) {
    const overlay = $('turn-modal-overlay');
    const titleEl = $('turn-overlay-title');
    const subEl = $('turn-overlay-sub');
    if (!overlay || destroyed) return;

    clearTimeout(state.turnToastTimer);
    clearTimeout(state.turnToastFadeTimer);

    const activeName = getActiveTurnName();
    const label = customText || `${activeName}'s Turn`;

    if (titleEl) titleEl.textContent = label;
    if (subEl) {
      subEl.textContent = customSub || (
        state.phase === 'BALL_IN_HAND'
          ? 'Ball in Hand • Place Cue Ball'
          : (state.mode === '8ball' ? '8-Ball Pool' : '9-Ball Pool')
      );
    }

    overlay.classList.remove('hidden', 'fading');

    state.turnToastFadeTimer = setTimeout(() => {
      if (!destroyed) overlay.classList.add('fading');
    }, 1050);

    state.turnToastTimer = setTimeout(() => {
      if (!destroyed) overlay.classList.add('hidden', 'fading');
    }, 1500);
  }

  function showPocketedAnimation(ballNum) {
    const badge = $('pocket-anim-badge');
    if (!badge || destroyed) return;
    clearTimeout(state.pocketAnimTimer);
    clearTimeout(state.pocketAnimFadeTimer);

    const label = ballNum === 0
      ? 'Cue Ball Pocketed'
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
    }, 1550);
  }

  function getSavedPlayerName() {
    try {
      const saved = localStorage.getItem(PLAYER_NAME_KEY) || localStorage.getItem('playerName');
      if (saved && saved.trim()) return saved.trim();
    } catch (_) {}
    const domName = $('p1-name')?.textContent;
    return (domName && domName.trim()) || 'Player 1';
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
    if (p1El) p1El.textContent = name.slice(0, 14);
  }

  function goToHubLobby() {
    leavingToHub = true;
    state.phase = 'MENU';
    clearPendingTimers();
    hidePocketBadgeImmediately();
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

  function createPocketedBallChip(n, highlight = false) {
    const chip = document.createElement('span');
    chip.className = 'pocketed-chip' + (highlight ? ' just-pocketed' : '');
    chip.style.background = n > 8
      ? `radial-gradient(circle, #fff 44%, ${BALL_COLORS[n]} 47%)`
      : (BALL_COLORS[n] || '#f8fafc');
    if (n === 8) chip.style.color = '#ffffff';
    chip.textContent = String(n);
    chip.title = `Pocketed Ball #${n}`;
    return chip;
  }

  function updateDividerDrawer() {
    const drawerTitle = $('drawer-player-title');
    const centerGroup = $('drawer-center-group');
    const leftLabel = $('drawer-left-label');
    const rightLabel = $('drawer-right-label');
    const rowEl = $('pocketed-ball-row');

    const p1Label = getP1Name();
    const p2Label = getP2Name();
    const rr = getRoundRobinSides();

    if (drawerTitle) {
      drawerTitle.textContent = `${p1Label} vs ${p2Label}`;
    }

    if (centerGroup) {
      if (state.mode === '8ball') {
        const activeGroup = state.groups[state.turn];
        const groupText = activeGroup ? activeGroup.toUpperCase() : 'OPEN';
        centerGroup.textContent = `${getActiveTurnName()}: ${groupText}`;
        centerGroup.className = activeGroup === 'stripes'
          ? 'side-stripes'
          : (activeGroup === 'solids' ? 'side-solids' : 'side-center-tag');
      } else {
        const lowest = getLowestTargetNumber();
        centerGroup.textContent = lowest ? `TARGET #${lowest}` : '9-BALL';
        centerGroup.className = 'side-center-tag';
      }
    }

    if (leftLabel && rightLabel) {
      if (state.mode === '8ball') {
        const leftIsSolids = rr.left === 'solids';
        leftLabel.textContent = leftIsSolids ? 'LEFT: SOLIDS' : 'LEFT: STRIPES';
        leftLabel.className = leftIsSolids ? 'side-solids' : 'side-stripes';

        const rightIsStripes = rr.right === 'stripes';
        rightLabel.textContent = rightIsStripes ? 'RIGHT: STRIPES' : 'RIGHT: SOLIDS';
        rightLabel.className = rightIsStripes ? 'side-stripes' : 'side-solids';
      } else {
        const lowest = getLowestTargetNumber();
        leftLabel.textContent = lowest ? `TARGET #${lowest}` : '9-BALL';
        leftLabel.className = 'side-solids';
        rightLabel.textContent = `MATCH ${state.matchCount + 1}`;
        rightLabel.className = 'side-stripes';
      }
    }

    if (rowEl) {
      rowEl.innerHTML = '';
      if (!state.pocketedStack.length) {
        const emptySpan = document.createElement('span');
        emptySpan.className = 'pocketed-empty-hint';
        emptySpan.textContent = 'Pocketed balls stack here';
        rowEl.appendChild(emptySpan);
      } else {
        state.pocketedStack.forEach(num => {
          const isRecent = state.pocketedThisShot.includes(num);
          rowEl.appendChild(createPocketedBallChip(num, isRecent));
        });
      }
    }
  }

  function updateHUD() {
    const p2El = $('p2-name');
    const p2Icon = $('p2-icon');
    if (p2El) p2El.textContent = getP2Name();
    if (p2Icon) p2Icon.textContent = state.opponent === 'ai' ? '🤖' : '👥';

    renderNameTimerVisuals();
    updateDividerDrawer();

    const aiBanner = $('ai-thinking-banner');
    if (aiBanner) {
      const isAiTurnActive = state.opponent === 'ai' && state.turn === 2 &&
        (state.phase === 'AIMING' || state.phase === 'BALL_IN_HAND');
      aiBanner.classList.toggle('hidden', !isAiTurnActive);
    }

    const hintEl = $('ball-in-hand-hint');
    if (hintEl) {
      hintEl.style.display = state.phase === 'BALL_IN_HAND' ? 'block' : 'none';
    }
    syncSettingsSummaries();
  }

  function startTurnTimer() {
    clearInterval(state.timerInterval);
    state.timerSeconds = TURN_DURATION;
    renderNameTimerVisuals();
    state.timerInterval = setInterval(() => {
      if (destroyed || leavingToHub || state.phase === 'MENU' || state.phase === 'GAME_OVER') {
        clearInterval(state.timerInterval);
        return;
      }
      if (state.phase === 'SHOOTING') return;
      state.timerSeconds--;
      renderNameTimerVisuals();
      if (state.timerSeconds <= 0) {
        clearInterval(state.timerInterval);
        handleTimeoutTurnPass();
      }
    }, 1000);
  }

  function handleTimeoutTurnPass() {
    playTone(180, 'sawtooth', 0.35, 0.16);
    haptic(60);
    state.turn = state.turn === 1 ? 2 : 1;
    state.phase = 'AIMING';
    updateHUD();
    showTurnModal("Time's Up", `${getActiveTurnName()}'s Turn`);
    startTurnTimer();
    maybeTriggerAI();
  }

  function setupRack(advanceRoundRobin = false) {
    if (advanceRoundRobin) {
      state.matchCount += 1;
    }
    clearPendingTimers();
    hidePocketBadgeImmediately();
    state.shotWasBreak = true;
    resizeTable(false);
    resetMatchGroups();
    state.pocketedStack = [];
    state.pocketedThisShot = [];
    state.firstHitBall = null;
    state.railHitAfterContact = false;
    state.turn = getBreakerForMatch();
    state.spin = { x: 0, y: 0 };
    updateSpinUI();
    state.takoPull = 0;
    updatePowerUI();

    buildRackBalls();

    state.aimAngle = 0;
    state.phase = 'AIMING';
    updateHUD();
    showTurnModal(`${getActiveTurnName()}'s Turn`, `Match ${state.matchCount + 1} • Break Shot`);
    startTurnTimer();
    maybeTriggerAI();

    requestAnimationFrame(() => {
      if (!destroyed && !leavingToHub && state.shotWasBreak && state.phase === 'AIMING') {
        resizeTable(false);
        positionTriangleRackBalls();
      }
    });
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

  function findBestPocketForBall(ball, incomingDir) {
    let bestPk = null;
    let bestLineScore = -Infinity;
    pockets.forEach(pk => {
      const toPkX = pk.x - ball.x;
      const toPkY = pk.y - ball.y;
      const d = Math.hypot(toPkX, toPkY) || 1;
      const ux = toPkX / d;
      const uy = toPkY / d;
      const align = ux * incomingDir.x + uy * incomingDir.y;
      const score = align * 100 - d * 0.05;
      if (score > bestLineScore) {
        bestLineScore = score;
        bestPk = { pk, ux, uy, d, aligned: align > 0.94 };
      }
    });
    return bestPk;
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
    let targetLineLen = 95;
    let pocketAligned = false;
    let cueDeflectDir = null;
    let illegalAimTarget = null;

    if (hitBall) {
      const illegalOpp = isOpponentGroupBall(hitBall.num, state.turn);
      const illegalEight = hitBall.num === 8 && isEightBallIllegalTarget(state.turn);
      if (illegalOpp || illegalEight) {
        illegalAimTarget = hitBall;
        return {
          cue,
          ghostX,
          ghostY,
          hitBall,
          targetDir: null,
          targetLineLen: 0,
          pocketAligned: false,
          cueDeflectDir: null,
          illegalAimTarget
        };
      }

      const nx = (hitBall.x - ghostX) / rSum;
      const ny = (hitBall.y - ghostY) / rSum;
      targetDir = { x: nx, y: ny };

      const pocketInfo = findBestPocketForBall(hitBall, targetDir);
      if (pocketInfo && pocketInfo.aligned) {
        pocketAligned = true;
        targetLineLen = Math.min(pocketInfo.d, 220);
      }

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

    return {
      cue,
      ghostX,
      ghostY,
      hitBall,
      targetDir,
      targetLineLen,
      pocketAligned,
      cueDeflectDir,
      illegalAimTarget: null
    };
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

    state.shotWasBreak = false;
    state.pocketedThisShot = [];
    state.firstHitBall = null;
    state.railHitAfterContact = false;
    state.phase = 'SHOOTING';
    state.takoPull = 0;
    updatePowerUI();
    updateHUD();

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
          if (Math.hypot(b.x - pk.x, b.y - pk.y) < pocketR * 1.05) {
            b.pocketed = true;
            b.vx = 0;
            b.vy = 0;
            state.pocketedThisShot.push(b.num);
            if (b.num > 0 && !state.pocketedStack.includes(b.num)) {
              state.pocketedStack.push(b.num);
            }
            if (b.num > 0 && b.num !== 8) {
              maybeAssignGroupsFromPocketed([b.num]);
            }
            updateHUD();
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
              const restitution = 0.96;
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

    const hitOpponentBallFirst =
      state.firstHitBall !== null && isOpponentGroupBall(state.firstHitBall, state.turn);
    const hitEightBallTooEarly =
      state.firstHitBall === 8 && isEightBallIllegalTarget(state.turn);
    const pocketedOpponentBall = objectPocketed.some(n => isOpponentGroupBall(n, state.turn));
    const foulCommitted =
      scratched || hitOpponentBallFirst || hitEightBallTooEarly || pocketedOpponentBall;

    if (scratched) {
      const cue = getCueBall();
      if (cue) {
        cue.pocketed = false;
        cue.vx = 0;
        cue.vy = 0;
        cue.x = playX + playW * 0.25;
        cue.y = playY + playH * 0.5;
      }
    }

    if (state.mode === '9ball') {
      if (objectPocketed.includes(9)) {
        endMatch(!foulCommitted ? state.turn : otherPlayer);
        return;
      }
      if (objectPocketed.length > 0 && !foulCommitted) {
        state.phase = 'AIMING';
      } else {
        state.turn = otherPlayer;
        state.phase = foulCommitted ? 'BALL_IN_HAND' : 'AIMING';
      }
    } else {
      if (objectPocketed.includes(8)) {
        const hadRemaining = hasRemainingGroupBalls(state.turn);
        if (foulCommitted || hadRemaining) {
          endMatch(otherPlayer);
        } else {
          endMatch(state.turn);
        }
        return;
      }

      const shooterGroup = state.groups[state.turn];
      const pocketedOwnGroup = !foulCommitted && objectPocketed.length > 0 && (
        shooterGroup
          ? objectPocketed.some(n => getBallGroup(n) === shooterGroup)
          : objectPocketed.some(n => getBallGroup(n) !== null)
      );

      if (pocketedOwnGroup) {
        state.phase = 'AIMING';
      } else {
        state.turn = otherPlayer;
        state.phase = foulCommitted ? 'BALL_IN_HAND' : 'AIMING';
      }
    }

    state.spin = { x: 0, y: 0 };
    updateSpinUI();
    updateHUD();
    showTurnModal(
      `${getActiveTurnName()}'s Turn`,
      foulCommitted
        ? 'Foul • Ball in Hand'
        : (state.turn === otherPlayer && objectPocketed.length === 0 ? 'Active Turn' : 'Extra Shot')
    );
    startTurnTimer();
    maybeTriggerAI();
  }

  function endMatch(winnerNum) {
    if (state.phase === 'GAME_OVER') return;
    state.phase = 'GAME_OVER';
    clearPendingTimers();
    updateHUD();
    playTone(587, 'triangle', 0.45, 0.25);
    haptic([40, 40, 80]);

    const titleEl = $('winner-title');
    const modalEl = $('gameover-modal');
    if (titleEl) {
      titleEl.textContent = winnerNum === 1 ? 'You Win' : 'You Lose';
    }
    if (modalEl) modalEl.classList.remove('hidden');
  }

  function getAiCandidateTargets() {
    const active = state.balls.filter(b => !b.pocketed && b.num > 0);
    if (state.mode === '9ball') {
      const lowest = getLowestTargetNumber();
      return active.filter(b => b.num === lowest);
    }

    const aiGroup = state.groups[2];
    if (!aiGroup) {
      const nonEight = active.filter(b => b.num !== 8);
      return nonEight.length > 0 ? nonEight : active;
    }

    const ownGroupBalls = active.filter(b => getBallGroup(b.num) === aiGroup);
    if (ownGroupBalls.length > 0) {
      return ownGroupBalls;
    }

    const eightBall = active.find(b => b.num === 8);
    return eightBall ? [eightBall] : active;
  }

  function maybeTriggerAI() {
    clearTimeout(state.aiTimer);
    clearInterval(state.aiPullInterval);
    updateHUD();
    if (destroyed || leavingToHub || state.opponent !== 'ai' || state.turn !== 2) return;
    if (state.phase !== 'AIMING' && state.phase !== 'BALL_IN_HAND') return;

    state.aiTimer = setTimeout(() => {
      if (destroyed || leavingToHub || state.opponent !== 'ai' || state.turn !== 2) return;
      const cue = getCueBall();
      if (!cue) return;

      const legalTargets = getAiCandidateTargets();

      if (state.phase === 'BALL_IN_HAND') {
        if (legalTargets.length > 0) {
          const t = legalTargets[0];
          cue.x = Math.max(playX + ballR * 2, Math.min(playX + playW - ballR * 2, t.x - playW * 0.18));
          cue.y = Math.max(playY + ballR * 2, Math.min(playY + playH - ballR * 2, t.y));
        }
        state.phase = 'AIMING';
        updateHUD();
      }

      let bestAngle = null;
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
          if (cutCos > 0.12) {
            const score = cutCos * 120 - distPk * 0.15;
            if (score > bestScore) {
              bestScore = score;
              bestAngle = shotAngle;
            }
          }
        });
      });

      if (bestAngle === null && legalTargets.length > 0) {
        const fallback = legalTargets[0];
        bestAngle = Math.atan2(fallback.y - cue.y, fallback.x - cue.x);
      } else if (bestAngle === null) {
        bestAngle = Math.atan2((playY + playH / 2) - cue.y, (playX + playW * 0.68) - cue.x);
      }

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
      ctx.arc(playX + playW * 0.68, playY + playH * 0.5, 3, 0, Math.PI * 2);
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

      let illegalAimTarget = null;

      if ((state.phase === 'AIMING' || state.phase === 'BALL_IN_HAND') && state.guideMode !== 'off') {
        const traj = computeTrajectory();
        if (traj) {
          const {
            cue, ghostX, ghostY, hitBall, targetDir, targetLineLen,
            pocketAligned, cueDeflectDir
          } = traj;
          illegalAimTarget = traj.illegalAimTarget;

          // Keep cue trajectory line visible up to the contact/ghost point
          ctx.save();
          ctx.setLineDash([6, 6]);
          ctx.lineWidth = 2;
          ctx.strokeStyle = illegalAimTarget ? 'rgba(239, 68, 68, 0.85)' : 'rgba(255, 255, 255, 0.78)';
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

          // When aiming at an unpocketed opponent group ball (or early 8-ball), end the line at the impact point with no extra lines
          if (!illegalAimTarget && state.guideMode === 'full') {
            ctx.beginPath();
            ctx.arc(ghostX, ghostY, ballR, 0, Math.PI * 2);
            ctx.strokeStyle = pocketAligned ? '#34d399' : (hitBall ? 'rgba(251, 191, 36, 0.85)' : 'rgba(255, 255, 255, 0.4)');
            ctx.lineWidth = pocketAligned ? 2.2 : 1.5;
            ctx.stroke();

            if (hitBall && targetDir) {
              ctx.beginPath();
              ctx.moveTo(hitBall.x, hitBall.y);
              ctx.lineTo(hitBall.x + targetDir.x * targetLineLen, hitBall.y + targetDir.y * targetLineLen);
              ctx.strokeStyle = pocketAligned ? '#34d399' : '#fbbf24';
              ctx.lineWidth = pocketAligned ? 3 : 2.2;
              ctx.stroke();
            }

            if (cueDeflectDir) {
              ctx.beginPath();
              ctx.moveTo(ghostX, ghostY);
              ctx.lineTo(ghostX + cueDeflectDir.x * 65, ghostY + cueDeflectDir.y * 65);
              ctx.strokeStyle = 'rgba(96, 165, 250, 0.75)';
              ctx.lineWidth = 1.6;
              ctx.stroke();
            }
          }
        }
      }

      state.balls.forEach(b => {
        if (!b.pocketed) drawBall(b);
      });

      // Only draw a red circle when actively aiming at an unpocketed opponent group ball (or early 8-ball)
      if (illegalAimTarget && !illegalAimTarget.pocketed) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(illegalAimTarget.x, illegalAimTarget.y, ballR + 5.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.8;
        ctx.stroke();
        ctx.restore();
      }

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
    if (gripEl) gripEl.style.top = (22 + state.takoPull * 54) + '%';
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
    state.aimAngle -= 0.015 * Math.max(0.4, state.fineAimSpeed * 3);
    haptic(8);
  });

  $('btn-aim-cw')?.addEventListener('click', () => {
    if (!isUserTurn()) return;
    state.aimAngle += 0.015 * Math.max(0.4, state.fineAimSpeed * 3);
    haptic(8);
  });

  const spinDot = $('spin-dot');
  const spinReadout = $('spin-readout');
  const cockpitSpinPad = $('cockpit-spin-pad');
  const spinModal = $('spin-modal');
  const spinModalPad = $('spin-modal-pad');
  const spinModalDot = $('spin-modal-dot');
  const spinModalReadout = $('spin-modal-readout');
  let modalSpinDragging = false;
  let cockpitSpinDragging = false;

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

  function applySpinFromPad(padEl, e) {
    if (!padEl) return;
    const rect = padEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = Math.max(8, rect.width * 0.36);
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

  if (cockpitSpinPad) {
    cockpitSpinPad.addEventListener('pointerdown', (e) => {
      if (!isUserTurn()) return;
      cockpitSpinPad.setPointerCapture(e.pointerId);
      cockpitSpinDragging = true;
      applySpinFromPad(cockpitSpinPad, e);
    });
    cockpitSpinPad.addEventListener('pointermove', (e) => {
      if (!cockpitSpinDragging || !isUserTurn()) return;
      applySpinFromPad(cockpitSpinPad, e);
    });
    cockpitSpinPad.addEventListener('pointerup', () => {
      cockpitSpinDragging = false;
    });
  }

  $('btn-cockpit-reset-spin')?.addEventListener('click', () => {
    if (!isUserTurn()) return;
    state.spin = { x: 0, y: 0 };
    updateSpinUI();
    haptic(10);
  });

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
      applySpinFromPad(spinModalPad, e);
    });

    spinModalPad.addEventListener('pointermove', (e) => {
      if (!modalSpinDragging || !isUserTurn()) return;
      applySpinFromPad(spinModalPad, e);
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
    if (changed && state.phase !== 'MENU') setupRack(false);
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

  $('btn-new-rack-top')?.addEventListener('click', () => {
    setupRack(true);
    haptic(10);
  });

  $('btn-start-match')?.addEventListener('click', () => {
    markGateHandledOnce();
    try { sessionStorage.removeItem(ENTER_FS_FROM_HUB_KEY); } catch (_) {}
    BilliardLandscapeGuard.requestFullscreenSafe(false);
    BilliardLandscapeGuard.tryLockLandscape();
    BilliardLandscapeGuard.sync();
    $('setup-modal')?.classList.add('hidden');
    setupRack(true);
    setTimeout(() => { if (!destroyed) resizeTable(true); }, 120);
  });

  $('btn-new-match')?.addEventListener('click', () => {
    clearPendingTimers();
    hidePocketBadgeImmediately();
    state.phase = 'MENU';
    updateHUD();
    $('setup-modal')?.classList.remove('hidden');
  });

  $('btn-rematch')?.addEventListener('click', () => {
    markGateHandledOnce();
    BilliardLandscapeGuard.requestFullscreenSafe(false);
    BilliardLandscapeGuard.tryLockLandscape();
    BilliardLandscapeGuard.sync();
    $('gameover-modal')?.classList.add('hidden');
    setupRack(true);
    setTimeout(() => { if (!destroyed) resizeTable(true); }, 120);
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
    setupRack(true);
    setTimeout(() => { if (!destroyed) resizeTable(true); }, 80);
  });

  $('btn-dock-fs')?.addEventListener('click', () => {
    BilliardLandscapeGuard.requestFullscreenSafe(true);
    BilliardLandscapeGuard.tryLockLandscape();
    BilliardLandscapeGuard.sync();
    haptic(10);
    setTimeout(() => { if (!destroyed) resizeTable(true); }, 120);
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
  setupRack(false);
  rafId = requestAnimationFrame(render);

  return function cleanupBilliardPool() {
    destroyed = true;
    leavingToHub = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    clearPendingTimers();
    hidePocketBadgeImmediately();
    BilliardLandscapeGuard.teardown();
    if (audioCtx && typeof audioCtx.close === 'function') {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    stage.innerHTML = '';
  };
};