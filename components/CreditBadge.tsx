import { View, Text } from 'react-native';
import { Coins } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface CreditBadgeProps {
  amount: number;
  className?: string;
  tone?: 'reward' | 'mint';
}

export function CreditBadge({ amount, className, tone = 'reward' }: CreditBadgeProps) {
  const bg = tone === 'reward' ? 'bg-reward-soft' : 'bg-mint-soft';
  const iconColor = tone === 'reward' ? colors.reward : colors.mint;
  return (
    <View className={cn('flex-row items-center gap-1 rounded-full px-2.5 py-1', bg, className)}>
      <Coins size={13} color={iconColor} />
      <Text className="text-ink text-xs font-semibold">{amount}</Text>
    </View>
  );
}
