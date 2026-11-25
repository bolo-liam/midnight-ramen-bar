// Tiny WebAudio bleeps, all synthesized — no audio files. M toggles mute.
export function createAudio() {
  let ctx = null;
  let muted = false;
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function blip(freq, dur, type, vol) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  }
  return {
    pickup() { blip(520, 0.09, 'triangle', 0.07); },
    perfect() { blip(660, 0.08, 'sine', 0.09); setTimeout(() => blip(880, 0.12, 'sine', 0.09), 70); },
    serve() { blip(523, 0.1, 'triangle', 0.09); setTimeout(() => blip(659, 0.1, 'triangle', 0.09), 90); setTimeout(() => blip(784, 0.16, 'triangle', 0.09), 180); },
    error() { blip(180, 0.16, 'sawtooth', 0.05); },
    expire() { blip(220, 0.2, 'sawtooth', 0.05); setTimeout(() => blip(160, 0.25, 'sawtooth', 0.05), 140); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
  };
}
