function initTinyCafe(stage) {
  stage.innerHTML = `
    <div id="cafe-root" class="relative w-full h-full bg-slate-950 flex flex-col select-none text-white overflow-y-auto pb-28 transition-colors duration-1000" style="background: linear-gradient(180deg, #38bdf8 0%, #0ea5e9 50%, #0f172a 100%);">
      <!-- Cloud Dissolve Intro Overlay -->
      <div id="cafe-intro-clouds" class="absolute inset-0 z-50 bg-sky-900 flex flex-col items-center justify-center transition-transform duration-1000">
        <div class="text-5xl mb-3 animate-bounce">🧾🍳☕</div>
        <h2 class="text-xl font-black text-amber-300 mb-1">Tiny Café &amp; Pro Bistro</h2>
        <p class="text-xs text-sky-200 mb-4 text-center max-w-xs">Clean layout, instant station tabs, and sticky serve buttons!</p>
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

      <!-- Clean Status Bar (No Duplicated Hub/Settings) -->
      <div class="flex items-center justify-center gap-4 w-full bg-black/60 px-3 py-1.5 border-b border-white/10 shrink-0 text-xs">
        <div id="top-stats-container" class="flex items-center gap-4 font-black opacity-0 transition-opacity duration-500">
          <span id="cafe-coins" class="text-amber-400">🪙 500</span>
          <span id="day-goal-text" class="text-cyan-300">📅 DAY 1 (0/10)</span>
        </div>
      </div>

      <!-- Game Content Padding Container -->
      <div class="p-2 flex flex-col flex-1">
        <!-- Customer Counter & Receipt Ticket -->
        <div class="w-full bg-slate-900/90 border border-white/15 rounded-2xl p-2.5 shadow-lg flex items-center justify-center gap-3 shrink-0 backdrop-blur-md mb-2">
          <div id="customer-avatar" class="text-3xl animate-bounce">🧑‍💼</div>
          <div class="bg-amber-50 text-slate-950 px-3 py-1.5 rounded-xl font-mono text-[11px] shadow-md w-56 border-b-4 border-dashed border-amber-300 relative">
            <div class="text-[9px] font-black uppercase text-center border-b border-slate-300 pb-0.5 mb-0.5 text-slate-700">🧾 Customer Receipt Ticket</div>
            <div id="receipt-order-text" class="font-bold text-center text-slate-900">Loading order...</div>
          </div>
        </div>

        <!-- WORKSPACE AREA -->
        <div id="workspace-container" class="w-full flex-1 flex flex-col mb-4">
          <!-- Dynamically rendered via JS -->
        </div>
      </div>

      <!-- Preparation Tray & Serve Actions (Sticky Pinned at Bottom) -->
      <div class="sticky bottom-2 w-full bg-black/95 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center shadow-2xl z-30 mx-auto max-w-md">
        <div class="text-[11px] text-slate-300 mb-1.5 uppercase font-black">Tray: <span id="cup-tray" class="text-pink-400 font-mono">[ Empty ]</span></div>
        <div class="flex gap-2">
          <button onclick="resetTray()" class="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition active:scale-95">Clear 🗑️</button>
          <button onclick="serveOrder()" class="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-lg transition active:scale-95">Serve Order 🛎️</button>
        </div>
      </div>
    </div>
  `;

  let coins = 500, served = 0, currentDay = 1, dailyServed = 0, customerTimeLeft = 60;
  let currentOrderObj = { name: 'Espresso', ingredients: ['Beans'] };
  let currentTray = [];
  let gameInterval = null;
  let activeTimers = {};
  let currentView = 'kitchen'; // Default directly to Kitchen

  const avatars = ['🧑‍💼', '👩‍🎨', '🧑‍🎓', '👩‍💻', '🧑‍🎤', '👷‍♂️', '👩‍⚕️'];
  
  const possibleOrders = [
    { name: 'Espresso', ingredients: ['Beans'] },
    { name: 'Latte', ingredients: ['Beans', 'Milk'] },
    { name: 'Classic Burger', ingredients: ['Burger'] },
    { name: 'Cheesy Burger', ingredients: ['Burger', 'Cheese'] },
    { name: 'Burger & Coffee Combo', ingredients: ['Burger', 'Beans'] },
    { name: 'Pancakes & Latte Combo', ingredients: ['Pancake', 'Beans', 'Milk'] },
    { name: 'Hotdog Sandwich', ingredients: ['Hotdog'] },
    { name: 'Pepperoni Pizza', ingredients: ['Pizza', 'Cheese'] },
    { name: 'Crispy Fries', ingredients: ['Fries'] },
    { name: 'Chicken & Fries Meal', ingredients: ['Chicken', 'Fries'] },
    { name: 'Taco & Soda Combo', ingredients: ['Taco', 'Sugar', 'Beans'] },
    { name: 'Sweet Waffle & Matcha', ingredients: ['Waffle', 'Milk'] }
  ];

  window.startCafeShift = function() {
    const cloudEl = document.getElementById('cafe-intro-clouds');
    if (cloudEl) {
      cloudEl.style.transform = 'translateY(-100%)';
      setTimeout(() => cloudEl.remove(), 1000);
    }
    
    const topStats = document.getElementById('top-stats-container');
    if (topStats) topStats.classList.remove('opacity-0');

    if (typeof AudioFX !== 'undefined') AudioFX.coin();
    window.spawnNextCustomer();
    renderWorkspace();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(() => {
      customerTimeLeft--;
      let secs = customerTimeLeft % 60;
      
      if (customerTimeLeft <= 0) {
        coins = Math.max(0, coins - 40);
        document.getElementById('cafe-coins').textContent = `🪙 ${coins}`;
        if (typeof AudioFX !== 'undefined') AudioFX.lose();
        window.spawnNextCustomer();
      }
    }, 1000);
  };

  window.switchView = function(view) {
    currentView = view;
    renderWorkspace();
    if (typeof AudioFX !== 'undefined') AudioFX.click();
  };

  window.renderWorkspace = function() {
    const container = document.getElementById('workspace-container');
    if (!container) return;

    const isKitchen = currentView === 'kitchen';

    container.innerHTML = `
      <div class="w-full flex flex-col bg-black/40 border border-white/10 rounded-2xl p-2.5">
        <!-- Quick Switch Header Tabs -->
        <div class="flex items-center justify-between border-b border-white/10 pb-2 mb-2 shrink-0">
          <span class="text-xs font-black ${isKitchen ? 'text-amber-300' : 'text-sky-300'}">
            ${isKitchen ? '🍳 Kitchen Equipment (10s Cook)' : '☕ Brewing Stand (Drinks Station)'}
          </span>
          <div class="flex gap-1">
            <button onclick="switchView('drinks')" class="px-3 py-1 rounded-lg text-[10px] font-black transition ${!isKitchen ? 'bg-sky-600 text-white shadow' : 'bg-white/10 hover:bg-white/20 text-slate-300'}">☕ Drinks</button>
            <button onclick="switchView('kitchen')" class="px-3 py-1 rounded-lg text-[10px] font-black transition ${isKitchen ? 'bg-amber-600 text-white shadow' : 'bg-white/10 hover:bg-white/20 text-slate-300'}">🍳 Kitchen</button>
          </div>
        </div>

        <!-- Station Content Grid -->
        <div class="grid grid-cols-2 gap-2">
          ${isKitchen ? `
            <button onclick="startCooking('Burger', '🍔', 'Burger')" class="bg-slate-900 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between">
              <div class="flex items-center gap-2"><span class="text-lg">🍳🍔</span><div class="text-left"><div class="text-xs font-bold">Burger</div><div id="timer-Burger" class="text-[9px] text-amber-400">Frying Pan</div></div></div>
              <span id="badge-Burger" class="px-2 py-1 bg-amber-500 text-slate-950 font-black rounded text-[9px]">Cook</span>
            </button>
            <button onclick="startCooking('Egg', '🍳', 'Egg')" class="bg-slate-900 border border-yellow-400/30 rounded-xl p-2.5 flex items-center justify-between">
              <div class="flex items-center gap-2"><span class="text-lg">🍳🍳</span><div class="text-left"><div class="text-xs font-bold">Egg</div><div id="timer-Egg" class="text-[9px] text-yellow-300">Frying Pan</div></div></div>
              <span id="badge-Egg" class="px-2 py-1 bg-yellow-400 text-slate-950 font-black rounded text-[9px]">Cook</span>
            </button>
            <button onclick="startCooking('Hotdog', '🌭', 'Hotdog')" class="bg-slate-900 border border-red-500/30 rounded-xl p-2.5 flex items-center justify-between">
              <div class="flex items-center gap-2"><span class="text-lg">🍳🌭</span><div class="text-left"><div class="text-xs font-bold">Hotdog</div><div id="timer-Hotdog" class="text-[9px] text-red-400">Frying Pan</div></div></div>
              <span id="badge-Hotdog" class="px-2 py-1 bg-red-600 text-white font-black rounded text-[9px]">Cook</span>
            </button>
            <button onclick="startCooking('Pancake', '🥞', 'Pancake')" class="bg-slate-900 border border-orange-400/30 rounded-xl p-2.5 flex items-center justify-between">
              <div class="flex items-center gap-2"><span class="text-lg">🍳🥞</span><div class="text-left"><div class="text-xs font-bold">Pancake</div><div id="timer-Pancake" class="text-[9px] text-orange-300">Frying Pan</div></div></div>
              <span id="badge-Pancake" class="px-2 py-1 bg-orange-500 text-slate-950 font-black rounded text-[9px]">Cook</span>
            </button>
            <button onclick="startCooking('Taco', '🌮', 'Taco')" class="bg-slate-900 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between">
              <div class="flex items-center gap-2"><span class="text-lg">🍳🌮</span><div class="text-left"><div class="text-xs font-bold">Taco</div><div id="timer-Taco" class="text-[9px] text-emerald-400">Frying Pan</div></div></div>
              <span id="badge-Taco" class="px-2 py-1 bg-emerald-600 text-white font-black rounded text-[9px]">Cook</span>
            </button>
            <button onclick="startCooking('Pizza', '🍕', 'Pizza')" class="bg-slate-900 border border-orange-500/30 rounded-xl p-2.5 flex items-center justify-between">
              <div class="flex items-center gap-2"><span class="text-lg">🔥🍕</span><div class="text-left"><div class="text-xs font-bold">Pizza</div><div id="timer-Pizza" class="text-[9px] text-orange-400">Oven Bake</div></div></div>
              <span id="badge-Pizza" class="px-2 py-1 bg-orange-600 text-white font-black rounded text-[9px]">Bake</span>
            </button>
            <button onclick="startCooking('Fries', '🍟', 'Fries')" class="bg-slate-900 border border-yellow-500/30 rounded-xl p-2.5 flex items-center justify-between">
              <div class="flex items-center gap-2"><span class="text-lg">🔥🍟</span><div class="text-left"><div class="text-xs font-bold">Fries</div><div id="timer-Fries" class="text-[9px] text-yellow-400">Oven Bake</div></div></div>
              <span id="badge-Fries" class="px-2 py-1 bg-yellow-500 text-slate-950 font-black rounded text-[9px]">Bake</span>
            </button>
            <button onclick="startCooking('Chicken', '🍗', 'Chicken')" class="bg-slate-900 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between">
              <div class="flex items-center gap-2"><span class="text-lg">🔥🍗</span><div class="text-left"><div class="text-xs font-bold">Chicken</div><div id="timer-Chicken" class="text-[9px] text-amber-400">Oven Bake</div></div></div>
              <span id="badge-Chicken" class="px-2 py-1 bg-amber-600 text-white font-black rounded text-[9px]">Bake</span>
            </button>
            <button onclick="startCooking('Waffle', '🧇', 'Waffle')" class="bg-slate-900 border border-amber-700/30 rounded-xl p-2.5 flex items-center justify-between">
              <div class="flex items-center gap-2"><span class="text-lg">🔥🧇</span><div class="text-left"><div class="text-xs font-bold">Waffle</div><div id="timer-Waffle" class="text-[9px] text-amber-500">Oven Bake</div></div></div>
              <span id="badge-Waffle" class="px-2 py-1 bg-amber-700 text-white font-black rounded text-[9px]">Bake</span>
            </button>
          ` : `
            <button onclick="addDrink('Beans')" class="bg-slate-900 border border-sky-500/30 rounded-xl p-3 flex items-center gap-2">
              <span class="text-xl">🫘</span>
              <div class="text-left"><div class="text-xs font-bold">Beans</div><div class="text-[9px] text-sky-400">Brew Coffee</div></div>
            </button>
            <button onclick="addDrink('Milk')" class="bg-slate-900 border border-indigo-500/30 rounded-xl p-3 flex items-center gap-2">
              <span class="text-xl">🥛</span>
              <div class="text-left"><div class="text-xs font-bold">Milk</div><div class="text-[9px] text-indigo-400">Dairy Mixer</div></div>
            </button>
            <button onclick="addDrink('Sugar')" class="bg-slate-900 border border-cyan-500/30 rounded-xl p-3 flex items-center gap-2">
              <span class="text-xl">🧊</span>
              <div class="text-left"><div class="text-xs font-bold">Sugar</div><div class="text-[9px] text-cyan-400">Sweetener</div></div>
            </button>
            <button onclick="addDrink('Choco')" class="bg-slate-900 border border-pink-500/30 rounded-xl p-3 flex items-center gap-2">
              <span class="text-xl">🍫</span>
              <div class="text-left"><div class="text-xs font-bold">Choco</div><div class="text-[9px] text-pink-400">Syrup Topping</div></div>
            </button>
            <button onclick="addDrink('Cheese')" class="bg-slate-900 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2">
              <span class="text-xl">🧀</span>
              <div class="text-left"><div class="text-xs font-bold">Cheese</div><div class="text-[9px] text-amber-400">Foam Topping</div></div>
            </button>
          `}
