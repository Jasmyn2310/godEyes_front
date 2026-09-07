import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import {
  Activity,
  CheckCircle2,
  Compass,
  MapPin,
  Navigation,
  Power,
  Radio,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { socketService } from '@/core/services/socket';

interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy: number | null;
  readonly speed: number | null;
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export const VendorOperationView: React.FC = () => {
  const { user } = useAuthStore();
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [lastBroadcastTime, setLastBroadcastTime] = useState<string | null>(null);
  const [serverConnected, setServerConnected] = useState<boolean>(false);

  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    socketService.connect();
    setServerConnected(true);

    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
      socketService.disconnect();
      setServerConnected(false);
    };
  }, []);

  const broadcastLocation = useCallback(
    (latitude: number, longitude: number) => {
      if (!user?.id || !isValidCoordinate(latitude, longitude)) {
        return;
      }

      socketService.emitLocation(user.id, latitude, longitude, true);
      const now = new Date();
      setLastBroadcastTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      );
    },
    [user?.id],
  );

  const startTransmitting = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso de Ubicación Necesario',
          'GodEyes requiere acceso a tu ubicación para que tus clientes puedan encontrar tu puesto en el mapa en tiempo real.',
        );
        setIsLoadingLocation(false);
        return;
      }

      const initialPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const initialCoords: Coordinates = {
        latitude: initialPosition.coords.latitude,
        longitude: initialPosition.coords.longitude,
        accuracy: initialPosition.coords.accuracy,
        speed: initialPosition.coords.speed,
      };

      setCoords(initialCoords);
      broadcastLocation(initialCoords.latitude, initialCoords.longitude);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 4000,
          distanceInterval: 3,
        },
        (newLocation) => {
          const updatedCoords: Coordinates = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy,
            speed: newLocation.coords.speed,
          };
          setCoords(updatedCoords);
          broadcastLocation(updatedCoords.latitude, updatedCoords.longitude);
        },
      );

      locationSubscriptionRef.current = subscription;
      setIsTransmitting(true);
    } catch {
      Alert.alert(
        'Error de GPS',
        'No se pudo obtener la posición satelital del dispositivo. Verifica que el GPS esté activo.',
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const stopTransmitting = () => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
    setIsTransmitting(false);
  };

  const handleToggleTransmission = () => {
    if (isTransmitting) {
      stopTransmitting();
    } else {
      void startTransmitting();
    }
  };

  const handleManualRefresh = async () => {
    if (isLoadingLocation) return;
    setIsLoadingLocation(true);
    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const updated: Coordinates = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy,
        speed: current.coords.speed,
      };
      setCoords(updated);
      if (isTransmitting) {
        broadcastLocation(updated.latitude, updated.longitude);
      }
    } catch {
      Alert.alert('Aviso', 'No se pudo actualizar la posición en este momento.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.vendorGreeting}>Panel de Operación</Text>
            <Text style={styles.vendorName}>{user?.name || 'Mi Puesto GodEyes'}</Text>
          </View>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                serverConnected ? styles.statusDotOnline : styles.statusDotOffline,
              ]}
            />
            <Text style={styles.statusText}>
              {serverConnected ? 'Servidor Conectado' : 'Reconectando'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.heroCard,
            isTransmitting ? styles.heroCardActive : styles.heroCardInactive,
          ]}
        >
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.beaconIconContainer,
                isTransmitting ? styles.beaconActiveIcon : styles.beaconInactiveIcon,
              ]}
            >
              {isTransmitting ? (
                <Radio size={28} color="#10B981" />
              ) : (
                <Power size={28} color="#64748B" />
              )}
            </View>
            <View style={styles.heroStateLabels}>
              <Text
                style={[
                  styles.heroStateTag,
                  isTransmitting ? styles.heroStateTagActive : styles.heroStateTagInactive,
                ]}
              >
                {isTransmitting ? 'EN LÍNEA • TRANSMITIENDO' : 'PAUSADO • INACTIVO'}
              </Text>
              <Text style={styles.heroTitle}>
                {isTransmitting ? 'Puesto Visible al Público' : 'Baliza GPS Apagada'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroDescription}>
            {isTransmitting
              ? 'Tu ubicación en vivo está siendo transmitida a los clientes de GodEyes en un radio de cobertura de 500m.'
              : 'Tus clientes no pueden ver tu puesto en el radar. Enciende la baliza para comenzar a recibir visitas.'}
          </Text>

          <Pressable
            onPress={handleToggleTransmission}
            disabled={isLoadingLocation}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isTransmitting ? 'Detener transmisión' : 'Iniciar transmisión'}
            style={({ pressed }) => [
              styles.ctaButton,
              isTransmitting ? styles.ctaButtonStop : styles.ctaButtonStart,
              pressed ? styles.ctaButtonPressed : null,
              isLoadingLocation ? styles.ctaButtonDisabled : null,
            ]}
          >
            {isLoadingLocation ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.ctaContent}>
                {isTransmitting ? (
                  <>
                    <Power size={20} color="#FFFFFF" />
                    <Text style={styles.ctaText}>Pausar Transmisión</Text>
                  </>
                ) : (
                  <>
                    <Zap size={20} color="#FFFFFF" />
                    <Text style={styles.ctaText}>Transmitir mi Puesto</Text>
                  </>
                )}
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Telemetría en Vivo</Text>
          <Pressable
            onPress={handleManualRefresh}
            disabled={isLoadingLocation}
            style={styles.refreshButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <RefreshCw size={16} color="#0284C7" />
            <Text style={styles.refreshText}>Refrescar</Text>
          </Pressable>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MapPin size={18} color="#0284C7" />
              <Text style={styles.metricLabel}>Coordenadas</Text>
            </View>
            <Text style={styles.metricValue}>
              {coords
                ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
                : 'Sin señal GPS'}
            </Text>
            <Text style={styles.metricSub}>
              {coords ? 'Posición fijada' : 'Pulsa transmitir para capturar'}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Compass size={18} color="#059669" />
              <Text style={styles.metricLabel}>Precisión GPS</Text>
            </View>
            <Text style={styles.metricValue}>
              {coords?.accuracy ? `± ${coords.accuracy.toFixed(1)} m` : '--'}
            </Text>
            <Text style={styles.metricSub}>
              {coords?.accuracy && coords.accuracy < 10 ? 'Alta precisión' : 'Estándar'}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Navigation size={18} color="#D97706" />
              <Text style={styles.metricLabel}>Movimiento</Text>
            </View>
            <Text style={styles.metricValue}>
              {coords?.speed && coords.speed > 0.5
                ? `${(coords.speed * 3.6).toFixed(1)} km/h`
                : 'Puesto Fijo'}
            </Text>
            <Text style={styles.metricSub}>
              {coords?.speed && coords.speed > 0.5 ? 'En desplazamiento' : 'Estacionario'}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Activity size={18} color="#7C3AED" />
              <Text style={styles.metricLabel}>Último Enlace</Text>
            </View>
            <Text style={styles.metricValue}>{lastBroadcastTime || 'En espera'}</Text>
            <Text style={styles.metricSub}>Sincronización socket</Text>
          </View>
        </View>

        <View style={styles.securityNoticeCard}>
          <ShieldCheck size={20} color="#0284C7" style={styles.securityIcon} />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Privacidad y Seguridad Garantizada</Text>
            <Text style={styles.securityText}>
              Tus coordenadas solo se transmiten mientras mantengas la baliza encendida. Al pausar,
              ningún cliente ni tercero tiene acceso a tu ubicación.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  vendorGreeting: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vendorName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotOnline: {
    backgroundColor: '#10B981',
  },
  statusDotOffline: {
    backgroundColor: '#94A3B8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  heroCardActive: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  heroCardInactive: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  beaconIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  beaconActiveIcon: {
    backgroundColor: '#D1FAE5',
  },
  beaconInactiveIcon: {
    backgroundColor: '#F1F5F9',
  },
  heroStateLabels: {
    flex: 1,
  },
  heroStateTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  heroStateTagActive: {
    color: '#059669',
  },
  heroStateTagInactive: {
    color: '#64748B',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    marginBottom: 20,
  },
  ctaButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaButtonStart: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
  },
  ctaButtonStop: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  ctaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '48%',
    flexGrow: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  securityNoticeCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
  },
  securityIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 4,
  },
  securityText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#0C4A6E',
  },
});
