function initMiniGame(stage) {
  stage.innerHTML = `
    <div id="game-root" class="relative w-full h-full bg-slate-950 flex flex-col select-none text-white overflow-y-auto pb-28 transition-colors duration-1000" style="background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%);">
      
      <!-- Intro Overlay / Splash Screen -->
      <div id="game-intro" class="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center transition-transform duration-1000 p-4 text-center">
        <div class="text-6xl mb-3 animate-bounce">🎮</div>
        <h2 class="text-2xl font-black text-amber-300 mb-2">Mini-Game Title</h2>
        <p class="text-xs text-slate-300 mb-6 max-w-xs">Play, score points, and progress across levels!</p>
        <button onclick="startGameSession()" class="px-8 py-3.5 bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl hover:scale-105 transition text-sm">Start Game 🚀</button>
      </div>

      <!-- Unified Integrated Game Header Bar -->
      <div class="flex items-center justify-between w-full bg-slate-900/90 px-3 py-2.5 border-b border-white/15 shrink-0 text-xs shadow-md z-20">
        <div class="flex items-center gap-2 font-black">
          <span id="game-coins" class="text-amber-400 bg-black/40 px-2 py-1 rounded-lg border border-amber-500/30">🪙 500</span>
          <span id="game-score-hud" class="text-emerald-300 bg-black/40 px-2 py-1 rounded-lg border border-emerald-500/30">SCORE: 0</span>
        </div>
        <div id="game-timer-hud" class="text-cyan-300 font-mono font-bold bg-black/40 px-2 py-1 rounded-lg border border-cyan-500/30">⏳ 01:00</div>
      </div>

      <!-- Main Game Play Area Container -->
      <div class="p-3 flex flex-col flex-1 items-center justify-center">
        <div id="game-board" class="w-full max-w-md bg-black/40 border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center shadow-2xl min-h-[300px]">
          <div class="text-sm font-bold text-slate-400">Game board content goes here...</div>
        </div>
      </div>

      <!-- Sticky Footer Controls (Pinned at Bottom for Easy Mobile Access) -->
      <div class="sticky bottom-2 w-full bg-black/95 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center shadow-2xl z-30 mx-auto max-w-md">
        <div class="flex gap-2">
          <button onclick="resetGameAction()" class="py-2.5 px-5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition active:scale-95">Reset 🔄</button>
          <button onclick="triggerMainAction()" class="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-lg transition active:scale-95">Action Button ⚡</button>
        </div>
      </div>
    </div>
  `;

  let coins = 500, score = 0, timeLeft = 60;
  let gameInterval = null;

  window.startGameSession = function() {
    const introEl = document.getElementById('game-intro');
    if (introEl) {
      introEl.style.transform = 'translateY(-100%)';
      setTimeout(() => introEl.remove(), 1000);
    }
    
    if (typeof AudioFX !== 'undefined') AudioFX.coin();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(() => {
      timeLeft--;
      const timerHud = document.getElementById('game-timer-hud');
      if (timerHud) timerHud.textContent = `⏳ 00:${String(timeLeft % 60).padStart(2,'0')}`;

      if (timeLeft <= 0) {
        clearInterval(gameInterval);
        if (typeof AudioFX !== 'undefined') AudioFX.win();
        alert('Game Over! Final Score: ' + score);
      }
    }, 1000);
  };

  window.resetGameAction = function() {
    score = 0;
    const scoreHud = document.getElementById('game-score-hud');
    if (scoreHud) scoreHud.textContent = `SCORE: ${score}`;
    if (typeof AudioFX !== 'undefined') AudioFX.hit();
  };

  window.triggerMainAction = function() {
    score += 10;
    const scoreHud = document.getElementById('game-score-hud');
    if (scoreHud) scoreHud.textContent = `SCORE: ${score}`;
    if (typeof AudioFX !== 'undefined') AudioFX.click();
    if (typeof addXP === 'function') addXP(5);
  };

  return () => {
    if (gameInterval) clearInterval(gameInterval);
  };
}
