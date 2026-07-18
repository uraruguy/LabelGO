import { useEffect, useRef, useState } from 'react';
import { Text, type TextProps } from 'react-native';

interface AnimatedNumberProps extends TextProps {
  value: number;
  duration?: number;
}

/**
 * Counts up/down to `value` over `duration` ms for satisfying credit changes.
 */
export function AnimatedNumber({ value, duration = 800, ...rest }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    const start = displayRef.current;
    const diff = value - start;
    if (diff === 0) return undefined;
    const startedAt = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <Text {...rest}>{display.toLocaleString()}</Text>;
}
