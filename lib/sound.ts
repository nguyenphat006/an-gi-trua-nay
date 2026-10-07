/**
 * Synthesized sound effects via the Web Audio API — no audio assets needed.
 *
 * Browsers only allow audio after a user gesture, so call `unlockAudio()` from
 * any click/tap handler (the squishy Button does this automatically). Every
 * effect is a no-op on the server, when muted, or when the context is locked.
 */

type Wave = OscillatorType;

const MUTE_KEY = "lunchbox:muted";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let noiseBuffer: AudioBuffer | null = null;

if (typeof window !== "undefined") {
  try {
    muted = window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    /* storage blocked — default to unmuted */
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.55;
    // Gentle compressor keeps stacked effects (rattle + drumroll) from clipping.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
  }
  return ctx;
}

/** Ready-to-play context + output node, or null when we must stay silent. */
function out(): { ac: AudioContext; dest: GainNode } | null {
  if (muted) return null;
  const ac = getCtx();
  if (!ac || !master || ac.state !== "running") return null;
  return { ac, dest: master };
}

function getNoise(ac: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const len = ac.sampleRate;
  noiseBuffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

interface ToneOpts {
  freq: number;
  to?: number;
  type?: Wave;
  start?: number;
  duration: number;
  volume?: number;
  attack?: number;
}

function tone({ freq, to, type = "sine", start = 0, duration, volume = 0.4, attack = 0.005 }: ToneOpts) {
  const o = out();
  if (!o) return;
  const { ac, dest } = o;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(dest);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise({
  start = 0,
  duration,
  volume = 0.3,
  filter = 1800,
  q = 1,
  type = "bandpass" as BiquadFilterType,
}: {
  start?: number;
  duration: number;
  volume?: number;
  filter?: number;
  q?: number;
  type?: BiquadFilterType;
}) {
  const o = out();
  if (!o) return;
  const { ac, dest } = o;
  const t0 = ac.currentTime + start;
  const src = ac.createBufferSource();
  src.buffer = getNoise(ac);
  const bq = ac.createBiquadFilter();
  bq.type = type;
  bq.frequency.value = filter;
  bq.Q.value = q;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(bq).connect(gain).connect(dest);
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + duration + 0.02);
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function unlockAudio() {
  const ac = getCtx();
  if (ac && ac.state === "suspended") void ac.resume();
}

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export const sfx = {
  /** Bubbly "bloop" — adding a capsule, opening things. */
  pop(pitch = 1) {
    tone({ freq: 380 * pitch, to: 900 * pitch, type: "sine", duration: 0.12, volume: 0.45 });
    tone({ freq: 900 * pitch, to: 1400 * pitch, type: "triangle", start: 0.03, duration: 0.07, volume: 0.12 });
  },

  /** Soft tactile tap for buttons. */
  click() {
    tone({ freq: 620, to: 420, type: "triangle", duration: 0.06, volume: 0.22 });
  },

  /** Plastic capsule clack; intensity 0..1 scales loudness & brightness. */
  clack(intensity = 0.5) {
    const i = Math.min(1, Math.max(0.05, intensity));
    noise({ duration: 0.035 + i * 0.03, volume: 0.08 + i * 0.22, filter: 2200 + Math.random() * 2400, q: 6 });
    tone({ freq: 1200 + Math.random() * 900, type: "square", duration: 0.025, volume: 0.03 + i * 0.05 });
  },

  /** Short descending "boing" for removing things. */
  boing() {
    tone({ freq: 520, to: 160, type: "sine", duration: 0.28, volume: 0.35 });
  },

  /** Cheerful two-note chime when someone joins. */
  join() {
    tone({ freq: 784, type: "sine", duration: 0.14, volume: 0.25 });
    tone({ freq: 1175, type: "sine", start: 0.09, duration: 0.2, volume: 0.25 });
  },

  /** Airy sweep — capsule dropping through the chute. */
  whoosh() {
    noise({ duration: 0.45, volume: 0.25, filter: 900, q: 0.8, type: "lowpass" });
    tone({ freq: 900, to: 220, type: "sine", duration: 0.4, volume: 0.15 });
  },

  /** Rolling rumble for the capsule rolling to center stage. */
  roll(duration = 0.8) {
    const steps = Math.floor(duration / 0.06);
    for (let s = 0; s < steps; s++) {
      noise({ start: s * 0.06, duration: 0.05, volume: 0.06, filter: 400 + Math.random() * 200, q: 2 });
    }
  },

  /** Big confetti pop. */
  burst() {
    noise({ duration: 0.35, volume: 0.5, filter: 1400, q: 0.6 });
    tone({ freq: 160, to: 60, type: "sine", duration: 0.3, volume: 0.6 });
    tone({ freq: 600, to: 1800, type: "triangle", start: 0.02, duration: 0.18, volume: 0.2 });
  },

  /**
   * Snare-ish drumroll that accelerates for `seconds`, then a cymbal crash.
   * Returns a stop function (e.g. if the component unmounts mid-roll).
   */
  drumroll(seconds = 5): () => void {
    const o = out();
    if (!o) return () => {};
    const { ac, dest } = o;
    const bus = ac.createGain();
    bus.gain.value = 1;
    bus.connect(dest);
    const t0 = ac.currentTime;
    let t = 0;
    while (t < seconds) {
      const progress = t / seconds;
      const interval = 0.11 - progress * 0.075; // accelerate 110ms → 35ms
      const src = ac.createBufferSource();
      src.buffer = getNoise(ac);
      const bq = ac.createBiquadFilter();
      bq.type = "bandpass";
      bq.frequency.value = 1800 + progress * 1200;
      bq.Q.value = 0.9;
      const g = ac.createGain();
      const vol = 0.07 + progress * 0.2;
      g.gain.setValueAtTime(vol, t0 + t);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + t + 0.06);
      src.connect(bq).connect(g).connect(bus);
      src.start(t0 + t, Math.random() * 0.5);
      src.stop(t0 + t + 0.08);
      // Low tom underneath every 4th hit for body.
      if (Math.round(t / interval) % 4 === 0) {
        const osc = ac.createOscillator();
        const og = ac.createGain();
        osc.frequency.setValueAtTime(140, t0 + t);
        osc.frequency.exponentialRampToValueAtTime(70, t0 + t + 0.12);
        og.gain.setValueAtTime(0.15 + progress * 0.2, t0 + t);
        og.gain.exponentialRampToValueAtTime(0.0001, t0 + t + 0.14);
        osc.connect(og).connect(bus);
        osc.start(t0 + t);
        osc.stop(t0 + t + 0.16);
      }
      t += interval;
    }
    return () => {
      bus.gain.cancelScheduledValues(ac.currentTime);
      bus.gain.setValueAtTime(bus.gain.value, ac.currentTime);
      bus.gain.linearRampToValueAtTime(0, ac.currentTime + 0.05);
      window.setTimeout(() => bus.disconnect(), 200);
    };
  },

  /** Triumphant brass-ish fanfare: "ta-ta-ta-TAAA!" */
  fanfare() {
    const notes: Array<[number, number, number]> = [
      // [freq, start, duration]
      [523.25, 0, 0.12],
      [523.25, 0.14, 0.12],
      [523.25, 0.28, 0.12],
      [698.46, 0.42, 0.5],
      [622.25, 0.95, 0.16],
      [698.46, 1.12, 0.16],
      [880, 1.3, 0.9],
    ];
    for (const [f, s, d] of notes) {
      tone({ freq: f, type: "sawtooth", start: s, duration: d, volume: 0.12, attack: 0.02 });
      tone({ freq: f * 2, type: "square", start: s, duration: d * 0.9, volume: 0.035, attack: 0.02 });
      tone({ freq: f / 2, type: "triangle", start: s, duration: d, volume: 0.15, attack: 0.01 });
    }
    // Sparkle on top
    [1568, 2093, 2637, 3136].forEach((f, i) => tone({ freq: f, type: "sine", start: 1.3 + i * 0.07, duration: 0.3, volume: 0.06 }));
  },

  /** Tiny ascending sparkle — copy success etc. */
  sparkle() {
    [1046, 1318, 1568].forEach((f, i) => tone({ freq: f, type: "sine", start: i * 0.06, duration: 0.16, volume: 0.18 }));
  },
};
