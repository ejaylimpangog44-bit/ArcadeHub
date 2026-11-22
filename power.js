document.addEventListener("DOMContentLoaded", () => {
  const powerScreen = document.getElementById("power-screen");
  const pullChain = document.querySelector(".pull-chain-assembly");
  const pullHandle = document.getElementById("pullHandle");

  let isPoweredOn = false;

  function triggerPowerOn() {
    if (isPoweredOn) return;
    isPoweredOn = true;

    const docEl = document.documentElement;
    const requestFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
    if (requestFs) {
      requestFs.call(docEl).catch((err) => console.log("Fullscreen request blocked:", err));
    }
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock("landscape").catch(() => {});
    }

    playPowerAudio();

    if (pullChain) pullChain.classList.add("pulled");
    if (powerScreen) powerScreen.classList.add("active-glow");

    setTimeout(() => {
      if (powerScreen) powerScreen.classList.add("powered-on");
    }, 800);
  }

  function playPowerAudio() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
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
    pullHandle.addEventListener("click", triggerPowerOn);
    pullHandle.addEventListener("touchstart", (e) => {
      e.preventDefault();
      triggerPowerOn();
    }, { passive: false });
  }
});