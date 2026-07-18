import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function tapLight() {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function tapMedium() {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function notifySuccess() {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function selectionTick() {
  if (Platform.OS === 'web') return;
  void Haptics.selectionAsync();
}
