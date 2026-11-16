function initTinyCafe(stage) {
  stage.innerHTML = `
    <div id="cafe-root" class="relative w-full h-full bg-slate-950 flex flex-col justify-between p-2 pt-1 select-none text-white overflow-hidden transition-colors duration-1000" style="background: linear-gradient(180deg, #38bdf8 0%, #0ea5e9 50%, #0f172a 100%);">
      <!-- Cloud Dissolve Intro Overlay -->
      <div id="cafe-intro-clouds" class="absolute inset-0 z-50 bg-sky-900 flex flex-col items-center justify-center transition-transform duration-1000">
        <div class="text-5xl mb-3 animate-bounce">🍔☕</div>
        <h2 class="text-xl font-black text-amber-300 mb-1">Tiny Café &amp; Bistro Pro</h2>
        <p class="text-xs text-sky-200 mb-4 text-center max-w-xs">Drinks on the left, 10s cookable foods on the right. Zero scrolling, full viewport!</p>
        <button onclick="startCafeShift()" class="px-6 py-3 bg-amber-500 text-slate-950 font-black rounded-xl shadow-xl hover:scale-105 transition text-xs">Start Bistro Shift 🚀</button>
      </div>

      <!-- Day Complete Reward Modal Overlay -->
      <div id="day-modal" class="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 hidden transition-all duration-500 opacity-0 scale-95">
        <div class="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 max-w-xs w-full text-center shadow-2xl">
          <div class="text-4xl mb-2 animate-bounce">🏆</div>
          <h3 id="modal-title" class="text-lg font-black text-amber-300 mb-1">Day Completed!</h3>
          <p class="text-[11px] text-slate-300 mb-3">You successfully served 10 customers today!</p>
          
          <div class="bg-black/50 border border-white/10 rounded-xl p-2.5 mb-4 flex justify-around text-xs font-bold">
            <div class="text-amber-400">🪙 +500 Coins</div>
            <div class="text-emerald-400">⭐ +150 XP</div>
          </div>

          <button onclick="advanceToNextDay()" class="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-lg hover:scale-105 transition">Start Next Day 🌅</button>
        </div>
      </div>

      <!-- Top HUD -->
      <div class="flex items-center justify-between w-full bg-black/70 p-2 rounded-xl border border-white/10 shrink-0 text-xs">
        <span id="cafe-coins" class="text-amber-400 font-black">🪙 500</span>
        <span id="day-goal-text" class="text-amber-300 font-bold">📅 DAY 1 (0/10)</span>
        <span id="customer-patience-text" class="text-cyan-300 font-mono font-bold">⏳ 01:00</span>
      </div>

      <!-- Customer Counter & Current Order Banner -->
      <div class="w-full bg-slate-900/90 border border-white/15 rounded-2xl p-2 shadow-lg flex items-center justify-center gap-3 shrink-0 backdrop-blur-md">
        <div id="customer-avatar" class="text-3xl animate-bounce">🧑‍💼</div>
        <div class="relative bg-white text-slate-950 px-3 py-1.5 rounded-xl font-black text-xs shadow-md max-w-[240px] text-center">
          <div class="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-6 border-t-transparent border-r-6 border-r-white border-b-6 border-b-transparent"></div>
          <span id="customer-order-bubble">Waiting for customer...</span>
        </div>
      </div>

      <!-- MAIN WORKSPACE: Side-by-Side List Layout (Left: Drinks | Right: Foods) -->
      <div class="w-full grid grid-cols-2 gap-2 my-1 overflow-hidden shrink-0" style="height: calc(100% - 175px);">
        
        <!-- LEFT COLUMN: DRINKS & MIXERS -->
        <div class="bg-black/40 border border-white/10 rounded-2xl p-2 flex flex-col gap-1.5 overflow-y-auto">
          <div class="text-[10px] font-black text-sky-300 uppercase tracking-wider text-center border-b border-white/10 pb-1">☕ Drinks Station</div>
          
          <button onclick="addDrink('Beans', '🫘', 'Espresso Beans')" class="bg-slate-900/90 border border-sky-500/30 hover:border-sky-400 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow">
            <span class="text-lg">🫘</span>
            <div class="text-left flex-1 px-2">
              <div class="text-[11px] font-bold text-slate-200">Beans</div>
              <div class="text-[9px] text-sky-400">Instant Brew</div>
            </div>
            <span class="px-2 py-1 bg-sky-600 text-white font-black rounded-lg text-[9px]">+ Add</span>
          </button>

          <button onclick="addDrink('Milk', '🥛', 'Fresh Milk')" class="bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-400 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow">
            <span class="text-lg">🥛</span>
            <div class="text-left flex-1 px-2">
              <div class="text-[11px] font-bold text-slate-200">Milk</div>
              <div class="text-[9px] text-indigo-400">Dairy</div>
            </div>
            <span class="px-2 py-1 bg-indigo-600 text-white font-black rounded-lg text-[9px]">+ Add</span>
          </button>

          <button onclick="addDrink('Sugar', '🧊', 'Sugar/Ice')" class="bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow">
            <span class="text-lg">🧊</span>
            <div class="text-left flex-1 px-2">
              <div class="text-[11px] font-bold text-slate-200">Sugar</div>
              <div class="text-[9px] text-cyan-400">Sweetener</div>
            </div>
            <span class="px-2 py-1 bg-cyan-600 text-white font-black rounded-lg text-[9px]">+ Add</span>
          </button>

          <button onclick="addDrink('Choco', '🍫', 'Choco Syrup')" class="bg-slate-900/90 border border-pink-500/30 hover:border-pink-400 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow">
            <span class="text-lg">🍫</span>
            <div class="text-left flex-1 px-2">
              <div class="text-[11px] font-bold text-slate-200">Choco</div>
              <div class="text-[9px] text-pink-400">Syrup</div>
            </div>
            <span class="px-2 py-1 bg-pink-600 text-white font-black rounded-lg text-[9px]">+ Add</span>
          </button>

          <button onclick="addDrink('Cheese', '🧀', 'Cheese Topping')" class="bg-slate-900/90 border border-amber-500/30 hover:border-amber-400 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow">
            <span class="text-lg">🧀</span>
            <div class="text-left flex-1 px-2">
              <div class="text-[11px] font-bold text-slate-200">Cheese</div>
              <div class="text-[9px] text-amber-400">Topping</div>
            </div>
            <span class="px-2 py-1 bg-amber-600 text-white font-black rounded-lg text-[9px]">+ Add</span>
          </button>
        </div>

        <!-- RIGHT COLUMN: COOKABLE FOODS & KITCHEN -->
        <div class="bg-black/40 border border-white/10 rounded-2xl p-2 flex flex-col gap-1.5 overflow-y-auto">
          <div class="text-[10px] font-black text-amber-300 uppercase tracking-wider text-center border-b border-white/10 pb-1">🍳 Kitchen (10s Cook)</div>
          
          <!-- Food items with dynamic cook status buttons -->
          <div id="kitchen-food-list" class="flex flex-col gap-1.5">
            <!-- Rendered dynamically or via static list with live timer support -->
            <button id="btn-Burger" onclick="startCooking('Burger', '🍔', 'Burger')" class="bg-slate-900/90 border border-amber-600/30 hover:border-amber-500 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow relative">
              <span class="text-lg">🍔</span>
              <div class="text-left flex-1 px-2">
                <div class="text-[11px] font-bold text-slate-200">Burger</div>
                <div id="timer-Burger" class="text-[9px] text-amber-400">Ready to Cook</div>
              </div>
              <span id="badge-Burger" class="px-2 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-[9px]">Cook 10s</span>
            </button>

            <button id="btn-Pizza" onclick="startCooking('Pizza', '🍕', 'Pizza')" class="bg-slate-900/90 border border-orange-600/30 hover:border-orange-500 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow relative">
              <span class="text-lg">🍕</span>
              <div class="text-left flex-1 px-2">
                <div class="text-[11px] font-bold text-slate-200">Pizza</div>
                <div id="timer-Pizza" class="text-[9px] text-orange-400">Ready to Cook</div>
              </div>
              <span id="badge-Pizza" class="px-2 py-1 bg-orange-600 text-white font-black rounded-lg text-[9px]">Cook 10s</span>
            </button>

            <button id="btn-Fries" onclick="startCooking('Fries', '🍟', 'Fries')" class="bg-slate-900/90 border border-yellow-500/30 hover:border-yellow-400 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow relative">
              <span class="text-lg">🍟</span>
              <div class="text-left flex-1 px-2">
                <div class="text-[11px] font-bold text-slate-200">Fries</div>
                <div id="timer-Fries" class="text-[9px] text-yellow-400">Ready to Cook</div>
              </div>
              <span id="badge-Fries" class="px-2 py-1 bg-yellow-500 text-slate-950 font-black rounded-lg text-[9px]">Cook 10s</span>
            </button>

            <button id="btn-Hotdog" onclick="startCooking('Hotdog', '🌭', 'Hotdog')" class="bg-slate-900/90 border border-red-500/30 hover:border-red-400 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow relative">
              <span class="text-lg">🌭</span>
              <div class="text-left flex-1 px-2">
                <div class="text-[11px] font-bold text-slate-200">Hotdog</div>
                <div id="timer-Hotdog" class="text-[9px] text-red-400">Ready to Cook</div>
              </div>
              <span id="badge-Hotdog" class="px-2 py-1 bg-red-600 text-white font-black rounded-lg text-[9px]">Cook 10s</span>
            </button>

            <button id="btn-Chicken" onclick="startCooking('Chicken', '🍗', 'Chicken')" class="bg-slate-900/90 border border-amber-500/30 hover:border-amber-400 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow relative">
              <span class="text-lg">🍗</span>
              <div class="text-left flex-1 px-2">
                <div class="text-[11px] font-bold text-slate-200">Chicken</div>
                <div id="timer-Chicken" class="text-[9px] text-amber-400">Ready to Cook</div>
              </div>
              <span id="badge-Chicken" class="px-2 py-1 bg-amber-600 text-white font-black rounded-lg text-[9px]">Cook 10s</span>
            </button>

            <button id="btn-Egg" onclick="startCooking('Egg', '🍳', 'Egg')" class="bg-slate-900/90 border border-yellow-400/30 hover:border-yellow-300 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow relative">
              <span class="text-lg">🍳</span>
              <div class="text-left flex-1 px-2">
                <div class="text-[11px] font-bold text-slate-200">Egg</div>
                <div id="timer-Egg" class="text-[9px] text-yellow-300">Ready to Cook</div>
              </div>
              <span id="badge-Egg" class="px-2 py-1 bg-yellow-400 text-slate-950 font-black rounded-lg text-[9px]">Cook 10s</span>
            </button>

            <button id="btn-Taco" onclick="startCooking('Taco', '🌮', 'Taco')" class="bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow relative">
              <span class="text-lg">🌮</span>
              <div class="text-left flex-1 px-2">
                <div class="text-[11px] font-bold text-slate-200">Taco</div>
                <div id="timer-Taco" class="text-[9px] text-emerald-400">Ready to Cook</div>
              </div>
              <span id="badge-Taco" class="px-2 py-1 bg-emerald-600 text-white font-black rounded-lg text-[9px]">Cook 10s</span>
            </button>

            <button id="btn-Pancake" onclick="startCooking('Pancake', '🥞', 'Pancake')" class="bg-slate-900/90 border border-orange-400/30 hover:border-orange-300 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow relative">
              <span class="text-lg">🥞</span>
              <div class="text-left flex-1 px-2">
                <div class="text-[11px] font-bold text-slate-200">Pancake</div>
                <div id="timer-Pancake" class="text-[9px] text-orange-300">Ready to Cook</div>
              </div>
              <span id="badge-Pancake" class="px-2 py-1 bg-orange-500 text-slate-950 font-black rounded-lg text-[9px]">Cook 10s</span>
            </button>

            <button id="btn-Waffle" onclick="startCooking('Waffle', '🧇', 'Waffle')" class="bg-slate-900/90 border border-amber-700/30 hover:border-amber-600 rounded-xl p-2 flex items-center justify-between transition active:scale-95 shadow relative">
              <span class="text-lg">🧇</span>
              <div class="text-left flex-1 px-2">
                <div class="text-[11px] font-bold text-slate-200">Waffle</div>
                <div id="timer-Waffle" class="text-[9px] text-amber-500">Ready to Cook</div>
              </div>
              <span id="badge-Waffle" class="px-2 py-1 bg-amber-700 text-white font-black rounded-lg text-[9px]">Cook 10s</span>
            </button>
          </div>

        </div>

      </div>

      <!-- Preparation Tray & Serve Actions (Pinned at Bottom) -->
      <div class="w-full bg-black/90 backdrop-blur-md border border-white/15 rounded-2xl p-2 text-center shrink-0 shadow-2xl">
        <div class="text-[10px] text-slate-400 mb-1 uppercase font-bold">Tray: <span id="cup-tray" class="text-pink-400 font-mono">[ Empty ]</span></div>
        <div class="flex gap-2">
          <button onclick="resetTray()" class="py-2 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition active:scale-95">Clear 🗑️</button>
          <button onclick="serveOrder()" class="flex-1 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-lg transition active:scale-95">Serve Order 🛎️</button>
        </div>
      </div>
    </div>
  `;

  let coins = 500, served = 0, currentDay = 1, dailyServed = 0, customerTimeLeft = 60, phaseIndex = 0;
  let currentOrderObj = { name: 'Espresso', ingredients: ['Beans'] };
  let currentTray = [];
  let gameInterval = null;
  let activeTimers = {}; // Tracks ongoing cooking timers per item key

  const avatars = ['🧑‍💼', '👩‍🎨', '🧑‍🎓', '🧑‍💻', '🧑‍🎤', '👷‍♂️', '👩‍⚕️'];
  
  const possibleOrders = [
    { name: 'Espresso', ingredients: ['Beans'] },
    { name: 'Latte', ingredients: ['Beans', 'Milk'] },
    { name: 'Classic Burger', ingredients: ['Burger'] },
    { name: 'Cheesy Burger', ingredients: ['Burger', 'Cheese'] },
    { name: 'Hotdog Sandwich', ingredients: ['Hotdog'] },
    { name: 'Pepperoni Pizza', ingredients: ['Pizza', 'Cheese'] },
    { name: 'Crispy Fries', ingredients: ['Fries'] },
    { name: 'Fried Chicken Meal', ingredients: ['Chicken', 'Fries'] },
    { name: 'Crispy Taco', ingredients: ['Taco'] },
    { name: 'Fluffy Pancakes', ingredients: ['Pancake'] },
    { name: 'Sweet Waffle', ingredients: ['Waffle'] },
    { name: 'Mocha Frappe', ingredients: ['Beans', 'Milk', 'Choco'] }
  ];

  window.startCafeShift = function() {
    const cloudEl = document.getElementById('cafe-intro-clouds');
    if (cloudEl) {
      cloudEl.style.transform = 'translateY(-100%)';
      setTimeout(() => cloudEl.remove(), 1000);
    }
    if (typeof AudioFX !== 'undefined') AudioFX.coin();
    window.spawnNextCustomer();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(() => {
      customerTimeLeft--;
      let secs = customerTimeLeft % 60;
      const timerEl = document.getElementById('customer-patience-text');
      const barEl = document.getElementById('patience-bar-fill');
      
      if (timerEl) timerEl.textContent = `⏳ 00:${String(secs).padStart(2,'0')}`;

      if (customerTimeLeft <= 0) {
        coins = Math.max(0, coins - 40);
        document.getElementById('cafe-coins').textContent = `🪙 ${coins}`;
        if (typeof AudioFX !== 'undefined') AudioFX.lose();
        window.spawnNextCustomer();
      }
    }, 1000);
  };

  window.spawnNextCustomer = function() {
    customerTimeLeft = 60; 
    currentOrderObj = possibleOrders[Math.floor(Math.random() * possibleOrders.length)];
    currentTray = [];
    
    const bubble = document.getElementById('customer-order-bubble');
    const avatar = document.getElementById('customer-avatar');
    if (avatar) avatar.textContent = avatars[Math.floor(Math.random() * avatars.length)];
    if (bubble) bubble.textContent = `I want a ${currentOrderObj.name} (${currentOrderObj.ingredients.join(' + ')})`;
    updateTrayDisplay();
  };

  window.addDrink = function(item, emoji, name) {
    currentTray.push(item);
    updateTrayDisplay();
    if (typeof AudioFX !== 'undefined') AudioFX.click();
  };

  window.startCooking = function(itemKey, emoji, itemName) {
    if (activeTimers[itemKey]) return; // Already cooking

    const timerLabel = document.getElementById(`timer-${itemKey}`);
    const badge = document.getElementById(`badge-${itemKey}`);
    
    let timeLeft = 10;
    if (badge) {
      badge.textContent = `${timeLeft}s 🔥`;
      badge.classList.remove('bg-amber-500', 'bg-orange-600', 'bg-yellow-500', 'bg-red-600', 'bg-amber-600', 'bg-yellow-400', 'bg-emerald-600', 'bg-orange-500', 'bg-amber-700');
      badge.classList.add('bg-rose-600', 'text-white');
    }
    if (typeof AudioFX !== 'undefined') AudioFX.click();

    activeTimers[itemKey] = setInterval(() => {
      timeLeft--;
      if (timerLabel) timerLabel.textContent = `Cooking... ${timeLeft}s`;

      if (timeLeft <= 0) {
        clearInterval(activeTimers[itemKey]);
        delete activeTimers[itemKey];

        if (timerLabel) timerLabel.textContent = `Ready! (Added to Tray)`;
        if (badge) {
          badge.textContent = `Cooked ✓`;
          badge.classList.remove('bg-rose-600');
          badge.classList.add('bg-emerald-500', 'text-slate-950');
        }

        // Add to tray automatically when done cooking!
        currentTray.push(itemKey);
        updateTrayDisplay();
        if (typeof AudioFX !== 'undefined') AudioFX.coin();

        // Reset badge after 1.5s
        setTimeout(() => {
          if (timerLabel) timerLabel.textContent = `Ready to Cook`;
          if (badge) {
            badge.textContent = `Cook 10s`;
            badge.classList.remove('bg-emerald-500', 'text-slate-950');
            badge.classList.add('bg-amber-500', 'text-slate-950');
          }
        }, 1500);
      }
    }, 1000);
  };

  window.resetTray = function() {
    currentTray = [];
    updateTrayDisplay();
    if (typeof AudioFX !== 'undefined') AudioFX.hit();
  };

  function updateTrayDisplay() {
    const trayEl = document.getElementById('cup-tray');
    if (trayEl) {
      trayEl.textContent = currentTray.length > 0 ? `[ ${currentTray.join(' → ')} ]` : '[ Empty ]';
    }
  }

  window.serveOrder = function() {
    const isMatch = currentTray.length === currentOrderObj.ingredients.length && currentOrderObj.ingredients.every((val, index) => val === currentTray[index]);
    if (isMatch) {
      coins += 220;
      served++;
      dailyServed++;
      
      document.getElementById('cafe-coins').textContent = `🪙 ${coins}`;
      document.getElementById('day-goal-text').textContent = `📅 DAY ${currentDay} (${dailyServed}/10)`;

      if (typeof AudioFX !== 'undefined') AudioFX.win();
      if (typeof addXP === 'function') addXP(45);

      if (dailyServed >= 10) {
        if (gameInterval) clearInterval(gameInterval);
        Object.values(activeTimers).forEach(t => clearInterval(t));
        
        coins += 500;
        document.getElementById('cafe-coins').textContent = `🪙 ${coins}`;
        if (typeof addXP === 'function') addXP(150);

        const modal = document.getElementById('day-modal');
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.textContent = `Day ${currentDay} Completed! 🎉`;
        if (modal) {
          modal.classList.remove('hidden');
          setTimeout(() => {
            modal.classList.remove('opacity-0', 'scale-95');
            modal.classList.add('opacity-100', 'scale-100');
          }, 50);
        }
        return;
      }
    } else {
      coins = Math.max(0, coins - 35);
      document.getElementById('cafe-coins').textContent = `🪙 ${coins}`;
      if (typeof AudioFX !== 'undefined') AudioFX.lose();
    }
    window.spawnNextCustomer();
  };

  window.advanceToNextDay = function() {
    currentDay++;
    dailyServed = 0;
    
    const modal = document.getElementById('day-modal');
    if (modal) {
      modal.classList.add('opacity-0', 'scale-95');
      setTimeout(() => modal.classList.add('hidden'), 300);
    }

    document.getElementById('day-goal-text').textContent = `📅 DAY ${currentDay} (0/10)`;
    if (typeof AudioFX !== 'undefined') AudioFX.coin();
    window.startCafeShift();
  };

  return () => {
    if (gameInterval) clearInterval(gameInterval);
    Object.values(activeTimers).forEach(t => clearInterval(t));
  };
}
