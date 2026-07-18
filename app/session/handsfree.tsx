import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';
import {
  Wifi,
  Coins,
  Dog,
  Baby,
  Bell,
  Repeat,
  SkipForward,
  Pause,
  Play,
  Square,
  Check,
  type LucideIcon,
} from 'lucide-react-native';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { Waveform } from '@/components/Waveform';
import { EVERYDAY_SOUNDS_TASKS, PROJECTS } from '@/lib/mockData';
import type { SoundResponse } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { openComplete } from '@/lib/navigation';
import { notifySuccess } from '@/lib/haptics';
import {
  speak,
  stopSpeaking,
  matchCommand,
  elevenLabsAvailable,
  transcribe,
  type VoiceCommand,
} from '@/lib/speech';
import { clipUrlFor } from '@/lib/clips';
import { playClip, stopClip, releaseAudio } from '@/lib/audio';
import { startRecording, requestMicPermission, type ActiveRecording } from '@/lib/recorder';

const CREDITS_PER_TASK = 4;

type Phase = 'preparing' | 'playing' | 'listening' | 'detected' | 'confirmed' | 'paused';

const RESPONSE_ICON: Record<string, LucideIcon> = {
  dog: Dog,
  baby: Baby,
  doorbell: Bell,
  unsure: Repeat,
};
const RESPONSE_LABEL: Record<string, string> = {
  dog: 'Dog',
  baby: 'Baby',
  doorbell: 'Doorbell',
  unsure: 'Unsure',
};

/** State-driven copy for the center of the orb. */
const STATE_TEXT: Record<Phase, { title: string; sub: string }> = {
  preparing: { title: 'Preparing', sub: 'Getting the next clip ready' },
  playing: { title: 'Playing sound…', sub: 'Listen through your headphones' },
  listening: { title: 'Listening…', sub: 'What did you hear?' },
  detected: { title: 'Answer detected', sub: 'Locking it in' },
  confirmed: { title: 'Recorded. Next task.', sub: 'Nice work' },
  paused: { title: 'Paused', sub: 'Say “resume” or tap play' },
};

function AudioOrb({ phase }: { phase: Phase }) {
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1, false);
  }, [spin]);

  useEffect(() => {
    const listening = phase === 'listening';
    pulse.value = withRepeat(
      withTiming(1, { duration: listening ? 900 : 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [phase, pulse]);

  const outer = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }, { scale: 1 + pulse.value * 0.05 }],
    opacity: 0.35 + pulse.value * 0.25,
  }));
  const mid = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + pulse.value * 0.08 }],
    opacity: 0.5 + pulse.value * 0.3,
  }));
  const glow = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.2, 0.55]),
    transform: [{ scale: 1.1 + pulse.value * 0.15 }],
  }));

  const active = phase === 'playing' || phase === 'listening';
  const isMint = phase === 'listening' || phase === 'detected' || phase === 'confirmed';

  return (
    <View className="h-64 w-64 items-center justify-center">
      <Animated.View
        style={glow}
        className={`absolute h-64 w-64 rounded-full ${isMint ? 'bg-mint/25' : 'bg-purple/30'}`}
      />
      <Animated.View
        style={outer}
        className={`absolute h-56 w-56 rounded-full border ${
          isMint ? 'border-mint/40' : 'border-purple/40'
        }`}
      />
      <Animated.View
        style={mid}
        className={`absolute h-44 w-44 rounded-full ${isMint ? 'bg-mint/12' : 'bg-purple/15'}`}
      />
      <View className="h-32 w-32 items-center justify-center rounded-full bg-white/8">
        <Waveform
          active={active}
          bars={9}
          height={40}
          barClassName={isMint ? 'bg-mint' : 'bg-purple'}
        />
      </View>
    </View>
  );
}

function ControlButton({
  icon: Icon,
  label,
  onPress,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-1 items-center gap-1.5"
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <View className="h-14 w-14 items-center justify-center rounded-full bg-white/10">
        <Icon size={22} color={colors.white} />
      </View>
      <Text className="text-xs font-semibold text-white/70">{label}</Text>
    </Pressable>
  );
}

