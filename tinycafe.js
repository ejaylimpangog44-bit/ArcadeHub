function initTinyCafe(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 flex flex-col items-center p-4 select-none text-white overflow-y-auto pb-24">
      <!-- Cloud Dissolve Intro Overlay -->
      <div id="cafe-intro-clouds" class="absolute inset-0 z-50 bg-sky-900 flex flex-col items-center justify-center transition-transform duration-1000">
        <div class="text-6xl mb-4 animate-bounce">☕</div>
        <h2 class="text-2xl font-black text-amber-300 mb-2">Tiny Café Full Viewport Edition</h2>
        <p class="text-xs text-sky-200 mb-6 text-center max-w-xs">Brew custom coffees, serve customers before their patience empties!</p>
        <button onclick="startCafeShift()" class="px-8 py-3.5 bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl hover:scale-105 transition">Start Café Shift 🚀</button>
      </div>

      <!-- Top HUD -->
      <div class="flex items-center justify-between w-full max-w-md bg-black/60 p-3 rounded-2xl border border-white/10 shrink-0 mb-4">
        <span id="cafe-coins" class="text-amber-400 font-black text-xs sm:text-sm">🪙 500</span>
        <span id="cafe-timer" class="text-cyan-300 font-mono font-bold text-xs">⏳ 05:00</span>
        <span id="cafe-score" class="text-emerald-300 font-black text-xs sm:text-sm">SERVED: 0</span>
      </div>

      <!-- Customer Counter & Walking Scene -->
      <div class="w-full max-w-md bg-gradient-to-b from-slate-900 to-black border border-white/15 rounded-3xl p-5 mb-4 shadow-xl flex flex-col items-center relative overflow-hidden shrink-0">
        <div class="absolute top-2 left-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shop Counter</div>
        
        <!-- Walking Customer & Speech Bubble -->
        <div class="flex items-center gap-4 my-4">
          <div id="customer-avatar" class="text-4xl animate-bounce">🧍</div>
          <div class="relative bg-white text-slate-950 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm shadow-lg max-w-[200px] text-center">
            <div class="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white border-b-8 border-b-transparent"></div>
            <span id="customer-order-bubble">Waiting for customer...</span>
          </div>
        </div>
      </div>

      <!-- Brewing Ingredient Grid -->
      <div class="w-full max-w-md grid grid-cols-2 gap-3 mb-4 shrink-0">
        <button onclick="addIngredient('Beans')" class="bg-slate-900/90 border border-white/10 hover:border-amber-500/50 rounded-2xl p-4 text-center flex flex-col items-center gap-2 transition active:scale-95">
          <div class="text-3xl">🫘</div>
          <div class="text-xs font-bold text-slate-300">Coffee Beans</div>
          <span class="w-full py-2 bg-amber-600 text-white font-black rounded-xl text-xs">+ Add Beans</span>
        </button>
        <button onclick="addIngredient('Milk')" class="bg-slate-900/90 border border-white/10 hover:border-indigo-500/50 rounded-2xl p-4 text-center flex flex-col items-center gap-2 transition active:scale-95">
          <div class="text-3xl">🥛</div>
          <div class="text-xs font-bold text-slate-300">Fresh Milk</div>
          <span class="w-full py-2 bg-indigo-600 text-white font-black rounded-xl text-xs">+ Add Milk</span>
        </button>
        <button onclick="addIngredient('Sugar')" class="bg-slate-900/90 border border-white/10 hover:border-cyan-500/50 rounded-2xl p-4 text-center flex flex-col items-center gap-2 transition active:scale-95">
          <div class="text-3xl">🧊</div>
          <div class="text-xs font-bold text-slate-300">Sugar / Ice</div>
          <span class="w-full py-2 bg-cyan-600 text-white font-black rounded-xl text-xs">+ Add Sugar</span>
        </button>
        <button onclick="addIngredient('Matcha')" class="bg-slate-900/90 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-4 text-center flex flex-col items-center gap-2 transition active:scale-95">
          <div class="text-3xl">🍵</div>
          <div class="text-xs font-bold text-slate-300">Matcha Leaf</div>
          <span class="w-full py-2 bg-emerald-600 text-white font-black rounded-xl text-xs">+ Add Matcha</span>
        </button>
      </div>

      <!-- Cup Tray & Actions (Pinned clearly above fold) -->
      <div class="w-full max-w-md bg-black/80 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center shrink-0 shadow-2xl">
        <div class="text-[11px] text-slate-400 mb-2 uppercase font-bold">Current Cup: <span id="cup-tray" class="text-pink-400 font-mono">[ Empty ]</span></div>
        <div class="flex gap-2">
          <button onclick="resetCup()" class="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition active:scale-95">Clear 🗑️</button>
          <button onclick="serveOrder()" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-lg transition active:scale-95">Serve Order 🛎️</button>
        </div>
      </div>
    </div>
  `;

  let coins = 500, served = 0, queueTime = 300;
  let currentOrderObj = { name: 'Espresso', ingredients: ['Beans'] };
  let currentCup = [];
  let timerInterval = null;
  const avatars = ['🧑‍💼', '👩‍🎨', '🧑‍🎓', '👩‍💻', '🧑‍🎤'];
  const possibleOrders = [
    { name: 'Espresso', ingredients: ['Beans'] },
    { name: 'Latte', ingredients: ['Beans', 'Milk'] },
    { name: 'Sweet Matcha', ingredients: ['Matcha', 'Sugar'] },
    { name: 'Special Macchiato', ingredients: ['Beans', 'Milk', 'Sugar'] }
  ];

  window.startCafeShift = function() {
    const cloudEl = document.getElementById('cafe-intro-clouds');
    if (cloudEl) {
      cloudEl.style.transform = 'translateY(-100%)';
      setTimeout(() => cloudEl.remove(), 1000);
    }
    if (typeof AudioFX !== 'undefined') AudioFX.coin();
    window.spawnNextCustomer();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      queueTime--;
      let mins = Math.floor(queueTime / 60);
      let secs = queueTime % 60;
      const timerEl = document.getElementById('cafe-timer');
      if (timerEl) timerEl.textContent = `⏳ ${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
      if (queueTime <= 0) {
        clearInterval(timerInterval);
        alert('Shift Completed! Great job managing the café queue.');
      }
    }, 1000);
  };

  window.spawnNextCustomer = function() {
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
      coins += 150;
      served++;
      document.getElementById('cafe-coins').textContent = `🪙 ${coins}`;
      document.getElementById('cafe-score').textContent = `SERVED: ${served}`;
      if (typeof AudioFX !== 'undefined') AudioFX.win();
      if (typeof addXP === 'function') addXP(30);
    } else {
      coins -= 30;
      document.getElementById('cafe-coins').textContent = `🪙 ${coins}`;
      if (typeof AudioFX !== 'undefined') AudioFX.lose();
    }
    window.spawnNextCustomer();
  };

  return () => {
    if (timerInterval) clearInterval(timerInterval);
  };
}