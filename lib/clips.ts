import type { SoundAnswer } from './types';

/**
 * Sound cues are synthesized locally as WAV data URIs — no network, no remote
 * codec risk. This guarantees identical playback on web, iOS (incl. Expo Go),
 * and Android. Each category has a distinct, easily distinguishable motif that
 * is synthesized with noise + formants + realistic envelopes so it sounds far
 * closer to a true recording than a plain sine tone:
 *   - dog:      gruff, breathy repeated "woof" bursts (formant + noise)
 *   - baby:     raspy, wailing vibrato cry (harmonic-rich + shimmer)
 *   - doorbell: struck metallic two-tone "ding-dong" with long decay
 *
 * The generated cue IS the ground truth for a task: whatever plays is correct.
 */

const SAMPLE_RATE = 22050;

/** Base64-encode a byte array without relying on Buffer (works on web + native). */
function bytesToBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + chars[(n >> 6) & 63] + chars[n & 63];
  }
  if (i < bytes.length) {
    const rem = bytes.length - i;
    if (rem === 1) {
      const n = bytes[i] << 16;
      out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + '==';
    } else {
      const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
      out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + chars[(n >> 6) & 63] + '=';
    }
  }
  return out;
}

/** Wrap mono 16-bit PCM samples (Float32 in [-1,1]) into a WAV data URI. */
function samplesToWavDataUri(samples: Float32Array): string {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buffer = new Uint8Array(44 + dataSize);
  const view = new DataView(buffer.buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  return `data:audio/wav;base64,${bytesToBase64(buffer)}`;
}

/** Normalize a buffer to a target peak to avoid clipping while staying loud. */
function normalize(out: Float32Array, target = 0.92): Float32Array {
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) {
    const scale = target / peak;
    for (let i = 0; i < out.length; i++) out[i] *= scale;
  }
  return out;
}

/** Deterministic pseudo-random in [-1,1] so cues are identical every run. */
function makeNoise(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return (s / 0xffffffff) * 2 - 1;
  };
}

/** One-pole low-pass smoothing state helper (mutable via closure). */
function lowpass(alpha: number): (x: number) => number {
  let y = 0;
  return (x: number) => {
    y += alpha * (x - y);
    return y;
  };
}

/**
 * A dog "woof": a glottal buzz (rich sawtooth-like harmonics) shaped by two
 * vocal formants, mixed with breathy filtered noise, and wrapped in a fast
 * attack / gruff decay envelope. Pitch glides down like a real bark.
 */
function makeDog(): string {
  const total = Math.floor(1.5 * SAMPLE_RATE);
  const out = new Float32Array(total);
  const noise = makeNoise(1337);
  const barks = [
    { start: 0.0, dur: 0.26, f0: 300, glide: 150 },
    { start: 0.46, dur: 0.24, f0: 320, glide: 160 },
    { start: 1.02, dur: 0.3, f0: 280, glide: 130 },
  ];
  for (const b of barks) {
    const startIdx = Math.floor(b.start * SAMPLE_RATE);
    const len = Math.floor(b.dur * SAMPLE_RATE);
    let phase = 0;
    const nLp = lowpass(0.25);
    for (let i = 0; i < len; i++) {
      const idx = startIdx + i;
      if (idx >= total) break;
      const p = i / len;
      // Fast attack, gruff exponential-ish decay.
      const env = Math.min(1, p * 12) * Math.pow(1 - p, 1.4);
      const f0 = b.f0 + (b.glide - b.f0) * p;
      phase += (2 * Math.PI * f0) / SAMPLE_RATE;
      // Rich glottal buzz: sum of harmonics with 1/h rolloff (sawtooth-like).
      let buzz = 0;
      for (let h = 1; h <= 8; h++) buzz += Math.sin(phase * h) / h;
      // Two crude formants emphasize growl (~500Hz, ~1500Hz) via detuned partials.
      const formant = 0.6 * Math.sin(phase * 1.7) + 0.4 * Math.sin(phase * 5.1);
      // Breathy filtered noise.
      const breath = nLp(noise()) * 0.5;
      out[idx] += (buzz * 0.8 + formant * 0.3 + breath * 0.4) * env * 0.9;
    }
  }
  return samplesToWavDataUri(normalize(out));
}

