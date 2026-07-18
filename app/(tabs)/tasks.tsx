import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { ProjectCard } from '@/components/ProjectCard';
import { PROJECTS } from '@/lib/mockData';
import type { Project, ProjectCategory } from '@/lib/types';
import { openProject } from '@/lib/navigation';
import { selectionTick } from '@/lib/haptics';

type Filter = 'foryou' | ProjectCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'foryou', label: 'For you' },
  { id: 'audio', label: 'Audio' },
  { id: 'images', label: 'Images' },
  { id: 'text', label: 'Text' },
  { id: 'collection', label: 'Collection' },
];

export default function TasksScreen() {
  const [filter, setFilter] = useState<Filter>('foryou');

  const projects = useMemo(() => {
    if (filter === 'foryou') return PROJECTS;
    return PROJECTS.filter((p) => p.category === filter);
  }, [filter]);

  return (
    <SafeAreaView edges={['top']} className="bg-canvas flex-1">
      <View className="px-5 pt-2">
        <Text className="text-ink text-2xl font-extrabold">Tasks</Text>
        <Text className="text-ink-soft mt-1 text-sm">
          Pick a project and start earning credits.
        </Text>
      </View>

      <View className="mt-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-5 gap-2"
        >
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  selectionTick();
                  setFilter(f.id);
                }}
                className={`rounded-full border px-4 py-2 ${
                  active ? 'bg-purple border-purple' : 'bg-card border-hairline'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink-soft'}`}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-8 pt-4 gap-3"
      >
        {projects.length === 0 ? (
          <View className="mt-16 items-center">
            <Text className="text-ink-soft text-sm">No projects in this category yet.</Text>
          </View>
        ) : (
          projects.map((project: Project, i) => (
            <Animated.View key={project.id} entering={FadeIn.delay(i * 60).duration(300)}>
              <ProjectCard project={project} onPress={(p) => openProject(p.id)} />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
