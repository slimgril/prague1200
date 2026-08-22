/**
 * Prague1200 — Web Audio Synthesis Sound Engine
 * All sounds synthesized in-browser, no audio files needed.
 */

const SoundEngine = (() => {
  let ctx = null;
  let enabled = false;

  /* ── HTMLMediaElement 自動播放解鎖 ──
     真正的根因找到了：P10 配樂「正翻沒有、反翻卻有」不是隨機的自動播放
     擋播被吞掉，而是 Safari／WebKit 的規則——第一次 play() 如果不是
     直接發生在使用者手勢的同步呼叫堆疊裡，就會被永久拒絕；翻頁動畫要
     等圖片準備好、等 transitionend 才觸發配樂，這已經是非同步事件，
     不算使用者手勢，所以「正翻第一次进某頁」這種配樂一定會被擋。反翻
     回去能聽到，只是因為那顆 iframe 沒有重新載入、音檔已經在瀏覽器
     快取裡，剛好蒙混過關而已，並不是真的修好了。
     解法：只要在使用者「第一次」點擊／觸控／按鍵這個真正的手勢裡，
     同步地 play()＋立刻 pause() 一顆隱形靜音的 <audio>，就能讓整頁
     被瀏覽器判定「已經有過使用者互動的播放」，之後不管翻頁配樂是在
     多久以後、多不同步的地方觸發，都能正常播放——不用管是正翻還是
     反翻、也不用管是不是第一次進某一頁。 */
  let _mediaUnlocked = false;
  function unlockMedia() {
    if (_mediaUnlocked) return;
    _mediaUnlocked = true;
    try {
      const a = new Audio();
      a.muted = true;
      a.playsInline = true;
      const p = a.play();
      if (p && p.then) {
        p.then(() => a.pause()).catch(() => { _mediaUnlocked = false; });
      } else {
        a.pause();
      }
    } catch (e) { _mediaUnlocked = false; }
  }

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

  /* ── 背景配樂 淡入／淡出（一般 <audio> 元素，非 Web Audio 合成音效）── */
  let _track = null;
  let _fadeTimer = null;
  function _clearFade() { if (_fadeTimer) { clearInterval(_fadeTimer); _fadeTimer = null; } }
  function fadeInTrack(src, { volume = 0.7, fadeMs = 2500, loop = true } = {}) {
    if (!enabled) return;
    _clearFade();
    if (_track) { _track.pause(); }
    const track = new Audio(src);
    _track = track;
    track.loop = loop;
    track.preload = 'auto';
    track.volume = 0;

    /* 正翻/倒翻的配樂差異，根源是「第一次建立這個 Audio 物件時直接
       play()」在部分瀏覽器下會因為尚未緩衝好、或自動播放政策而被悄悄
       拒絕（promise reject 後被 .catch(()=>{}) 吞掉），之後淡入的音量
       timer 還是照跑，只是套用在一個「其實沒有在播放」的靜音元素上，
       完全聽不到聲音；倒翻回來時瀏覽器多半已經快取/緩衝過同一個檔案，
       第二次 play() 就順利成功，所以才會「這個方向永遠沒聲音、那個方向
       永遠有聲音」。改成：play() 失敗時，等 canplaythrough 或 loadeddata
       再重試一次；如果是自動播放政策直接拒絕，改用「先靜音播放、隨後
       嘗試取消靜音」這個已經在 P11 影片上驗證可行的退路，確保不會整段
       靜音、聽不到任何聲音。 */
    function attemptPlay() {
      const p = track.play();
      if (p && p.catch) {
        p.catch(() => {
          if (track.readyState >= 2) {
            track.muted = true;
            track.play().then(() => { track.muted = false; }).catch(() => {});
          } else {
            const retry = () => {
              track.muted = true;
              track.play().then(() => { track.muted = false; }).catch(() => {});
            };
            track.addEventListener('canplaythrough', retry, { once: true });
            track.addEventListener('loadeddata', retry, { once: true });
          }
        });
      }
    }
    attemptPlay();

    const steps = 30, stepTime = fadeMs / steps;
    let i = 0;
    _fadeTimer = setInterval(() => {
      i++;
      if (_track === track) track.volume = Math.min(volume, (volume * i) / steps);
      if (i >= steps) _clearFade();
    }, stepTime);
  }
  function fadeOutTrack({ fadeMs = 2000 } = {}) {
    if (!_track) return;
    _clearFade();
    const trackRef = _track;
    const startVol = trackRef.volume || 0.001;
    const steps = 30, stepTime = fadeMs / steps;
    let i = 0;
    _fadeTimer = setInterval(() => {
      i++;
      trackRef.volume = Math.max(0, startVol * (1 - i / steps));
      if (i >= steps) {
        _clearFade();
        trackRef.pause();
        trackRef.currentTime = 0;
        if (_track === trackRef) _track = null;
      }
    }, stepTime);
  }

  return {
    enable()  { enabled = true;  resume(); },
    disable() { enabled = false; },
    toggle()  { enabled ? this.disable() : this.enable(); return enabled; },
    isEnabled() { return enabled; },
    pageTurn, tramBell, beerGlug, stampThud, tick, magic, achievement,
    fadeInTrack, fadeOutTrack, unlockMedia,
  };
})();

window.SoundEngine = SoundEngine;
