import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** 0..1 */
  progress: number;
  className?: string;
  fillClassName?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  className,
  fillClassName = 'bg-purple',
  height = 8,
}: ProgressBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(1, progress)), { duration: 500 });
  }, [progress, width]);

  const style = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      className={cn('bg-hairline w-full overflow-hidden rounded-full', className)}
      style={{ height }}
    >
      <Animated.View className={cn('h-full rounded-full', fillClassName)} style={style} />
    </View>
  );
}
