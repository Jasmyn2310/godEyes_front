import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:3000`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000`;
    }
  }

  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/$/, '');
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}

export const API_BASE_URL = resolveBaseUrl();

export const ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    me: `${API_BASE_URL}/auth/me`,
  },
  users: {
    profile: `${API_BASE_URL}/users/profile`,
  },
  catalog: {
    categories: `${API_BASE_URL}/categories`,
    products: `${API_BASE_URL}/products`,
  },
  promotions: `${API_BASE_URL}/promotions`,
  sales: {
    base: `${API_BASE_URL}/sales`,
    summary: `${API_BASE_URL}/sales/summary`,
  },
  uploads: {
    image: `${API_BASE_URL}/uploads/image`,
  },
  vendors: {
    list: `${API_BASE_URL}/vendors`,
    detail: (id: string) => `${API_BASE_URL}/vendors/${id}/detail`,
  },
  subscriptions: {
    plans: `${API_BASE_URL}/subscriptions/plans`,
  },
  admin: {
    dashboardStats: `${API_BASE_URL}/admin/dashboard-stats`,
  },
} as const;
