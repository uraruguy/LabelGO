import { router } from 'expo-router';
import type { ContextId, SessionMode } from './types';

export function openProject(projectId: string, context?: ContextId) {
  router.push({ pathname: '/project/[id]', params: { id: projectId, context: context ?? '' } });
}

export function startSession(mode: SessionMode, projectId: string) {
  if (mode === 'handsfree') {
    router.push({ pathname: '/session/handsfree', params: { projectId } });
  } else {
    router.push({ pathname: '/session/tap', params: { projectId, mode } });
  }
}

export function openComplete(params: {
  projectId: string;
  answered: string;
  correct: string;
  credits: string;
  quality: string;
}) {
  router.replace({ pathname: '/session/complete', params });
}
