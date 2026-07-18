import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { cn } from '@/lib/utils';

interface WaveformProps {
  active?: boolean;
  bars?: number;
  barClassName?: string;
  height?: number;
}

function Bar({
  index,
  active,
  barClassName,
  height,
}: {
  index: number;
  active: boolean;
  barClassName: string;
  height: number;
}) {
  const value = useSharedValue(0.3);

  useEffect(() => {
    if (active) {
      value.value = withDelay(
        index * 90,
        withRepeat(
          withTiming(1, { duration: 480 + (index % 4) * 120, easing: Easing.inOut(Easing.quad) }),
          -1,
          true,
        ),
      );
    } else {
      value.value = withTiming(0.3, { duration: 250 });
    }
  }, [active, index, value]);

  const style = useAnimatedStyle(() => ({
    height: height * value.value,
  }));

  return <Animated.View className={cn('w-1.5 rounded-full', barClassName)} style={style} />;
}

export function Waveform({
  active = true,
  bars = 7,
  barClassName = 'bg-purple',
  height = 48,
}: WaveformProps) {
  const ids = useMemo(
    () => Array.from({ length: bars }, () => Math.random().toString(36).slice(2)),
    [bars],
  );
  return (
    <View className="flex-row items-center gap-1.5" style={{ height }}>
      {ids.map((id, i) => (
        <Bar key={id} index={i} active={active} barClassName={barClassName} height={height} />
      ))}
    </View>
  );
}
