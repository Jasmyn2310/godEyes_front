import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { CreditCard, List, Map, Radio, User } from 'lucide-react-native';
import { useAuthStore } from '@/features/auth/store/auth-store';

export default function AppTabs() {
  const scheme = useColorScheme();
  const { user } = useAuthStore();
  const isVendor = user?.role === 'vendor';
  const isClient = user?.role === 'client';

  const colors = {
    background: scheme === 'dark' ? '#0F172A' : '#FFFFFF',
    text: scheme === 'dark' ? '#F8FAFC' : '#0F172A',
    active: '#0284C7',
    inactive: scheme === 'dark' ? '#64748B' : '#94A3B8',
    border: scheme === 'dark' ? '#1E293B' : '#E2E8F0',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isVendor ? 'Mi Baliza' : 'Radar',
          tabBarIcon: ({ color, size }) =>
            isVendor ? <Radio color={color} size={size} /> : <Map color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'Puestos',
          href: isVendor ? null : '/(tabs)/list',
          tabBarIcon: ({ color, size }) => <List color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Planes',
          href: isClient ? null : '/(tabs)/plans',
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
