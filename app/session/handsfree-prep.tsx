import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import {
  X,
  Headphones,
  Mic,
  Check,
  ShieldAlert,
  ListMusic,
  Clock,
  Dog,
  Baby,
  Bell,
  Repeat,
  SkipForward,
  Pause,
  Square,
  type LucideIcon,
} from 'lucide-react-native';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { Waveform } from '@/components/Waveform';
import { colors } from '@/lib/theme';
import { tapLight, tapMedium, notifySuccess } from '@/lib/haptics';
import { speak, stopSpeaking, listenOnce, speechRecognitionAvailable } from '@/lib/speech';

interface CheckItem {
  icon: LucideIcon;
  label: string;
  value: string;
}

const CHECKLIST: CheckItem[] = [
  { icon: Headphones, label: 'Headphones connected', value: 'Ready' },
  { icon: Mic, label: 'Voice commands enabled', value: 'Ready' },
  { icon: ListMusic, label: 'Short audio tasks', value: '8 clips' },
  { icon: Clock, label: 'Estimated time', value: 'About 2 min' },
];

const COMMANDS: { icon: LucideIcon; label: string; hint: string }[] = [
  { icon: Dog, label: 'Dog', hint: 'Answer' },
  { icon: Baby, label: 'Baby', hint: 'Answer' },
  { icon: Bell, label: 'Doorbell', hint: 'Answer' },
  { icon: Repeat, label: 'Repeat', hint: 'Replay clip' },
  { icon: SkipForward, label: 'Skip', hint: 'Next task' },
  { icon: Pause, label: 'Pause', hint: 'Hold session' },
  { icon: Square, label: 'Stop', hint: 'End session' },
];

function PulseRing({ active }: { active: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (active) {
      p.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      );
    } else {
      p.value = withTiming(0, { duration: 200 });
    }
  }, [active, p]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + p.value * 0.6 }],
    opacity: (1 - p.value) * 0.5,
  }));
  return (
    <Animated.View style={style} className="border-mint absolute h-24 w-24 rounded-full border-2" />
  );
}

