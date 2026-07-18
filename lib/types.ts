export type ContextId = 'waiting' | 'commuting' | 'walking' | 'quiet';

export type SessionMode = 'tap' | 'handsfree' | 'record';

export type ContextAccent = 'purple' | 'reward' | 'mint' | 'danger';

export interface AppContext {
  id: ContextId;
  title: string;
  subtitle: string;
  estimate: string;
  recommended?: boolean;
  mode: SessionMode;
  cta: string;
  /** Contextual accent used for the card's selected state. */
  accent: ContextAccent;
  /** Short reassurance shown under the recommended project when selected. */
  message: string;
}

export type ProjectCategory = 'audio' | 'images' | 'text' | 'collection';
export type Difficulty = 'Beginner' | 'Intermediate';

export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
  categoryLabel: string;
  prompt: string;
  taskCount: number;
  credits: number;
  difficulty: Difficulty;
  description: string;
  estMinutes: number;
  playable: boolean;
}

export type SoundAnswer = 'dog' | 'baby' | 'doorbell';

/** All possible responses a user can submit for a task. */
export type SoundResponse = SoundAnswer | 'unsure';

export interface LabelTask {
  id: string;
  /** The correct answer for the clip (used to compute a quality score). */
  answer: SoundAnswer;
  /** A short human label of the clip for the demo. */
  clipLabel: string;
  /** Clip length in seconds (3–5s for the demo). */
  duration: number;
  /** Stable seed so each clip renders a distinct-looking waveform. */
  waveformSeed: number;
  /** Hidden quality-check task — never revealed before answering. */
  isQualityCheck?: boolean;
  /** Intentionally ambiguous clip where "Unsure" is treated as a good answer. */
  ambiguous?: boolean;
}

export interface ActivityDay {
  id: string;
  label: string;
  credits: number;
}
