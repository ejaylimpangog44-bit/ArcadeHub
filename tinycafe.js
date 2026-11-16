function initTinyCafe(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 flex flex-col items-center p-4 select-none text-white overflow-y-auto pb-24">
      <!-- Cloud Dissolve Intro Overlay -->
      <div id="cafe-intro-clouds" class="absolute inset-0 z-50 bg-sky-900 flex flex-col items-center justify-center transition-transform duration-1000">
        <div class="text-6xl mb-4 animate-bounce">☕</div>
        <h2 class="text-2xl font-black text-amber-300 mb-2">Tiny Café Barista Edition</h2>
        <p class="text-xs text-sky-200 mb-6 text-center max-w-xs">1-Minute per customer patience timer, expanded recipes & full viewport layout!</p>
        <button onclick="startCafeShift()" class="px-8 py-3.5 bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl hover:scale-105 transition">Start Café Shift 🚀</button>
      </div>

      <!-- Top HUD -->
      <div class="flex items-center justify-between w-full max-w-md bg-black/60 p-3 rounded-2xl border border-white/10 shrink-0 mb-3">
        <span id="cafe-coins" class="text-amber-400 font-black text-xs sm:text-sm">🪙 500</span>
        <span id="customer-patience-text" class="text-cyan-300 font-mono font-bold text-xs">⏳ 01:00</span>
        <span id="cafe-score" class="text-emerald-300 font-black text-xs sm:text-sm">SERVED: 0</span>
      </div>

      <!-- Patience Bar Track -->
      <div class="w-full max-w-md bg-white/10 h-2 rounded-full overflow-hidden mb-3 shrink-0">
        <div id="patience-bar-fill" class="bg-gradient-to-r from-emerald-500 to-amber-500 h-full w-full transition-all duration-1000"></div>
      </div>

      <!-- Customer Counter & Walking Scene -->
      <div class="w-full max-w-md bg-gradient-to-b from-slate-900 to-black border border-white/15 rounded-3xl p-4 mb-4 shadow-xl flex flex-col items-center relative overflow-hidden shrink-0">
        <div class="absolute top-2 left-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shop Counter</div>
        
        <div class="flex items-center gap-3 my-2">
          <div id="customer-avatar" class="text-4xl animate-bounce">🧑‍💼</div>
          <div class="relative bg-white text-slate-950 px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm shadow-lg max-w-[210px] text-center">
            <div class="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white border-b-8 border-b-transparent"></div>
            <span id="customer-order-bubble">Waiting for customer...</span>
          </div>
        </div>
      </div>

      <!-- Brewing Ingredient Grid (Expanded to 6 Ingredients) -->
      <div class="w-full max-w-md grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4 shrink-0">
        <button onclick="addIngredient('Beans')" class="bg-slate-900/90 border border-white/10 hover:border-amber-500/50 rounded-2xl p-3 text-center flex flex-col items-center gap-1.5 transition active:scale-95">
          <div class="text-2xl">🫘</div>
          <div class="text-[11px] font-bold text-slate-300">Beans</div>
          <span class="w-full py-1.5 bg-amber-600 text-white font-black rounded-xl text-[10px]">+ Add</span>
        </button>
        <button onclick="addIngredient('Milk')" class="bg-slate-900/90 border border-white/10 hover:border-indigo-500/50 rounded-2xl p-3 text-center flex flex-col items-center gap-1.5 transition active:scale-95">
          <div class="text-2xl">🥛</div>
          <div class="text-[11px] font-bold text-slate-300">Milk</div>
          <span class="w-full py-1.5 bg-indigo-600 text-white font-black rounded-xl text-[10px]">+ Add</span>
        </button>
        <button onclick="addIngredient('Sugar')" class="bg-slate-900/90 border border-white/10 hover:border-cyan-500/50 rounded-2xl p-3 text-center flex flex-col items-center gap-1.5 transition active:scale-95">
          <div class="text-2xl">🧊</div>
          <div class="text-[11px] font-bold text-slate-300">Sugar</div>
          <span class="w-full py-1.5 bg-cyan-600 text-white font-black rounded-xl text-[10px]">+ Add</span>
        </button>
        <button onclick="addIngredient('Matcha')" class="bg-slate-900/90 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-3 text-center flex flex-col items-center gap-1.5 transition active:scale-95">
          <div class="text-2xl">🍵</div>
          <div class="text-[11px] font-bold text-slate-300">Matcha</div>
          <span class="w-full py-1.5 bg-emerald-600 text-white font-black rounded-xl text-[10px]">+ Add</span>
        </button>
        <button onclick="addIngredient('Choco')" class="bg-slate-900/90 border border-white/10 hover:border-pink-500/50 rounded-2xl p-3 text-center flex flex-col items-center gap-1.5 transition active:scale-95">
          <div class="text-2xl">🍫</div>
          <div class="text-[11px] font-bold text-slate-300">Choco Syrup</div>
          <span class="w-full py-1.5 bg-pink-600 text-white font-black rounded-xl text-[10px]">+ Add</span>
        </button>
        <button onclick="addIngredient('Caramel')" class="bg-slate-900/90 border border-white/10 hover:border-yellow-500/50 rounded-2xl p-3 text-center flex flex-col items-center gap-1.5 transition active:scale-95">
          <div class="text-2xl">🍯</div>
          <div class="text-[11px] font-bold text-slate-300">Caramel</div>
          <span class="w-full py-1.5 bg-yellow-600 text-white font-black rounded-xl text-[10px]">+ Add</span>
        </button>
      </div>

      <!-- Cup Tray & Actions -->
      <div class="w-full max-w-md bg-black/80 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center shrink-0 shadow-2xl">
        <div class="text-[11px] text-slate-400 mb-2 uppercase font-bold">Current Cup: <span id="cup-tray" class="text-pink-400 font-mono">[ Empty ]</span></div>
        <div class="flex gap-2">
          <button onclick="resetCup()" class="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition active:scale-95">Clear 🗑️</button>
          <button onclick="serveOrder()" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-lg transition active:scale-95">Serve Order 🛎️</button>
        </div>
      </div>
    </div>
  `;

  let coins = 500, served = 0, customerTimeLeft = 60;
  let currentOrderObj = { name: 'Espresso', ingredients: ['Beans'] };
  let currentCup = [];
  let gameInterval = null;
  const avatars = ['🧑‍💼', '👩‍🎨', '🧑‍🎓', '👩‍💻', '🧑‍🎤', '👷‍♂️', '👩‍⚕️'];
  const possibleOrders = [
    { name: 'Espresso', ingredients: ['Beans'] },
    { name: 'Latte', ingredients: ['Beans', 'Milk'] },
    { name: 'Sweet Matcha', ingredients: ['Matcha', 'Sugar'] },
    { name: 'Mocha Frappe', ingredients: ['Beans', 'Milk', 'Choco'] },
    { name: 'Caramel Macchiato', ingredients: ['Beans', 'Milk', 'Caramel'] },
    { name: 'Ultimate Sweet Cup', ingredients: ['Beans', 'Milk', 'Sugar', 'Caramel'] }
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
      if (barEl) barEl.style.width = `${(customerTimeLeft / 60) * 100}%`;

      if (customerTimeLeft <= 0) {
        // Customer got angry and left!
        coins = Math.max(0, coins - 40);
        document.getElementById('cafe-coins').textContent = `🪙 ${coins}`;
        if (typeof AudioFX !== 'undefined') AudioFX.lose();
        window.spawnNextCustomer();
      }
    }, 1000);
  };

  window.spawnNextCustomer = function() {
    customerTimeLeft = 60; // Reset to 1 minute per customer
    currentOrderObj = possibleOrders[Math.floor(Math.random() * possibleOrders.length)];
    currentCup = [];
    
    const bubble = document.getElementById('customer-order-bubble');
    const avatar = document.getElementById('customer-avatar');
    if (avatar) avatar.textContent = avatars[Math.floor(Math.random() * avatars.length)];
    if (bubble) bubble.textContent = `I want a ${currentOrderObj.name} (${currentOrderObj.ingredients.join(' + ')})`;
    updateCupDisplay();
  };

  window.addIngredient = function(item) {
    currentCup.push(item);
    updateCupDisplay();
    if (typeof AudioFX !== 'undefined') AudioFX.click();
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
      coins += 180;
      served++;
      document.getElementById('cafe-coins').textContent = `🪙 ${coins}`;
      document.getElementById('cafe-score').textContent = `SERVED: ${served}`;
      if (typeof AudioFX !== 'undefined') AudioFX.win();
      if (typeof addXP === 'function') addXP(35);
    } else {
      coins = Math.max(0, coins - 30);
      document.getElementById('cafe-coins').textContent = `🪙 ${coins}`;
      if (typeof AudioFX !== 'undefined') AudioFX.lose();
    }
    window.spawnNextCustomer();
  };

  return () => {
    if (gameInterval) clearInterval(gameInterval);
  };
}