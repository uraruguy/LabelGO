import type { SoundAnswer } from './types';

/**
 * Sound cues are synthesized locally as WAV data URIs — no network, no remote
 * codec risk. This guarantees identical playback on web, iOS (incl. Expo Go),
 * and Android. Each category has a distinct, easily distinguishable motif:
 *   - dog:      low, gruff repeated "woof" pulses
 *   - baby:     high, wailing vibrato cry
 *   - doorbell: classic two-tone "ding-dong"
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

type ToneOptions = {
  freq: number;
  start: number; // seconds
  duration: number; // seconds
  gain?: number;
  vibratoHz?: number;
  vibratoDepth?: number; // fraction of freq
  glideTo?: number; // ramp frequency to this value over the tone
  harmonics?: number[]; // relative amplitudes of overtones
};

/** Additively synthesize the described tones into a buffer of `totalSec` length. */
function synth(totalSec: number, tones: ToneOptions[]): Float32Array {
  const total = Math.floor(totalSec * SAMPLE_RATE);
  const out = new Float32Array(total);

  for (const t of tones) {
    const startIdx = Math.floor(t.start * SAMPLE_RATE);
    const len = Math.floor(t.duration * SAMPLE_RATE);
    const gain = t.gain ?? 0.6;
    const harmonics = t.harmonics ?? [1];
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const idx = startIdx + i;
      if (idx >= total) break;
      const p = i / len; // 0..1 progress
      // Smooth attack/decay envelope to avoid clicks.
      const env = Math.sin(Math.PI * p);
      const glide = t.glideTo != null ? t.freq + (t.glideTo - t.freq) * p : t.freq;
      const vib =
        t.vibratoHz && t.vibratoDepth
          ? 1 + Math.sin((2 * Math.PI * t.vibratoHz * i) / SAMPLE_RATE) * t.vibratoDepth
          : 1;
      const instFreq = glide * vib;
      phase += (2 * Math.PI * instFreq) / SAMPLE_RATE;
      let sample = 0;
      for (let h = 0; h < harmonics.length; h++) {
        sample += harmonics[h] * Math.sin(phase * (h + 1));
      }
      out[idx] += sample * env * gain;
    }
  }

  // Normalize to avoid clipping from overlapping tones.
  let peak = 0;
  for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0.98) {
    const scale = 0.98 / peak;
    for (let i = 0; i < total; i++) out[i] *= scale;
  }
  return out;
}

/** Low gruff repeated pulses — a dog barking motif. */
function makeDog(): string {
  const tones: ToneOptions[] = [];
  const barkStarts = [0.0, 0.42, 0.95];
  for (const s of barkStarts) {
    tones.push({
      freq: 320,
      glideTo: 180,
      start: s,
      duration: 0.22,
      gain: 0.7,
      harmonics: [1, 0.6, 0.35, 0.2],
    });
  }
  return samplesToWavDataUri(synth(1.35, tones));
}

/** High wailing vibrato — a baby crying motif. */
function makeBaby(): string {
  const tones: ToneOptions[] = [
    {
      freq: 620,
      glideTo: 720,
      start: 0.0,
      duration: 0.7,
      gain: 0.55,
      vibratoHz: 7,
      vibratoDepth: 0.05,
      harmonics: [1, 0.4, 0.2],
    },
    {
      freq: 700,
      glideTo: 560,
      start: 0.75,
      duration: 0.6,
      gain: 0.5,
      vibratoHz: 8,
      vibratoDepth: 0.06,
      harmonics: [1, 0.4, 0.2],
    },
  ];
  return samplesToWavDataUri(synth(1.5, tones));
}

/** Two-tone chime — a classic doorbell ding-dong. */
function makeDoorbell(): string {
  const tones: ToneOptions[] = [
    { freq: 660, start: 0.0, duration: 0.5, gain: 0.6, harmonics: [1, 0.5, 0.25] }, // ding
    { freq: 520, start: 0.5, duration: 0.8, gain: 0.6, harmonics: [1, 0.5, 0.25] }, // dong
  ];
  return samplesToWavDataUri(synth(1.4, tones));
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
