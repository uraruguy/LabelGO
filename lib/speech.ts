import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { playClip, stopClip } from './audio';
import type { RecordingResult } from './recorder';

/** Constrained vocabulary the hands-free session understands. */
export type VoiceCommand =
  | 'dog'
  | 'baby'
  | 'doorbell'
  | 'repeat'
  | 'skip'
  | 'pause'
  | 'resume'
  | 'stop';

const VOCAB: VoiceCommand[] = [
  'dog',
  'baby',
  'doorbell',
  'repeat',
  'skip',
  'pause',
  'resume',
  'stop',
];

/** A few loose synonyms so natural speech still maps to the vocabulary. */
const SYNONYMS: Record<string, VoiceCommand> = {
  puppy: 'dog',
  puppies: 'dog',
  barking: 'dog',
  bark: 'dog',
  infant: 'baby',
  crying: 'baby',
  cry: 'baby',
  bell: 'doorbell',
  buzzer: 'doorbell',
  ring: 'doorbell',
  chime: 'doorbell',
  again: 'repeat',
  replay: 'repeat',
  next: 'skip',
  continue: 'resume',
  resumed: 'resume',
  end: 'stop',
  finish: 'stop',
};

/** Map an arbitrary transcript to a known command, or null if none match. */
export function matchCommand(transcript: string): VoiceCommand | null {
  const words = transcript
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  for (const word of words) {
    const direct = VOCAB.find((v) => v === word);
    if (direct) return direct;
    if (SYNONYMS[word]) return SYNONYMS[word];
  }
  return null;
}

// --- ElevenLabs configuration -------------------------------------------------

const ELEVENLABS_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY ?? '';
// "Rachel" — a clear, natural default voice available on every account.
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const TTS_MODEL = 'eleven_turbo_v2_5';
const STT_MODEL = 'scribe_v1';

export function elevenLabsAvailable(): boolean {
  return ELEVENLABS_KEY.length > 0;
}

// --- Text to speech -----------------------------------------------------------

/**
 * Speak a prompt aloud. Uses ElevenLabs for a premium voice when a key is
 * present, and falls back to the on-device voice (expo-speech) otherwise or on
 * any failure. Resolves via onDone when speech finishes.
 */
export function speak(text: string, onDone?: () => void) {
  if (elevenLabsAvailable()) {
    void speakWithElevenLabs(text, onDone);
    return;
  }
  speakWithDevice(text, onDone);
}

function speakWithDevice(text: string, onDone?: () => void) {
  try {
    void Speech.stop();
    Speech.speak(text, {
      rate: Platform.OS === 'ios' ? 0.5 : 1.0,
      pitch: 1.02,
      onDone,
      onStopped: onDone,
      onError: onDone,
    });
  } catch {
    onDone?.();
  }
}

async function speakWithElevenLabs(text: string, onDone?: () => void) {
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: TTS_MODEL,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );
    if (!res.ok) throw new Error(`tts ${res.status}`);
    const blob = await res.blob();
    const url = await blobToPlayableSource(blob);
    await playClip(url, onDone);
  } catch {
    // Any failure (network, quota, unsupported) → device voice so the demo
    // never goes silent.
    speakWithDevice(text, onDone);
  }
}

export function stopSpeaking() {
  try {
    void Speech.stop();
  } catch {
    // ignore
  }
  stopClip();
}

/**
 * Convert a fetched audio Blob into a source string expo-audio can play.
 * On web an object URL works directly; on native we inline as a data URI.
 */
async function blobToPlayableSource(blob: Blob): Promise<string> {
  if (Platform.OS === 'web' && typeof URL !== 'undefined' && URL.createObjectURL) {
    return URL.createObjectURL(blob);
  }
  const base64 = await blobToBase64(blob);
  return `data:audio/mpeg;base64,${base64}`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('error', () => reject(new Error('read failed')));
    reader.addEventListener('loadend', () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    });
    reader.readAsDataURL(blob);
  });
}

// --- Speech to text (ElevenLabs Scribe) --------------------------------------

/**
 * Transcribe a recorded utterance with ElevenLabs Scribe. Returns the raw
 * transcript text, or null if transcription is unavailable / failed.
 */
export async function transcribe(recording: RecordingResult): Promise<string | null> {
  if (!elevenLabsAvailable()) return null;
  try {
    const form = new FormData();
    form.append('model_id', STT_MODEL);
    form.append('language_code', 'en');
    form.append('tag_audio_events', 'false');

    if (recording.platform === 'web') {
      const blob = recording.data;
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      form.append('file', blob, `answer.${ext}`);
    } else {
      // React Native FormData accepts { uri, name, type }.
      form.append('file', {
        uri: recording.data,
        name: 'answer.m4a',
        type: recording.mimeType,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-type-assertion
      } as any);
    }

    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text/convert', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_KEY },
      body: form,
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (json && typeof json === 'object' && 'text' in json) {
      const record: Record<string, unknown> = json;
      const text = record.text;
      return typeof text === 'string' ? text.trim() : null;
    }
    return null;
  } catch {
    return null;
  }
}

// --- Web-only live recognition (kept for the mic-test convenience) -----------

interface WebSpeechRecognitionEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface WebRecognition {
  start: () => void;
  stop: () => void;
  abort: () => void;
  addEventListener(type: 'result', listener: (event: WebSpeechRecognitionEvent) => void): void;
  addEventListener(type: 'error' | 'end', listener: () => void): void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => WebRecognition;
    webkitSpeechRecognition?: new () => WebRecognition;
  }
}

/** True when the browser's built-in recognizer is available (web only). */
export function speechRecognitionAvailable(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

/**
 * Start listening for a single command via the browser recognizer. Falls back
 * to onUnavailable when it can't run. Returns a stop function.
 */
export function listenOnce(
  onTranscript: (text: string) => void,
  onCommand: (cmd: VoiceCommand) => void,
  onUnavailable: () => void,
): () => void {
  if (!speechRecognitionAvailable()) {
    onUnavailable();
    return () => {};
  }
  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Ctor) {
    onUnavailable();
    return () => {};
  }
  let stopped = false;
  const rec = new Ctor();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = 'en-US';
  rec.addEventListener('result', (event) => {
    let text = '';
    for (let i = 0; i < event.results.length; i++) {
      text += event.results[i][0].transcript;
    }
    onTranscript(text.trim());
    const cmd = matchCommand(text);
    if (cmd && !stopped) {
      stopped = true;
      onCommand(cmd);
      try {
        rec.stop();
      } catch {
        // ignore
      }
    }
  });
  rec.addEventListener('error', () => {
    if (!stopped) {
      stopped = true;
      onUnavailable();
    }
  });
  try {
    rec.start();
  } catch {
    onUnavailable();
    return () => {};
  }
  return () => {
    stopped = true;
    try {
      rec.abort();
    } catch {
      // ignore
    }
  };
}
