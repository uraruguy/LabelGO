import { Platform } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, type AudioRecorder } from 'expo-audio';

/**
 * Cross-platform short-utterance recorder used to capture a voice answer for
 * speech-to-text. Web uses the browser MediaRecorder; native uses expo-audio.
 *
 * The result is a Blob (web) or file URI (native) plus a mime type, ready to
 * upload to a transcription API.
 */
/**
 * Result of a completed recording. Discriminated on `platform` so callers get
 * a `Blob` on web and a file URI `string` on native without any type casts.
 */
export type RecordingResult =
  | { platform: 'web'; data: Blob; mimeType: string }
  | { platform: 'native'; data: string; mimeType: string };

export interface MicPermission {
  granted: boolean;
}

export async function requestMicPermission(): Promise<MicPermission> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return { granted: false };
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release immediately; we only needed to confirm access.
      stream.getTracks().forEach((t) => t.stop());
      return { granted: true };
    } catch {
      return { granted: false };
    }
  }
  try {
    const res = await AudioModule.requestRecordingPermissionsAsync();
    return { granted: res.granted };
  } catch {
    return { granted: false };
  }
}

/** Web implementation: records with MediaRecorder and returns a Blob. */
class WebRecorder {
  private media: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
      this.media = mime
        ? new MediaRecorder(this.stream, { mimeType: mime })
        : new MediaRecorder(this.stream);
      this.chunks = [];
      this.media.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      });
      this.media.start();
      return true;
    } catch {
      this.cleanup();
      return false;
    }
  }

  stop(): Promise<RecordingResult | null> {
    return new Promise((resolve) => {
      const media = this.media;
      if (!media) {
        resolve(null);
        return;
      }
      media.addEventListener('stop', () => {
        const type = media.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type });
        this.cleanup();
        resolve({ data: blob, mimeType: type, platform: 'web' });
      });
      try {
        media.stop();
      } catch {
        this.cleanup();
        resolve(null);
      }
    });
  }

  cleanup() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.media = null;
    this.chunks = [];
  }
}

class NativeRecorder {
  private recorder: AudioRecorder | null = null;

  async start(): Promise<boolean> {
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      const recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
      this.recorder = recorder;
      await recorder.prepareToRecordAsync();
      recorder.record();
      return true;
    } catch {
      this.recorder = null;
      return false;
    }
  }

  async stop(): Promise<RecordingResult | null> {
    const recorder = this.recorder;
    this.recorder = null;
    if (!recorder) return null;
    try {
      await recorder.stop();
      const uri = recorder.uri;
      // Restore playback-only mode after recording so clips route to the main
      // speaker at full volume (recording routes to the earpiece on iOS).
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        interruptionMode: 'mixWithOthers',
      });
      if (!uri) return null;
      return { data: uri, mimeType: 'audio/m4a', platform: 'native' };
    } catch {
      return null;
    }
  }
}

/** A live recording session. Call stop() to end and retrieve the audio. */
export interface ActiveRecording {
  stop: () => Promise<RecordingResult | null>;
}

/**
 * Begin recording. Returns an ActiveRecording, or null if the mic could not
 * start (permission denied / unsupported). Never throws.
 */
export async function startRecording(): Promise<ActiveRecording | null> {
  if (Platform.OS === 'web') {
    const rec = new WebRecorder();
    const ok = await rec.start();
    if (!ok) return null;
    return { stop: () => rec.stop() };
  }
  const rec = new NativeRecorder();
  const ok = await rec.start();
  if (!ok) return null;
  return { stop: () => rec.stop() };
}
