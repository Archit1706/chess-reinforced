import { useUIStore } from '@/store/ui-store';

/**
 * Tiny dependency-free sound engine for board feedback.
 *
 * All sounds are synthesized with the Web Audio API (no audio assets to load),
 * and every call is gated on the user's `soundEnabled` / `volume` settings
 * from the UI store — callers can invoke `playSound` unconditionally.
 */

export type SoundKind =
  | 'move' // quiet piece move
  | 'capture' // piece captured
  | 'check' // check delivered
  | 'gameEnd' // checkmate / stalemate / draw
  | 'success' // puzzle solved
  | 'error'; // wrong puzzle move

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC: typeof AudioContext | undefined =
    window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  // Browsers suspend audio contexts created before a user gesture; sounds are
  // always triggered by a move (a gesture), so resuming here is allowed.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOptions {
  freq: number;
  /** Seconds after "now" to start. */
  delay?: number;
  /** Seconds the tone lasts. */
  duration?: number;
  type?: OscillatorType;
  /** Peak gain, before the master volume is applied. */
  peak?: number;
}

function tone(
  audio: AudioContext,
  volume: number,
  { freq, delay = 0, duration = 0.08, type = 'sine', peak = 0.9 }: ToneOptions
) {
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  // Fast attack, exponential decay — reads as a soft "thock" rather than a beep.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * volume), start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Play a board feedback sound. No-op when sound is disabled or unsupported. */
export function playSound(kind: SoundKind) {
  const { soundEnabled, volume } = useUIStore.getState();
  if (!soundEnabled || volume <= 0) return;
  const audio = getContext();
  if (!audio) return;

  switch (kind) {
    case 'move':
      tone(audio, volume, { freq: 260, type: 'triangle', duration: 0.07 });
      break;
    case 'capture':
      // Lower, harder double-hit.
      tone(audio, volume, { freq: 150, type: 'triangle', duration: 0.09, peak: 1 });
      tone(audio, volume, { freq: 110, type: 'sine', delay: 0.03, duration: 0.1, peak: 0.8 });
      break;
    case 'check':
      // Two-tone rising alert.
      tone(audio, volume, { freq: 440, type: 'triangle', duration: 0.09 });
      tone(audio, volume, { freq: 587, type: 'triangle', delay: 0.09, duration: 0.12 });
      break;
    case 'gameEnd':
      // Short descending cadence.
      tone(audio, volume, { freq: 523, type: 'triangle', duration: 0.12 });
      tone(audio, volume, { freq: 392, type: 'triangle', delay: 0.12, duration: 0.12 });
      tone(audio, volume, { freq: 330, type: 'triangle', delay: 0.24, duration: 0.2 });
      break;
    case 'success':
      // Rising major arpeggio.
      tone(audio, volume, { freq: 523, type: 'triangle', duration: 0.1 });
      tone(audio, volume, { freq: 659, type: 'triangle', delay: 0.09, duration: 0.1 });
      tone(audio, volume, { freq: 784, type: 'triangle', delay: 0.18, duration: 0.16 });
      break;
    case 'error':
      tone(audio, volume, { freq: 165, type: 'square', duration: 0.14, peak: 0.35 });
      break;
  }
}
