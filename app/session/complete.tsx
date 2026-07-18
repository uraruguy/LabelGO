import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Coins, ShieldCheck } from 'lucide-react-native';
import { Button } from 'heroui-native';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { colors } from '@/lib/theme';
import { notifySuccess } from '@/lib/haptics';

export default function SessionComplete() {
  const params = useLocalSearchParams<{
    answered: string;
    correct: string;
    credits: string;
    quality: string;
  }>();

  const answered = Number(params.answered ?? 0);
  const correct = Number(params.correct ?? 0);
  const credits = Number(params.credits ?? 0);
  const quality = Number(params.quality ?? 100);

  const checkScale = useSharedValue(0);
  const ringScale = useSharedValue(0);

  useEffect(() => {
    notifySuccess();
    ringScale.value = withTiming(1, { duration: 400 });
    checkScale.value = withDelay(
      200,
      withSequence(withSpring(1.2, { damping: 8 }), withSpring(1, { damping: 12 })),
    );
  }, [checkScale, ringScale]);

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringScale.value,
  }));

  return (
    <LinearGradient
      colors={['#21D6A2', '#1BC194', '#12A87F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1 items-center justify-between px-6 py-6"
      >
        <View className="flex-1 items-center justify-center">
          <Animated.View
            style={ringStyle}
            className="h-32 w-32 items-center justify-center rounded-full bg-white/20"
          >
            <Animated.View
              style={checkStyle}
              className="h-20 w-20 items-center justify-center rounded-full bg-white"
            >
              <Check size={44} color={colors.mint} strokeWidth={3} />
            </Animated.View>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(300).duration(400)}
            className="mt-8 text-3xl font-extrabold text-white"
          >
            Session complete!
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(400).duration(400)}
            className="mt-2 text-center text-base text-white/85"
          >
            You labeled {answered} sounds and earned demo credits.
          </Animated.Text>

          <Animated.View
            entering={FadeIn.delay(500).duration(500)}
            className="mt-8 flex-row items-center gap-2 rounded-full bg-white px-6 py-3"
          >
            <Coins size={22} color={colors.reward} />
            <AnimatedNumber
              value={credits}
              className="text-2xl font-extrabold"
              style={{ color: colors.ink }}
            />
            <Text className="text-lg font-bold" style={{ color: colors.ink }}>
              credits
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(650).duration(400)}
            className="mt-6 w-full flex-row gap-3"
          >
            <View className="flex-1 items-center rounded-2xl bg-white/15 py-4">
              <ShieldCheck size={22} color={colors.white} />
              <Text className="mt-1 text-lg font-extrabold text-white">{quality}%</Text>
              <Text className="text-xs text-white/80">Quality</Text>
            </View>
            <View className="flex-1 items-center rounded-2xl bg-white/15 py-4">
              <Check size={22} color={colors.white} />
              <Text className="mt-1 text-lg font-extrabold text-white">
                {correct}/{answered}
              </Text>
              <Text className="text-xs text-white/80">Correct</Text>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(800).duration(400)} className="w-full gap-2">
          <Button
            variant="primary"
            size="lg"
            onPress={() => router.replace('/(tabs)/earnings')}
            className="rounded-2xl bg-white"
          >
            <Button.Label className="text-mint">See earnings</Button.Label>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onPress={() => router.replace('/(tabs)')}
            className="rounded-2xl"
          >
            <Button.Label className="text-white">Back to home</Button.Label>
          </Button>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}
