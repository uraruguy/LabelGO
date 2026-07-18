import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * Single-player audio controller. Guarantees only one clip plays at a time
 * (no overlap) by reusing one AudioPlayer and replacing its source.
 * Works on web and native via expo-audio.
 */
let player: AudioPlayer | null = null;
let endListenerRemove: (() => void) | null = null;
let audioModeReady = false;

async function ensureAudioMode() {
  if (audioModeReady) return;
  try {
    // Allow playback even if the device is on silent (iOS) — important for a
    // listening demo. Failure here is non-fatal.
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch {
    // ignore — playback still works with default mode
  }
  audioModeReady = true;
}

function getPlayer(source: string): AudioPlayer {
  if (!player) {
    player = createAudioPlayer(source, { updateInterval: 200 });
  } else {
    player.replace(source);
  }
  // Ensure audible output — a replaced/fresh source can reset volume on some
  // platforms, and iOS otherwise honors the hardware silent switch.
  try {
    player.volume = 1;
    player.muted = false;
  } catch {
    // ignore — not all platforms expose these before load
  }
  return player;
}

/**
 * Play a clip from the start. Resolves when the clip finishes naturally, is
 * stopped, or errors — so callers can chain the next phase reliably.
 */
export async function playClip(source: string, onDone?: () => void): Promise<void> {
  await ensureAudioMode();
  let settled = false;
  const done = () => {
    if (settled) return;
    settled = true;
    endListenerRemove?.();
    endListenerRemove = null;
    onDone?.();
  };

  try {
    const p = getPlayer(source);
    // Reset any previous end listener before wiring a new one.
    endListenerRemove?.();
    const sub = p.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) done();
    });
    endListenerRemove = () => sub.remove();
    try {
      await p.seekTo(0);
    } catch {
      // seeking on a fresh/replaced source can no-op — safe to ignore
    }
    p.play();
  } catch {
    done();
  }
}

/** Stop and reset the current clip. Safe to call anytime. */
export function stopClip() {
  endListenerRemove?.();
  endListenerRemove = null;
  try {
    player?.pause();
    void player?.seekTo(0);
  } catch {
    // ignore
  }
}

export function pauseClip() {
  try {
    player?.pause();
  } catch {
    // ignore
  }
}

/** Fully release the player. Call on unmount to free native resources. */
export function releaseAudio() {
  endListenerRemove?.();
  endListenerRemove = null;
  try {
    player?.remove();
  } catch {
    // ignore
  }
  player = null;
}
