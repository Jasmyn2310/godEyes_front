import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveBaseUrl(): string {
  // 1. Prioridad absoluta: Variable de entorno (para Vercel / producción)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/$/, '');
  }

  // 2. Si corre en Web localmente
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:3000`;
  }

  // 3. Expo Go (Dispositivo físico / red local)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000`;
    }
  }

  // 4. Android Emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // 5. Fallback por defecto
  return 'http://localhost:3000';
}

export const API_BASE_URL = resolveBaseUrl();

// ... (el objeto ENDPOINTS déjalo tal cual lo tienes abajo)