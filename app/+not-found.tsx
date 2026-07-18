import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';

export default function NotFoundScreen() {
  return (
    <SafeAreaView className="bg-canvas flex-1">
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-ink text-xl font-extrabold">This screen doesn&apos;t exist.</Text>
        <Link href="/(tabs)" className="mt-4">
          <Text className="text-purple text-base font-semibold">Go to home</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