/**
 * A baby cry: high harmonic-rich tone with expressive pitch contour, fast
 * vibrato shimmer, and a touch of noise "rasp" for the vocal-fold texture.
 * Two sobbing phrases with a breath gap between.
 */
function makeBaby(): string {
  const total = Math.floor(1.7 * SAMPLE_RATE);
  const out = new Float32Array(total);
  const noise = makeNoise(90210);
  const phrases = [
    { start: 0.0, dur: 0.78, f0: 550, peak: 780 },
    { start: 0.92, dur: 0.7, f0: 600, peak: 720 },
  ];
  for (const ph of phrases) {
    const startIdx = Math.floor(ph.start * SAMPLE_RATE);
    const len = Math.floor(ph.dur * SAMPLE_RATE);
    let phase = 0;
    const nLp = lowpass(0.4);
    for (let i = 0; i < len; i++) {
      const idx = startIdx + i;
      if (idx >= total) break;
      const p = i / len;
      // Arc up then down — the classic "waaah" contour.
      const contour = Math.sin(Math.PI * p);
      const env = Math.min(1, p * 8) * Math.pow(1 - p, 0.7);
      // Fast vibrato/shimmer for a wavering cry.
      const vib = 1 + Math.sin((2 * Math.PI * 9 * i) / SAMPLE_RATE) * 0.04;
      const f0 = (ph.f0 + (ph.peak - ph.f0) * contour) * vib;
      phase += (2 * Math.PI * f0) / SAMPLE_RATE;
      // Harmonic-rich voice with strong upper partials for a piercing timbre.
      const voice =
        Math.sin(phase) +
        0.5 * Math.sin(phase * 2) +
        0.32 * Math.sin(phase * 3) +
        0.18 * Math.sin(phase * 4);
      const rasp = nLp(noise()) * 0.12 * contour;
      out[idx] += (voice + rasp) * env * 0.5;
    }
  }
  return samplesToWavDataUri(normalize(out));
}

/**
 * A doorbell: two struck metallic notes (ding then dong). Each note is an
 * inharmonic partial stack (bell-like) with a sharp attack and long ringing
 * exponential decay, rather than a flat sine.
 */
function makeDoorbell(): string {
  const total = Math.floor(2.0 * SAMPLE_RATE);
  const out = new Float32Array(total);
  // Bell partials relative to fundamental (slightly inharmonic for metal timbre).
  const partials = [
    { mult: 1.0, amp: 1.0 },
    { mult: 2.01, amp: 0.6 },
    { mult: 2.99, amp: 0.4 },
    { mult: 4.18, amp: 0.25 },
    { mult: 5.43, amp: 0.15 },
  ];
  const notes = [
    { start: 0.0, dur: 1.1, f0: 660, decay: 3.2 }, // ding
    { start: 0.55, dur: 1.4, f0: 520, decay: 2.6 }, // dong
  ];
  for (const n of notes) {
    const startIdx = Math.floor(n.start * SAMPLE_RATE);
    const len = Math.floor(n.dur * SAMPLE_RATE);
    for (let i = 0; i < len; i++) {
      const idx = startIdx + i;
      if (idx >= total) break;
      const t = i / SAMPLE_RATE;
      const p = i / len;
      // Sharp attack, long exponential ring.
      const env = Math.min(1, p * 40) * Math.exp(-n.decay * t);
      let sample = 0;
      for (const par of partials) {
        sample += par.amp * Math.sin(2 * Math.PI * n.f0 * par.mult * t);
      }
      out[idx] += sample * env * 0.5;
    }
  }
  return samplesToWavDataUri(normalize(out));
}

// Generate once at module load and reuse.
export const SOUND_CLIPS: Record<SoundAnswer, string[]> = {
  dog: [makeDog()],
  baby: [makeBaby()],
  doorbell: [makeDoorbell()],
};

/** Resolve the playable clip source for a given answer/clip index. */
export function clipUrlFor(answer: SoundAnswer, index = 0): string {
  const list = SOUND_CLIPS[answer];
  return list[index % list.length];
}
