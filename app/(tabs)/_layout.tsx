import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: {
          backgroundColor: '#f8f8f8',
          borderTopWidth: 0.7,
          borderTopColor: '#ddd',
          paddingBottom: insets.bottom,
          height: 57 + insets.bottom,
          elevation: 10, // Android
        },

        tabBarActiveTintColor: '#0097A7',
        tabBarInactiveTintColor: '#999',

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },

        tabBarIcon: ({ color, size, focused }) => {
  let iconName: React.ComponentProps<typeof Ionicons>['name'];

  if (route.name === 'agenda') {
    iconName = focused ? 'calendar' : 'calendar-outline';
  } else if (route.name === 'index') {
    iconName = focused ? 'home' : 'home-outline';
  } else if (route.name === 'prontuario') {
    iconName = focused ? 'document-text' : 'document-text-outline';
  } else {
    iconName = 'ellipse'; 
  }

  return <Ionicons name={iconName} size={22} color={color} />;
}
      })}
    >
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="prontuario" options={{ title: 'Prontuário' }} />
    </Tabs>
  );
}