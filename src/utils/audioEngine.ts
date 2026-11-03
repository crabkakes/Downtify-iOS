/**
 * Real Web Audio API engine for Downtify iOS
 * Provides interactive playback with synthesized musical chords/melodies
 * and support for custom user audio files, plus real-time frequency analysis.
 */

import { Track } from '../types';

type PlaybackListener = (state: {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}) => void;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying = false;
  private currentTrack: Track | null = null;
  private currentTime = 0;
  private duration = 0;
  private timerId: number | null = null;
  private listeners: Set<PlaybackListener> = new Set();
  
  // Custom audio element for real audio files
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;

  // Synthesizer nodes
  private synthGain: GainNode | null = null;
  private scheduledOscillators: OscillatorNode[] = [];
  private stepIntervalId: number | null = null;

  constructor() {
    // WebKit / iOS Safari AudioContext gesture unlocker
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('touchend', unlockAudio);
        window.removeEventListener('click', unlockAudio);
      };
      window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
      window.addEventListener('touchend', unlockAudio, { passive: true, once: true });
      window.addEventListener('click', unlockAudio, { passive: true, once: true });
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    this.initContext();
    return this.analyser;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(32);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public subscribe(listener: PlaybackListener) {
    this.listeners.add(listener);
    listener({
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
    };
    this.listeners.forEach((fn) => fn(state));
  }

  public playTrack(track: Track, startTime = 0) {
    this.initContext();
    this.stopInternal();

    this.currentTrack = track;
    this.currentTime = startTime;
    this.duration = track.duration || 180;
    this.isPlaying = true;

    if (track.customAudioUrl) {
      this.playRealAudio(track.customAudioUrl, startTime);
    } else {
      this.startSynthesizer(track, startTime);
    }

    this.startProgressTicker();
    this.notify();
  }

  private playRealAudio(url: string, startTime: number) {
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      if (this.ctx && this.masterGain) {
        try {
          this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
          this.audioSourceNode.connect(this.masterGain);
        } catch {
          // If already connected
        }
      }
    }

    this.audioElement.src = url;
    this.audioElement.currentTime = startTime;
    this.audioElement.play().catch(() => {
      // fallback to synth if blocked
      if (this.currentTrack) {
        this.startSynthesizer(this.currentTrack, startTime);
      }
    });

    this.audioElement.onended = () => {
      this.handleEnded();
    };
  }

  private startSynthesizer(track: Track, startTime: number) {
    if (!this.ctx || !this.masterGain) return;

    this.synthGain = this.ctx.createGain();
    this.synthGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.synthGain.connect(this.masterGain);

    const cfg = track.synthConfig || {
      bpm: 118,
      rootFreq: 220, // A3
      chords: [
        [220, 261.63, 329.63], // Am
        [174.61, 220, 261.63], // F
        [261.63, 329.63, 392], // C
        [196, 246.94, 293.66], // G
      ],
      melodyNotes: [440, 493.88, 523.25, 587.33, 659.25, 783.99],
      genre: 'pop' as const,
    };

    const beatDuration = 60 / cfg.bpm; // duration of one beat in seconds
    let currentStep = Math.floor(startTime / beatDuration) % 16;

    const playStep = () => {
      if (!this.isPlaying || !this.ctx || !this.synthGain) return;
      const now = this.ctx.currentTime;
      const chordIndex = Math.floor(currentStep / 4) % cfg.chords.length;
      const chord = cfg.chords[chordIndex];

      // 1. Play warm pad/chord on beat 0 of every bar
      if (currentStep % 4 === 0) {
        chord.forEach((freq) => {
          this.playTone(freq, now, beatDuration * 3.8, 'triangle', 0.12);
        });
        // Bass note
        this.playTone(chord[0] / 2, now, beatDuration * 3.6, 'sine', 0.22);
      }

      // 2. Play subtle drum / percussion
      if (currentStep % 4 === 0) {
        // Kick
        this.playKick(now);
      } else if (currentStep % 4 === 2) {
        // Snare / clap
        this.playSnare(now);
      } else {
        // Hihat
        this.playHiHat(now);
      }

      // 3. Arpeggiated melody note
      if (currentStep % 2 === 0 || Math.random() > 0.4) {
        const noteIndex = (currentStep * 3 + chordIndex) % cfg.melodyNotes.length;
        const noteFreq = cfg.melodyNotes[noteIndex];
        this.playTone(noteFreq, now, beatDuration * 0.9, 'sine', 0.09);
      }

      currentStep = (currentStep + 1) % 16;
    };

    // First step immediate
    playStep();
    this.stepIntervalId = window.setInterval(playStep, beatDuration * 1000);
  }

  private playTone(freq: number, when: number, dur: number, type: OscillatorType, gainLevel: number) {
    if (!this.ctx || !this.synthGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);

    gain.gain.setValueAtTime(0.001, when);
    gain.gain.linearRampToValueAtTime(gainLevel, when + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    osc.connect(gain);
    gain.connect(this.synthGain);

    osc.start(when);
    osc.stop(when + dur + 0.1);
    this.scheduledOscillators.push(osc);
    if (this.scheduledOscillators.length > 50) {
      this.scheduledOscillators.splice(0, 25);
    }
  }

  private playKick(when: number) {
    if (!this.ctx || !this.synthGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, when);
    osc.frequency.exponentialRampToValueAtTime(32, when + 0.18);

    gain.gain.setValueAtTime(0.35, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.22);

    osc.connect(gain);
    gain.connect(this.synthGain);

    osc.start(when);
    osc.stop(when + 0.25);
  }

  private playSnare(when: number) {
    if (!this.ctx || !this.synthGain) return;
    // Tone component
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, when);
    osc.frequency.exponentialRampToValueAtTime(80, when + 0.1);
    oscGain.gain.setValueAtTime(0.15, when);
    oscGain.gain.exponentialRampToValueAtTime(0.01, when + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.synthGain);
    osc.start(when);
    osc.stop(when + 0.15);

    // Noise component
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, when);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, when + 0.14);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.synthGain);

    whiteNoise.start(when);
  }

  private playHiHat(when: number) {
    if (!this.ctx || !this.synthGain) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.synthGain);

    noise.start(when);
  }

  private startProgressTicker() {
    if (this.timerId) {
      window.clearInterval(this.timerId);
    }
    this.timerId = window.setInterval(() => {
      if (this.isPlaying) {
        if (this.audioElement && !this.audioElement.paused) {
          this.currentTime = this.audioElement.currentTime;
          this.duration = this.audioElement.duration || this.duration;
        } else {
          this.currentTime += 0.5;
        }

        if (this.currentTime >= this.duration) {
          this.handleEnded();
        } else {
          this.notify();
        }
      }
    }, 500);
  }

  private handleEnded() {
    this.stop();
    // Dispatch custom event for playlist auto-advance
    window.dispatchEvent(new CustomEvent('downtify:trackEnded'));
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopInternal();
    this.notify();
  }

  public resume() {
    if (this.currentTrack) {
      this.playTrack(this.currentTrack, this.currentTime);
    }
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
    if (this.isPlaying && this.currentTrack) {
      this.playTrack(this.currentTrack, this.currentTime);
    } else {
      this.notify();
    }
  }

  public setVolume(val: number) {
    this.initContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, val));
    }
  }

  public stop() {
    this.isPlaying = false;
    this.currentTime = 0;
    this.stopInternal();
    this.notify();
  }

  private stopInternal() {
    if (this.stepIntervalId) {
      clearInterval(this.stepIntervalId);
      this.stepIntervalId = null;
    }
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.scheduledOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    this.scheduledOscillators = [];
    if (this.synthGain) {
      try {
        this.synthGain.disconnect();
      } catch {
        // ignore
      }
      this.synthGain = null;
    }
  }

  public playHapticClick() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);

      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch {
      // ignore
    }
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioEngine = new AudioEngine();
