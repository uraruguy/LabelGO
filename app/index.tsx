import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { LogoMark } from '@/components/LogoMark';
import { useAppStore } from '@/lib/store';

export default function SplashScreen() {
  const hydrated = useAppStore((s) => s.hydrated);
  const onboarded = useAppStore((s) => s.onboarded);

  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withSequence(
      withSpring(1.08, { damping: 10, stiffness: 120 }),
      withSpring(1, { damping: 14 }),
    );
  }, [logoOpacity, logoScale]);

  useEffect(() => {
    if (!hydrated) return undefined;
    const timer = setTimeout(() => {
      router.replace(onboarded ? '/(tabs)' : '/onboarding');
    }, 1700);
    return () => clearTimeout(timer);
  }, [hydrated, onboarded]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <LinearGradient
      colors={['#6C63FF', '#625BF6', '#4B44D6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 items-center justify-center"
    >
      <Animated.View style={logoStyle} className="items-center">
        <View className="rounded-[28px] bg-white/15 p-5">
          <LogoMark size={72} />
        </View>
        <Text className="mt-5 text-4xl font-extrabold tracking-tight text-white">LabelGo</Text>
      </Animated.View>

      <Animated.Text
        entering={FadeIn.delay(700).duration(700).easing(Easing.out(Easing.quad))}
        className="absolute bottom-24 px-12 text-center text-base font-medium text-white/85"
      >
        Train AI in the moments between everything else.
      </Animated.Text>
    </LinearGradient>
  );
}
