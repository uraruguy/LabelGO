import { useEffect, useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useAnimatedRef,
  useSharedValue,
  interpolate,
  Extrapolation,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeInDown,
  FadeOut,
  type SharedValue,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import {
  Clock,
  TramFront,
  Footprints,
  Mic,
  Coins,
  Headphones,
  Dog,
  Baby,
  Bell,
  type LucideIcon,
} from 'lucide-react-native';
import { Button } from 'heroui-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { LogoMark } from '@/components/LogoMark';
import { Waveform } from '@/components/Waveform';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { tapMedium } from '@/lib/haptics';

/** A small element that drifts up and down to add life without distraction. */
function Floating({
  children,
  className,
  delay = 0,
  distance = 6,
}: {
  children: React.ReactNode;
  className: string;
  delay?: number;
  distance?: number;
}) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-distance, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withTiming(distance, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, [y, delay, distance]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View className={`absolute ${className}`} style={style}>
      {children}
    </Animated.View>
  );
}

function PageOneVisual() {
  return (
    <View className="h-60 w-full items-center justify-center">
      <View className="bg-card border-hairline h-44 w-28 items-center justify-center rounded-[28px] border shadow-sm">
        <LogoMark size={44} />
        <View className="bg-purple-soft mt-3 h-1.5 w-12 rounded-full" />
        <View className="bg-hairline mt-1.5 h-1.5 w-8 rounded-full" />
      </View>
      <Floating className="top-4 left-6" delay={0}>
        <View className="bg-card border-hairline flex-row items-center gap-1 rounded-2xl border px-3 py-2 shadow-sm">
          <Coins size={16} color={colors.reward} />
          <Text className="text-ink text-xs font-bold">+4</Text>
        </View>
      </Floating>
      <Floating className="top-10 right-6" delay={300}>
        <View className="bg-purple rounded-2xl px-3 py-2 shadow-sm">
          <Text className="text-xs font-bold text-white">Dog?</Text>
        </View>
      </Floating>
      <Floating className="right-8 bottom-8" delay={600}>
        <View className="bg-mint rounded-2xl px-3 py-2 shadow-sm">
          <Text className="text-xs font-bold text-white">+8 credits</Text>
        </View>
      </Floating>
      <Floating className="bottom-10 left-8" delay={900}>
        <View className="bg-card border-hairline flex-row items-center gap-1 rounded-2xl border px-3 py-2 shadow-sm">
          <Coins size={16} color={colors.reward} />
          <Text className="text-ink text-xs font-bold">+6</Text>
        </View>
      </Floating>
    </View>
  );
}

function OrbitBubble({
  icon: Icon,
  className,
  delay,
}: {
  icon: LucideIcon;
  className: string;
  delay: number;
}) {
  return (
    <Floating className={className} delay={delay} distance={5}>
      <View className="bg-card border-hairline h-14 w-14 items-center justify-center rounded-2xl border shadow-sm">
        <Icon size={24} color={colors.purple} />
      </View>
    </Floating>
  );
}

function PageTwoVisual() {
  return (
    <View className="h-60 w-full items-center justify-center">
      <View className="bg-purple-soft h-24 w-24 items-center justify-center rounded-full">
        <LogoMark size={44} />
      </View>
      <OrbitBubble icon={Clock} className="top-4 left-10" delay={0} />
      <OrbitBubble icon={TramFront} className="top-4 right-10" delay={250} />
      <OrbitBubble icon={Footprints} className="bottom-4 left-10" delay={500} />
      <OrbitBubble icon={Mic} className="right-10 bottom-4" delay={750} />
    </View>
  );
}

function PulseRing() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.6, { duration: 1600, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1600, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
  }, [scale, opacity]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return <Animated.View className="bg-purple absolute h-20 w-20 rounded-full" style={style} />;
}

function VoiceChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <View className="bg-card border-hairline flex-row items-center gap-1.5 rounded-full border px-3 py-2 shadow-sm">
      <Icon size={16} color={colors.purple} />
      <Text className="text-ink text-xs font-semibold">{label}</Text>
    </View>
  );
}

