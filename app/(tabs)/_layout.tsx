import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Home, LayoutGrid, Wallet, User } from 'lucide-react-native';
import { colors } from '@/lib/theme';

export default function TabLayout() {
  return (
    <>
      {/* eslint-disable-next-line react/style-prop-object -- expo-status-bar's `style` prop is a string theme enum ("dark"/"light"/"auto"), not a React Native style object */}
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.canvas },
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.hairline,
            height: 84,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarActiveTintColor: colors.purple,
          tabBarInactiveTintColor: colors.inkSoft,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size ?? 22} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size ?? 22} />,
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: 'Earnings',
            tabBarIcon: ({ color, size }) => <Wallet color={color} size={size ?? 22} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size ?? 22} />,
          }}
        />
      </Tabs>
    </>
  );
}
