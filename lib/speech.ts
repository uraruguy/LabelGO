import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

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
  barking: 'dog',
  infant: 'baby',
  crying: 'baby',
  bell: 'doorbell',
  buzzer: 'doorbell',
  again: 'repeat',
  next: 'skip',
  continue: 'resume',
  end: 'stop',
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

/** Speak a prompt aloud. Resolves when speech finishes (or immediately on failure). */
export function speak(text: string, onDone?: () => void) {
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

export function stopSpeaking() {
  try {
    void Speech.stop();
  } catch {
    // ignore
  }
}

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

/**
 * Returns true when live browser speech recognition is available.
 * Native (iOS/Android) has no bundled recognizer here, so we report false and
 * the session falls back to the reliable demo voice sequence.
 */
export function speechRecognitionAvailable(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

/**
 * Start listening for a single command on web. Calls onCommand with the first
 * recognized vocabulary word, or onUnavailable if recognition can't run.
 * Returns a stop function.
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