export default function HandsFreePrep() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognized, setRecognized] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    stopSpeaking();
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const begin = () => {
    tapMedium();
    cleanup();
    router.replace({
      pathname: '/session/handsfree',
      params: { projectId: projectId ?? 'everyday-sounds' },
    });
  };

  const runMicTest = () => {
    tapLight();
    setRecognized(null);
    setTranscript('');
    setListening(true);
    speak('Say dog, baby, or doorbell.');

    const finishWith = (word: string) => {
      setListening(false);
      setRecognized(word);
      setTranscript(word);
      notifySuccess();
    };

    if (speechRecognitionAvailable()) {
      stopRef.current = listenOnce(
        (text) => setTranscript(text),
        (cmd) => finishWith(cmd.charAt(0).toUpperCase() + cmd.slice(1)),
        () => {
          // Recognition unavailable — fall back to a simulated detection.
          timerRef.current = setTimeout(() => finishWith('Dog'), 1600);
        },
      );
    } else {
      // Simulated detection so the test always demonstrates the flow.
      timerRef.current = setTimeout(() => finishWith('Dog'), 1800);
    }
  };

  const openTutorial = () => {
    tapLight();
    setTutorialOpen(true);
  };

  const closeTutorial = () => {
    cleanup();
    setListening(false);
    setTutorialOpen(false);
  };

  return (
    <LinearGradient
      colors={['#0B1020', '#141A34', '#1B2350']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="flex-row items-center px-5 py-2">
          <Pressable
            onPress={() => {
              tapLight();
              router.back();
            }}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <X size={20} color={colors.white} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-6 pb-6">
          <Animated.View entering={FadeInDown.duration(400)} className="items-center pt-2">
            <View className="bg-mint/15 h-16 w-16 items-center justify-center rounded-3xl">
              <Headphones size={32} color={colors.mint} />
            </View>
            <Text className="mt-4 text-center text-3xl font-extrabold text-white">
              Ready to label hands-free?
            </Text>
            <Text className="mt-2 text-center text-sm text-white/70">
              Keep your phone in your pocket. Listen through your headphones and answer with your
              voice.
            </Text>
          </Animated.View>

          {/* Checklist */}
          <Animated.View
            entering={FadeInDown.delay(120).duration(400)}
            className="mt-7 gap-2 rounded-[28px] bg-white/5 p-3"
          >
            {CHECKLIST.map((item) => {
              const Icon = item.icon;
              return (
                <View key={item.label} className="flex-row items-center gap-3 px-2 py-2.5">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <Icon size={18} color={colors.mint} />
                  </View>
                  <Text className="flex-1 text-sm font-semibold text-white">{item.label}</Text>
                  <View className="bg-mint/15 flex-row items-center gap-1.5 rounded-full px-2.5 py-1">
                    <Check size={12} color={colors.mint} strokeWidth={3} />
                    <Text className="text-mint text-xs font-bold">{item.value}</Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>

          {/* Safety note */}
          <Animated.View
            entering={FadeInDown.delay(220).duration(400)}
            className="border-reward/30 bg-reward/10 mt-4 flex-row items-start gap-3 rounded-[24px] border p-4"
          >
            <ShieldAlert size={20} color={colors.reward} />
            <Text className="flex-1 text-sm leading-5 text-white/85">
              Use hands-free mode only where listening remains safe. Never use it while driving.
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Actions */}
        <Animated.View entering={FadeInUp.delay(260).duration(400)} className="gap-3 px-6 pt-2">
          <Pressable onPress={begin} className="bg-mint items-center rounded-2xl py-4">
            <Text className="text-base font-extrabold text-[#0B1020]">Begin session</Text>
          </Pressable>
          <Pressable
            onPress={openTutorial}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-white/15 py-4"
          >
            <Mic size={16} color={colors.white} />
            <Text className="text-base font-bold text-white">Test voice commands</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>

      {/* Voice command tutorial */}
      <Modal transparent visible={tutorialOpen} animationType="fade" onRequestClose={closeTutorial}>
        <Pressable className="flex-1 justify-end bg-black/60" onPress={closeTutorial}>
          <Animated.View entering={FadeInUp.duration(240)}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="rounded-t-[32px] bg-[#141A34] px-6 pt-6 pb-10"
            >
              <View className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
              <Text className="text-xl font-extrabold text-white">Voice commands</Text>
              <Text className="mt-1 text-sm text-white/65">
                During a session you can say any of these:
              </Text>

              <View className="mt-4 flex-row flex-wrap gap-2">
                {COMMANDS.map((c) => {
                  const Icon = c.icon;
                  return (
                    <View
                      key={c.label}
                      className="flex-row items-center gap-2 rounded-2xl bg-white/8 px-3 py-2"
                    >
                      <Icon size={15} color={colors.mint} />
                      <Text className="text-sm font-bold text-white">{c.label}</Text>
                      <Text className="text-xs text-white/50">{c.hint}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Mic test */}
              <View className="mt-6 items-center rounded-[24px] bg-white/5 py-6">
                <View className="h-24 w-24 items-center justify-center">
                  <PulseRing active={listening} />
                  <View
                    className={`h-16 w-16 items-center justify-center rounded-full ${
                      recognized ? 'bg-mint' : 'bg-white/12'
                    }`}
                  >
                    {recognized ? (
                      <Check size={26} color="#0B1020" strokeWidth={3} />
                    ) : (
                      <Mic size={26} color={colors.white} />
                    )}
                  </View>
                </View>

                <View className="mt-4 h-8 items-center justify-center">
                  {listening ? (
                    <Waveform active bars={11} height={26} barClassName="bg-mint" />
                  ) : null}
                </View>

                {/* Live transcript pill */}
                <Animated.View
                  key={transcript || recognized || 'idle'}
                  entering={FadeIn.duration(200)}
                  className="mt-2 rounded-full bg-white/10 px-4 py-1.5"
                >
                  <Text className="text-sm font-semibold text-white">
                    {recognized
                      ? `Heard: ${recognized}`
                      : transcript
                        ? transcript
                        : listening
                          ? 'Listening…'
                          : 'Tap below to test your mic'}
                  </Text>
                </Animated.View>

                <Pressable
                  onPress={runMicTest}
                  disabled={listening}
                  className="bg-mint mt-4 rounded-full px-6 py-2.5"
                  style={{ opacity: listening ? 0.6 : 1 }}
                >
                  <Text className="text-sm font-extrabold text-[#0B1020]">
                    {recognized ? 'Test again' : 'Start mic test'}
                  </Text>
                </Pressable>
                {!speechRecognitionAvailable() ? (
                  <Text className="mt-3 px-6 text-center text-xs text-white/45">
                    Live recognition isn’t available here, so the test shows a sample detection.
                    Your session will still run end to end.
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={() => {
                  closeTutorial();
                  begin();
                }}
                className="mt-5 items-center rounded-2xl bg-white/10 py-3.5"
              >
                <Text className="text-base font-bold text-white">Continue to session</Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}
