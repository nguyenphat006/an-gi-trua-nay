/**
 * Web Audio API Sound Synthesizer for LunchBox 3D
 * Generates all playful sounds natively in real-time without external audio asset downloads.
 */

class SoundController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lunchbox_muted');
      this.isMuted = saved === 'true';
    }
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lunchbox_muted', String(this.isMuted));
    }
    if (!this.isMuted) {
      this.playPop();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Juicy bubble pop sound (used when adding food, tapping balls, etc.)
   */
  public playPop(frequency = 550, duration = 0.09): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const now = ctx.currentTime;

      // Pitch swoop downwards for bubble pop feeling
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + duration);

      // Volume envelope
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Audio fallback fail-safe
    }
  }

  /**
   * Crisp wooden/plastic rattle tick (used when capsule balls collide)
   */
  public playTick(pitch = 900): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const now = ctx.currentTime;
      const dur = 0.035;

      osc.frequency.setValueAtTime(pitch + (Math.random() * 200 - 100), now);
      osc.frequency.exponentialRampToValueAtTime(250, now + dur);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
    } catch {}
  }

  /**
   * Fast drumroll rattle effect during the 5s lottery shuffle
   */
  public startShuffleRattle(durationMs = 4500): () => void {
    if (this.isMuted) return () => {};
    let isCancelled = false;
    let timer: NodeJS.Timeout | null = null;
    const startTime = Date.now();

    const rattleLoop = () => {
      if (isCancelled) return;
      const elapsed = Date.now() - startTime;
      if (elapsed >= durationMs) return;

      // Accelerate frequency as time progresses
      const progress = elapsed / durationMs;
      const delay = Math.max(35, 120 - progress * 80);

      this.playTick(600 + Math.random() * 500);

      timer = setTimeout(rattleLoop, delay);
    };

    rattleLoop();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }

  /**
   * Golden capsule drop whoosh sound
   */
  public playDrop(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const now = ctx.currentTime;
      const dur = 0.35;

      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + dur);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
    } catch {}
  }

  /**
   * Capsule pop open sound (chime + pop)
   */
  public playCapsulePop(): void {
    if (this.isMuted) return;
    this.playPop(750, 0.12);

    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const now = ctx.currentTime + 0.04;
      const dur = 0.4;

      osc.frequency.setValueAtTime(1046.5, now); // C6
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
    } catch {}
  }

  /**
   * Jubilant fanfare chord progression for the winning dish reveal!
   */
  public playFanfare(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      // Notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
      const notes = [
        { freq: 523.25, time: 0, dur: 0.12 },
        { freq: 659.25, time: 0.1, dur: 0.12 },
        { freq: 783.99, time: 0.2, dur: 0.15 },
        { freq: 1046.5, time: 0.35, dur: 0.7 },
        { freq: 1318.5, time: 0.42, dur: 0.65 }, // E6 sparkle
      ];

      const now = ctx.currentTime;

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.28, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch {}
  }

  /**
   * Light button click feedback
   */
  public playClick(): void {
    if (this.isMuted) return;
    this.playPop(800, 0.04);
  }
}

export const soundFx = new SoundController();
