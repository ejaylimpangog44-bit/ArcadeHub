(() => {
  const STORAGE_KEY = "arcadehub_hero_state_v1";
  const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

  const EXCLUDED_CARD_GAMES = new Set([
    "speed solitaire",
    "speed-solitaire",
    "speedsolitaire",
    "high-loe",
    "high-low",
    "highlow",
    "highloe",
    "coin scatter v2",
    "coin-scatter-v2",
    "coinscatterv2",
    "blackjack21",
    "blackjack 21",
    "blackjack-21"
  ]);

  const CATALOG = {
    avatars: [
      { id: "fox", name: "Cyber Fox", icon: "🦊", price: 0 },
      { id: "wolf", name: "Shadow Wolf", icon: "🐺", price: 250 },
      { id: "dragon", name: "Blaze Drake", icon: "🐲", price: 500 },
      { id: "tiger", name: "Neon Tiger", icon: "🐯", price: 800 }
    ],
    borders: [
      { id: "border-default", name: "Steel Ring", icon: "⚪", price: 0 },
      { id: "border-gold", name: "Solar Gold", icon: "🟡", price: 300 },
      { id: "border-neon", name: "Cyber Cyan", icon: "🔵", price: 450 },
      { id: "border-crimson", name: "Crimson Aura", icon: "🔴", price: 700 }
    ],
    outfits: [
      { id: "vest", name: "Arcade Vest", icon: "🦺", price: 0 },
      { id: "crown", name: "Champion Crown", icon: "👑", price: 400 },
      { id: "armor", name: "Mecha Plate", icon: "🛡️", price: 650 },
      { id: "cape", name: "Phantom Cape", icon: "🦸", price: 950 }
    ]
  };

  const WHEEL_PRIZES = [
    { label: "50 Coins", coins: 50, xp: 0 },
    { label: "100 XP", coins: 0, xp: 100 },
    { label: "150 Coins", coins: 150, xp: 0 },
    { label: "250 XP", coins: 0, xp: 250 },
    { label: "300 Coins", coins: 300, xp: 0 },
    { label: "500 Coins", coins: 500, xp: 100 }
  ];

  const defaultState = {
    xp: 0,
    coins: 100,
    owned: {
      avatars: ["fox"],
      borders: ["border-default"],
      outfits: ["vest"]
    },
    equipped: {
      avatar: "fox",
      border: "border-default",
      outfit: "vest"
    },
    streakCount: 0,
    lastStreakPhtDate: "",
    lastSpinTimestamp: 0,
    wheelRotation: 0,
    position: { side: "right", top: 76 }
  };

  let state = loadState();
  let fadeTimer = null;
  let wheelInterval = null;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved ? { ...defaultState, ...saved, owned: { ...defaultState.owned, ...saved.owned }, equipped: { ...defaultState.equipped, ...saved.equipped } } : structuredClone(defaultState);
    } catch {
      return structuredClone(defaultState);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getPhtNow() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + 8 * 3600000);
  }

  function getPhtDateString() {
    const pht = getPhtNow();
    const y = pht.getFullYear();
    const m = String(pht.getMonth() + 1).padStart(2, "0");
    const d = String(pht.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getYesterdayPhtDateString() {
    const pht = getPhtNow();
    pht.setDate(pht.getDate() - 1);
    const y = pht.getFullYear();
    const m = String(pht.getMonth() + 1).padStart(2, "0");
    const d = String(pht.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getGreetingPht() {
    const hour = getPhtNow().getHours();
    if (hour >= 5 && hour < 18) {
      return "Hi, good morning! Have a great day!";
    }
    return "Hi, good evening! Have a great night!";
  }

  function getLevelInfo(xp) {
    const level = Math.floor(xp / 500) + 1;
    const currentLevelXp = xp % 500;
    return { level, currentLevelXp, nextLevelXp: 500 };
  }

  function scheduleFade(delayMs = 4200) {
    const pill = document.getElementById("hero-companion");
    const speech = document.getElementById("hero-greeting");
    if (!pill || !speech) return;
    clearTimeout(fadeTimer);
    pill.classList.remove("faded");
    fadeTimer = setTimeout(() => {
      speech.classList.remove("visible");
      pill.classList.add("faded");
    }, delayMs);
  }

  function triggerGreeting() {
    const speech = document.getElementById("hero-greeting");
    if (!speech) return;
    speech.textContent = getGreetingPht();
    speech.classList.add("visible");
    scheduleFade(4500);
  }

  function renderUI() {
    const { level, currentLevelXp, nextLevelXp } = getLevelInfo(state.xp);
    const avatarObj = CATALOG.avatars.find(a => a.id === state.equipped.avatar) || CATALOG.avatars[0];
    const outfitObj = CATALOG.outfits.find(o => o.id === state.equipped.outfit) || CATALOG.outfits[0];

    const pillAvatar = document.getElementById("hero-pill-avatar");
    if (pillAvatar) pillAvatar.textContent = avatarObj.icon;
    const pillOutfit = document.getElementById("hero-pill-outfit");
    if (pillOutfit) pillOutfit.textContent = outfitObj.icon;
    const pillLvl = document.getElementById("hero-pill-lvl");
    if (pillLvl) pillLvl.textContent = `LVL ${level}`;
    const pillXp = document.getElementById("hero-pill-xp");
    if (pillXp) pillXp.textContent = `${state.xp.toLocaleString()} XP`;

    const pillBorder = document.getElementById("hero-pill-border");
    if (pillBorder) pillBorder.className = `hero-avatar-wrap ${state.equipped.border}`;

    const modalAvatarIcon = document.getElementById("modal-avatar-icon");
    if (modalAvatarIcon) modalAvatarIcon.textContent = avatarObj.icon;
    const modalOutfitIcon = document.getElementById("modal-outfit-icon");
    if (modalOutfitIcon) modalOutfitIcon.textContent = outfitObj.icon;
    const modalAvatarBorder = document.getElementById("modal-avatar-border");
    if (modalAvatarBorder) modalAvatarBorder.className = `hero-avatar-wrap large ${state.equipped.border}`;
    const modalLvlTitle = document.getElementById("modal-lvl-title");
    if (modalLvlTitle) modalLvlTitle.textContent = `LVL ${level} Hero`;
    const modalXpSub = document.getElementById("modal-xp-sub");
    if (modalXpSub) modalXpSub.textContent = `${currentLevelXp} / ${nextLevelXp} XP`;
    const modalXpFill = document.getElementById("modal-xp-fill");
    if (modalXpFill) modalXpFill.style.width = `${(currentLevelXp / nextLevelXp) * 100}%`;
    const heroCoinBalance = document.getElementById("hero-coin-balance");
    if (heroCoinBalance) heroCoinBalance.textContent = state.coins.toLocaleString();

    renderWardrobe();
    renderShop();
    renderRewards();
  }

  function renderWardrobe() {
    const buildOwnedGrid = (containerId, category, equippedKey) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = "";
      CATALOG[category].forEach(item => {
        if (!state.owned[category].includes(item.id)) return;
        const isEquipped = state.equipped[equippedKey] === item.id;
        const card = document.createElement("div");
        card.className = `cosmetic-card ${isEquipped ? "equipped" : ""}`;
        card.innerHTML = `
          <div class="cosmetic-preview">${item.icon}</div>
          <div class="cosmetic-name">${item.name}</div>
          <div class="cosmetic-tag">${isEquipped ? "Equipped" : "Equip"}</div>
        `;
        card.onclick = () => {
          state.equipped[equippedKey] = item.id;
          saveState();
          renderUI();
        };
        container.appendChild(card);
      });
    };

    buildOwnedGrid("grid-avatars", "avatars", "avatar");
    buildOwnedGrid("grid-borders", "borders", "border");
    buildOwnedGrid("grid-outfits", "outfits", "outfit");
  }

  function renderShop() {
    const shopGrid = document.getElementById("grid-shop");
    if (!shopGrid) return;
    shopGrid.innerHTML = "";
    const allItems = [
      ...CATALOG.avatars.map(i => ({ ...i, category: "avatars", equippedKey: "avatar" })),
      ...CATALOG.borders.map(i => ({ ...i, category: "borders", equippedKey: "border" })),
      ...CATALOG.outfits.map(i => ({ ...i, category: "outfits", equippedKey: "outfit" }))
    ].filter(item => item.price > 0);

    allItems.forEach(item => {
      const owned = state.owned[item.category].includes(item.id);
      const card = document.createElement("div");
      card.className = `cosmetic-card ${owned ? "equipped" : ""}`;
      card.innerHTML = `
        <div class="cosmetic-preview">${item.icon}</div>
        <div class="cosmetic-name">${item.name}</div>
        <div class="cosmetic-tag">${owned ? "Owned" : `${item.price} 🪙`}</div>
      `;
      card.onclick = () => {
        if (owned) return;
        if (state.coins < item.price) {
          alert("Not enough coins! Play arcade games to earn more.");
          return;
        }
        state.coins -= item.price;
        state.owned[item.category].push(item.id);
        state.equipped[item.equippedKey] = item.id;
        saveState();
        renderUI();
      };
      shopGrid.appendChild(card);
    });

    const buyXpBtn = document.getElementById("buy-xp-btn");
    if (buyXpBtn) buyXpBtn.disabled = state.coins < 150;
  }

  function renderRewards() {
    const todayPht = getPhtDateString();
    const yesterdayPht = getYesterdayPhtDateString();
    let effectiveStreak = state.streakCount;

    if (state.lastStreakPhtDate && state.lastStreakPhtDate !== todayPht && state.lastStreakPhtDate !== yesterdayPht) {
      effectiveStreak = 0;
    }

    const claimedToday = state.lastStreakPhtDate === todayPht;
    const nextDayNum = (effectiveStreak % 7) + 1;
    const rewardCoins = nextDayNum * 50;

    const streakStatusText = document.getElementById("streak-status-text");
    if (streakStatusText) {
      streakStatusText.textContent = claimedToday
        ? `Streak: ${effectiveStreak} Day(s) • Come back tomorrow (PHT)`
        : `Day ${nextDayNum} Ready: +${rewardCoins} Coins & +100 XP`;
    }

    const claimBtn = document.getElementById("claim-streak-btn");
    if (claimBtn) {
      claimBtn.disabled = claimedToday;
      claimBtn.textContent = claimedToday ? "Claimed Today" : `Claim +${rewardCoins} 🪙`;
    }

    const row = document.getElementById("streak-days-row");
    if (row) {
      row.innerHTML = "";
      for (let d = 1; d <= 7; d++) {
        const pip = document.createElement("div");
        const completedCount = effectiveStreak % 7 === 0 && effectiveStreak > 0 && claimedToday ? 7 : effectiveStreak % 7;
        pip.className = "streak-pip";
        if (d <= completedCount) pip.classList.add("done");
        else if (d === nextDayNum && !claimedToday) pip.classList.add("today");
        pip.textContent = `D${d}`;
        row.appendChild(pip);
      }
    }

    updateWheelCooldownUI();
  }

  function updateWheelCooldownUI() {
    const spinBtn = document.getElementById("spin-wheel-btn");
    const timerText = document.getElementById("wheel-timer-text");
    if (!spinBtn || !timerText) return;

    const nowMs = Date.now();
    const elapsed = nowMs - state.lastSpinTimestamp;

    if (elapsed >= FIVE_HOURS_MS) {
      spinBtn.disabled = false;
      spinBtn.textContent = "Spin Free";
      timerText.textContent = "Ready to Spin! (PHT +8 Synced)";
    } else {
      spinBtn.disabled = true;
      const remaining = FIVE_HOURS_MS - elapsed;
      const hrs = Math.floor(remaining / 3600000);
      const mins = Math.floor((remaining % 3600000) / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      spinBtn.textContent = "Cooldown";
      timerText.textContent = `Next spin in ${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
  }

  function setupInteractions() {
    const pill = document.getElementById("hero-companion");
    const backdrop = document.getElementById("hero-modal-backdrop");
    const closeBtn = document.getElementById("close-hero-modal");
    if (!pill || !backdrop || !closeBtn) return;

    pill.style.top = `${state.position.top}px`;
    if (state.position.side === "left") {
      pill.classList.remove("edge-right");
      pill.classList.add("edge-left");
      pill.style.left = "14px";
      pill.style.right = "auto";
    } else {
      pill.classList.remove("edge-left");
      pill.classList.add("edge-right");
      pill.style.right = "14px";
      pill.style.left = "auto";
    }

    let isDragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    pill.addEventListener("pointerdown", e => {
      isDragging = true;
      moved = false;
      clearTimeout(fadeTimer);
      pill.classList.remove("faded");
      pill.classList.add("dragging");
      const rect = pill.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      origLeft = rect.left;
      origTop = rect.top;
      pill.setPointerCapture(e.pointerId);
    });

    pill.addEventListener("pointermove", e => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
      if (!moved) return;

      const maxLeft = window.innerWidth - pill.offsetWidth - 8;
      const maxTop = window.innerHeight - pill.offsetHeight - 8;
      const nextLeft = Math.max(8, Math.min(maxLeft, origLeft + dx));
      const nextTop = Math.max(8, Math.min(maxTop, origTop + dy));

      pill.style.left = `${nextLeft}px`;
      pill.style.right = "auto";
      pill.style.top = `${nextTop}px`;
    });

    pill.addEventListener("pointerup", e => {
      if (!isDragging) return;
      isDragging = false;
      pill.classList.remove("dragging");
      pill.releasePointerCapture(e.pointerId);

      if (!moved) {
        openHeroModal();
        return;
      }

      const rect = pill.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const snapLeft = centerX < window.innerWidth / 2;

      if (snapLeft) {
        pill.classList.remove("edge-right");
        pill.classList.add("edge-left");
        pill.style.left = "14px";
        pill.style.right = "auto";
        state.position.side = "left";
      } else {
        pill.classList.remove("edge-left");
        pill.classList.add("edge-right");
        pill.style.right = "14px";
        pill.style.left = "auto";
        state.position.side = "right";
      }

      state.position.top = Math.round(rect.top);
      saveState();
      scheduleFade(3500);
    });

    function openHeroModal() {
      renderUI();
      backdrop.classList.remove("hidden");
      requestAnimationFrame(() => backdrop.classList.add("open"));
    }

    function closeHeroModal() {
      backdrop.classList.remove("open");
      setTimeout(() => backdrop.classList.add("hidden"), 280);
      scheduleFade(3000);
    }

    closeBtn.addEventListener("click", closeHeroModal);
    backdrop.addEventListener("click", e => {
      if (e.target === backdrop) closeHeroModal();
    });

    document.querySelectorAll(".hero-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".hero-tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".hero-tab-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        const targetTab = document.getElementById(`tab-${btn.dataset.tab}`);
        if (targetTab) targetTab.classList.add("active");
      });
    });

    const buyXpBtn = document.getElementById("buy-xp-btn");
    if (buyXpBtn) {
      buyXpBtn.addEventListener("click", () => {
        if (state.coins < 150) return;
        state.coins -= 150;
        state.xp += 250;
        saveState();
        renderUI();
      });
    }

    const claimStreakBtn = document.getElementById("claim-streak-btn");
    if (claimStreakBtn) {
      claimStreakBtn.addEventListener("click", () => {
        const todayPht = getPhtDateString();
        const yesterdayPht = getYesterdayPhtDateString();
        if (state.lastStreakPhtDate === todayPht) return;

        if (state.lastStreakPhtDate === yesterdayPht) {
          state.streakCount += 1;
        } else {
          state.streakCount = 1;
        }

        const dayTier = ((state.streakCount - 1) % 7) + 1;
        state.coins += dayTier * 50;
        state.xp += 100;
        state.lastStreakPhtDate = todayPht;
        saveState();
        renderUI();
      });
    }

    const spinWheelBtn = document.getElementById("spin-wheel-btn");
    if (spinWheelBtn) {
      spinWheelBtn.addEventListener("click", () => {
        if (Date.now() - state.lastSpinTimestamp < FIVE_HOURS_MS) return;
        const prizeIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
        const prize = WHEEL_PRIZES[prizeIndex];

        state.lastSpinTimestamp = Date.now();
        state.wheelRotation += 1440 + (360 - prizeIndex * 60 - 30);
        saveState();

        const wheelEl = document.getElementById("lucky-wheel");
        if (wheelEl) wheelEl.style.transform = `rotate(${state.wheelRotation}deg)`;
        updateWheelCooldownUI();

        setTimeout(() => {
          state.coins += prize.coins;
          state.xp += prize.xp;
          saveState();
          renderUI();
          alert(`You won ${prize.label}!`);
        }, 3300);
      });
    }
  }

  window.ArcadeHero = {
    awardGameScore(gameNameOrId, rawScore) {
      const normalized = String(gameNameOrId || "").trim().toLowerCase();
      if (EXCLUDED_CARD_GAMES.has(normalized)) return 0;

      const earnedCoins = Math.max(0, Math.floor(Number(rawScore) || 0));
      if (earnedCoins <= 0) return 0;

      state.coins += earnedCoins;
      state.xp += Math.floor(earnedCoins * 0.25);
      saveState();
      renderUI();

      const speech = document.getElementById("hero-greeting");
      if (speech) {
        speech.textContent = `+${earnedCoins} Coins earned!`;
        speech.classList.add("visible");
        scheduleFade(3200);
      }
      return earnedCoins;
    },
    getState() {
      return structuredClone(state);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderUI();
    setupInteractions();
    triggerGreeting();
    wheelInterval = setInterval(updateWheelCooldownUI, 1000);
  });
})();
