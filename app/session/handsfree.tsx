import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Headphones, Mic, Dog, Baby, Bell, type LucideIcon } from 'lucide-react-native';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { ProgressBar } from '@/components/ProgressBar';
import { Waveform } from '@/components/Waveform';
import { EVERYDAY_SOUNDS_TASKS, PROJECTS } from '@/lib/mockData';
import type { SoundAnswer } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { openComplete } from '@/lib/navigation';
import { notifySuccess } from '@/lib/haptics';

const CREDITS_PER_TASK = 4;
type Phase = 'listen' | 'respond' | 'confirm';

const RESPONSE_ICON: Record<SoundAnswer, LucideIcon> = {
  dog: Dog,
  baby: Baby,
  doorbell: Bell,
};
const RESPONSE_LABEL: Record<SoundAnswer, string> = {
  dog: 'Dog',
  baby: 'Baby',
  doorbell: 'Doorbell',
};

export default function HandsFreeSession() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const project = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];
  const completeSession = useAppStore((s) => s.completeSession);

  const tasks = EVERYDAY_SOUNDS_TASKS;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('listen');
  const [heard, setHeard] = useState<SoundAnswer | null>(null);
  const correctRef = useRef(0);
  const answeredRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const task = tasks[index];

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const finish = useCallback(() => {
    clearTimers();
    const answered = answeredRef.current;
    const correct = correctRef.current;
    const credits = correct * CREDITS_PER_TASK;
    completeSession({ projectId: project.id, answered, correct, creditsEarned: credits });
    const quality = answered > 0 ? Math.round((correct / answered) * 100) : 100;
    openComplete({
      projectId: project.id,
      answered: String(answered),
      correct: String(correct),
      credits: String(credits),
      quality: String(quality),
    });
  }, [completeSession, project.id]);

  const commit = useCallback(
    (answer: SoundAnswer) => {
      setHeard(answer);
      setPhase('confirm');
      answeredRef.current += 1;
      if (answer === task.answer) {
        correctRef.current += 1;
        notifySuccess();
      }
      const t = setTimeout(() => {
        if (index + 1 >= tasks.length) {
          finish();
          return;
        }
        setIndex((i) => i + 1);
        setPhase('listen');
        setHeard(null);
      }, 1400);
      timers.current.push(t);
    },
    [finish, index, task, tasks.length],
  );

  // Drive the hands-free loop: listen to clip -> auto "recognize" the voice answer.
  useEffect(() => {
    if (phase !== 'listen') return undefined;
    const toRespond = setTimeout(() => setPhase('respond'), 2200);
    timers.current.push(toRespond);
    return () => clearTimeout(toRespond);
  }, [phase, index]);

  useEffect(() => {
    if (phase !== 'respond') return undefined;
    // Simulate voice recognition landing on the correct answer.
    const recognize = setTimeout(() => commit(task.answer), 1600);
    timers.current.push(recognize);
    return () => clearTimeout(recognize);
  }, [phase, index, task, commit]);

  useEffect(() => () => clearTimers(), []);

  return (
    <LinearGradient
      colors={['#5B54E8', '#625BF6', '#7A73FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="flex-row items-center gap-3 px-5 py-2">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/15"
          >
            <X size={20} color={colors.white} />
          </Pressable>
          <View className="flex-1">
            <ProgressBar
              progress={index / tasks.length}
              className="bg-white/25"
              fillClassName="bg-white"
            />
          </View>
          <Text className="text-sm font-semibold text-white/90">
            {index + 1}/{tasks.length}
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <View className="flex-row items-center gap-2 rounded-full bg-white/15 px-4 py-1.5">
            <Headphones size={16} color={colors.white} />
            <Text className="text-xs font-bold text-white">HANDS-FREE MODE</Text>
          </View>

          <View className="mt-12 h-40 w-40 items-center justify-center rounded-full bg-white/10">
            <View className="h-28 w-28 items-center justify-center rounded-full bg-white/15">
              {phase === 'respond' ? (
                <Mic size={44} color={colors.white} />
              ) : (
                <Headphones size={44} color={colors.white} />
              )}
            </View>
          </View>

          <View className="mt-10 h-14 justify-center">
            <Waveform active={phase !== 'confirm'} bars={13} height={48} barClassName="bg-white" />
          </View>

          <Animated.Text
            key={phase + index}
            entering={FadeIn.duration(300)}
            className="mt-8 text-center text-2xl font-extrabold text-white"
          >
            {phase === 'listen' ? 'Listen…' : phase === 'respond' ? 'Say your answer' : 'Got it!'}
          </Animated.Text>
          <Text className="mt-2 text-center text-sm text-white/80">
            {phase === 'confirm' && heard
              ? `Recorded: ${RESPONSE_LABEL[heard]}`
              : 'Keep your phone in your pocket'}
          </Text>
        </View>

        {/* Voice options — also tappable for accessibility / silent demo */}
        <View className="px-6 pb-4">
          <Text className="mb-3 text-center text-xs font-medium text-white/70">
            Say “Dog”, “Baby”, or “Doorbell”
          </Text>
          <View className="flex-row gap-3">
            {(['dog', 'baby', 'doorbell'] as SoundAnswer[]).map((answer) => {
              const Icon = RESPONSE_ICON[answer];
              const isHeard = heard === answer;
              return (
                <Pressable
                  key={answer}
                  disabled={phase === 'confirm'}
                  onPress={() => {
                    clearTimers();
                    commit(answer);
                  }}
                  className="flex-1"
                >
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    className={`items-center gap-1.5 rounded-3xl py-4 ${
                      isHeard ? 'bg-white' : 'bg-white/15'
                    }`}
                  >
                    <Icon size={26} color={isHeard ? colors.purple : colors.white} />
                    <Text
                      className="text-sm font-bold"
                      style={{ color: isHeard ? colors.purple : colors.white }}
                    >
                      {RESPONSE_LABEL[answer]}
                    </Text>
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
