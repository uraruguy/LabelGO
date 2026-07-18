import { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInRight, FadeOut } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Play, Pause, SkipForward } from 'lucide-react-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { ProgressBar } from '@/components/ProgressBar';
import { AnswerButton } from '@/components/AnswerButton';
import { Waveform } from '@/components/Waveform';
import { EVERYDAY_SOUNDS_TASKS, PROJECTS } from '@/lib/mockData';
import type { SoundAnswer } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { openComplete } from '@/lib/navigation';
import { notifySuccess, tapLight } from '@/lib/haptics';

const CREDITS_PER_TASK = 4;

export default function TapSession() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const project = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];
  const completeSession = useAppStore((s) => s.completeSession);

  const tasks = EVERYDAY_SOUNDS_TASKS;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [picked, setPicked] = useState<SoundAnswer | null>(null);
  const correctRef = useRef(0);
  const answeredRef = useRef(0);

  const task = tasks[index];
  const answers: SoundAnswer[] = ['dog', 'baby', 'doorbell'];

  const finish = useMemo(
    () => (correct: number, answered: number) => {
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
    },
    [completeSession, project.id],
  );

  const advance = () => {
    if (index + 1 >= tasks.length) {
      finish(correctRef.current, answeredRef.current);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setPlaying(true);
  };

  const onPick = (answer: SoundAnswer) => {
    if (picked) return;
    setPicked(answer);
    answeredRef.current += 1;
    if (answer === task.answer) {
      correctRef.current += 1;
      notifySuccess();
    }
    setTimeout(advance, 650);
  };

  const onSkip = () => {
    tapLight();
    if (picked) return;
    advance();
  };

  const answeredCount = answeredRef.current;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="bg-canvas flex-1">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-5 py-2">
        <Pressable
          onPress={() => router.back()}
          className="bg-card border-hairline h-10 w-10 items-center justify-center rounded-full border"
        >
          <X size={20} color={colors.ink} />
        </Pressable>
        <View className="flex-1">
          <ProgressBar progress={index / tasks.length} />
        </View>
        <Text className="text-ink-soft text-sm font-semibold">
          {index + 1}/{tasks.length}
        </Text>
      </View>

      <View className="flex-1 px-6">
        <Text className="text-ink-soft mt-4 text-center text-sm font-semibold tracking-wide uppercase">
          {project.name}
        </Text>
        <Text className="text-ink mt-2 text-center text-2xl font-extrabold">
          What sound is this?
        </Text>

        {/* Player */}
        <View className="flex-1 items-center justify-center">
          <Animated.View
            key={task.id}
            entering={FadeInRight.duration(280)}
            exiting={FadeOut.duration(150)}
            className="bg-card border-hairline w-full items-center rounded-[28px] border px-6 py-10"
          >
            <Pressable
              onPress={() => {
                tapLight();
                setPlaying((p) => !p);
              }}
              className="bg-purple h-20 w-20 items-center justify-center rounded-full"
            >
              {playing ? (
                <Pause size={30} color={colors.white} fill={colors.white} />
              ) : (
                <Play size={30} color={colors.white} fill={colors.white} />
              )}
            </Pressable>
            <View className="mt-6">
              <Waveform active={playing} bars={11} height={44} />
            </View>
            <Text className="text-ink-soft mt-5 text-center text-xs">{task.clipLabel}</Text>
          </Animated.View>
        </View>

        {/* Answers */}
        <View className="flex-row gap-3">
          {answers.map((answer) => (
            <AnswerButton
              key={answer}
              answer={answer}
              state={
                picked === null
                  ? 'idle'
                  : answer === task.answer
                    ? 'correct'
                    : answer === picked
                      ? 'wrong'
                      : 'idle'
              }
              disabled={picked !== null}
              onPress={onPick}
            />
          ))}
        </View>

        <Pressable
          onPress={onSkip}
          className="mt-4 mb-2 flex-row items-center justify-center gap-1.5 py-2"
        >
          <SkipForward size={16} color={colors.inkSoft} />
          <Text className="text-ink-soft text-sm font-medium">Skip if unclear</Text>
        </Pressable>
        <Text className="text-ink-soft mb-2 text-center text-[11px]">
          {answeredCount} answered · +{correctRef.current * CREDITS_PER_TASK} credits this session
        </Text>
      </View>
    </SafeAreaView>
  );
}
