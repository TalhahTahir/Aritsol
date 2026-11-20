// ─────────────────────────────────────────────────────────────
// Soft UI sounds, synthesised with the Web Audio API (no audio files).
//
//  key()   a muted mechanical-keyboard tap (used while headings type in)
//  click() a quiet two-part mouse click (press + release)
//
// Everything runs through a low-pass filter and a small room reverb so the
// sounds stay warm and quiet. Sound is OFF by default; the visitor turns it
// on with the header toggle (that click also unlocks audio in the browser).
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'artisol-sound';
const MASTER_VOLUME = 0.55; // overall loudness (0–1). Lower = calmer.

let ctx = null;
let master = null;
let noise = null;
let enabled = false;
let lastKey = 0;
let lastClick = 0;
const listeners = new Set();

try {
  enabled = localStorage.getItem(STORAGE_KEY) === 'on';
} catch {
  /* storage blocked */
}

function makeNoise(c) {
  const buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function makeRoom(c, seconds = 1.1, decay = 3.2) {
  const len = Math.floor(c.sampleRate * seconds);
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return ir;
}

/** Build the audio graph on a given context (also used for offline rendering). */
export function buildGraph(c) {
  const out = c.createGain();
  out.gain.value = MASTER_VOLUME;

  const tone = c.createBiquadFilter(); // takes the edge off every sound
  tone.type = 'lowpass';
  tone.frequency.value = 4200;
  tone.Q.value = 0.4;

  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -24;
  comp.ratio.value = 3;

  const room = c.createConvolver();
  room.buffer = makeRoom(c);
  const send = c.createGain();
  send.gain.value = 0.22;

  out.connect(tone);
  tone.connect(comp);
  tone.connect(send);
  send.connect(room);
  room.connect(comp);
  comp.connect(c.destination);

  return { out, noiseBuf: makeNoise(c) };
}

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const g = buildGraph(ctx);
  master = g.out;
  noise = g.noiseBuf;
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (enabled) ctx.resume();
  });
  return ctx;
}

const rand = (a, b) => a + Math.random() * (b - a);

/** Schedule one keyboard tap on any context/graph. */
export function playKey(c, out, buf, t, level = 1) {
  // the "tick": a short band-passed noise burst
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = rand(1300, 2400);
  bp.Q.value = 1.1;
  const g = c.createGain();
  const peak = 0.16 * level * rand(0.7, 1);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + rand(0.035, 0.05));
  src.connect(bp).connect(g).connect(out);
  src.start(t, rand(0, 0.9), 0.07);

  // the "thock": a soft low body under the tick
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(rand(150, 210), t);
  osc.frequency.exponentialRampToValueAtTime(90, t + 0.06);
  const og = c.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.09 * level, t + 0.004);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  osc.connect(og).connect(out);
  osc.start(t);
  osc.stop(t + 0.08);
}

/** Schedule one mouse click (press + softer release) on any context/graph. */
export function playClick(c, out, buf, t, level = 1) {
  const part = (when, peak, freq) => {
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 2.2;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + 0.0015);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.022);
    src.connect(bp).connect(g).connect(out);
    src.start(when, rand(0, 0.9), 0.04);
  };
  part(t, 0.2 * level, rand(2600, 3200));
  part(t + rand(0.06, 0.085), 0.09 * level, rand(3300, 3900));
}

/** Schedule a soft airy sweep (used by the brand page transition). */
export function playWhoosh(c, out, buf, t, level = 1) {
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(380, t);
  bp.frequency.exponentialRampToValueAtTime(1500, t + 0.45);
  bp.frequency.exponentialRampToValueAtTime(700, t + 0.75);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.07 * level, t + 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  src.connect(bp).connect(g).connect(out);
  src.start(t);
  src.stop(t + 0.85);
}

export const sound = {
  get enabled() {
    return enabled;
  },

  setEnabled(on) {
    enabled = on;
    try {
      localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    } catch {
      /* ignore */
    }
    if (on) {
      const c = ensureContext();
      c?.resume();
      // a gentle confirmation so the visitor knows it worked
      setTimeout(() => this.click(0.8), 40);
    } else {
      ctx?.suspend();
    }
    listeners.forEach((fn) => fn(enabled));
  },

  toggle() {
    this.setEnabled(!enabled);
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /** Keyboard tap. Rate-limited so fast typing never becomes a rattle. */
  key(level = 1) {
    if (!enabled || !ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (now - lastKey < 0.045) return;
    lastKey = now;
    playKey(ctx, master, noise, now + 0.005, level);
  },

  /** Soft sweep for page transitions. */
  whoosh(level = 1) {
    if (!enabled || !ctx || ctx.state !== 'running') return;
    playWhoosh(ctx, master, noise, ctx.currentTime + 0.01, level);
  },

  /** Mouse click. Rate-limited so many reveals at once produce a single click. */
  click(level = 1) {
    if (!enabled || !ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (now - lastClick < 0.14) return;
    lastClick = now;
    playClick(ctx, master, noise, now + 0.005, level);
  },
};

// Real clicks on links and buttons get the click sound too.
if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.target.closest?.('a, button, summary, [role="tab"]')) sound.click(0.9);
    },
    { passive: true }
  );
}
