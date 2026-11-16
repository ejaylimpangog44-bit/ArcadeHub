function initTinyCafe(stage) {
  stage.innerHTML = `
    <div class="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 select-none text-center">
      <div class="text-4xl mb-3">☕</div>
      <div class="text-2xl font-black text-amber-400 mb-2">Tiny Café Time Management</div>
      <p class="text-sm text-slate-300 max-w-md mb-6">Brew custom coffees, serve customers before their patience meter empties, and upgrade your station equipment between shifts!</p>
      <button onclick="if(typeof AudioFX!=='undefined')AudioFX.click();alert('Tiny Café shift unlocked!');" class="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-2xl shadow-lg">Start Café Shift 🚀</button>
    </div>
  `;
}
