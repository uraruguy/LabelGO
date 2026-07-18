import { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { ScrollView } from 'react-native-gesture-handler';
import {
  Clock,
  Train,
  Footprints,
  Mic,
  Coins,
  Headphones,
  Dog,
  Baby,
  Bell,
} from 'lucide-react-native';
import { Button } from 'heroui-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { LogoMark } from '@/components/LogoMark';
import { Waveform } from '@/components/Waveform';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { tapMedium } from '@/lib/haptics';

interface Page {
  key: string;
  headline: string;
  body: string;
  visual: React.ReactNode;
}

function PageOneVisual() {
  return (
    <View className="h-56 w-full items-center justify-center">
      <View className="bg-card border-hairline h-40 w-24 items-center justify-center rounded-3xl border">
        <LogoMark size={40} />
      </View>
      <View className="bg-card border-hairline absolute top-6 left-6 flex-row items-center gap-1 rounded-2xl border px-3 py-2">
        <Coins size={16} color={colors.reward} />
        <Text className="text-ink text-xs font-bold">+4</Text>
      </View>
      <View className="bg-purple absolute top-10 right-8 rounded-2xl px-3 py-2">
        <Text className="text-xs font-bold text-white">Dog?</Text>
      </View>
      <View className="bg-mint absolute right-10 bottom-8 rounded-2xl px-3 py-2">
        <Text className="text-xs font-bold text-white">+8 credits</Text>
      </View>
      <View className="bg-card border-hairline absolute bottom-10 left-8 flex-row items-center gap-1 rounded-2xl border px-3 py-2">
        <Coins size={16} color={colors.reward} />
        <Text className="text-ink text-xs font-bold">+6</Text>
      </View>
    </View>
  );
}

function ContextBubble({
  icon: Icon,
  positionClassName,
}: {
  icon: typeof Clock;
  positionClassName: string;
}) {
  return (
    <View
      className={`bg-card border-hairline absolute h-14 w-14 items-center justify-center rounded-2xl border ${positionClassName}`}
    >
      <Icon size={24} color={colors.purple} />
    </View>
  );
}

function PageTwoVisual() {
  return (
    <View className="h-56 w-full items-center justify-center">
      <View className="bg-purple-soft h-24 w-24 items-center justify-center rounded-full">
        <LogoMark size={44} />
      </View>
      <ContextBubble icon={Clock} positionClassName="left-10 top-4" />
      <ContextBubble icon={Train} positionClassName="right-10 top-4" />
      <ContextBubble icon={Footprints} positionClassName="left-10 bottom-4" />
      <ContextBubble icon={Mic} positionClassName="right-10 bottom-4" />
    </View>
  );
}

function VoiceChip({ icon: Icon, label }: { icon: typeof Dog; label: string }) {
  return (
    <View className="bg-card border-hairline flex-row items-center gap-1.5 rounded-full border px-3 py-2">
      <Icon size={16} color={colors.purple} />
      <Text className="text-ink text-xs font-semibold">{label}</Text>
    </View>
  );
}

function PageThreeVisual() {
  return (
    <View className="h-56 w-full items-center justify-center gap-5">
      <View className="bg-purple h-20 w-20 items-center justify-center rounded-full">
        <Headphones size={34} color={colors.white} />
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

const PAGES: Page[] = [
  {
    key: 'moments',
    headline: 'Turn spare moments into useful data.',
    body: 'Complete quick AI-training tasks whenever you have a few minutes.',
    visual: <PageOneVisual />,
  },
  {
    key: 'context',
    headline: 'Tasks that fit your context.',
    body: 'Waiting, commuting, walking, or sitting somewhere quiet — LabelGo finds the right task for the moment.',
    visual: <PageTwoVisual />,
  },
  {
    key: 'handsfree',
    headline: 'Label without touching your phone.',
    body: 'Hear short audio clips through your headphones and answer using your voice.',
    visual: <PageThreeVisual />,
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const isLast = index === PAGES.length - 1;

  const finish = () => {
    tapMedium();
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    if (page !== index) setIndex(page);
  };

  return (
    <SafeAreaView className="bg-canvas flex-1">
      <View className="flex-1">
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {PAGES.map((page) => (
            <View
              key={page.key}
              style={{ width }}
              className="flex-1 items-center justify-center px-8"
            >
              {page.visual}
              <Animated.View entering={FadeInDown.duration(400)} className="mt-10 items-center">
                <Text className="text-ink text-center text-[26px] leading-8 font-extrabold">
                  {page.headline}
                </Text>
                <Text className="text-ink-soft mt-3 text-center text-base leading-6">
                  {page.body}
                </Text>
              </Animated.View>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className="px-6 pb-2">
        <View className="mb-6 flex-row justify-center gap-2">
          {PAGES.map((page, i) => (
            <View
              key={page.key}
              className={`h-2 rounded-full ${i === index ? 'bg-purple w-6' : 'bg-hairline w-2'}`}
            />
          ))}
        </View>

        <Button variant="primary" size="lg" onPress={next} className="rounded-2xl">
          <Button.Label>{isLast ? 'Start demo' : 'Continue'}</Button.Label>
        </Button>

        <Pressable onPress={finish} className="mt-2 py-3">
          <Text className="text-ink-soft text-center text-sm font-medium">Skip introduction</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
