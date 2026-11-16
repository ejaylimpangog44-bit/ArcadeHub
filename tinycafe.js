function initTinyCafe(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 flex flex-col items-center justify-between p-4 select-none text-white overflow-y-auto">
      <div class="flex items-center justify-between w-full max-w-lg bg-black/40 p-3 rounded-2xl border border-white/10">
        <span id="cafe-coins" class="text-amber-400 font-black text-sm">🪙 COINS: 500</span>
        <span class="text-xs font-bold uppercase tracking-wider text-amber-200">☕ Tiny Café Shift</span>
        <span id="cafe-score" class="text-emerald-300 font-black text-sm">SERVED: 0</span>
      </div>

      <div id="cafe-floor" class="w-full max-w-lg grid grid-cols-2 gap-3 my-auto">
        <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-4 text-center flex flex-col items-center gap-2">
          <div class="text-3xl">☕</div>
          <div class="text-xs font-bold text-slate-300">Espresso Machine</div>
          <button onclick="brewCoffee('Espresso', 45)" class="w-full py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs">Brew Espresso</button>
        </div>
        <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-4 text-center flex flex-col items-center gap-2">
          <div class="text-3xl">🍵</div>
          <div class="text-xs font-bold text-slate-300">Matcha Station</div>
          <button onclick="brewCoffee('Matcha', 60)" class="w-full py-2 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs">Brew Matcha</button>
        </div>
      </div>

      <div class="w-full max-w-lg bg-black/60 border border-white/10 rounded-2xl p-4 text-center">
        <div class="text-xs text-slate-400 mb-2 uppercase font-bold">Active Customer Order</div>
        <div id="customer-order-box" class="text-base font-extrabold text-amber-300">Waiting for customer...</div>
        <button id="serve-btn" onclick="serveOrder()" disabled class="w-full mt-3 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-sm disabled:opacity-40">Serve Order 🛎️</button>
      </div>
    </div>
  `;

  let coins = 500, served = 0, currentDrink = null, readyDrink = null;
  const orders = ['Espresso', 'Matcha', 'Croissant', 'Latte'];

  window.spawnCustomer = function() {
    currentDrink = orders[Math.floor(Math.random() * orders.length)];
    const box = document.getElementById('customer-order-box');
    if (box) box.textContent = `Customer wants: 🥤 ${currentDrink}`;
    readyDrink = null;
  };

  window.brewCoffee = function(drinkName, cost) {
    if (coins < cost) {
      if (typeof AudioFX !== 'undefined') AudioFX.lose();
      return;
    }
    coins -= cost;
    readyDrink = drinkName;
    document.getElementById('cafe-coins').textContent = `🪙 COINS: ${coins}`;
    const box = document.getElementById('customer-order-box');
    if (box) box.textContent = `✅ Ready to serve: ${readyDrink}`;
    document.getElementById('serve-btn').disabled = false;
    if (typeof AudioFX !== 'undefined') AudioFX.card();
  };

  window.serveOrder = function() {
    if (!readyDrink || !currentDrink) return;
    if (readyDrink === currentDrink) {
      coins += 120;
      served++;
      document.getElementById('cafe-coins').textContent = `🪙 COINS: ${coins}`;
      document.getElementById('cafe-score').textContent = `SERVED: ${served}`;
      if (typeof AudioFX !== 'undefined') AudioFX.coin();
      if (typeof addXP === 'function') addXP(20);
    } else {
      coins -= 20;
      document.getElementById('cafe-coins').textContent = `🪙 COINS: ${coins}`;
      if (typeof AudioFX !== 'undefined') AudioFX.lose();
    }
    document.getElementById('serve-btn').disabled = true;
    window.spawnCustomer();
  };

  window.spawnCustomer();
}
