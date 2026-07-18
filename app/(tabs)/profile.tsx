import { View, Text, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import {
  MapPin,
  Languages,
  Sliders,
  Accessibility,
  ShieldCheck,
  RotateCcw,
  Check,
  Lock,
  ChevronRight,
  Flame,
  CheckCircle2,
  Mic,
  type LucideIcon,
} from 'lucide-react-native';
import { Switch } from 'heroui-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { QualityRing } from '@/components/QualityRing';
import { QUALIFICATIONS } from '@/lib/mockData';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { useShallow } from 'zustand/react/shallow';
import { tapMedium } from '@/lib/haptics';

function SectionRow({
  icon: Icon,
  title,
  subtitle,
  onPress,
  danger,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-4 py-3.5">
      <View
        className={`h-9 w-9 items-center justify-center rounded-xl ${danger ? 'bg-reward-soft' : 'bg-canvas'}`}
      >
        <Icon size={18} color={danger ? colors.danger : colors.purple} />
      </View>
      <View className="flex-1">
        <Text className={`text-sm font-semibold ${danger ? 'text-danger-accent' : 'text-ink'}`}>
          {title}
        </Text>
        {subtitle ? <Text className="text-ink-soft text-xs">{subtitle}</Text> : null}
      </View>
      <ChevronRight size={18} color={colors.inkSoft} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { qualityScore, tasksCompleted, streak, resetDemo, demoVoiceSim, setDemoVoiceSim } =
    useAppStore(
      useShallow((s) => ({
        qualityScore: s.qualityScore,
        tasksCompleted: s.tasksCompleted,
        streak: s.streak,
        resetDemo: s.resetDemo,
        demoVoiceSim: s.demoVoiceSim,
        setDemoVoiceSim: s.setDemoVoiceSim,
      })),
    );

  const doReset = () => {
    tapMedium();
    resetDemo();
    router.replace('/onboarding');
  };

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      doReset();
      return;
    }
    Alert.alert('Reset hackathon demo', 'This restores all demo credits, stats, and onboarding.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: doReset },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} className="bg-canvas flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
        {/* Header */}
        <View className="items-center pt-4">
          <View className="bg-purple h-20 w-20 items-center justify-center rounded-full">
            <Text className="text-2xl font-extrabold text-white">J</Text>
          </View>
          <Text className="text-ink mt-3 text-2xl font-extrabold">Jakob</Text>
          <View className="mt-1 flex-row items-center gap-1">
            <MapPin size={13} color={colors.inkSoft} />
            <Text className="text-ink-soft text-sm">Slovenia</Text>
          </View>
          <View className="bg-mint-soft mt-2 rounded-full px-3 py-1">
            <Text className="text-mint text-xs font-bold">Contributor level: Reliable</Text>
          </View>
        </View>

        {/* Quality + stats */}
        <View className="bg-card border-hairline mt-5 flex-row items-center rounded-[24px] border p-5">
          <QualityRing score={qualityScore} size={104} />
          <View className="ml-5 flex-1 gap-3">
            <View className="flex-row items-center gap-2">
              <CheckCircle2 size={18} color={colors.purple} />
              <View>
                <Text className="text-ink text-base font-bold">{tasksCompleted}</Text>
                <Text className="text-ink-soft text-xs">Completed tasks</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Flame size={18} color={colors.reward} />
              <View>
                <Text className="text-ink text-base font-bold">{streak}-day</Text>
                <Text className="text-ink-soft text-xs">Current streak</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Qualifications */}
        <Text className="text-ink mt-6 mb-2 text-lg font-extrabold">Qualifications</Text>
        <View className="bg-card border-hairline mt-3 gap-1 rounded-[24px] border p-3">
          {QUALIFICATIONS.map((q) => {
            const locked = q.status === 'Locked';
            return (
              <View key={q.id} className="flex-row items-center gap-3 px-1 py-2.5">
                <View
                  className={`h-9 w-9 items-center justify-center rounded-xl ${locked ? 'bg-canvas' : 'bg-mint-soft'}`}
                >
                  {locked ? (
                    <Lock size={16} color={colors.inkSoft} />
                  ) : (
                    <Check size={16} color={colors.mint} strokeWidth={3} />
                  )}
                </View>
                <Text className="text-ink flex-1 text-sm font-semibold">{q.name}</Text>
                <Text className={`text-xs font-bold ${locked ? 'text-ink-soft' : 'text-mint'}`}>
                  {q.status}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Sections */}
        <View className="bg-card border-hairline mt-4 divide-y rounded-[24px] border">
          <SectionRow icon={Languages} title="Languages" subtitle="English and Slovenian" />
          <View className="bg-hairline h-px" />
          <SectionRow icon={Sliders} title="Task preferences" subtitle="Audio, images, text" />
          <View className="bg-hairline h-px" />
          <SectionRow
            icon={Accessibility}
            title="Accessibility"
            subtitle="Voice control, large targets"
          />
          <View className="bg-hairline h-px" />
          <SectionRow icon={ShieldCheck} title="Privacy" subtitle="Data usage and consent" />
        </View>

        {/* Demo settings */}
        <Text className="text-ink mt-6 mb-2 text-lg font-extrabold">Demo settings</Text>
        <View className="bg-card border-hairline mt-1 rounded-[24px] border">
          <View className="flex-row items-center gap-3 px-4 py-3.5">
            <View className="bg-canvas h-9 w-9 items-center justify-center rounded-xl">
              <Mic size={18} color={colors.purple} />
            </View>
            <View className="flex-1">
              <Text className="text-ink text-sm font-semibold">Demo voice simulation</Text>
              <Text className="text-ink-soft text-xs">
                Runs hands-free with a scripted voice sequence so the demo always works
              </Text>
            </View>
            <Switch
              isSelected={demoVoiceSim}
              onSelectedChange={(v) => {
                tapMedium();
                setDemoVoiceSim(v);
              }}
            />
          </View>
        </View>

        {/* Reset */}
        <View className="bg-card border-hairline mt-4 rounded-[24px] border">
          <SectionRow
            icon={RotateCcw}
            title="Reset hackathon demo"
            subtitle="Restore starting credits and stats"
            onPress={confirmReset}
            danger
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
