import { View } from 'react-native';
import { Svg, Path, Circle } from '@/components/ui/primitives/Svg';
import { colors } from '@/lib/theme';

interface LogoMarkProps {
  size?: number;
}

/**
 * LabelGo mark: a rounded tag/label with a forward "go" spark.
 */
export function LogoMark({ size = 64 }: LogoMarkProps) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Path
          d="M8 20a10 10 0 0 1 10-10h18.7a8 8 0 0 1 5.66 2.34l13.3 13.3a8 8 0 0 1 0 11.31l-16.7 16.7a8 8 0 0 1-11.31 0l-13.3-13.3A8 8 0 0 1 12 36.68V20Z"
          fill={colors.purple}
        />
        <Circle cx="24" cy="24" r="5" fill={colors.white} />
        <Path
          d="M34 40l6-6m0 0l-4-.5m4 .5l.5 4"
          stroke={colors.mint}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
