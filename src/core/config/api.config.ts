import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveBaseUrl(): string {
  // Si estamos en Vercel (en web o compilando para producción), forzamos directamente Render
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    if (window.location.hostname.includes('vercel.app')) {
      return 'https://god-eyes-backs.onrender.com';
    }
    return `http://${window.location.hostname}:3000`;
  }

  // Si por alguna razón corre en otro entorno, revisamos la variable de entorno
  const envUrl = process.env.EXPO_PUBLIC_API_URL || (Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/$/, '');
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'https://god-eyes-backs.onrender.com';
}

export const API_BASE_URL = resolveBaseUrl();