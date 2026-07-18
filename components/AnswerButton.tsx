import { Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Dog, Baby, Bell, type LucideIcon } from 'lucide-react-native';
import type { SoundAnswer, SoundResponse } from '@/lib/types';
import { colors } from '@/lib/theme';
import { selectionTick } from '@/lib/haptics';

const ICONS: Record<SoundAnswer, LucideIcon> = {
  dog: Dog,
  baby: Baby,
  doorbell: Bell,
};

const LABELS: Record<SoundAnswer, string> = {
  dog: 'Dog',
  baby: 'Baby',
  doorbell: 'Doorbell',
};

type State = 'idle' | 'correct' | 'wrong';

interface AnswerButtonProps {
  answer: SoundAnswer;
  state: State;
  disabled?: boolean;
  onPress: (answer: SoundResponse) => void;
}

export function AnswerButton({ answer, state, disabled, onPress }: AnswerButtonProps) {
  const scale = useSharedValue(1);
  const Icon = ICONS[answer];

  const bg = state === 'correct' ? colors.mint : state === 'wrong' ? colors.danger : colors.card;
  const fg = state === 'idle' ? colors.purple : colors.white;

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: withTiming(bg, { duration: 160 }),
    borderColor: withTiming(state === 'idle' ? colors.hairline : bg, { duration: 160 }),
  }));

  return (
    <Pressable
      className="flex-1"
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 18 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12 });
      }}
      onPress={() => {
        selectionTick();
        onPress(answer);
      }}
    >
      <Animated.View className="items-center gap-2 rounded-3xl border py-5" style={style}>
        <Icon size={30} color={fg} />
        <Text
          className="text-base font-bold"
          style={{ color: state === 'idle' ? colors.ink : colors.white }}
        >
          {LABELS[answer]}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
