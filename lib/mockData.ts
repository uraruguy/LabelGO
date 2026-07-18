import type { ActivityDay, AppContext, LabelTask, Project } from './types';

export const CONTEXTS: AppContext[] = [
  {
    id: 'waiting',
    title: 'Waiting',
    subtitle: 'I can use the screen',
    estimate: '12 quick tasks',
    mode: 'tap',
    cta: 'Start quick labeling',
    accent: 'purple',
    message: 'Screen available — quick visual tasks unlocked.',
  },
  {
    id: 'commuting',
    title: 'Commuting',
    subtitle: "I'm a passenger",
    estimate: '8 easy tasks',
    mode: 'tap',
    cta: 'Start passenger mode',
    accent: 'reward',
    message: 'On the move — short, low-effort tasks lined up.',
  },
  {
    id: 'walking',
    title: 'Walking',
    subtitle: 'Hands-free with headphones',
    estimate: '8 audio tasks',
    mode: 'handsfree',
    recommended: true,
    cta: 'Start hands-free',
    accent: 'mint',
    message: 'Headphones detected — perfect for audio tasks.',
  },
  {
    id: 'quiet',
    title: 'Quiet room',
    subtitle: 'I can record clear audio',
    estimate: '5 recording tasks',
    mode: 'record',
    cta: 'Start recording',
    accent: 'danger',
    message: 'Quiet space — clear recordings score higher.',
  },
];

export const PROJECTS: Project[] = [
  {
    id: 'everyday-sounds',
    name: 'Everyday Sounds',
    category: 'audio',
    categoryLabel: 'Audio classification',
    prompt: 'Dog, baby, or doorbell',
    taskCount: 8,
    credits: 32,
    difficulty: 'Beginner',
    estMinutes: 2,
    description: 'Help an audio AI recognize common sounds.',
    playable: true,
  },
  {
    id: 'voice-quality',
    name: 'Voice Quality Check',
    category: 'audio',
    categoryLabel: 'Audio validation',
    prompt: 'Clean or noisy',
    taskCount: 10,
    credits: 40,
    difficulty: 'Beginner',
    estMinutes: 3,
    description:
      'Rate short voice clips as clean or noisy so models learn what good audio sounds like.',
    playable: false,
  },
  {
    id: 'product-match',
    name: 'Product Match',
    category: 'images',
    categoryLabel: 'Image classification',
    prompt: 'Match or no match',
    taskCount: 12,
    credits: 48,
    difficulty: 'Beginner',
    estMinutes: 4,
    description: 'Confirm whether a product photo matches its listing to improve visual search.',
    playable: false,
  },
  {
    id: 'response-ranking',
    name: 'Response Ranking',
    category: 'text',
    categoryLabel: 'AI response comparison',
    prompt: 'Choose the better answer',
    taskCount: 6,
    credits: 36,
    difficulty: 'Intermediate',
    estMinutes: 5,
    description: 'Compare two AI answers and pick the more helpful one to align future responses.',
    playable: false,
  },
];

export const EVERYDAY_SOUNDS_TASKS: LabelTask[] = [
  { id: 't1', answer: 'dog', clipLabel: 'A dog barking in a backyard' },
  { id: 't2', answer: 'baby', clipLabel: 'A baby crying softly' },
  { id: 't3', answer: 'doorbell', clipLabel: 'A doorbell chime' },
  { id: 't4', answer: 'dog', clipLabel: 'A small dog yapping' },
  { id: 't5', answer: 'doorbell', clipLabel: 'A two-tone doorbell' },
  { id: 't6', answer: 'baby', clipLabel: 'A baby fussing' },
  { id: 't7', answer: 'dog', clipLabel: 'A large dog barking' },
  { id: 't8', answer: 'doorbell', clipLabel: 'An apartment buzzer' },
];

export const INITIAL_ACTIVITY: ActivityDay[] = [
  { id: 'mon', label: 'M', credits: 14 },
  { id: 'tue', label: 'T', credits: 22 },
  { id: 'wed', label: 'W', credits: 8 },
  { id: 'thu', label: 'T', credits: 26 },
  { id: 'fri', label: 'F', credits: 12 },
  { id: 'sat', label: 'S', credits: 12 },
  { id: 'sun', label: 'S', credits: 32 },
];

export const CONTINUE_PROJECT = {
  id: 'voice-quality',
  name: 'Voice Quality Check',
  completed: 3,
  total: 10,
  credits: 28,
};

export const REWARD_OPTIONS = [
  { id: 'gift-5', title: '€5 digital gift card', cost: 100, kind: 'gift' as const },
  { id: 'gift-10', title: '€10 digital gift card', cost: 200, kind: 'gift' as const },
  { id: 'donate', title: 'Donate to a cause', cost: 100, kind: 'donate' as const },
];

export const QUALIFICATIONS = [
  { id: 'audio', name: 'Audio Basics', status: 'Passed' as const },
  { id: 'slovenian', name: 'Slovenian Language', status: 'Verified' as const },
  { id: 'image', name: 'Image Basics', status: 'Passed' as const },
  { id: 'advanced', name: 'Advanced Evaluation', status: 'Locked' as const },
];
