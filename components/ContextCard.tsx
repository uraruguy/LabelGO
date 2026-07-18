import { Pressable, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Clock, Train, Footprints, Mic, type LucideIcon } from 'lucide-react-native';
import type { AppContext, ContextId } from '@/lib/types';
import { colors } from '@/lib/theme';
import { selectionTick } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const ICONS: Record<ContextId, LucideIcon> = {
  waiting: Clock,
  commuting: Train,
  walking: Footprints,
  quiet: Mic,
};

interface ContextCardProps {
  context: AppContext;
  selected: boolean;
  onSelect: (id: ContextId) => void;
}

export function ContextCard({ context, selected, onSelect }: ContextCardProps) {
  const scale = useSharedValue(1);
  const Icon = ICONS[context.id];

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: withTiming(selected ? colors.purple : colors.hairline, { duration: 180 }),
    backgroundColor: withTiming(selected ? colors.purpleSoft : colors.card, { duration: 180 }),
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
          <View
            className={cn(
              'h-11 w-11 items-center justify-center rounded-2xl',
              selected ? 'bg-purple' : 'bg-canvas',
            )}
          >
            <Icon size={22} color={selected ? colors.white : colors.purple} />
          </View>
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
        <Text className="text-purple mt-2 text-xs font-semibold">{context.estimate}</Text>
      </Animated.View>
    </Pressable>
  );
}
