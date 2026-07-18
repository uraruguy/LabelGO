import { Pressable, View, Text } from 'react-native';
import {
  AudioLines,
  ImageIcon,
  MessageSquareText,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import type { Project, ProjectCategory } from '@/lib/types';
import { colors } from '@/lib/theme';
import { tapLight } from '@/lib/haptics';
import { CreditBadge } from './CreditBadge';

const CATEGORY_ICON: Record<ProjectCategory, LucideIcon> = {
  audio: AudioLines,
  images: ImageIcon,
  text: MessageSquareText,
  collection: AudioLines,
};

const CATEGORY_TINT: Record<ProjectCategory, { bg: string; color: string }> = {
  audio: { bg: 'bg-purple-soft', color: colors.purple },
  images: { bg: 'bg-mint-soft', color: colors.mint },
  text: { bg: 'bg-reward-soft', color: colors.reward },
  collection: { bg: 'bg-purple-soft', color: colors.purple },
};

interface ProjectCardProps {
  project: Project;
  onPress: (project: Project) => void;
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const Icon = CATEGORY_ICON[project.category];
  const tint = CATEGORY_TINT[project.category];

  return (
    <Pressable
      className="bg-card border-hairline rounded-[22px] border p-4"
      onPress={() => {
        tapLight();
        onPress(project);
      }}
    >
      <View className="flex-row items-center gap-3">
        <View className={`h-12 w-12 items-center justify-center rounded-2xl ${tint.bg}`}>
          <Icon size={24} color={tint.color} />
        </View>
        <View className="flex-1">
          <Text className="text-ink text-base font-bold">{project.name}</Text>
          <Text className="text-ink-soft text-xs">{project.categoryLabel}</Text>
        </View>
        <ChevronRight size={20} color={colors.inkSoft} />
      </View>

      <Text className="text-ink-soft mt-3 text-sm">{project.prompt}</Text>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="bg-canvas rounded-full px-2.5 py-1">
            <Text className="text-ink-soft text-[11px] font-semibold">
              {project.taskCount} tasks
            </Text>
          </View>
          <View className="bg-canvas rounded-full px-2.5 py-1">
            <Text className="text-ink-soft text-[11px] font-semibold">{project.difficulty}</Text>
          </View>
        </View>
        <CreditBadge amount={project.credits} />
      </View>
    </Pressable>
  );
}
