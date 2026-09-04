import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Map, List, CreditCard } from 'lucide-react-native';

export default function AppTabs() {
  const scheme = useColorScheme();
  
  const colors = {
    background: scheme === 'dark' ? '#151718' : '#ffffff',
    text: scheme === 'dark' ? '#ECEDEE' : '#11181C',
    active: scheme === 'dark' ? '#3b82f6' : '#2563eb', // Blue
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: scheme === 'dark' ? '#25292e' : '#e5e5e5',
        },
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: scheme === 'dark' ? '#687076' : '#8b949e',
      }}>
      <Tabs.Screen 
        name="index"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />
        }}
      />
      <Tabs.Screen 
        name="list"
        options={{
          title: "Lista",
          tabBarIcon: ({ color, size }) => <List color={color} size={size} />
        }}
      />
      <Tabs.Screen 
        name="plans"
        options={{
          title: "Planes",
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />
        }}
      />
    </Tabs>
  );
}
