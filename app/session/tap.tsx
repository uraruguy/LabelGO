import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeOut,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  HelpCircle,
  Check,
  ShieldCheck,
  Coins,
} from 'lucide-react-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { ProgressBar } from '@/components/ProgressBar';
import { AnswerButton } from '@/components/AnswerButton';
import { Waveform } from '@/components/Waveform';
import { EVERYDAY_SOUNDS_TASKS, PROJECTS } from '@/lib/mockData';
import type { SoundAnswer, SoundResponse } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { openComplete } from '@/lib/navigation';
import { notifySuccess, tapLight, tapMedium } from '@/lib/haptics';
import { clipUrlFor } from '@/lib/clips';
import { playClip, stopClip, releaseAudio } from '@/lib/audio';

const CREDITS_PER_TASK = 4;

function isGoodAnswer(response: SoundResponse, task: (typeof EVERYDAY_SOUNDS_TASKS)[number]) {
  if (task.ambiguous) return response === 'unsure' || response === task.answer;
  return response === task.answer;
}

export default function TapSession() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const project = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];
  const completeSession = useAppStore((s) => s.completeSession);

  const tasks = EVERYDAY_SOUNDS_TASKS;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [picked, setPicked] = useState<SoundResponse | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const correctRef = useRef(0);
  const answeredRef = useRef(0);
  const creditsRef = useRef(0);
  const finishedRef = useRef(false);
  const [sessionCredits, setSessionCredits] = useState(0);

  const task = tasks[index];
  const answers: SoundAnswer[] = ['dog', 'baby', 'doorbell'];

  // Play the real clip for this task whenever playback is active. The sound
  // that plays is the ground truth the user must identify.
  useEffect(() => {
    if (!playing) {
      stopClip();
      return undefined;
    }
    void playClip(clipUrlFor(task.answer), () => {
      // Clip finished on its own — reflect that in the play/pause button.
      setPlaying(false);
    });
    return () => stopClip();
  }, [playing, task.answer]);

  // Release the native player when leaving the session.
  useEffect(() => () => releaseAudio(), []);

  // banner shown after an answer is recorded
  const good = picked !== null ? isGoodAnswer(picked, task) : false;

  const creditPop = useSharedValue(0);
  const creditStyle = useAnimatedStyle(() => ({
    opacity: creditPop.value,
    transform: [{ translateY: (1 - creditPop.value) * 14 }, { scale: 0.9 + creditPop.value * 0.1 }],
  }));

  const finish = useMemo(
    () => (correct: number, answered: number, credits: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
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
    if (finishedRef.current) return;
    if (index + 1 >= tasks.length) {
      finish(correctRef.current, answeredRef.current, creditsRef.current);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setPlaying(true);
    creditPop.value = 0;
  };

  const record = (response: SoundResponse) => {
    if (picked) return;
    stopClip();
    setPlaying(false);
    setPicked(response);
    answeredRef.current += 1;
    if (isGoodAnswer(response, task)) {
      correctRef.current += 1;
      creditsRef.current += CREDITS_PER_TASK;
      setSessionCredits(creditsRef.current);
      notifySuccess();
      creditPop.value = withTiming(1, { duration: 260 });
    } else {
      tapMedium();
    }
    setTimeout(advance, 720);
  };

  const onSkip = () => {
    tapLight();
    if (picked) return;
    advance();
  };

  const leaveSave = () => {
    stopClip();
    if (answeredRef.current > 0) {
      finish(correctRef.current, answeredRef.current, creditsRef.current);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView edges={['bottom']} className="bg-canvas flex-1">
      {/* Header — pt-safe clears the notch/Dynamic Island even inside the
          iOS fullScreenModal, where the safe-area top edge can report 0. */}
      <View className="pt-safe-offset-3 flex-row items-center gap-3 px-5 pb-2">
        <Pressable
          onPress={() => {
            tapLight();
            setLeaveOpen(true);
          }}
          hitSlop={10}
          className="bg-card border-hairline h-10 w-10 items-center justify-center rounded-full border"
        >
          <X size={20} color={colors.ink} />
        </Pressable>
        <View className="flex-1">
          <ProgressBar progress={(index + (picked ? 1 : 0)) / tasks.length} />
        </View>
        <View className="bg-reward-soft flex-row items-center gap-1 rounded-full px-3 py-1.5">
          <Coins size={14} color={colors.reward} />
          <Text className="text-ink text-sm font-bold">{sessionCredits}</Text>
        </View>
      </View>

      <Text className="text-ink-soft mt-1 px-6 text-center text-sm font-semibold">
        {index + 1} of {tasks.length}
      </Text>

      <View className="flex-1 px-6">
        <Text className="text-ink mt-4 text-center text-2xl font-extrabold">
          What sound do you hear?
        </Text>

        {/* Player */}
        <View className="flex-1 items-center justify-center">
          <Animated.View
            key={task.id}
            entering={FadeInRight.duration(280)}
            exiting={FadeOut.duration(150)}
            className="bg-card border-hairline w-full items-center rounded-[28px] border px-6 py-9"
          >
            {/* Category stays hidden until answered */}
            {picked !== null ? (
              <Animated.View
                entering={FadeIn.duration(200)}
                className="bg-mint-soft flex-row items-center gap-1.5 rounded-full px-3 py-1"
              >
                <Check size={13} color={colors.mint} strokeWidth={3} />
                <Text className="text-mint text-xs font-bold">
                  {task.ambiguous && picked === 'unsure' ? 'Marked unsure' : 'Answer recorded'}
                </Text>
              </Animated.View>
            ) : (
              <View className="bg-canvas rounded-full px-3 py-1">
                <Text className="text-ink-soft text-xs font-semibold">Sound hidden</Text>
              </View>
            )}

            <Pressable
              onPress={() => {
                tapLight();
                setPlaying((p) => !p);
              }}
              className="bg-purple mt-6 h-20 w-20 items-center justify-center rounded-full"
            >
              {playing ? (
                <Pause size={30} color={colors.white} fill={colors.white} />
              ) : (
                <Play size={30} color={colors.white} fill={colors.white} />
              )}
            </Pressable>

            <View className="mt-6">
              <Waveform active={playing} bars={13} height={46} seed={task.waveformSeed} />
            </View>

            <View className="mt-5 flex-row items-center gap-4">
              <Text className="text-ink-soft text-xs font-semibold">{task.duration}s clip</Text>
              <Pressable
                onPress={() => {
                  tapLight();
                  stopClip();
                  setPlaying(false);
                  // Next tick re-triggers the play effect from the clip start.
                  setTimeout(() => setPlaying(true), 30);
                }}
                className="flex-row items-center gap-1.5"
              >
                <RotateCcw size={14} color={colors.purple} />
                <Text className="text-purple text-xs font-bold">Replay</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>

        {/* Success banner + credit pop */}
        <View className="h-8 items-center justify-center">
          {picked !== null && good ? (
            <Animated.View style={creditStyle} className="flex-row items-center gap-2">
              {task.isQualityCheck ? (
                <View className="bg-purple-soft flex-row items-center gap-1.5 rounded-full px-3 py-1">
                  <ShieldCheck size={14} color={colors.purple} />
                  <Text className="text-purple text-xs font-bold">Quality check passed</Text>
                </View>
              ) : null}
              <View className="bg-reward-soft flex-row items-center gap-1 rounded-full px-3 py-1">
                <Coins size={14} color={colors.reward} />
                <Text className="text-ink text-xs font-extrabold">+{CREDITS_PER_TASK} credits</Text>
              </View>
            </Animated.View>
          ) : null}
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
                  : answer === task.answer && !(task.ambiguous && picked === 'unsure')
                    ? 'correct'
                    : answer === picked
                      ? 'wrong'
                      : 'idle'
              }
              disabled={picked !== null}
              onPress={record}
            />
          ))}
        </View>

        {/* Unsure + Skip */}
        <View className="mt-3 mb-2 flex-row gap-3">
          <Pressable
            onPress={() => record('unsure')}
            disabled={picked !== null}
            className="border-hairline flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border py-3"
            style={{ opacity: picked !== null ? 0.5 : 1 }}
          >
            <HelpCircle size={16} color={colors.inkSoft} />
            <Text className="text-ink-soft text-sm font-semibold">Unsure</Text>
          </Pressable>
          <Pressable
            onPress={onSkip}
            disabled={picked !== null}
            className="border-hairline flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border py-3"
            style={{ opacity: picked !== null ? 0.5 : 1 }}
          >
            <X size={16} color={colors.inkSoft} />
            <Text className="text-ink-soft text-sm font-semibold">Skip</Text>
          </Pressable>
        </View>
      </View>

      {/* Leave confirmation sheet */}
      <Modal
        transparent
        visible={leaveOpen}
        animationType="fade"
        onRequestClose={() => setLeaveOpen(false)}
      >
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setLeaveOpen(false)}>
          <Animated.View entering={FadeInUp.duration(220)}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="bg-card rounded-t-[28px] px-6 pt-6 pb-10"
            >
              <View className="bg-hairline mx-auto mb-5 h-1 w-10 rounded-full" />
              <Text className="text-ink text-xl font-extrabold">Leave this session?</Text>
              <Text className="text-ink-soft mt-1.5 text-sm">Your progress will be saved.</Text>
              <View className="mt-6 gap-3">
                <Pressable
                  onPress={() => {
                    tapLight();
                    setLeaveOpen(false);
                  }}
                  className="bg-purple items-center rounded-2xl py-4"
                >
                  <Text className="text-base font-bold text-white">Continue session</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    tapLight();
                    setLeaveOpen(false);
                    leaveSave();
                  }}
                  className="items-center rounded-2xl py-4"
                >
                  <Text className="text-ink-soft text-base font-semibold">Save and leave</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
