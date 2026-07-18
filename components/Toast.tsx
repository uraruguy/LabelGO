import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { CheckCircle2 } from 'lucide-react-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';

/** Global transient confirmation toast, driven by store.toast. */
export function Toast() {
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(clearToast, 2600);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <SafeAreaView
      edges={['top']}
      pointerEvents="none"
      className="absolute inset-x-0 top-0 items-center px-5"
    >
      <Animated.View
        entering={FadeInDown.duration(240)}
        exiting={FadeOutUp.duration(200)}
        className="bg-ink mt-2 flex-row items-center gap-2 rounded-full px-4 py-3 shadow-lg"
      >
        <CheckCircle2 size={18} color={colors.mint} />
        <Text className="text-sm font-semibold text-white">{toast}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}
