import { useEffect } from 'react';
import { View, Text } from 'react-native';
import {
  createAnimatedComponent,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Svg, Circle } from '@/components/ui/primitives/Svg';
import { colors } from '@/lib/theme';

const AnimatedCircle = createAnimatedComponent(Circle);

interface QualityRingProps {
  /** 0..100 */
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function QualityRing({
  score,
  size = 120,
  strokeWidth = 12,
  label = 'Quality',
}: QualityRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(100, score)) / 100, { duration: 900 });
  }, [score, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.hairline}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.mint}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      <Text className="text-ink text-2xl font-extrabold">{Math.round(score)}%</Text>
      <Text className="text-ink-soft text-xs font-medium">{label}</Text>
    </View>
  );
}
