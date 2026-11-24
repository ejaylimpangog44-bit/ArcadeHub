document.addEventListener("DOMContentLoaded", () => {
  const powerScreen = document.getElementById("power-screen");
  const pullChain = document.querySelector(".pull-chain-assembly");
  const pullHandle = document.getElementById("pullHandle");
  const neonSignContainer = document.querySelector(".neon-sign-container");

  let isPoweredOn = false;

  function triggerPowerOn() {
    if (isPoweredOn) return;
    isPoweredOn = true;

    playPowerAudio();

    if (pullChain) pullChain.classList.add("pulled");
    if (powerScreen) powerScreen.classList.add("active-glow");

    setTimeout(() => {
      if (powerScreen) powerScreen.classList.add("powered-on");
      if (typeof window.startSplashScreen === "function") {
        window.startSplashScreen();
      }
    }, 700);
  }

  function playPowerAudio() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // AudioContext restricted or unavailable
    }
  }

  if (pullHandle) {
    pullHandle.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerPowerOn();
    });
    pullHandle.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerPowerOn();
    }, { passive: false });
    pullHandle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        triggerPowerOn();
      }
    });
  }

  if (neonSignContainer) {
    neonSignContainer.addEventListener("click", triggerPowerOn);
  }
});