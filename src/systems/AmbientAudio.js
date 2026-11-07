// Fully synthesised audio (WebAudio): no files, no licensing.
// The rain is the foundation; the music sits underneath it.
// Replace with recorded audio later by loading files and routing them through the same buses.

const rand = (a, b) => a + Math.random() * (b - a);

export default class AmbientAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.handlers = {};
    this.stopped = false;
  }

  on(name, fn) {
    this.handlers[name] = fn;
  }

  _emit(name) {
    this.handlers[name]?.();
  }

  // Must be called from a user gesture (browser autoplay rules).
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(ctx.destination);
    this.amb = this._bus(1);
    this.sfx = this._bus(0.9);
    this.music = this._bus(0.55);

    this.white = this._noise('white');
    this.brown = this._noise('brown');

    this._startRain();
    this._startMusic();
    this._scheduleDistant();

    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend();
      else this.ctx.resume();
    });
  }

  setMuted(m) {
    this.muted = m;
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // ---------- plumbing ----------
  _bus(v) {
    const g = this.ctx.createGain();
    g.gain.value = v;
    g.connect(this.master);
    return g;
  }

  _noise(type) {
    const c = this.ctx;
    const len = c.sampleRate * 4;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'white') d[i] = w;
      else {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
    return buf;
  }

  _loop(buf) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.start(0, Math.random() * 3);
    return s;
  }

  _filter(type, freq, q = 0.7) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  _gain(v) {
    const g = this.ctx.createGain();
    g.gain.value = v;
    return g;
  }

  _pan(p) {
    if (!this.ctx.createStereoPanner) return this._gain(1);
    const n = this.ctx.createStereoPanner();
    n.pan.value = p;
    return n;
  }

  _later(fn, ms) {
    setTimeout(() => !this.stopped && fn(), ms);
  }

  _lfo(freq, depth, target) {
    const o = this.ctx.createOscillator();
    o.frequency.value = freq;
    const g = this._gain(depth);
    o.connect(g);
    g.connect(target);
    o.start();
  }

  // ---------- rain & wind ----------
  _startRain() {
    // high hiss of drops on everything
    const hiss = this._loop(this.white);
    const hissG = this._gain(0.07);
    hiss.connect(this._filter('highpass', 1400)).connect(this._filter('lowpass', 8000)).connect(hissG).connect(this.amb);

    // soft low body of rain on roofs and ground
    const body = this._loop(this.brown);
    const bodyG = this._gain(0.22);
    body.connect(this._filter('lowpass', 900)).connect(bodyG).connect(this.amb);
    this._lfo(0.13, 0.05, bodyG.gain);

    // mid patter
    const patter = this._loop(this.white);
    const patG = this._gain(0.045);
    patter.connect(this._filter('bandpass', 3200, 0.7)).connect(patG).connect(this.amb);
    this._lfo(0.21, 0.015, patG.gain);

    // wind
    const wind = this._loop(this.brown);
    const windG = this._gain(0.05);
    wind.connect(this._filter('bandpass', 350, 1)).connect(windG).connect(this.amb);
    this._lfo(0.06, 0.04, windG.gain);

    // individual drops pinging on different surfaces
    const tick = () => {
      this._drop();
      this._later(tick, 50 + Math.random() * 110);
    };
    tick();
  }

  _drop() {
    const c = this.ctx;
    const t = c.currentTime;
    const s = c.createBufferSource();
    s.buffer = this.white;
    const g = this._gain(0);
    g.gain.setValueAtTime(rand(0.015, 0.05), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    s.connect(this._filter('bandpass', rand(2200, 6500), 4)).connect(g).connect(this._pan(rand(-0.9, 0.9))).connect(this.amb);
    s.start(t, Math.random() * 3);
    s.stop(t + 0.05);
  }

  // ---------- distant life ----------
  _scheduleDistant() {
    const loop = () => {
      const r = Math.random();
      if (r < 0.4) this.bell();
      else if (r < 0.65) this.train();
      else if (r < 0.9) this.door();
      else this.bell();
      this._later(loop, rand(14000, 34000));
    };
    this._later(loop, 7000);

    const storm = () => {
      this.thunder();
      this._later(storm, rand(60000, 140000));
    };
    this._later(storm, 50000);
  }

  bell() {
    const c = this.ctx;
    if (!c) return;
    const pan = this._pan(rand(-0.7, 0.7));
    const lp = this._filter('lowpass', 1800);
    lp.connect(pan).connect(this.amb);
    const base = [330, 370, 294][Math.floor(Math.random() * 3)];
    const strikes = 1 + Math.floor(Math.random() * 3);
    for (let k = 0; k < strikes; k++) {
      const t0 = c.currentTime + k * 2.3;
      const out = this._gain(0);
      out.gain.setValueAtTime(0, t0);
      out.gain.linearRampToValueAtTime(0.05, t0 + 0.01);
      out.gain.exponentialRampToValueAtTime(0.0001, t0 + 4.5);
      out.connect(lp);
      [1, 2.01, 2.76, 4.07].forEach((m, i) => {
        const o = c.createOscillator();
        o.frequency.value = base * m;
        const g = this._gain(1 / (i + 1));
        o.connect(g).connect(out);
        o.start(t0);
        o.stop(t0 + 5);
      });
    }
  }

  train() {
    const c = this.ctx;
    if (!c) return;
    const t0 = c.currentTime;
    const dir = Math.random() > 0.5 ? 1 : -1;
    const pan = this._pan(-0.8 * dir);
    if (pan.pan) {
      pan.pan.setValueAtTime(-0.8 * dir, t0);
      pan.pan.linearRampToValueAtTime(0.8 * dir, t0 + 11);
    }
    pan.connect(this.amb);

    const horn = this._gain(0);
    horn.gain.setValueAtTime(0, t0);
    horn.gain.linearRampToValueAtTime(0.03, t0 + 0.6);
    horn.gain.setValueAtTime(0.03, t0 + 2.2);
    horn.gain.linearRampToValueAtTime(0, t0 + 4);
    horn.connect(this._filter('lowpass', 700)).connect(pan);
    [196, 247].forEach((f) => {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(horn);
      o.start(t0);
      o.stop(t0 + 4.2);
    });

    const rumble = this._loop(this.brown);
    const rg = this._gain(0);
    rg.gain.setValueAtTime(0, t0);
    rg.gain.linearRampToValueAtTime(0.12, t0 + 5);
    rg.gain.linearRampToValueAtTime(0, t0 + 11);
    rumble.connect(this._filter('lowpass', 160)).connect(rg).connect(pan);
    rumble.stop(t0 + 11.2);
  }

  door() {
    const c = this.ctx;
    if (!c) return;
    const pan = this._pan(rand(-0.8, 0.8));
    const lp = this._filter('lowpass', 500);
    lp.connect(pan).connect(this.amb);
    [0, 0.9 + Math.random() * 0.6].forEach((dt) => {
      const t = c.currentTime + dt;
      const o = c.createOscillator();
      o.frequency.setValueAtTime(95, t);
      o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
      const g = this._gain(0);
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(lp);
      o.start(t);
      o.stop(t + 0.2);
    });
  }

  thunder() {
    const c = this.ctx;
    if (!c) return;
    this._emit('flash');
    this._later(() => this._emit('flash'), 140);
    this._later(() => {
      const t = c.currentTime;
      const src = this._loop(this.brown);
      const lp = this._filter('lowpass', 260);
      lp.frequency.exponentialRampToValueAtTime(70, t + 5);
      const g = this._gain(0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.45, t + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 7);
      src.connect(lp).connect(g).connect(this.amb);
      src.stop(t + 7.2);
    }, rand(1200, 3000));
  }

  // ---------- music: a quiet music box under the rain ----------
  _startMusic() {
    const c = this.ctx;
    const delay = c.createDelay(1.5);
    delay.delayTime.value = 0.52;
    const fb = this._gain(0.42);
    const dlp = this._filter('lowpass', 1500);
    delay.connect(dlp);
    dlp.connect(fb).connect(delay);
    dlp.connect(this.music);
    this.musicIn = this._gain(1);
    this.musicIn.connect(this.music);
    this.musicIn.connect(delay);

    const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
    const note = () => {
      this._pluck(scale[Math.floor(Math.random() * scale.length)], rand(0.018, 0.03));
      if (Math.random() < 0.35) this._later(() => this._pluck(scale[Math.floor(Math.random() * scale.length)], 0.02), 420);
      this._later(note, rand(2400, 4600));
    };
    this._later(note, 3500);

    const chords = [
      [110, 164.8, 220, 261.6],
      [87.3, 130.8, 174.6, 220],
      [98, 146.8, 196, 247],
      [82.4, 123.5, 164.8, 196],
    ];
    let ci = 0;
    const pad = () => {
      this._pad(chords[ci++ % chords.length]);
      this._later(pad, 8000);
    };
    this._later(pad, 1500);
  }

  _pluck(freq, vol) {
    const c = this.ctx;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = this._gain(0);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    o.connect(g).connect(this._filter('lowpass', 1400)).connect(this.musicIn);
    o.start(t);
    o.stop(t + 2.7);
  }

  _pad(freqs) {
    const c = this.ctx;
    const t = c.currentTime;
    const out = this._gain(0);
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(1, t + 3);
    out.gain.linearRampToValueAtTime(0, t + 8.5);
    out.connect(this._filter('lowpass', 800)).connect(this.musicIn);
    freqs.forEach((f) => {
      const o = c.createOscillator();
      o.frequency.value = f;
      o.connect(this._gain(0.012)).connect(out);
      o.start(t);
      o.stop(t + 9);
    });
  }

  // ---------- sound effects ----------
  step() {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    const s = c.createBufferSource();
    s.buffer = this.brown;
    const g = this._gain(0);
    g.gain.setValueAtTime(0.09, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.connect(this._filter('lowpass', rand(380, 700))).connect(g).connect(this.sfx);
    s.start(t, Math.random() * 3);
    s.stop(t + 0.09);
  }

  splash(big = false) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    const s = c.createBufferSource();
    s.buffer = this.white;
    const g = this._gain(0);
    const peak = big ? 0.16 : 0.09;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.35 : 0.2));
    s.connect(this._filter('bandpass', rand(1500, 2300), 0.6)).connect(g).connect(this.sfx);
    s.start(t, Math.random() * 3);
    s.stop(t + 0.4);
    for (let i = 0; i < (big ? 3 : 1); i++) {
      const o = c.createOscillator();
      const tt = t + 0.04 + i * 0.07;
      o.frequency.setValueAtTime(rand(600, 900), tt);
      o.frequency.exponentialRampToValueAtTime(280, tt + 0.09);
      const og = this._gain(0);
      og.gain.setValueAtTime(0.035, tt);
      og.gain.exponentialRampToValueAtTime(0.0001, tt + 0.1);
      o.connect(og).connect(this.sfx);
      o.start(tt);
      o.stop(tt + 0.12);
    }
  }

  blip(pitch = 1) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.value = 420 * pitch * rand(0.95, 1.08);
    const g = this._gain(0);
    g.gain.setValueAtTime(0.035, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + 0.08);
  }

  chime() {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    [880, 1320].forEach((f, i) => {
      const o = c.createOscillator();
      o.frequency.value = f;
      const g = this._gain(0);
      g.gain.setValueAtTime(0, t + i * 0.09);
      g.gain.linearRampToValueAtTime(0.04, t + i * 0.09 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.7);
      o.connect(g).connect(this.sfx);
      o.start(t + i * 0.09);
      o.stop(t + i * 0.09 + 0.8);
    });
  }

  ribbit() {
    const c = this.ctx;
    if (!c) return;
    [0, 0.14].forEach((dt) => {
      const t = c.currentTime + dt;
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(170, t);
      o.frequency.exponentialRampToValueAtTime(105, t + 0.09);
      const g = this._gain(0);
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.connect(this._filter('lowpass', 520)).connect(g).connect(this.sfx);
      o.start(t);
      o.stop(t + 0.12);
    });
  }

  mew() {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.frequency.setValueAtTime(600, t);
    o.frequency.linearRampToValueAtTime(930, t + 0.12);
    o.frequency.linearRampToValueAtTime(520, t + 0.34);
    const g = this._gain(0);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.022, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + 0.4);
  }
}
