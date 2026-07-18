import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  iconColor: string;
  iconBgClassName: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  iconColor,
  iconBgClassName,
  className,
}: StatCardProps) {
  return (
    <View className={cn('flex-1 items-center gap-1.5', className)}>
      <View className={cn('h-9 w-9 items-center justify-center rounded-full', iconBgClassName)}>
        <Icon size={18} color={iconColor} />
      </View>
      <Text className="text-ink text-lg font-bold">{value}</Text>
      <Text className="text-ink-soft text-[11px] font-medium">{label}</Text>
    </View>
  );
}
