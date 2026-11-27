(() => {
  const STYLE_ID = 'skyline-hustle-styles';

  const CSS = `
    .sh-shell {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 0;
      overflow-y: auto;
      padding: 16px;
      padding-top: 56px;
      background: radial-gradient(circle at 50% 10%, #2d3e38 0%, #16221f 58%, #0b1110 100%);
      color: #f4efe6;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .sh-shell *, .sh-shell *::before, .sh-shell *::after {
      box-sizing: border-box;
    }
    .sh-container {
      max-width: 980px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-bottom: 40px;
    }
    .sh-top-card {
      background: rgba(255, 253, 249, 0.97);
      color: #1f2629;
      border: 1px solid #dfd6c7;
      border-radius: 18px;
      padding: 16px 18px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
    }
    .sh-title {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 900;
      color: #1f6b5e;
      letter-spacing: -0.02em;
    }
    .sh-sub {
      font-size: 0.82rem;
      color: #5c666d;
      margin-top: 2px;
    }
    .sh-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .sh-stat {
      background: #f6f1e7;
      border: 1px solid #dfd6c7;
      border-radius: 12px;
      padding: 8px 12px;
      min-width: 98px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #5c666d;
    }
    .sh-stat strong {
      display: block;
      margin-top: 2px;
      font-size: 0.98rem;
      font-family: 'JetBrains Mono', monospace;
      color: #1b2226;
    }
    .sh-banner {
      border-radius: 14px;
      padding: 10px 14px;
      font-size: 0.82rem;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      background: rgba(254, 243, 199, 0.96);
      color: #78350f;
      border: 1px solid #f59e0b;
    }
    .sh-banner.is-ok {
      background: rgba(209, 250, 229, 0.95);
      color: #065f46;
      border-color: #10b981;
    }
    .sh-grid {
      display: grid;
      grid-template-columns: 1.45fr 1fr;
      gap: 14px;
    }
    @media (max-width: 780px) {
      .sh-grid {
        grid-template-columns: 1fr;
      }
    }
    .sh-card {
      background: rgba(255, 253, 249, 0.97);
      color: #1f2629;
      border: 1px solid #dfd6c7;
      border-radius: 16px;
      padding: 15px;
      margin-bottom: 12px;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.16);
    }
    .sh-card:last-child {
      margin-bottom: 0;
    }
    .sh-card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .sh-room-name {
      font-size: 1rem;
      font-weight: 800;
      color: #1b2226;
    }
    .sh-badge {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 9px;
      border-radius: 999px;
      background: #dff2ee;
      color: #1c6a5d;
    }
    .sh-badge.is-locked {
      background: #fdebd2;
      color: #b4650e;
    }
    .sh-meta {
      font-size: 0.8rem;
      color: #5c666d;
    }
    .sh-bar {
      height: 8px;
      border-radius: 999px;
      background: #e9e2d6;
      overflow: hidden;
      margin: 10px 0 12px;
    }
    .sh-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #2a7b6f, #3ca392);
      transition: width 0.25s ease;
    }
    .sh-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .sh-btn {
      border: none;
      border-radius: 10px;
      padding: 8px 13px;
      font-size: 0.8rem;
      font-weight: 800;
      cursor: pointer;
      background: #2a7b6f;
      color: #ffffff;
      transition: transform 0.12s ease, opacity 0.15s ease;
    }
    .sh-btn:active:not(:disabled) {
      transform: scale(0.97);
    }
    .sh-btn.sh-warm {
      background: #d97742;
    }
    .sh-btn.sh-teal {
      background: #1d6f8a;
    }
    .sh-btn.sh-ghost {
      background: #ece5d8;
      color: #263036;
    }
    .sh-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .sh-section-title {
      margin: 0 0 10px;
      font-size: 1rem;
      font-weight: 800;
      color: #1b2226;
    }
    .sh-goal {
      font-size: 0.85rem;
      margin-bottom: 8px;
      color: #2c353b;
    }
    .sh-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .sh-msg {
      background: #f6f1e7;
      border-left: 3px solid #d97742;
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 0.82rem;
      color: #2b343a;
      margin-bottom: 8px;
    }
    .sh-msg:last-child {
      margin-bottom: 0;
    }
  `;

  const STORAGE_PREFIX = 'skyline_hustle_save_v2_';

  function createInitialState() {
    return {
      cash: 500,
      mood: 85,
      bestCash: 500,
      submittedMilestone: false,
      contractCooldown: 0,
      rooms: [
        { id: 'pod1', name: 'Indie Pod 01', level: 1, baseCost: 150, baseIncome: 12, powerUse: 25 },
        { id: 'eng', name: 'Hardware & Code Loft', level: 0, baseCost: 400, baseIncome: 38, powerUse: 45 },
        { id: 'lounge', name: 'Rooftop Atrium & Lounge', level: 0, baseCost: 350, baseIncome: 22, moodBonus: 2, powerUse: 15 },
        { id: 'solar', name: 'Solar & Battery Bay', level: 1, baseCost: 300, baseIncome: 0, powerBonus: 60, powerUse: 0 }
      ],
      messages: [
        'Mentor Maya: Welcome to Skyline Hustle! Keep power balanced and ship client sprints.',
        'Sponsor Nova: Overloading power cuts studio output by 50% until you upgrade solar.'
      ]
    };
  }

  function getSaveKey() {
    const player = (window.playerName || 'AJ').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    return `${STORAGE_PREFIX}${player || 'aj'}`;
  }

  function loadSavedState() {
    try {
      const raw = localStorage.getItem(getSaveKey());
      if (!raw) return createInitialState();
      const parsed = JSON.parse(raw);
      const base = createInitialState();
      const savedRooms = Array.isArray(parsed.rooms) && parsed.rooms.length ? parsed.rooms : base.rooms;
      return {
        ...base,
        ...parsed,
        rooms: savedRooms,
        messages: Array.isArray(parsed.messages) && parsed.messages.length ? parsed.messages : base.messages
      };
    } catch (_) {
      return createInitialState();
    }
  }

  function persistState(state) {
    try {
      localStorage.setItem(getSaveKey(), JSON.stringify(state));
    } catch (_) {}
  }

  function vibrate(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (_) {}
  }

  class SkylineHustleController {
    constructor(containerEl) {
      this.containerEl = containerEl;
      this.state = loadSavedState();
      this.intervalId = null;
      this.rootEl = null;
      this.els = {};
      this.onVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    ensureStyles() {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    startLoop() {
      if (this.intervalId !== null) return;
      this.intervalId = window.setInterval(() => {
        if (document.hidden) return;
        const dt = 0.2;
        this.state.cash += this.getIncomePerSec() * dt;
        const loungeBonus = this.state.rooms
          .filter((r) => r.moodBonus && r.level > 0)
          .reduce((s, r) => s + r.moodBonus * r.level, 0);
        const netMoodDrift = (-0.25 + loungeBonus * 0.12) * dt;
        this.state.mood = Math.max(40, Math.min(100, this.state.mood + netMoodDrift));

        if (this.state.contractCooldown > 0) {
          this.state.contractCooldown = Math.max(0, Number((this.state.contractCooldown - dt).toFixed(1)));
        }

        if (this.state.cash > this.state.bestCash) {
          this.state.bestCash = Math.floor(this.state.cash);
        }

        this.checkScoreSubmission();
        this.render();
      }, 200);
    }

    stopLoop() {
      if (this.intervalId !== null) {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }

    handleVisibilityChange() {
      if (document.hidden) {
        persistState(this.state);
      }
    }

    checkScoreSubmission() {
      const roundedCash = Math.floor(this.state.cash);
      if (roundedCash >= 1500 && !this.state.submittedMilestone) {
        this.state.submittedMilestone = true;
        persistState(this.state);
        if (window.ArcadeHero && typeof window.ArcadeHero.awardGameScore === 'function') {
          window.ArcadeHero.awardGameScore('skyline-hustle', roundedCash, window.playerName);
        }
      }
    }

    mount() {
      if (!this.containerEl) return;
      this.ensureStyles();

      this.rootEl = document.createElement('div');
      this.rootEl.className = 'sh-shell';
      this.rootEl.innerHTML = `
        <div class="sh-container">
          <div class="sh-top-card">
            <div>
              <h1 class="sh-title">Skyline Hustle: Startup Tower</h1>
              <div class="sh-sub">Solarpunk Loft Management • Player: <span data-ref="player">AJ</span> • Best: <span data-ref="best">$500</span></div>
            </div>
            <div class="sh-stats">
              <div class="sh-stat">Cash <strong data-ref="cash">$500</strong></div>
              <div class="sh-stat">Income <strong data-ref="income">+$0.0/s</strong></div>
              <div class="sh-stat">Power Load <strong data-ref="power">0 / 100 W</strong></div>
              <div class="sh-stat">Mood <strong data-ref="mood">85%</strong></div>
            </div>
          </div>

          <div class="sh-banner" data-ref="banner"></div>

          <div class="sh-grid">
            <section data-ref="rooms"></section>
            <aside>
              <div class="sh-card">
                <h2 class="sh-section-title">Chapter Milestones &amp; Actions</h2>
                <div data-ref="goals"></div>
              </div>
              <div class="sh-card">
                <h2 class="sh-section-title">Studio Feed</h2>
                <div data-ref="feed"></div>
              </div>
            </aside>
          </div>
        </div>
      `;

      this.containerEl.innerHTML = '';
      this.containerEl.appendChild(this.rootEl);

      this.els = {
        player: this.rootEl.querySelector('[data-ref="player"]'),
        best: this.rootEl.querySelector('[data-ref="best"]'),
        cash: this.rootEl.querySelector('[data-ref="cash"]'),
        income: this.rootEl.querySelector('[data-ref="income"]'),
        power: this.rootEl.querySelector('[data-ref="power"]'),
        mood: this.rootEl.querySelector('[data-ref="mood"]'),
        banner: this.rootEl.querySelector('[data-ref="banner"]'),
        rooms: this.rootEl.querySelector('[data-ref="rooms"]'),
        goals: this.rootEl.querySelector('[data-ref="goals"]'),
        feed: this.rootEl.querySelector('[data-ref="feed"]')
      };

      if (this.els.player) {
        this.els.player.textContent = window.playerName || 'AJ';
      }

      this.rootEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        if (action === 'upgrade') {
          this.upgradeRoom(btn.getAttribute('data-room-id'));
        } else if (action === 'boost') {
          this.boostMood();
        } else if (action === 'contract') {
          this.shipSprintContract();
        } else if (action === 'reset') {
          this.resetTower();
        }
      });

      document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.render();
      this.startLoop();
    }

    destroy() {
      this.stopLoop();
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      persistState(this.state);
      if (this.rootEl && this.rootEl.parentNode) {
        this.rootEl.parentNode.removeChild(this.rootEl);
      }
      this.rootEl = null;
      this.els = {};
    }

    getPowerUsed() {
      return this.state.rooms.reduce(
        (sum, r) => sum + (r.level > 0 && r.powerUse ? r.powerUse * r.level : 0),
        0
      );
    }

    getMaxPower() {
      return (
        100 +
        this.state.rooms
          .filter((r) => r.powerBonus)
          .reduce((sum, r) => sum + (r.level > 0 ? (r.level - 1) * r.powerBonus : 0), 0)
      );
    }

    getIncomePerSec() {
      const used = this.getPowerUsed();
      const cap = this.getMaxPower();
      const overloadPenalty = used > cap ? 0.5 : 1;
      const moodFactor = 0.6 + (this.state.mood / 100) * 0.6;
      return this.state.rooms.reduce((sum, r) => {
        if (!r.baseIncome || r.level === 0) return sum;
        return sum + r.baseIncome * r.level * overloadPenalty * moodFactor;
      }, 0);
    }

    upgradeCost(room) {
      return Math.round(room.baseCost * Math.pow(1.45, room.level));
    }

    upgradeRoom(id) {
      const room = this.state.rooms.find((r) => r.id === id);
      if (!room) return;
      const cost = this.upgradeCost(room);
      if (this.state.cash < cost) return;

      this.state.cash -= cost;
      room.level += 1;
      this.state.mood = Math.min(100, this.state.mood + 3);
      this.state.messages.unshift(`${room.name} reached Level ${room.level}!`);
      persistState(this.state);
      vibrate(15);
      if (window.AudioFX) window.AudioFX.coin();
      this.render();
    }

    boostMood() {
      const cost = 75;
      if (this.state.cash < cost) return;

      this.state.cash -= cost;
      this.state.mood = Math.min(100, this.state.mood + 15);
      this.state.messages.unshift('Espresso & matcha restock boosted team mood (+15%).');
      persistState(this.state);
      vibrate(15);
      if (window.AudioFX) window.AudioFX.click();
      this.render();
    }

    shipSprintContract() {
      if (this.state.contractCooldown > 0) return;
      const totalLevels = this.state.rooms.reduce((s, r) => s + r.level, 0);
      const payout = 90 + totalLevels * 25;
      this.state.cash += payout;
      this.state.mood = Math.max(40, this.state.mood - 4);
      this.state.contractCooldown = 12;
      if (this.state.cash > this.state.bestCash) {
        this.state.bestCash = Math.floor(this.state.cash);
      }
      this.state.messages.unshift(`Shipped a client sprint for +$${payout} cash (-4% mood).`);
      this.checkScoreSubmission();
      persistState(this.state);
      vibrate([15, 30, 15]);
      if (window.AudioFX) window.AudioFX.win();
      this.render();
    }

    resetTower() {
      this.state = createInitialState();
      persistState(this.state);
      vibrate(20);
      if (window.AudioFX) window.AudioFX.click();
      this.render();
    }

    render() {
      if (!this.rootEl) return;

      const used = this.getPowerUsed();
      const cap = this.getMaxPower();
      const overloaded = used > cap;
      const inc = this.getIncomePerSec();
      const cashFloor = Math.floor(this.state.cash);

      if (this.els.best) {
        this.els.best.textContent = `$${Math.max(cashFloor, this.state.bestCash || 500).toLocaleString()}`;
      }
      this.els.cash.textContent = `$${cashFloor.toLocaleString()}`;
      this.els.income.textContent = `+$${inc.toFixed(1)}/s`;
      this.els.power.textContent = `${used} / ${cap} W`;
      this.els.mood.textContent = `${Math.round(this.state.mood)}%`;

      if (this.els.banner) {
        this.els.banner.classList.toggle('is-ok', !overloaded);
        this.els.banner.innerHTML = overloaded
          ? `<span>⚠️ Power Overload (${used}W / ${cap}W): Income reduced by 50%! Upgrade Solar &amp; Battery Bay.</span>`
          : `<span>⚡ Power Nominal (${used}W / ${cap}W): Full studio output active.</span>`;
      }

      this.els.rooms.innerHTML = this.state.rooms
        .map((r) => {
          const cost = this.upgradeCost(r);
          const effParts = [];
          if (r.baseIncome) effParts.push(`+$${(r.baseIncome * (r.level || 1)).toFixed(0)}/s base`);
          if (r.powerBonus) effParts.push(`+${r.powerBonus}W capacity`);
          if (r.moodBonus) effParts.push(`+${r.moodBonus * Math.max(1, r.level)} mood regen`);
          const drawText = r.powerUse ? `${r.powerUse * Math.max(1, r.level)}W draw` : 'Power generator';

          return `
            <div class="sh-card">
              <div class="sh-card-head">
                <span class="sh-room-name">${r.name}</span>
                <span class="sh-badge ${r.level === 0 ? 'is-locked' : ''}">
                  ${r.level === 0 ? 'Locked' : `Lv. ${r.level}`}
                </span>
              </div>
              <div class="sh-meta">${effParts.join(' • ')} • ${drawText}</div>
              <div class="sh-bar">
                <div class="sh-bar-fill" style="width:${Math.min(100, r.level * 20)}%"></div>
              </div>
              <div class="sh-row">
                <span class="sh-meta">Next: $${cost}</span>
                <button
                  type="button"
                  class="sh-btn"
                  data-action="upgrade"
                  data-room-id="${r.id}"
                  ${this.state.cash < cost ? 'disabled' : ''}
                >
                  ${r.level === 0 ? 'Unlock Room' : 'Upgrade'}
                </button>
              </div>
            </div>
          `;
        })
        .join('');

      const totalLevels = this.state.rooms.reduce((s, r) => s + r.level, 0);
      const sprintReady = this.state.contractCooldown <= 0;

      this.els.goals.innerHTML = `
        <div class="sh-goal">• Reach Total Room Level 6 (${Math.min(totalLevels, 6)}/6) ${totalLevels >= 6 ? '✅' : ''}</div>
        <div class="sh-goal">• Earn $1,500 Cash (${cashFloor >= 1500 ? '✅' : 'In progress'})</div>
        <div class="sh-actions">
          <button
            type="button"
            class="sh-btn sh-teal"
            data-action="contract"
            ${!sprintReady ? 'disabled' : ''}
          >
            ${sprintReady ? 'Ship Client Sprint' : `Sprint Cooldown (${Math.ceil(this.state.contractCooldown)}s)`}
          </button>
          <button
            type="button"
            class="sh-btn sh-warm"
            data-action="boost"
            ${this.state.cash < 75 ? 'disabled' : ''}
          >
            Snack &amp; Lounge Boost ($75)
          </button>
          <button type="button" class="sh-btn sh-ghost" data-action="reset">
            Reset Tower
          </button>
        </div>
      `;

      this.els.feed.innerHTML = this.state.messages
        .slice(0, 5)
        .map((m) => `<div class="sh-msg">${m}</div>`)
        .join('');
    }
  }

  let currentGame = null;

  function initSkylineHustle(stageEl) {
    if (currentGame) {
      currentGame.destroy();
      currentGame = null;
    }
    const target =
      typeof stageEl === 'string'
        ? document.querySelector(stageEl)
        : stageEl || document.getElementById('game-stage');
    if (!target) return null;

    currentGame = new SkylineHustleController(target);
    currentGame.mount();

    return () => {
      if (currentGame) {
        currentGame.destroy();
        currentGame = null;
      }
    };
  }

  window.initSkylineHustle = initSkylineHustle;
})();
