import type { SoundAnswer } from './types';

/**
 * Real, royalty-free sound clips streamed from Wikimedia Commons (public-domain /
 * CC-BY). MP3 transcodes are used so playback works on web, iOS, and Android.
 * expo-audio caches the stream after the first load, so subsequent plays are instant.
 *
 * These clips are the ground truth for a task: whatever plays is the correct answer.
 */
export const SOUND_CLIPS: Record<SoundAnswer, string[]> = {
  dog: [
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/5/58/Barking_of_a_dog_2.ogg/Barking_of_a_dog_2.ogg.mp3',
  ],
  baby: [
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/2b/Crying_newborn_baby.ogg/Crying_newborn_baby.ogg.mp3',
  ],
  doorbell: [
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f5/Doorbell-classic-dingdong.ogg/Doorbell-classic-dingdong.ogg.mp3',
  ],
};

/** Resolve the streaming URL for a given answer/clip index. */
export function clipUrlFor(answer: SoundAnswer, index = 0): string {
  const list = SOUND_CLIPS[answer];
  return list[index % list.length];
}