function PageThreeVisual() {
  return (
    <View className="h-60 w-full items-center justify-center gap-5">
      <View className="items-center justify-center">
        <PulseRing />
        <View className="bg-purple h-20 w-20 items-center justify-center rounded-full">
          <Headphones size={34} color={colors.white} />
        </View>
      </View>
      <Waveform active bars={9} height={40} />
      <View className="flex-row gap-2">
        <VoiceChip icon={Dog} label="Dog" />
        <VoiceChip icon={Baby} label="Baby" />
        <VoiceChip icon={Bell} label="Doorbell" />
      </View>
    </View>
  );
}

interface Page {
  key: string;
  headline: string;
  body: string;
  Visual: () => React.ReactNode;
}

const PAGES: Page[] = [
  {
    key: 'moments',
    headline: 'Turn spare moments into useful data.',
    body: 'Complete quick AI-training tasks whenever you have a few minutes.',
    Visual: PageOneVisual,
  },
  {
    key: 'context',
    headline: 'Tasks that fit your context.',
    body: 'Waiting, commuting, walking, or sitting somewhere quiet — LabelGo finds the right task for the moment.',
    Visual: PageTwoVisual,
  },
  {
    key: 'handsfree',
    headline: 'Label without touching your phone.',
    body: 'Hear short audio clips through your headphones and answer using your voice.',
    Visual: PageThreeVisual,
  },
];

function ParallaxPage({
  page,
  index,
  scrollX,
  width,
}: {
  page: Page;
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const visualStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          scrollX.value,
          inputRange,
          [width * 0.3, 0, -width * 0.3],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          scrollX.value,
          inputRange,
          [width * 0.12, 0, -width * 0.12],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
  }));

  const { Visual } = page;

  return (
    <View style={{ width }} className="flex-1 items-center justify-center px-8">
      <Animated.View style={visualStyle}>
        <Visual />
      </Animated.View>
      <Animated.View style={textStyle} className="mt-10 items-center">
        <Text className="text-ink text-center text-[26px] leading-8 font-extrabold">
          {page.headline}
        </Text>
        <Text className="text-ink-soft mt-3 text-center text-base leading-6">{page.body}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({
  index,
  scrollX,
  width,
}: {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}) {
  const style = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], Extrapolation.CLAMP),
    };
  });
  return <Animated.View className="bg-purple h-2 rounded-full" style={style} />;
}

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const [leaving, setLeaving] = useState(false);

  const isLast = index === PAGES.length - 1;

  const finish = () => {
    tapMedium();
    setLeaving(true);
    setOnboarded(true);
    // Let the fade-out play briefly before swapping to Home.
    setTimeout(() => router.replace('/(tabs)'), 220);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const onMomentumEnd = (offsetX: number) => {
    const page = Math.round(offsetX / width);
    if (page !== index) setIndex(page);
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    setIndex(index + 1);
  };

  return (
    <SafeAreaView className="bg-canvas flex-1">
      <Animated.View
        className="flex-1"
        exiting={FadeOut.duration(200)}
        style={{ opacity: leaving ? 0.4 : 1 }}
      >
        <View className="flex-1">
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => onMomentumEnd(e.nativeEvent.contentOffset.x)}
          >
            {PAGES.map((page, i) => (
              <ParallaxPage key={page.key} page={page} index={i} scrollX={scrollX} width={width} />
            ))}
          </Animated.ScrollView>
        </View>

        <View className="px-6 pb-2">
          <View className="mb-6 flex-row justify-center gap-2">
            {PAGES.map((page, i) => (
              <Dot key={page.key} index={i} scrollX={scrollX} width={width} />
            ))}
          </View>

          <Animated.View key={isLast ? 'last' : 'next'} entering={FadeInDown.duration(260)}>
            <Button variant="primary" size="lg" onPress={next} className="rounded-2xl">
              <Button.Label>{isLast ? 'Start demo' : 'Continue'}</Button.Label>
            </Button>
          </Animated.View>

          <Pressable onPress={finish} className="mt-2 py-3">
            <Text className="text-ink-soft text-center text-sm font-medium">Skip introduction</Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
