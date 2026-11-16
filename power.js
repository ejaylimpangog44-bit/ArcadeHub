document.addEventListener("DOMContentLoaded", () => {
  const powerScreen = document.getElementById("power-screen");
  const pullChain = document.querySelector(".pull-chain-assembly");
  const pullHandle = document.getElementById("pullHandle");

  let isPoweredOn = false;

  function triggerPowerOn() {
    if (isPoweredOn) return;
    isPoweredOn = true;

    playPowerAudio();

    pullChain.classList.add("pulled");
    powerScreen.classList.add("active-glow");

    setTimeout(() => {
      powerScreen.classList.add("powered-on");
    }, 800);
  }

  function playPowerAudio() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
    });
  }
});
