import { View, Text, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Clock,
  Coins,
  Gauge,
  Headphones,
  Hand,
  Lock,
  ListChecks,
  ShieldCheck,
} from 'lucide-react-native';
import { Button } from 'heroui-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { PROJECTS, CONTEXTS } from '@/lib/mockData';
import { colors } from '@/lib/theme';
import { startSession } from '@/lib/navigation';
import { tapMedium } from '@/lib/haptics';

const INSTRUCTIONS = [
  'Listen to the sound.',
  'Choose Dog, Baby, or Doorbell.',
  'Skip anything unclear.',
];

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 py-3">
      <View className="bg-canvas h-9 w-9 items-center justify-center rounded-xl">
        <Icon size={18} color={colors.purple} />
      </View>
      <Text className="text-ink-soft flex-1 text-sm">{label}</Text>
      <Text className="text-ink text-sm font-semibold">{value}</Text>
    </View>
  );
}

export default function ProjectDetails() {
  const { id, context } = useLocalSearchParams<{ id: string; context?: string }>();
  const project = PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
  const ctx = CONTEXTS.find((c) => c.id === context) ?? CONTEXTS[0];

  const isHandsFree = ctx.mode === 'handsfree';
  const cta = !project.playable
    ? 'Coming soon in demo'
    : isHandsFree
      ? 'Start hands-free session'
      : 'Start labeling';

  const modeLabel = isHandsFree
    ? 'Hands-free audio'
    : project.category === 'audio'
      ? 'Tap to label'
      : 'Tap to label';

  const start = () => {
    if (!project.playable) return;
    tapMedium();
    startSession(ctx.mode, project.id);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="bg-canvas flex-1">
      <View className="flex-row items-center px-5 py-2">
        <Pressable
          onPress={() => router.back()}
          className="bg-card border-hairline h-10 w-10 items-center justify-center rounded-full border"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-4">
        <View className="bg-purple-soft self-start rounded-full px-3 py-1">
          <Text className="text-purple text-xs font-bold">{project.categoryLabel}</Text>
        </View>
        <Text className="text-ink mt-3 text-[26px] leading-8 font-extrabold">{project.name}</Text>
        <Text className="text-ink-soft mt-2 text-base leading-6">{project.description}</Text>

        <View className="bg-card border-hairline mt-5 rounded-[24px] border px-4 py-1">
          <MetaRow icon={ListChecks} label="Tasks" value={`${project.taskCount}`} />
          <View className="bg-hairline h-px" />
          <MetaRow
            icon={Clock}
            label="Estimated duration"
            value={`About ${project.estMinutes} min`}
          />
          <View className="bg-hairline h-px" />
          <MetaRow icon={Coins} label="Total reward" value={`${project.credits} credits`} />
          <View className="bg-hairline h-px" />
          <MetaRow icon={Gauge} label="Task difficulty" value={project.difficulty} />
          <View className="bg-hairline h-px" />
          <MetaRow icon={isHandsFree ? Headphones : Hand} label="Required mode" value={modeLabel} />
        </View>

        {project.playable ? (
          <>
            <Text className="text-ink mt-7 text-lg font-extrabold">How it works</Text>
            <View className="mt-3 gap-3">
              {INSTRUCTIONS.map((step, i) => (
                <View key={step} className="flex-row items-center gap-3">
                  <View className="bg-purple h-7 w-7 items-center justify-center rounded-full">
                    <Text className="text-xs font-bold text-white">{i + 1}</Text>
                  </View>
                  <Text className="text-ink flex-1 text-sm font-medium">{step}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View className="bg-mint-soft mt-6 flex-row items-start gap-3 rounded-2xl p-4">
          <ShieldCheck size={20} color={colors.mint} />
          <Text className="text-ink flex-1 text-xs leading-5">
            Your responses are used only to improve AI models. No personal data is collected during
            this demo.
          </Text>
        </View>
      </ScrollView>

      <View className="px-5 pt-2">
        {project.playable ? (
          <Button variant="primary" size="lg" onPress={start} className="rounded-2xl">
            {isHandsFree ? <Headphones size={18} color={colors.white} /> : null}
            <Button.Label>{cta}</Button.Label>
          </Button>
        ) : (
          <View className="bg-hairline flex-row items-center justify-center gap-2 rounded-2xl py-4">
            <Lock size={16} color={colors.inkSoft} />
            <Text className="text-ink-soft text-sm font-semibold">{cta}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
