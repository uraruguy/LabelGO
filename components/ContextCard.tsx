import { useEffect } from 'react';
import { Pressable, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { Clock, TramFront, Headphones, Mic, type LucideIcon } from 'lucide-react-native';
import type { AppContext, ContextAccent, ContextId } from '@/lib/types';
import { colors } from '@/lib/theme';
import { selectionTick } from '@/lib/haptics';

const ICONS: Record<ContextId, LucideIcon> = {
  waiting: Clock,
  commuting: TramFront,
  walking: Headphones,
  quiet: Mic,
};

const ACCENTS: Record<ContextAccent, { base: string; soft: string }> = {
  purple: { base: colors.purple, soft: colors.purpleSoft },
  reward: { base: colors.reward, soft: colors.rewardSoft },
  mint: { base: colors.mint, soft: colors.mintSoft },
  danger: { base: colors.danger, soft: '#FDECEE' },
};

interface ContextCardProps {
  context: AppContext;
  selected: boolean;
  onSelect: (id: ContextId) => void;
}

export function ContextCard({ context, selected, onSelect }: ContextCardProps) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(selected ? 1 : 0);
  const wiggle = useSharedValue(0);
  const Icon = ICONS[context.id];
  const accent = ACCENTS[context.accent];

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, progress]);

  // Animate the walking headphone icon when its context is selected.
  useEffect(() => {
    if (context.id === 'walking' && selected) {
      wiggle.value = withRepeat(
        withSequence(
          withTiming(-1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
    } else {
      wiggle.value = withTiming(0, { duration: 200 });
    }
  }, [context.id, selected, wiggle]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: interpolateColor(progress.value, [0, 1], [colors.hairline, accent.base]),
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.card, accent.soft]),
  }));

  const iconWrapStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.canvas, accent.base]),
  }));

  const iconSpinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wiggle.value * 12}deg` }],
  }));

  return (
    <Pressable
      className="w-[48%]"
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 18 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12 });
      }}
      onPress={() => {
        selectionTick();
        onSelect(context.id);
      }}
    >
      <Animated.View className="rounded-[22px] border p-4" style={containerStyle}>
        <View className="mb-8 flex-row items-start justify-between">
          <Animated.View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={iconWrapStyle}
          >
            <Animated.View style={iconSpinStyle}>
              <Icon size={22} color={selected ? colors.white : accent.base} />
            </Animated.View>
          </Animated.View>
          {context.recommended ? (
            <View className="bg-mint rounded-full px-2 py-0.5">
              <Text className="text-[10px] font-bold text-white">Recommended</Text>
            </View>
          ) : null}
        </View>
        <Text className="text-ink text-base font-bold">{context.title}</Text>
        <Text className="text-ink-soft mt-0.5 text-xs" numberOfLines={1}>
          {context.subtitle}
        </Text>
        <Text className="mt-2 text-xs font-semibold" style={{ color: accent.base }}>
          {context.estimate}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