export default function HandsFreeSession() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const project = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];
  const completeSession = useAppStore((s) => s.completeSession);
  const demoVoiceSim = useAppStore((s) => s.demoVoiceSim);

  const tasks = EVERYDAY_SOUNDS_TASKS;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('preparing');
  const [heard, setHeard] = useState<SoundResponse | null>(null);
  const [transcript, setTranscript] = useState('');
  const [sessionCredits, setSessionCredits] = useState(0);

  const correctRef = useRef(0);
  const answeredRef = useRef(0);
  const creditsRef = useRef(0);
  const finishedRef = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const recordingRef = useRef<ActiveRecording | null>(null);
  const listenTokenRef = useRef(0);
  const phaseRef = useRef<Phase>('preparing');
  const indexRef = useRef(0);

  // Live voice needs both an ElevenLabs key and mic access. If either is
  // missing (or the user prefers the guided walkthrough), we run the reliable
  // guided sequence instead so the demo never dead-ends.
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const useSim = demoVoiceSim || !elevenLabsAvailable() || micGranted === false;

  // Request mic access once, only when the hands-free session begins.
  useEffect(() => {
    let cancelled = false;
    if (demoVoiceSim || !elevenLabsAvailable()) {
      setMicGranted(false);
      return () => {
        cancelled = true;
      };
    }
    void requestMicPermission().then((res) => {
      if (!cancelled) setMicGranted(res.granted);
    });
    return () => {
      cancelled = true;
    };
  }, [demoVoiceSim]);

  const setPhaseSafe = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const pushTimer = (t: ReturnType<typeof setTimeout>) => {
    timers.current.push(t);
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const stopListening = () => {
    // Invalidate any in-flight recording/transcription and stop the mic.
    listenTokenRef.current += 1;
    const rec = recordingRef.current;
    recordingRef.current = null;
    if (rec) void rec.stop();
  };

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimers();
    stopListening();
    stopSpeaking();
    stopClip();
    const answered = answeredRef.current;
    const correct = correctRef.current;
    const credits = creditsRef.current;
    completeSession({ projectId: project.id, answered, correct, creditsEarned: credits });
    const quality = answered > 0 ? Math.round((correct / answered) * 100) : 100;
    openComplete({
      projectId: project.id,
      answered: String(answered),
      correct: String(correct),
      credits: String(credits),
      quality: String(quality),
      voice: '1',
    });
  }, [completeSession, project.id]);

  const goNext = useCallback(() => {
    if (indexRef.current + 1 >= tasks.length) {
      finish();
      return;
    }
    indexRef.current += 1;
    setIndex(indexRef.current);
    setHeard(null);
    setTranscript('');
    setPhaseSafe('preparing');
  }, [finish, setPhaseSafe, tasks.length]);

  const commit = useCallback(
    (response: SoundResponse) => {
      if (finishedRef.current) return;
      stopListening();
      clearTimers();
      const current = tasks[indexRef.current];
      const isGood = current.ambiguous
        ? response === 'unsure' || response === current.answer
        : response === current.answer;
      setHeard(response);
      setPhaseSafe('detected');
      answeredRef.current += 1;
      if (isGood) {
        correctRef.current += 1;
        creditsRef.current += CREDITS_PER_TASK;
        setSessionCredits(creditsRef.current);
        notifySuccess();
      }
      speak(`${RESPONSE_LABEL[response]} recorded.`);
      pushTimer(
        setTimeout(() => {
          setPhaseSafe('confirmed');
          pushTimer(setTimeout(goNext, 900));
        }, 700),
      );
    },
    [goNext, setPhaseSafe, tasks],
  );

  // Ref indirection so the listen callback can reach the latest command handler
  // without creating a definition cycle between listening and control actions.
  const handleCommandRef = useRef<(cmd: VoiceCommand) => void>(() => {});

  // Guided walkthrough answer for the current task (used when live voice is
  // unavailable or the guided demo is enabled).
  const runGuidedAnswer = useCallback(
    (delayMs: number) => {
      const current = tasks[indexRef.current];
      const answer: SoundResponse = current.ambiguous ? 'unsure' : current.answer;
      pushTimer(
        setTimeout(() => {
          if (phaseRef.current !== 'listening') return;
          setTranscript(RESPONSE_LABEL[answer]);
          commit(answer);
        }, delayMs),
      );
    },
    [commit, tasks],
  );

  const startListening = useCallback(() => {
    setPhaseSafe('listening');
    speak('What did you hear?', () => {
      if (phaseRef.current !== 'listening') return;

      if (useSim) {
        // Reliable guided sequence when live voice isn't in play.
        runGuidedAnswer(1500);
        return;
      }

      // --- Live voice: record a short utterance, then transcribe with Scribe.
      const token = ++listenTokenRef.current;
      void startRecording().then((rec) => {
        if (token !== listenTokenRef.current || phaseRef.current !== 'listening') {
          void rec?.stop();
          return;
        }
        if (!rec) {
          // Mic couldn't start — fall back gracefully.
          runGuidedAnswer(600);
          return;
        }
        recordingRef.current = rec;
        setTranscript('Listening…');
        // Give the speaker a moment to answer, then transcribe.
        pushTimer(
          setTimeout(() => {
            if (token !== listenTokenRef.current || phaseRef.current !== 'listening') return;
            const active = recordingRef.current;
            recordingRef.current = null;
            if (!active) return;
            setPhaseSafe('detected');
            setTranscript('Recognizing…');
            void active.stop().then(async (result) => {
              if (token !== listenTokenRef.current || finishedRef.current) return;
              const text = result ? await transcribe(result) : null;
              if (token !== listenTokenRef.current || finishedRef.current) return;
              const cmd = text ? matchCommand(text) : null;
              if (text) setTranscript(text);
              if (cmd) {
                handleCommandRef.current(cmd);
              } else {
                // Couldn't confidently recognize — let the user retry this clip.
                setPhaseSafe('listening');
                setTranscript("Didn't catch that — say it again");
                pushTimer(
                  setTimeout(() => {
                    if (token === listenTokenRef.current && phaseRef.current === 'listening') {
                      startListening();
                    }
                  }, 900),
                );
              }
            });
          }, 2600),
        );
      });
    });
  }, [runGuidedAnswer, setPhaseSafe, useSim]);

  const playTaskClip = useCallback(() => {
    setPhaseSafe('playing');
    const current = tasks[indexRef.current];
    // Play the real sound clip; begin listening once it finishes.
    void playClip(clipUrlFor(current.answer), () => {
      if (phaseRef.current === 'playing') startListening();
    });
  }, [setPhaseSafe, startListening, tasks]);

  const replayClip = useCallback(() => {
    stopListening();
    clearTimers();
    stopClip();
    setTranscript('');
    setHeard(null);
    playTaskClip();
  }, [playTaskClip]);

  const pauseSession = useCallback(() => {
    stopListening();
    clearTimers();
    stopSpeaking();
    setPhaseSafe('paused');
  }, [setPhaseSafe]);

  const resumeSession = useCallback(() => {
    if (phaseRef.current !== 'paused') return;
    playTaskClip();
  }, [playTaskClip]);

  // Handle a recognized command (from speech or the simulation).
  const handleCommand = useCallback(
    (cmd: VoiceCommand) => {
      if (cmd === 'dog' || cmd === 'baby' || cmd === 'doorbell') {
        commit(cmd);
        return;
      }
      if (cmd === 'repeat') {
        replayClip();
        return;
      }
      if (cmd === 'skip') {
        stopListening();
        clearTimers();
        goNext();
        return;
      }
      if (cmd === 'pause') {
        pauseSession();
        return;
      }
      if (cmd === 'resume') {
        resumeSession();
        return;
      }
      if (cmd === 'stop') {
        finish();
      }
    },
    [commit, finish, goNext, pauseSession, replayClip, resumeSession],
  );

  useEffect(() => {
    handleCommandRef.current = handleCommand;
  }, [handleCommand]);

  // Kick off each task once it enters "preparing".
  useEffect(() => {
    if (phase !== 'preparing') return undefined;
    const t = setTimeout(() => {
      if (phaseRef.current === 'preparing') playTaskClip();
    }, 700);
    pushTimer(t);
    return undefined;
  }, [phase, index, playTaskClip]);

  useEffect(
    () => () => {
      clearTimers();
      stopListening();
      stopSpeaking();
      stopClip();
      releaseAudio();
    },
    [],
  );

  const st = STATE_TEXT[phase];
  const connected = true;

  return (
    <LinearGradient
      colors={['#0B1020', '#131A33', '#1A2247']}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      className="flex-1"
    >
      {/* Radial glow accent */}
      <View className="bg-purple/20 absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full" />
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        {/* Top bar */}
        <View className="px-6 pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-white/90">Hands-free session</Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                <Wifi size={13} color={connected ? colors.mint : colors.danger} />
                <Text className="text-xs font-semibold text-white/80">
                  {connected ? 'Connected' : 'Offline'}
                </Text>
              </View>
              <View className="flex-row items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                <Coins size={13} color={colors.reward} />
                <Text className="text-xs font-bold text-white">{sessionCredits}</Text>
              </View>
            </View>
          </View>
          <View className="mt-3 flex-row items-center gap-1.5">
            {tasks.map((t, i) => (
              <View
                key={t.id}
                className={`h-1.5 flex-1 rounded-full ${
                  i < index ? 'bg-mint' : i === index ? 'bg-white/80' : 'bg-white/15'
                }`}
              />
            ))}
          </View>
          <Text className="mt-2 text-xs font-semibold text-white/60">
            {index + 1} of {tasks.length}
          </Text>
        </View>

        {/* Center */}
        <View className="flex-1 items-center justify-center px-8">
          <AudioOrb phase={phase} />

          <Animated.Text
            key={`title-${phase}`}
            entering={FadeIn.duration(280)}
            className="mt-6 text-center text-2xl font-extrabold text-white"
          >
            {st.title}
          </Animated.Text>
          <Text className="mt-1.5 text-center text-sm text-white/60">{st.sub}</Text>

          {/* Live recognized-command transcript */}
          <View className="mt-5 h-9 items-center justify-center">
            {phase === 'listening' && transcript ? (
              <Animated.View
                entering={FadeIn.duration(150)}
                className="flex-row items-center gap-2 rounded-full bg-white/10 px-4 py-1.5"
              >
                <View className="bg-mint h-2 w-2 rounded-full" />
                <Text className="text-sm font-semibold text-white">{transcript}</Text>
              </Animated.View>
            ) : null}
          </View>
        </View>

        {/* High-confidence confirmation card */}
        <View className="h-28 px-6">
          {heard && (phase === 'detected' || phase === 'confirmed') ? (
            <Animated.View
              entering={FadeInDown.duration(280)}
              className="bg-mint flex-row items-center gap-4 rounded-[24px] px-5 py-4"
            >
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#0B1020]/10">
                {(() => {
                  const Icon = RESPONSE_ICON[heard];
                  return <Icon size={28} color="#0B1020" />;
                })()}
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold tracking-wide text-[#0B1020]/60 uppercase">
                  Answer detected
                </Text>
                <Text className="text-2xl font-extrabold text-[#0B1020]">
                  {RESPONSE_LABEL[heard]}
                </Text>
              </View>
              <View className="h-9 w-9 items-center justify-center rounded-full bg-[#0B1020]">
                <Check size={18} color={colors.mint} strokeWidth={3} />
              </View>
            </Animated.View>
          ) : phase === 'listening' ? (
            <View className="flex-row flex-wrap justify-center gap-2 pt-1">
              {(['dog', 'baby', 'doorbell'] as const).map((a) => {
                const Icon = RESPONSE_ICON[a];
                return (
                  <Pressable
                    key={a}
                    onPress={() => commit(a)}
                    className="flex-row items-center gap-2 rounded-full bg-white/10 px-4 py-2.5"
                  >
                    <Icon size={16} color={colors.white} />
                    <Text className="text-sm font-bold text-white">{RESPONSE_LABEL[a]}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        {/* Bottom controls */}
        <View className="flex-row items-start px-6 pt-2 pb-2">
          {phase === 'paused' ? (
            <ControlButton icon={Play} label="Resume" onPress={resumeSession} />
          ) : (
            <ControlButton
              icon={Pause}
              label="Pause"
              onPress={pauseSession}
              disabled={phase === 'detected' || phase === 'confirmed'}
            />
          )}
          <ControlButton
            icon={Repeat}
            label="Repeat"
            onPress={replayClip}
            disabled={phase === 'detected' || phase === 'confirmed' || phase === 'paused'}
          />
          <ControlButton
            icon={SkipForward}
            label="Skip"
            onPress={() => {
              stopListening();
              clearTimers();
              stopSpeaking();
              stopClip();
              goNext();
            }}
            disabled={phase === 'detected' || phase === 'confirmed'}
          />
          <ControlButton icon={Square} label="End" onPress={finish} />
        </View>

        <Text className="pb-1 text-center text-xs text-white/35">
          {useSim
            ? 'Say “Dog”, “Baby”, or “Doorbell” — or tap a chip'
            : phase === 'listening'
              ? 'Speak your answer — or tap a chip'
              : 'Listening for your voice'}
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}
