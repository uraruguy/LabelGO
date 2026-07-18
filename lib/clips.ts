import type { AudioSource } from 'expo-audio';
import type { SoundAnswer } from './types';

/**
 * Real recordings bundled with the app. Metro resolves these static requires
 * for web, iOS, and Android, so clips are always available offline.
 */
export const SOUND_CLIPS: Record<SoundAnswer, AudioSource[]> = {
  dog: [
    require('../assets/audio/dog1.wav'),
    require('../assets/audio/dog2.wav'),
    require('../assets/audio/dog3.wav'),
    require('../assets/audio/dog4.wav'),
  ],
  baby: [
    require('../assets/audio/baby1.mp3'),
    require('../assets/audio/baby2.mp3'),
    require('../assets/audio/baby3.mp3'),
  ],
  doorbell: [
    require('../assets/audio/door1.mp3'),
    require('../assets/audio/door2.mp3'),
    require('../assets/audio/door3.mp3'),
  ],
};

const lastClipIndex: Partial<Record<SoundAnswer, number>> = {};

/**
 * Select a random bundled recording for the requested category. Consecutive
 * requests for the same category never return the same recording twice.
 */
export function clipUrlFor(answer: SoundAnswer): AudioSource {
  const clips = SOUND_CLIPS[answer];
  const previousIndex = lastClipIndex[answer];
  let index = Math.floor(Math.random() * clips.length);

  if (clips.length > 1 && index === previousIndex) {
    index = (index + 1 + Math.floor(Math.random() * (clips.length - 1))) % clips.length;
  }

  lastClipIndex[answer] = index;
  return clips[index];
}
