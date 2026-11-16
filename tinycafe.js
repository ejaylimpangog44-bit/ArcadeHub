function initTinyCafe(stage) {
  stage.innerHTML = `
    <div id="cafe-root" class="relative w-full h-full bg-slate-950 flex flex-col items-center justify-between p-4 select-none text-white overflow-hidden">
      <!-- Cloud Dissolve Intro Overlay -->
      <div id="cafe-intro-clouds" class="absolute inset-0 z-50 bg-sky-900 flex flex-col items-center justify-center transition-transform duration-1000">
        <div class="text-6xl mb-4 animate-bounce">☕</div>
        <h2 class="text-2xl font-black text-amber-300 mb-2">Tiny Café Full Viewport Edition</h2>
        <p class="text-xs text-sky-200 mb-6 text-center max-w-xs">Prepare ingredients, manage 5-minute customer queues, and brew orders!</p>
        <button onclick="startCafeShift()" class="px-8 py-3.5 bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl hover:scale-105 transition">Start Café Shift 🚀</button>
      </div>

      <div class="flex items-center justify-between w-full max-w-2xl bg-black/50 p-3 rounded-2xl border border-white/10 shrink-0">
        <span id="cafe-coins" class="text-amber-400 font-black text-sm">🪙 COINS: 500</span>
        <span id="cafe-timer" class="text-cyan-300 font-mono font-bold text-xs">⏳ QUEUE: 05:00</span>
        <span id="cafe-score" class="text-emerald-300 font-black text-sm">SERVED: 0</span>
      </div>

      <!-- Customer Queue Line -->
      <div class="w-full max-w-2xl bg-black/40 border border-white/10 rounded-2xl p-3 flex items-center justify-between shrink-0">
        <div class="text-xs font-bold text-slate-300">👥 Customer Line:</div>
        <div id="customer-queue-display" class="text-sm font-extrabold text-amber-300 tracking-wider">Waiting for customers...</div>
      </div>

      <!-- Brewing Ingredient Stations -->
      <div class="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 my-auto">
        <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-4 text-center flex flex-col items-center gap-2">
          <div class="text-2xl">🫘</div>
          <div class="text-[11px] font-bold text-slate-300">Coffee Beans</div>
          <button onclick="addIngredient('Beans')" class="w-full py-2 bg-amber-600 text-white font-black rounded-xl text-xs">+ Add Beans</button>
        </div>
        <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-4 text-center flex flex-col items-center gap-2">
          <div class="text-2xl">🥛</div>
          <div class="text-[11px] font-bold text-slate-300">Fresh Milk</div>
          <button onclick="addIngredient('Milk')" class="w-full py-2 bg-indigo-600 text-white font-black rounded-xl text-xs">+ Add Milk</button>
        </div>
        <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-4 text-center flex flex-col items-center gap-2">
          <div class="text-2xl">🧊</div>
          <div class="text-[11px] font-bold text-slate-300">Sugar / Ice</div>
          <button onclick="addIngredient('Sugar')" class="w-full py-2 bg-cyan-600 text-white font-black rounded-xl text-xs">+ Add Sugar</button>
        </div>
        <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-4 text-center flex flex-col items-center gap-2">
          <div class="text-2xl">🍵</div>
          <div class="text-[11px] font-bold text-slate-300">Matcha Leaf</div>
          <button onclick="addIngredient('Matcha')" class="w-full py-2 bg-emerald-600 text-white font-black rounded-xl text-xs">+ Add Matcha</button>
        </div>
      </div>

      <!-- Order Tray & Station -->
      <div class="w-full max-w-2xl bg-black/60 border border-white/10 rounded-2xl p-4 text-center shrink-0">
        <div class="text-xs text-slate-400 mb-1 uppercase font-bold">Current Cup Ingredients: <span id="cup-tray" class="text-pink-400 font-mono">[ Empty ]</span></div>
        <div id="customer-order-box" class="text-sm font-extrabold text-amber-300 my-1">Customer Order: Espresso (Beans + Milk)</div>
        <div class="flex gap-2 mt-3">
          <button onclick="resetCup()" class="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs">Clear Cup 🗑️</button>
          <button onclick="serveOrder()" class="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-lg">Serve Order 🛎️</button>
        </div>
      </div>
    </div>
  `;

  let coins = 500, served = 0, queueTime = 300; // 5 minutes in seconds
  let currentOrder = 'Espresso';
  let requiredIngredients = ['Beans', 'Milk'];
  let currentCup = [];
  let timerInterval = null;
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
      if (timerEl) timerEl.textContent = `⏳ QUEUE: ${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
      if (queueTime <= 0) {
        clearInterval(timerInterval);
        alert('Shift Completed! Great job managing the café queue.');
      }
    }, 1000);
  };

  window.spawnNextCustomer = function() {
    const orderObj = possibleOrders[Math.floor(Math.random() * possibleOrders.length)];
    currentOrder = orderObj.name;
    requiredIngredients = orderObj.ingredients;
    currentCup = [];
    const orderBox = document.getElementById('customer-order-box');
    const queueDisplay = document.getElementById('customer-queue-display');
    if (orderBox) orderBox.textContent = `Customer wants: ${currentOrder} (${requiredIngredients.join(' + ')})`;
    if (queueDisplay) queueDisplay.textContent = `👤 3 Customers waiting in queue...`;
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
    // Check if ingredients match
    const isMatch = currentCup.length === requiredIngredients.length && requiredIngredients.every((val, index) => val === currentCup[index]);
    if (isMatch) {
      coins += 150;
      served++;
      document.getElementById('cafe-coins').textContent = `🪙 COINS: ${coins}`;
      document.getElementById('cafe-score').textContent = `SERVED: ${served}`;
      if (typeof AudioFX !== 'undefined') AudioFX.win();
      if (typeof addXP === 'function') addXP(30);
    } else {
      coins -= 30;
      document.getElementById('cafe-coins').textContent = `🪙 COINS: ${coins}`;
      if (typeof AudioFX !== 'undefined') AudioFX.lose();
    }
    window.spawnNextCustomer();
  };

  return () => {
    if (timerInterval) clearInterval(timerInterval);
  };
}
