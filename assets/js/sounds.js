/**
 * Prague1200 — Web Audio Synthesis Sound Engine
 * All sounds synthesized in-browser, no audio files needed.
 */

const SoundEngine = (() => {
  let ctx = null;
  let enabled = false;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function resume() {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
  }

  /* ── Page turn: soft paper whoosh ── */
  function pageTurn() {
    if (!enabled) return;
    resume();
    const c = getCtx();
    const dur = 0.18;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / d.length;
      d[i] = (Math.random() * 2 - 1)
             * Math.exp(-t * 12)
             * Math.sin(t * Math.PI)
             * 0.4;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 600;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.6, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + dur);
    src.connect(hp); hp.connect(gain); gain.connect(c.destination);
    src.start();
  }

  /* ── Tram bell: ding-ding ── */
  function tramBell() {
    if (!enabled) return;
    resume();
    const c = getCtx();
    const times = [0, 0.28];
    times.forEach(offset => {
      const osc  = c.createOscillator();
      const osc2 = c.createOscillator();
      const gain = c.createGain();
      osc.type  = 'sine'; osc.frequency.value  = 1480; // ~F#6
      osc2.type = 'sine'; osc2.frequency.value = 1760; // ~A6
      const t0 = c.currentTime + offset;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.5, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.9);
      osc.connect(gain); osc2.connect(gain); gain.connect(c.destination);
      osc.start(t0);  osc.stop(t0 + 0.9);
      osc2.start(t0); osc2.stop(t0 + 0.9);
    });
  }

  /* ── Beer glug: gurgle sound ── */
  function beerGlug() {
    if (!enabled) return;
    resume();
    const c = getCtx();
    [0, 0.12, 0.27, 0.45, 0.65].forEach((offset, idx) => {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      // Pitch drops on each glug
      osc.frequency.value = 220 - idx * 18;
      osc.frequency.exponentialRampToValueAtTime(
        osc.frequency.value * 0.7,
        c.currentTime + offset + 0.1
      );
      const t0 = c.currentTime + offset;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.35, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t0); osc.stop(t0 + 0.15);
    });
    // Trailing "Ahh!" — brief noise burst
    setTimeout(() => {
      const buf  = c.createBuffer(1, c.sampleRate * 0.12, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.04));
      }
      const src  = c.createBufferSource();
      src.buffer = buf;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 800;
      const g = c.createGain(); g.gain.value = 0.2;
      src.connect(lp); lp.connect(g); g.connect(c.destination);
      src.start();
    }, 700);
  }

  /* ── Rubber stamp thud ── */
  function stampThud() {
    if (!enabled) return;
    resume();
    const c = getCtx();
    // Low thump
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine'; osc.frequency.value = 60;
    osc.frequency.exponentialRampToValueAtTime(25, c.currentTime + 0.12);
    gain.gain.setValueAtTime(1.2, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.22);

    // Click transient
    const buf  = c.createBuffer(1, c.sampleRate * 0.01, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const g2 = c.createGain(); g2.gain.value = 0.8;
    src.connect(g2); g2.connect(c.destination);
    src.start();
  }

  /* ── Timer tick ── */
  function tick() {
    if (!enabled) return;
    resume();
    const c = getCtx();
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.type = 'square'; osc.frequency.value = 800;
    g.gain.setValueAtTime(0.06, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
    osc.connect(g); g.connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.04);
  }

  /* ── Magic sparkle ── */
  function magic() {
    if (!enabled) return;
    resume();
    const c = getCtx();
    [0, 0.05, 0.12, 0.2, 0.3].forEach((offset, i) => {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880 + i * 220;
      const t0 = c.currentTime + offset;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.15, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t0); osc.stop(t0 + 0.35);
    });
  }

  /* ── Achievement unlock jingle ── */
  function achievement() {
    if (!enabled) return;
    resume();
    const c = getCtx();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      const t0 = c.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.2, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t0); osc.stop(t0 + 0.4);
    });
  }

  return {
    enable()  { enabled = true;  resume(); },
    disable() { enabled = false; },
    toggle()  { enabled ? this.disable() : this.enable(); return enabled; },
    isEnabled() { return enabled; },
    pageTurn, tramBell, beerGlug, stampThud, tick, magic, achievement,
  };
})();

window.SoundEngine = SoundEngine;
