function initTinyCafe(stage) {
  stage.innerHTML = `
    <div id="cafe-root" class="relative w-full h-full bg-slate-950 flex flex-col items-center justify-between p-3 pt-2 select-none text-white overflow-y-auto pb-20 transition-colors duration-1000" style="background: linear-gradient(180deg, #38bdf8 0%, #0ea5e9 50%, #0f172a 100%);">
      <!-- Cloud Dissolve Intro Overlay -->
      <div id="cafe-intro-clouds" class="absolute inset-0 z-50 bg-sky-900 flex flex-col items-center justify-center transition-transform duration-1000">
        <div class="text-6xl mb-4 animate-bounce">🍔🔥🏆</div>
        <h2 class="text-2xl font-black text-amber-300 mb-2">Tiny Café &amp; Bistro Goal Edition</h2>
        <p class="text-xs text-sky-200 mb-6 text-center max-w-xs">Complete 10 orders a day to unlock coin &amp; XP rewards, new cookable foods, and daily progression!</p>
        <button onclick="startCafeShift()" class="px-8 py-3.5 bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl hover:scale-105 transition">Start Bistro Shift 🚀</button>
      </div>

      <!-- Day Complete Reward Modal Overlay -->
      <div id="day-modal" class="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 hidden transition-all duration-500 opacity-0 scale-95">
        <div class="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
          <div class="text-5xl mb-2 animate-bounce">🏆</div>
          <h3 id="modal-title" class="text-xl font-black text-amber-300 mb-1">Day 1 Completed!</h3>
          <p class="text-xs text-slate-300 mb-4">Amazing job! You successfully served 10 customers today.</p>
          
          <div class="bg-black/50 border border-white/10 rounded-2xl p-3 mb-5 flex justify-around text-xs font-bold">
            <div class="text-amber-400">🪙 +500 Coins</div>
            <div class="text-emerald-400">⭐ +150 XP</div>
          </div>

          <button onclick="advanceToNextDay()" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-sm shadow-lg hover:scale-105 transition">Start Day 2 🌅</button>
        </div>
      </div>

      <!-- Top HUD -->
      <div class="flex items-center justify-between w-full max-w-xl bg-black/60 p-2.5 rounded-2xl border border-white/10 shrink-0 mb-1.5">
        <span id="cafe-coins" class="text-amber-400 font-black text-xs sm:text-sm">🪙 500</span>
        <span id="day-goal-text" class="text-amber-300 font-bold text-xs">📅 DAY 1 (0/10)</span>
        <span id="customer-patience-text" class="text-cyan-300 font-mono font-bold text-xs">⏳ 01:00</span>
      </div>

      <!-- Scenic Environment & Time Banner -->
      <div id="scenic-banner" class="w-full max-w-xl bg-black/40 border border-white/10 rounded-xl py-1 px-3 text-center text-xs font-bold text-amber-200 mb-1.5 shrink-0 flex items-center justify-center gap-2">
        <span>🌅</span> <span id="scenic-text">Morning • Plaza Square</span>
      </div>

      <!-- Patience Bar Track -->
      <div class="w-full max-w-xl bg-white/10 h-2 rounded-full overflow-hidden mb-2 shrink-0">
        <div id="patience-bar-fill" class="bg-gradient-to-r from-emerald-500 to-amber-500 h-full w-full transition-all duration-1000"></div>
      </div>

      <!-- Customer Counter & Walking Scene -->
      <div class="w-full max-w-xl bg-gradient-to-b from-slate-900/90 to-black/90 border border-white/15 rounded-3xl p-3 mb-2 shadow-xl flex items-center justify-center gap-4 relative overflow-hidden shrink-0 backdrop-blur-md">
        <div class="absolute top-1.5 left-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bistro Counter</div>
        <div id="customer-avatar" class="text-4xl animate-bounce">🧑‍💼</div>
        <div class="relative bg-white text-slate-950 px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm shadow-lg max-w-[260px] text-center">
          <div class="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white border-b-8 border-b-transparent"></div>
          <span id="customer-order-bubble">Waiting for customer...</span>
        </div>
      </div>

      <!-- Active Cooking Station Status Banner -->
      <div id="cooking-status-box" class="w-full max-w-xl bg-amber-950/80 border border-amber-500/40 rounded-xl py-1.5 px-3 text-center text-xs font-bold text-amber-200 mb-2 shrink-0 hidden">
        🔥 <span id="cooking-label">Cooking Item...</span> <span id="cooking-timer" class="font-mono text-amber-400">10s</span>
        <div class="w-full bg-black/40 h-1.5 rounded-full mt-1 overflow-hidden">
          <div id="cooking-progress-fill" class="bg-amber-400 h-full w-full transition-all duration-300"></div>
        </div>
      </div>

      <!-- Spacious Kitchen & Ingredient Grid -->
      <div class="w-full max-w-xl grid grid-cols-2 sm:grid-cols-5 gap-2 my-auto shrink-0 py-1">
        <!-- Instant Items -->
        <button onclick="addInstantIngredient('Beans', '🫘')" class="bg-slate-950/90 border border-white/10 hover:border-amber-500/50 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg">
          <div class="text-2xl">🫘</div>
          <div class="text-[10px] font-bold text-slate-300">Beans</div>
          <span class="w-full py-1 bg-amber-600 text-white font-black rounded-lg text-[9px]">+ Add</span>
        </button>
        <button onclick="addInstantIngredient('Milk', '🥛')" class="bg-slate-950/90 border border-white/10 hover:border-indigo-500/50 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg">
          <div class="text-2xl">🥛</div>
          <div class="text-[10px] font-bold text-slate-300">Milk</div>
          <span class="w-full py-1 bg-indigo-600 text-white font-black rounded-lg text-[9px]">+ Add</span>
        </button>
        <button onclick="addInstantIngredient('Sugar', '🧊')" class="bg-slate-950/90 border border-white/10 hover:border-cyan-500/50 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg">
          <div class="text-2xl">🧊</div>
          <div class="text-[10px] font-bold text-slate-300">Sugar</div>
          <span class="w-full py-1 bg-cyan-600 text-white font-black rounded-lg text-[9px]">+ Add</span>
        </button>
        <button onclick="addInstantIngredient('Choco', '🍫')" class="bg-slate-950/90 border border-white/10 hover:border-pink-500/50 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg">
          <div class="text-2xl">🍫</div>
          <div class="text-[10px] font-bold text-slate-300">Choco</div>
          <span class="w-full py-1 bg-pink-600 text-white font-black rounded-lg text-[9px]">+ Add</span>
        </button>
        <button onclick="addInstantIngredient('Cheese', '🧀')" class="bg-slate-950/90 border border-white/10 hover:border-amber-400/50 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg">
          <div class="text-2xl">🧀</div>
          <div class="text-[10px] font-bold text-slate-300">Cheese</div>
          <span class="w-full py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-[9px]">+ Add</span>
        </button>

        <!-- 10s Cookable Grill/Fryer Items -->
        <button onclick="startCooking('Burger', '🍔', 'Burger')" class="bg-slate-950/90 border border-amber-600/30 hover:border-amber-500 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg relative">
          <span class="absolute top-1 right-1 text-[8px] bg-amber-600 text-slate-950 font-bold px-1 rounded">10s 🔥</span>
          <div class="text-2xl">🍔</div>
          <div class="text-[10px] font-bold text-slate-300">Burger</div>
          <span class="w-full py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-[9px]">Cook 10s</span>
        </button>
        <button onclick="startCooking('Pizza', '🍕', 'Pizza Crust')" class="bg-slate-950/90 border border-orange-500/30 hover:border-orange-500 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg relative">
          <span class="absolute top-1 right-1 text-[8px] bg-orange-600 text-white font-bold px-1 rounded">10s 🔥</span>
          <div class="text-2xl">🍕</div>
          <div class="text-[10px] font-bold text-slate-300">Pizza</div>
          <span class="w-full py-1 bg-orange-600 text-white font-black rounded-lg text-[9px]">Cook 10s</span>
        </button>
        <button onclick="startCooking('Fries', '🍟', 'French Fries')" class="bg-slate-950/90 border border-yellow-500/30 hover:border-yellow-500 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg relative">
          <span class="absolute top-1 right-1 text-[8px] bg-yellow-600 text-slate-950 font-bold px-1 rounded">10s 🔥</span>
          <div class="text-2xl">🍟</div>
          <div class="text-[10px] font-bold text-slate-300">Fries</div>
          <span class="w-full py-1 bg-yellow-500 text-slate-950 font-black rounded-lg text-[9px]">Cook 10s</span>
        </button>
        <button onclick="startCooking('Hotdog', '🌭', 'Hotdog')" class="bg-slate-950/90 border border-red-500/30 hover:border-red-500 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg relative">
          <span class="absolute top-1 right-1 text-[8px] bg-red-600 text-white font-bold px-1 rounded">10s 🔥</span>
          <div class="text-2xl">🌭</div>
          <div class="text-[10px] font-bold text-slate-300">Hotdog</div>
          <span class="w-full py-1 bg-red-600 text-white font-black rounded-lg text-[9px]">Cook 10s</span>
        </button>
        <button onclick="startCooking('Chicken', '🍗', 'Fried Chicken')" class="bg-slate-950/90 border border-amber-500/30 hover:border-amber-500 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg relative">
          <span class="absolute top-1 right-1 text-[8px] bg-amber-600 text-white font-bold px-1 rounded">10s 🔥</span>
          <div class="text-2xl">🍗</div>
          <div class="text-[10px] font-bold text-slate-300">Chicken</div>
          <span class="w-full py-1 bg-amber-600 text-white font-black rounded-lg text-[9px]">Cook 10s</span>
        </button>
        <button onclick="startCooking('Egg', '🍳', 'Fried Egg')" class="bg-slate-950/90 border border-yellow-400/30 hover:border-yellow-400 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg relative">
          <span class="absolute top-1 right-1 text-[8px] bg-yellow-500 text-slate-950 font-bold px-1 rounded">10s 🔥</span>
          <div class="text-2xl">🍳</div>
          <div class="text-[10px] font-bold text-slate-300">Egg</div>
          <span class="w-full py-1 bg-yellow-400 text-slate-950 font-black rounded-lg text-[9px]">Cook 10s</span>
        </button>
        <button onclick="startCooking('Taco', '🌮', 'Crispy Taco')" class="bg-slate-950/90 border border-emerald-500/30 hover:border-emerald-500 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg relative">
          <span class="absolute top-1 right-1 text-[8px] bg-emerald-600 text-white font-bold px-1 rounded">10s 🔥</span>
          <div class="text-2xl">🌮</div>
          <div class="text-[10px] font-bold text-slate-300">Taco</div>
          <span class="w-full py-1 bg-emerald-600 text-white font-black rounded-lg text-[9px]">Cook 10s</span>
        </button>
        <button onclick="startCooking('Pancake', '🥞', 'Pancakes')" class="bg-slate-950/90 border border-orange-400/30 hover:border-orange-400 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg relative">
          <span class="absolute top-1 right-1 text-[8px] bg-orange-500 text-slate-950 font-bold px-1 rounded">10s 🔥</span>
          <div class="text-2xl">🥞</div>
          <div class="text-[10px] font-bold text-slate-300">Pancake</div>
          <span class="w-full py-1 bg-orange-400 text-slate-950 font-black rounded-lg text-[9px]">Cook 10s</span>
        </button>
        <button onclick="startCooking('Waffle', '🧇', 'Belgian Waffle')" class="bg-slate-950/90 border border-amber-700/30 hover:border-amber-700 rounded-2xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 shadow-lg relative">
          <span class="absolute top-1 right-1 text-[8px] bg-amber-800 text-white font-bold px-1 rounded">10s 🔥</span>
          <div class="text-2xl">🧇</div>
          <div class="text-[10px] font-bold text-slate-300">Waffle</div>
          <span class="w-full py-1 bg-amber-700 text-white font-black rounded-lg text-[9px]">Cook 10s</span>
        </button>
      </div>

      <!-- Preparation Tray & Actions -->
      <div class="w-full max-w-xl bg-black/85 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center shrink-0 shadow-2xl mt-1">
        <div class="text-[11px] text-slate-400 mb-1.5 uppercase font-bold">Preparation Tray: <span id="cup-tray" class="text-pink-400 font-mono">[ Empty ]</span></div>
        <div class="flex gap-2">
          <button onclick="resetCup()" class="py-2 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition active:scale-95">Clear 🗑️</button>
          <button onclick="serveOrder()" class="flex-1 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-lg transition active:scale-95">Serve Order 🛎️</button>
        </div>
      </div>
    </div>
  `;

  let coins = 500, served = 0, currentDay = 1, dailyServed = 0, customerTimeLeft = 60, phaseIndex = 0;
  let currentOrderObj = { name: 'Espresso', ingredients: ['Beans'] };
  let currentCup = [];
  let gameInterval = null;
  let cookingInterval = null;
  let isCookingActive = false;

  const avatars = ['🧑‍💼', '👩‍🎨', '🧑‍🎓', '🧑‍💻', '🧑‍🎤', '👷‍♂️', '👩‍⚕️'];
  
  // Expanded Bistro Orders
  const possibleOrders = [
    { name: 'Espresso', ingredients: ['Beans'] },
    { name: 'Latte', ingredients: ['Beans', 'Milk'] },
    { name: 'Classic Burger', ingredients: ['Burger'] },
    { name: 'Cheesy Burger', ingredients: ['Burger', 'Cheese'] },
    { name: 'Breakfast Burger', ingredients: ['Burger', 'Egg'] },
    { name: 'Hotdog Sandwich', ingredients: ['Hotdog'] },
    { name: 'Pepperoni Pizza', ingredients: ['Pizza', 'Cheese'] },
    { name: 'Crispy Fries', ingredients: ['Fries'] },
    { name: 'Fried Chicken Meal', ingredients: ['Chicken', 'Fries'] },
    { name: 'Crispy Taco', ingredients: ['Taco'] },
    { name: 'Fluffy Pancakes', ingredients: ['Pancake'] },
    { name: 'Sweet Waffle', ingredients: ['Waffle'] },
    { name: 'Mocha Frappe', ingredients: ['Beans', 'Milk', 'Choco'] }
  ];

  const timeCycles = [
    { title: 'Morning • Plaza Square', bg: 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 50%, #0f172a 100%)', icon: '🌅' },
    { title: 'Noon • City Skyline & Skyscrapers', bg: 'linear-gradient(180deg, #0284c7 0%, #38bdf8 60%, #1e293b 100%)', icon: '☀️' },
    { title: 'Afternoon • Suburban Houses', bg: 'linear-gradient(180deg, #f59e0b 0%, #fbbf24 50%, #1c1917 100%)', icon: '🌳' },
    { title: 'Dusk • Downtown Plaza', bg: 'linear-gradient(180deg, #c084fc 0%, #f43f5e 50%, #0f0728 100%)', icon: '🌇' },
    { title: 'Evening • City Skyline Lights', bg: 'linear-gradient(180deg, #1e1b4b 0%, #311042 60%, #05020a 100%)', icon: '🌃' },
    { title: 'Dawn • Suburban Neighborhood', bg: 'linear-gradient(180deg, #f43f5e 0%, #fb7185 50%, #1e1b4b 100%)', icon: '🌄' }
  ];

  window.startCafeShift = function() {
    const cloudEl = document.getElementById('cafe-intro-clouds');
    if (cloudEl) {
      cloudEl.style.transform = 'translateY(-100%)';
      setTimeout(() => cloudEl.remove(), 1000);
    }
    if (typeof AudioFX !== 'undefined') AudioFX.coin();
    window.spawnNextCustomer();
    updateEnvironmentVisuals();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(() => {
      customerTimeLeft--;
      let secs = customerTimeLeft % 60;
      const timerEl = document.getElementById('customer-patience-text');
      const barEl = document.getElementById('patience-bar-fill');
      
      if (timerEl) timerEl.textContent = `⏳ 00:${String(secs).padStart(2,'0')}`;
      if (barEl) barEl.style.width = `${(customerTimeLeft / 60) * 100}%`;

      if (customerTimeLeft <= 0) {
        coins = Math.max(0, coins - 40);
        document.getElementById('cafe-coins').textContent = `🪙 ${coins}`;
        if (typeof AudioFX !== 'undefined') AudioFX.lose();
        window.spawnNextCustomer();
      }
    }, 1000);
  };

  window.updateEnvironmentVisuals = function() {
    const cycle = timeCycles[phaseIndex];
    const rootEl = document.getElementById('cafe-root');
    const textEl = document.getElementById('scenic-text');
    if (rootEl) rootEl.style.background = cycle.bg;
    if (textEl) textEl.innerHTML = `${cycle.icon} ${cycle.title}`;
  };

  window.spawnNextCustomer = function() {
    customerTimeLeft = 60; 
    currentOrderObj = possibleOrders[Math.floor(Math.random() * possibleOrders.length)];
    currentCup = [];
    
    const bubble = document.getElementById('customer-order-bubble');
    const avatar = document.getElementById('customer-avatar');
    if (avatar) avatar.textContent = avatars[Math.floor(Math.random() * avatars.length)];
    if (bubble) bubble.textContent = `I want a ${currentOrderObj.name} (${currentOrderObj.ingredients.join(' + ')})`;
    updateCupDisplay();
  };

  window.addInstantIngredient = function(item, emoji) {
    currentCup.push(item);
    updateCupDisplay();
    if (typeof AudioFX !== 'undefined') AudioFX.click();
  };

  window.startCooking = function(itemKey, emoji, itemName) {
    if (isCookingActive) return;
    isCookingActive = true;

    const statusBox = document.getElementById('cooking-status-box');
    const labelEl = document.getElementById('cooking-label');
    const timerEl = document.getElementById('cooking-timer');
    const progressFill = document.getElementById('cooking-progress-fill');

    if (statusBox) statusBox.classList.remove('hidden');
    
    let timeLeft = 10;
    if (labelEl) labelEl.textContent = `Cooking ${itemName} (${emoji})...`;
    if (timerEl) timerEl.textContent = `${timeLeft}s`;
    if (progressFill) progressFill.style.width = `100%`;

    if (typeof AudioFX !== 'undefined') AudioFX.click();

    if (cookingInterval) clearInterval(cookingInterval);
    cookingInterval = setInterval(() => {
      timeLeft--;
      if (timerEl) timerEl.textContent = `${timeLeft}s`;
      if (progressFill) progressFill.style.width = `${(timeLeft / 10) * 100}%`;

      if (timeLeft <= 0) {
        clearInterval(cookingInterval);
        isCookingActive = false;
        if (statusBox) statusBox.classList.add('hidden');
        
        currentCup.push(itemKey);
        updateCupDisplay();
        if (typeof AudioFX !== 'undefined') AudioFX.coin();
      }
    }, 1000);
  };

  window.resetCup = function() {
    currentCup = [];
    updateCupDisplay();
    if (typeof AudioFX !== 'undefined') AudioFX.hit();
  };

  function updateCupDisplay() {
    const trayEl = document.getElementById('cup-tray');
    if (trayEl) {
      trayEl.textContent = currentCup.length > 0 ? `[ ${currentCup.join(' → ')} ]` : '[ Empty ]';
    }
  }

  window.serveOrder = function() {
    const isMatch = currentCup.length === currentOrderObj.ingredients.length && currentOrderObj.ingredients.every((val, index) => val === currentCup[index]);
    if (isMatch) {
      coins += 220;
      served++;
      dailyServed++;
      
      document.getElementById('cafe-coins').textContent = `🪙 ${coins}`;
      document.getElementById('day-goal-text').textContent = `📅 DAY ${currentDay} (${dailyServed}/10)`;
      
      if (served % 2 === 0) {
        phaseIndex = (phaseIndex + 1) % timeCycles.length;
        window.updateEnvironmentVisuals();
      }

      if (typeof AudioFX !== 'undefined') AudioFX.win();
      if (typeof addXP === 'function') addXP(45);

      // Check if Daily Goal (10 orders) is reached!
      if (dailyServed >= 10) {
        if (gameInterval) clearInterval(gameInterval);
        if (cookingInterval) clearInterval(cookingInterval);
        
        // Show Day Complete Reward Modal with smooth animation
        coins += 500; // Bonus reward coins
        document.getElementById('cafe-coins').textContent = `🪙 ${coins}`;
        if (typeof addXP === 'function') addXP(150); // Bonus reward XP

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
    if (cookingInterval) clearInterval(cookingInterval);
  };
}
