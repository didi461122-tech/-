/**
 * Web Audio API synthesizer for Bible Quiz sound effects.
 * Works offline and requires no external MP3 dependencies.
 * Includes:
 * - Button click sound (צליל לחיצה על כפתור)
 * - Correct answer chime (צליל לתשובה נכונה)
 * - Wrong answer buzzer (צליל לתשובה שגויה)
 * - Festive end-game fanfare (צליל חגיגי בסיום משחק)
 * - Sound toggle & listeners for reactive UI syncing
 */

const SOUND_MUTED_STORAGE_KEY = 'tanach_quiz_sound_muted_v1';

type MuteListener = (muted: boolean) => void;
type MusicListener = (isPlaying: boolean) => void;

class SoundController {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private listeners: Set<MuteListener> = new Set();
  private musicListeners: Set<MusicListener> = new Set();
  private millionaireAudio: HTMLAudioElement | null = null;
  private millionaireSuspenseAudio: HTMLAudioElement | null = null;
  private millionaireCorrectAudio: HTMLAudioElement | null = null;
  private millionaireWrongAudio: HTMLAudioElement | null = null;
  private isMusicPlaying: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(SOUND_MUTED_STORAGE_KEY);
        this.muted = stored === 'true';
      } catch {
        this.muted = false;
      }
    }
  }

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SOUND_MUTED_STORAGE_KEY, muted ? 'true' : 'false');
      } catch (err) {
        console.warn('Failed to store sound preference:', err);
      }
    }

    if (muted) {
      if (this.millionaireAudio) try { this.millionaireAudio.pause(); } catch {}
      if (this.millionaireSuspenseAudio) try { this.millionaireSuspenseAudio.pause(); } catch {}
      if (this.millionaireCorrectAudio) try { this.millionaireCorrectAudio.pause(); } catch {}
      if (this.millionaireWrongAudio) try { this.millionaireWrongAudio.pause(); } catch {}
    } else if (!muted && this.isMusicPlaying && this.millionaireAudio) {
      try {
        this.millionaireAudio.play().catch(() => {});
      } catch {}
    }

    this.listeners.forEach(fn => fn(muted));
    this.musicListeners.forEach(fn => fn(this.isMillionaireMusicPlaying()));
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public subscribe(listener: MuteListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeMusic(listener: MusicListener): () => void {
    this.musicListeners.add(listener);
    return () => {
      this.musicListeners.delete(listener);
    };
  }

  /**
   * Play the iconic original 'Who Wants to Be a Millionaire' theme music
   */
  public playMillionaireTheme(loop: boolean = true) {
    if (typeof window === 'undefined') return;

    try {
      if (!this.millionaireAudio) {
        this.millionaireAudio = new Audio('/audio/millionaire_theme.mp3');
        this.millionaireAudio.addEventListener('ended', () => {
          if (!this.millionaireAudio?.loop) {
            this.isMusicPlaying = false;
            this.musicListeners.forEach(fn => fn(false));
          }
        });
      }

      this.millionaireAudio.loop = loop;
      this.millionaireAudio.volume = 0.35; // optimal TV studio balance

      if (this.muted) {
        this.isMusicPlaying = true;
        this.musicListeners.forEach(fn => fn(false));
        return;
      }

      const playPromise = this.millionaireAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isMusicPlaying = true;
            this.musicListeners.forEach(fn => fn(true));
          })
          .catch(err => {
            // Autoplay policy may require first user gesture
            console.log('Audio playback pending user gesture:', err);
          });
      }
    } catch (e) {
      console.warn('Could not initialize millionaire audio:', e);
    }
  }

  public stopMillionaireTheme() {
    if (this.millionaireAudio) {
      try {
        this.millionaireAudio.pause();
        this.millionaireAudio.currentTime = 0;
      } catch {}
    }
    this.isMusicPlaying = false;
    this.musicListeners.forEach(fn => fn(false));
  }

  public toggleMillionaireMusic(): boolean {
    if (this.isMillionaireMusicPlaying()) {
      this.stopMillionaireTheme();
      return false;
    } else {
      this.playMillionaireTheme(true);
      return true;
    }
  }

  public isMillionaireMusicPlaying(): boolean {
    return this.isMusicPlaying && !this.muted && !!(this.millionaireAudio && !this.millionaireAudio.paused);
  }

  /**
   * Dramatic suspense stinger & heartbeat cue played after contestant chooses an answer ("תשובה סופית")
   * before the correct answer is revealed!
   */
  public playMillionaireSuspense() {
    if (typeof window === 'undefined') return;

    // Temporarily pause the background theme so the dramatic suspense takes center stage!
    if (this.millionaireAudio) {
      try {
        this.millionaireAudio.pause();
      } catch {}
    }

    if (this.muted) return;

    try {
      if (!this.millionaireSuspenseAudio) {
        this.millionaireSuspenseAudio = new Audio('/audio/millionaire_suspense.mp3');
      }
      this.millionaireSuspenseAudio.currentTime = 0;
      this.millionaireSuspenseAudio.volume = 0.55;
      this.millionaireSuspenseAudio.play().catch(() => {});
    } catch (e) {
      console.warn('Could not play millionaire suspense cue:', e);
    }
  }

  public stopMillionaireSuspense() {
    if (this.millionaireSuspenseAudio) {
      try {
        this.millionaireSuspenseAudio.pause();
        this.millionaireSuspenseAudio.currentTime = 0;
      } catch {}
    }
  }

  /**
   * Play the iconic Millionaire correct answer reveal cue
   */
  public playMillionaireCorrect() {
    this.stopMillionaireSuspense();
    if (this.muted) return;
    if (typeof window === 'undefined') return;

    try {
      if (!this.millionaireCorrectAudio) {
        this.millionaireCorrectAudio = new Audio('/audio/millionaire_correct.mp3');
      }
      this.millionaireCorrectAudio.currentTime = 0;
      this.millionaireCorrectAudio.volume = 0.5;
      this.millionaireCorrectAudio.play().catch(() => {
        this.playCorrect();
      });
    } catch {
      this.playCorrect();
    }
  }

  /**
   * Play the iconic Millionaire wrong answer reveal cue
   */
  public playMillionaireWrong() {
    this.stopMillionaireSuspense();
    if (this.muted) return;
    if (typeof window === 'undefined') return;

    try {
      if (!this.millionaireWrongAudio) {
        this.millionaireWrongAudio = new Audio('/audio/millionaire_wrong.mp3');
      }
      this.millionaireWrongAudio.currentTime = 0;
      this.millionaireWrongAudio.volume = 0.5;
      this.millionaireWrongAudio.play().catch(() => {
        this.playWrong();
      });
    } catch {
      this.playWrong();
    }
  }

  /**
   * Sound for button clicks and UI interactions (צליל לחיצה על כפתור)
   */
  public playClick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Gentle cheerful tap: quick frequency ramp 480Hz -> 620Hz -> 200Hz
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.05);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Sound for correct answer: triumphant uplifting harmonic chord (צליל לתשובה נכונה)
   */
  public playCorrect() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // F-major arpeggio (F5, A5, C6, F6) with warm triangle waves
    const freqs = [698.46, 880.00, 1046.50, 1396.91];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.5);
    });
  }

  /**
   * Sound for wrong answer: gentle descending buzz (צליל לתשובה שגויה)
   */
  public playWrong() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  /**
   * Grand victory fanfare at game completion (צליל חגיגי בסיום משחק)
   */
  public playFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Inspiring multi-voice fanfare sequence: C5, C5, C5, E5, G5, C6 triumphant chord
    const melody = [
      { f: 523.25, t: 0, d: 0.14 },    // C5
      { f: 523.25, t: 0.15, d: 0.14 }, // C5
      { f: 523.25, t: 0.30, d: 0.14 }, // C5
      { f: 659.25, t: 0.45, d: 0.32 }, // E5
      { f: 783.99, t: 0.80, d: 0.22 }, // G5
      { f: 1046.50, t: 1.05, d: 0.9 }, // High C6 (sustained)
    ];

    melody.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0, now + note.t);
      gain.gain.linearRampToValueAtTime(0.24, now + note.t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.t);
      osc.stop(now + note.t + note.d + 0.05);
    });

    // Harmony accompaniment chord on the finale note
    const harmonyFreqs = [523.25, 659.25, 783.99]; // C-E-G triad
    harmonyFreqs.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 1.05);

      gain.gain.setValueAtTime(0, now + 1.05);
      gain.gain.linearRampToValueAtTime(0.12, now + 1.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.95);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 1.05);
      osc.stop(now + 2.0);
    });
  }

  /**
   * Celebration fanfare alias
   */
  public playTada() {
    this.playFanfare();
  }

  /**
   * Timer tick sound (soft woodblock click)
   */
  public playTick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Lifeline sound: shimmering magical sparkle
   */
  public playLifeline() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.35);
    });
  }

  /**
   * Speak announcement in Hebrew (TTS).
   * E.g. "צדקת! כל הכבוד", "לא נכון! התשובה הנכונה היא..."
   */
  public speak(text: string) {
    if (this.muted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'he-IL';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const heVoice = voices.find(v => v.lang.toLowerCase().startsWith('he'));
      if (heVoice) {
        utterance.voice = heVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  public playTheme(loop: boolean = false) {
    this.playMillionaireTheme(loop);
  }

  public playSuspense() {
    this.playMillionaireSuspense();
  }
}

export const sound = new SoundController();
