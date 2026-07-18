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
  /** Optional deterministic seed so each clip renders a distinct, stable shape. */
  seed?: number;
}

function seededHeights(count: number, seed: number): number[] {
  const out: number[] = [];
  let s = seed || 1;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    out.push(0.35 + (s / 233280) * 0.65);
  }
  return out;
}

function Bar({
  index,
  active,
  barClassName,
  height,
  peak,
}: {
  index: number;
  active: boolean;
  barClassName: string;
  height: number;
  peak: number;
}) {
  const value = useSharedValue(0.3);

  useEffect(() => {
    if (active) {
      value.value = withDelay(
        index * 90,
        withRepeat(
          withTiming(peak, {
            duration: 480 + (index % 4) * 120,
            easing: Easing.inOut(Easing.quad),
          }),
          -1,
          true,
        ),
      );
    } else {
      value.value = withTiming(0.3, { duration: 250 });
    }
  }, [active, index, value, peak]);

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
  seed,
}: WaveformProps) {
  const ids = useMemo(
    () => Array.from({ length: bars }, () => Math.random().toString(36).slice(2)),
    [bars],
  );
  const peaks = useMemo(
    () => (seed === undefined ? ids.map(() => 1) : seededHeights(bars, seed)),
    [bars, seed, ids],
  );
  return (
    <View className="flex-row items-center gap-1.5" style={{ height }}>
      {ids.map((id, i) => (
        <Bar
          key={id}
          index={i}
          active={active}
          barClassName={barClassName}
          height={height}
          peak={peaks[i]}
        />
      ))}
    </View>
  );
}
