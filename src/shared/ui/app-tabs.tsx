import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import {
  CreditCard,
  List,
  Compass,
  Signal,
  Sparkles,
  Store,
  TrendingUp,
  User,
} from 'lucide-react-native';
import { useAuthStore } from '@/features/auth/store/auth-store';

export default function AppTabs() {
  const scheme = useColorScheme();
  const { user } = useAuthStore();
  const isVendor = user?.role === 'vendor';

  const colors = {
    background: scheme === 'dark' ? '#0F172A' : '#FFFFFF',
    active: '#0284C7',
    inactive: scheme === 'dark' ? '#64748B' : '#94A3B8',
    border: scheme === 'dark' ? '#1E293B' : '#E2E8F0',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isVendor ? 'Mi Baliza' : 'Radar',
          tabBarAccessibilityLabel: isVendor ? 'Mi Baliza' : 'Radar',
          tabBarIcon: ({ color, size }) =>
            isVendor ? <Signal color={color} size={size + 2} /> : <Compass color={color} size={size + 2} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'Puestos',
          href: isVendor ? null : undefined,
          tabBarAccessibilityLabel: 'Puestos',
          tabBarIcon: ({ color, size }) => <List color={color} size={size + 2} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Productos',
          href: isVendor ? undefined : null,
          tabBarAccessibilityLabel: 'Productos',
          tabBarIcon: ({ color, size }) => <Store color={color} size={size + 2} />,
        }}
      />
      <Tabs.Screen
        name="promotions"
        options={{
          title: 'Promos',
          href: isVendor ? undefined : null,
          tabBarAccessibilityLabel: 'Promociones',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size + 2} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Ventas',
          href: isVendor ? undefined : null,
          tabBarAccessibilityLabel: 'Ventas',
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size + 2} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Planes',
          href: null,
          tabBarAccessibilityLabel: 'Planes',
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size + 2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarAccessibilityLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size + 2} />,
        }}
      />
    </Tabs>
  );
}
