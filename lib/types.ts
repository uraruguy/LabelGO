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

export interface LabelTask {
  id: string;
  /** The correct answer for the clip (used to compute a quality score). */
  answer: SoundAnswer;
  /** A short human label of the clip for the demo. */
  clipLabel: string;
}

export interface ActivityDay {
  id: string;
  label: string;
  credits: number;
}
