import { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bell, Sparkles, ShieldCheck, Star, Flame, ArrowRight } from 'lucide-react-native';
import { Button } from 'heroui-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { ContextCard } from '@/components/ContextCard';
import { StatCard } from '@/components/StatCard';
import { CreditBadge } from '@/components/CreditBadge';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { ProgressBar } from '@/components/ProgressBar';
import { CONTEXTS, PROJECTS, CONTINUE_PROJECT } from '@/lib/mockData';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { openProject, startSession } from '@/lib/navigation';
import { tapMedium } from '@/lib/haptics';

export default function HomeScreen() {
  const credits = useAppStore((s) => s.credits);
  const qualityScore = useAppStore((s) => s.qualityScore);
  const streak = useAppStore((s) => s.streak);
  const selectedContext = useAppStore((s) => s.selectedContext);
  const selectContext = useAppStore((s) => s.selectContext);

  const context = useMemo(
    () => CONTEXTS.find((c) => c.id === selectedContext) ?? CONTEXTS[0],
    [selectedContext],
  );
  const featured = PROJECTS[0];

  const start = () => {
    tapMedium();
    startSession(context.mode, featured.id);
  };

  return (
    <SafeAreaView edges={['top']} className="bg-canvas flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-8">
        {/* Header */}
        <View className="flex-row items-center justify-between pt-2">
          <View className="flex-row items-center gap-3">
            <View className="bg-purple h-11 w-11 items-center justify-center rounded-full">
              <Text className="text-base font-bold text-white">J</Text>
            </View>
            <View>
              <Text className="text-ink-soft text-xs">Good afternoon,</Text>
              <Text className="text-ink text-lg font-bold">Jakob</Text>
            </View>
          </View>
          <Pressable className="bg-card border-hairline h-11 w-11 items-center justify-center rounded-full border">
            <Bell size={20} color={colors.ink} />
          </Pressable>
        </View>

        {/* Stats card */}
        <View className="bg-card border-hairline mt-5 flex-row items-center rounded-[24px] border p-4">
          <StatCard
            icon={Sparkles}
            value={credits.toLocaleString()}
            label="Credits"
            iconColor={colors.purple}
            iconBgClassName="bg-purple-soft"
          />
          <View className="bg-hairline h-10 w-px" />
          <StatCard
            icon={ShieldCheck}
            value={`${qualityScore}%`}
            label="Quality"
            iconColor={colors.mint}
            iconBgClassName="bg-mint-soft"
          />
          <View className="bg-hairline h-10 w-px" />
          <StatCard
            icon={Flame}
            value={`${streak}-day`}
            label="Streak"
            iconColor={colors.reward}
            iconBgClassName="bg-reward-soft"
          />
        </View>

        {/* Context selection */}
        <Text className="text-ink mt-7 text-xl font-extrabold">
          How are you spending this moment?
        </Text>
        <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
          {CONTEXTS.map((c) => (
            <ContextCard
              key={c.id}
              context={c}
              selected={c.id === selectedContext}
              onSelect={selectContext}
            />
          ))}
        </View>

        {/* Recommended project */}
        <Animated.View
          key={context.id}
          entering={FadeInDown.duration(320)}
          className="bg-card border-hairline mt-6 rounded-[24px] border p-5"
        >
          <View className="flex-row items-center justify-between">
            <View className="bg-purple-soft rounded-full px-2.5 py-1">
              <Text className="text-purple text-[11px] font-bold">RECOMMENDED</Text>
            </View>
            <CreditBadge amount={featured.credits} />
          </View>
          <Text className="text-ink mt-3 text-xl font-extrabold">{featured.name}</Text>
          <Text className="text-ink-soft mt-1 text-sm">{featured.description}</Text>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {[
              `${featured.taskCount} tasks`,
              `About ${featured.estMinutes} minutes`,
              `${featured.credits / featured.taskCount} credits per task`,
              'Beginner friendly',
            ].map((chip) => (
              <View key={chip} className="bg-canvas rounded-full px-3 py-1.5">
                <Text className="text-ink-soft text-xs font-semibold">{chip}</Text>
              </View>
            ))}
          </View>

          <Button variant="primary" size="lg" onPress={start} className="mt-5 rounded-2xl">
            <Button.Label>{context.cta}</Button.Label>
          </Button>
        </Animated.View>

        {/* Continue */}
        <Text className="text-ink mt-7 text-lg font-extrabold">Continue where you left off</Text>
        <Pressable
          onPress={() => openProject(CONTINUE_PROJECT.id)}
          className="bg-card border-hairline mt-3 rounded-[24px] border p-4"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-ink text-base font-bold">{CONTINUE_PROJECT.name}</Text>
            <ArrowRight size={18} color={colors.inkSoft} />
          </View>
          <View className="mt-3">
            <ProgressBar progress={CONTINUE_PROJECT.completed / CONTINUE_PROJECT.total} />
          </View>
          <View className="mt-2.5 flex-row items-center justify-between">
            <Text className="text-ink-soft text-xs font-medium">
              {CONTINUE_PROJECT.completed} of {CONTINUE_PROJECT.total} completed
            </Text>
            <View className="flex-row items-center gap-1">
              <Star size={13} color={colors.reward} fill={colors.reward} />
              <AnimatedNumber
                value={CONTINUE_PROJECT.credits}
                className="text-ink text-xs font-semibold"
              />
              <Text className="text-ink-soft text-xs font-medium">credits available</Text>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
