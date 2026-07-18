import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  Coins,
  Gift,
  Heart,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Info,
  AudioLines,
  Sparkles,
} from 'lucide-react-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { REWARD_OPTIONS } from '@/lib/mockData';
import type { ActivityDay, EarningActivity } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { useShallow } from 'zustand/react/shallow';
import { tapLight } from '@/lib/haptics';

const EUR_PER_CREDIT = 0.05;

function ActivityChart({ data }: { data: ActivityDay[] }) {
  const max = Math.max(...data.map((d) => d.credits), 1);
  return (
    <View className="flex-row items-end justify-between gap-2" style={{ height: 130 }}>
      {data.map((day, i) => {
        const heightPct = Math.max(0.08, day.credits / max);
        const isToday = i === data.length - 1;
        return (
          <View key={day.id} className="flex-1 items-center gap-2">
            <View className="w-full flex-1 justify-end">
              <Animated.View
                entering={FadeIn.delay(i * 70).duration(400)}
                className={`w-full rounded-xl ${isToday ? 'bg-purple' : 'bg-purple-soft'}`}
                style={{ height: `${heightPct * 100}%` }}
              />
            </View>
            <Text
              className={`text-[11px] font-semibold ${isToday ? 'text-purple' : 'text-ink-soft'}`}
            >
              {day.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
}) {
  return (
    <View className="bg-card border-hairline flex-1 rounded-2xl border p-4">
      <Icon size={18} color={colors.purple} />
      <Text className="text-ink mt-2 text-xl font-extrabold">{value}</Text>
      <Text className="text-ink-soft text-xs">{label}</Text>
    </View>
  );
}

function ActivityRow({ item }: { item: EarningActivity }) {
  const Icon = item.kind === 'bonus' ? Sparkles : AudioLines;
  const tint = item.kind === 'bonus' ? colors.reward : colors.purple;
  const tintBg = item.kind === 'bonus' ? 'bg-reward-soft' : 'bg-purple-soft';
  return (
    <View className="flex-row items-center gap-3 px-1 py-3">
      <View className={`h-10 w-10 items-center justify-center rounded-2xl ${tintBg}`}>
        <Icon size={18} color={tint} />
      </View>
      <View className="flex-1">
        <Text className="text-ink text-sm font-bold">{item.label}</Text>
        <Text className="text-ink-soft text-xs">{item.when}</Text>
      </View>
      <Text className="text-mint text-sm font-extrabold">+{item.credits}</Text>
    </View>
  );
}

export default function EarningsScreen() {
  const { credits, todayCredits, weekCredits, tasksCompleted, qualityScore, activity, history } =
    useAppStore(
      useShallow((s) => ({
        credits: s.credits,
        todayCredits: s.todayCredits,
        weekCredits: s.weekCredits,
        tasksCompleted: s.tasksCompleted,
        qualityScore: s.qualityScore,
        activity: s.activity,
        history: s.history,
      })),
    );
  const [tab, setTab] = useState<'rewards' | 'activity'>('rewards');
  const [redeemOpen, setRedeemOpen] = useState(false);
  const euro = (credits * EUR_PER_CREDIT).toFixed(2);

  return (
    <SafeAreaView edges={['top']} className="bg-canvas flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-8">
        <Text className="text-ink pt-2 text-2xl font-extrabold">Earnings</Text>

        {/* Balance card */}
        <LinearGradient
          colors={['#6C63FF', '#625BF6', '#4B44D6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mt-4 rounded-[28px] p-6"
        >
          <View className="flex-row items-center gap-2">
            <Coins size={18} color={colors.white} />
            <Text className="text-sm font-medium text-white/80">Hackathon demo balance</Text>
          </View>
          <View className="mt-2 flex-row items-end gap-2">
            <AnimatedNumber value={credits} className="text-5xl font-extrabold text-white" />
            <Text className="mb-1.5 text-lg font-semibold text-white/90">demo credits</Text>
          </View>
          <Text className="mt-1 text-sm text-white/75">Equivalent reward preview: €{euro}</Text>
          <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-white/15 px-3 py-2">
            <Info size={14} color={colors.white} />
            <Text className="flex-1 text-xs text-white/85">
              Credits are a demo reward preview. No real money is involved.
            </Text>
          </View>
        </LinearGradient>

        {/* Daily / weekly progress */}
        <View className="mt-4 flex-row gap-3">
          <StatPill icon={TrendingUp} label="Today" value={`${todayCredits}`} />
          <StatPill icon={Coins} label="This week" value={`${weekCredits}`} />
        </View>

        {/* Tabs */}
        <View className="bg-card border-hairline mt-4 flex-row rounded-2xl border p-1">
          {(['rewards', 'activity'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                tapLight();
                setTab(t);
              }}
              className={`flex-1 items-center rounded-xl py-2.5 ${tab === t ? 'bg-purple' : ''}`}
            >
              <Text
                className={`text-sm font-semibold ${tab === t ? 'text-white' : 'text-ink-soft'}`}
              >
                {t === 'rewards' ? 'Reward options' : 'Activity'}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'rewards' ? (
          <Animated.View entering={FadeIn.duration(250)} className="mt-4 gap-3">
            {REWARD_OPTIONS.map((option) => {
              const Icon = option.kind === 'donate' ? Heart : Gift;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    tapLight();
                    setRedeemOpen(true);
                  }}
                  className="bg-card border-hairline flex-row items-center gap-3 rounded-[22px] border p-4"
                >
                  <View className="bg-reward-soft h-12 w-12 items-center justify-center rounded-2xl">
                    <Icon size={22} color={colors.reward} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink text-base font-bold">{option.title}</Text>
                    <Text className="text-ink-soft text-xs">{option.cost} credits</Text>
                  </View>
                  <View className="bg-purple rounded-full px-4 py-2">
                    <Text className="text-xs font-bold text-white">Redeem</Text>
                  </View>
                </Pressable>
              );
            })}
            <Text className="text-ink-soft mt-1 text-center text-[11px]">
              Reward options are a preview. Redemption opens after launch.
            </Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(250)} className="mt-4">
            <View className="bg-card border-hairline rounded-[24px] border p-5">
              <View className="mb-4 flex-row items-center gap-2">
                <Calendar size={16} color={colors.purple} />
                <Text className="text-ink text-base font-bold">Last 7 days</Text>
              </View>
              <ActivityChart data={activity} />
            </View>

            <View className="mt-3 flex-row gap-3">
              <StatPill icon={CheckCircle2} label="Tasks completed" value={`${tasksCompleted}`} />
              <StatPill icon={ShieldCheck} label="Avg quality" value={`${qualityScore}%`} />
            </View>

            {/* Recent activity */}
            <Text className="text-ink mt-6 mb-1 text-lg font-extrabold">Recent activity</Text>
            <View className="bg-card border-hairline mt-2 rounded-[24px] border px-4 py-1">
              {history.map((item, i) => (
                <View key={item.id}>
                  {i > 0 ? <View className="bg-hairline h-px" /> : null}
                  <ActivityRow item={item} />
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Reward redemption sheet */}
      <Modal
        visible={redeemOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRedeemOpen(false)}
      >
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setRedeemOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-card pb-safe-offset-6 rounded-t-[28px] px-5 pt-3"
          >
            <View className="bg-hairline mx-auto h-1.5 w-10 rounded-full" />
            <View className="bg-reward-soft mt-5 h-14 w-14 items-center justify-center self-center rounded-full">
              <Gift size={26} color={colors.reward} />
            </View>
            <Text className="text-ink mt-4 text-center text-lg font-extrabold">
              Reward redemption is disabled
            </Text>
            <Text className="text-ink-soft mt-2 text-center text-sm">
              Reward redemption is disabled in this hackathon demo. Your credits show the reward you
              would earn in the full product.
            </Text>
            <Pressable
              onPress={() => {
                tapLight();
                setRedeemOpen(false);
              }}
              className="bg-purple mt-6 items-center rounded-full py-3.5"
            >
              <Text className="text-base font-bold text-white">Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
