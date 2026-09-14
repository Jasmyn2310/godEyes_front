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
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import {
  Activity,
  Compass,
  DollarSign,
  MapPin,
  Navigation,
  Package,
  Power,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Signal,
  Store,
  Tag,
} from 'lucide-react-native';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { socketService } from '@/core/services/socket';
import {
  vendorApiService,
  type ProductItem,
  type SalesSummary,
  type UserProfile,
} from '@/features/vendor/services/vendor-api.service';

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
  const router = useRouter();
  const { user, userToken } = useAuthStore();
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [lastBroadcastTime, setLastBroadcastTime] = useState<string | null>(null);
  const [serverConnected, setServerConnected] = useState<boolean>(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);

  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const loadRealData = useCallback(async () => {
    if (!userToken) return;
    setIsLoadingStats(true);
    try {
      const [profileData, summaryData, productsData] = await Promise.allSettled([
        vendorApiService.getProfile(userToken),
        vendorApiService.getSalesSummary(userToken),
        vendorApiService.getProducts(userToken),
      ]);

      if (profileData.status === 'fulfilled') {
        setProfile(profileData.value);
        if (profileData.value.fixedLatitude && profileData.value.fixedLongitude && !coords) {
          setCoords({
            latitude: profileData.value.fixedLatitude,
            longitude: profileData.value.fixedLongitude,
            accuracy: 5.0,
            speed: 0,
          });
        }
      }

      if (summaryData.status === 'fulfilled') {
        setSalesSummary(summaryData.value);
      }

      if (productsData.status === 'fulfilled') {
        setProductsCount(productsData.value.length);
      }
    } finally {
      setIsLoadingStats(false);
    }
  }, [userToken, coords]);

  useEffect(() => {
    socketService.connect();
    setServerConnected(true);
    void loadRealData();

    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
      socketService.disconnect();
      setServerConnected(false);
    };
  }, [loadRealData]);

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
        if (Platform.OS === 'web') {
          alert('Permiso de Ubicación Necesario para transmitir en el mapa.');
        } else {
          Alert.alert(
            'Permiso Necesario',
            'GodEyes requiere acceso a tu ubicación para que los clientes vean tu puesto en el radar.',
          );
        }
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
      if (Platform.OS === 'web') {
        alert('No se pudo capturar la señal GPS. Verifica los permisos de tu navegador.');
      } else {
        Alert.alert('Error de GPS', 'No se pudo obtener la posición satelital del dispositivo.');
      }
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
      await loadRealData();
    } catch {
      if (Platform.OS === 'web') {
        alert('No se pudo actualizar la posición en este momento.');
      } else {
        Alert.alert('Aviso', 'No se pudo actualizar la posición en este momento.');
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const vendorDisplayName = profile?.name || user?.name || 'Mi Puesto GodEyes';
  const vendorTypeBadge = profile?.vendorType || 'Comercio Ambulante';
  const vendorAddressText = profile?.fixedAddress || 'Ubicación móvil';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.storeAvatar}>
              <Store size={22} color="#0284C7" />
            </View>
            <View style={styles.statusPill}>
              <View
                style={[
                  styles.statusDot,
                  serverConnected ? styles.statusDotOnline : styles.statusDotOffline,
                ]}
              />
              <Text style={styles.statusPillText}>
                {serverConnected ? 'Servidor Conectado' : 'Reconectando'}
              </Text>
            </View>
          </View>

          <Text style={styles.vendorGreeting}>PANEL DE OPERACIÓN</Text>
          <Text style={styles.vendorName}>{vendorDisplayName}</Text>

          <View style={styles.tagRow}>
            <View style={styles.tagBadge}>
              <Tag size={12} color="#0284C7" />
              <Text style={styles.tagBadgeText}>{vendorTypeBadge}</Text>
            </View>
            <View style={styles.addressBadge}>
              <MapPin size={12} color="#64748B" />
              <Text style={styles.addressBadgeText} numberOfLines={1}>
                {vendorAddressText}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsSummaryContainer}>
          <View style={styles.statBox}>
            <View style={styles.statIconWrap}>
              <DollarSign size={16} color="#059669" />
            </View>
            <Text style={styles.statValue}>
              ${(salesSummary?.todayTotal ?? 0).toFixed(2)}
            </Text>
            <Text style={styles.statTitle}>Ventas de Hoy</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <ShoppingBag size={16} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{salesSummary?.todayCount ?? 0}</Text>
            <Text style={styles.statTitle}>Órdenes Hoy</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FAF5FF' }]}>
              <Package size={16} color="#9333EA" />
            </View>
            <Text style={styles.statValue}>{productsCount}</Text>
            <Text style={styles.statTitle}>Catálogo</Text>
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
                <Signal size={26} color="#059669" />
              ) : (
                <Power size={26} color="#64748B" />
              )}
            </View>
            <View style={styles.heroStateLabels}>
              <Text
                style={[
                  styles.heroStateTag,
                  isTransmitting ? styles.heroStateTagActive : styles.heroStateTagInactive,
                ]}
              >
                {isTransmitting ? 'EN LÍNEA • BALIZA ACTIVA' : 'PAUSADO • FUERA DEL RADAR'}
              </Text>
              <Text style={styles.heroTitle}>
                {isTransmitting ? 'Puesto Visible a Clientes' : 'Baliza Satelital Apagada'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroDescription}>
            {isTransmitting
              ? 'Tus clientes pueden ver tu posición en vivo en el radar y seguir tu desplazamiento en tiempo real.'
              : 'Enciende tu baliza para transmitir tu ubicación y aparecer en el mapa satelital de los clientes.'}
          </Text>

          <Pressable
            onPress={handleToggleTransmission}
            disabled={isLoadingLocation}
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
              <Text style={styles.ctaText}>
                {isTransmitting ? 'Pausar Transmisión' : 'Transmitir mi Puesto en Vivo'}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionHeaderTitle}>Accesos Rápidos</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable
              onPress={() => router.push('/(tabs)/sales')}
              style={({ pressed }) => [
                styles.quickActionButton,
                pressed ? styles.quickActionPressed : null,
              ]}
            >
              <Text style={styles.quickActionTitle}>Registrar Venta</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/products')}
              style={({ pressed }) => [
                styles.quickActionButton,
                pressed ? styles.quickActionPressed : null,
              ]}
            >
              <Text style={styles.quickActionTitle}>Gestionar Menú</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>Telemetría GPS en Vivo</Text>
          <Pressable
            onPress={handleManualRefresh}
            disabled={isLoadingLocation}
            style={styles.refreshButton}
            accessibilityLabel="Refrescar telemetría"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RefreshCw size={16} color="#0284C7" />
          </Pressable>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MapPin size={16} color="#0284C7" />
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
              <Compass size={16} color="#059669" />
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
              <Navigation size={16} color="#D97706" />
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
              <Activity size={16} color="#7C3AED" />
              <Text style={styles.metricLabel}>Último Enlace</Text>
            </View>
            <Text style={styles.metricValue}>{lastBroadcastTime || 'En espera'}</Text>
            <Text style={styles.metricSub}>Socket sincronizado</Text>
          </View>
        </View>

        <View style={styles.securityNoticeCard}>
          <ShieldCheck size={20} color="#0284C7" style={styles.securityIcon} />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Privacidad y Control</Text>
            <Text style={styles.securityText}>
              Tu ubicación solo se comparte mientras la baliza esté encendida. Al pausarla, ningún
              cliente tiene acceso a tu posición en tiempo real.
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  storeAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  statusDotOnline: {
    backgroundColor: '#10B981',
  },
  statusDotOffline: {
    backgroundColor: '#94A3B8',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  vendorGreeting: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.8,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  addressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: '65%',
  },
  addressBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  statsSummaryContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
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
    marginBottom: 12,
  },
  beaconIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  beaconActiveIcon: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  beaconInactiveIcon: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroStateLabels: {
    flex: 1,
  },
  heroStateTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  heroStateTagActive: {
    color: '#059669',
  },
  heroStateTagInactive: {
    color: '#64748B',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 16,
  },
  ctaButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonStart: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonStop: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionPressed: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.98 }],
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  metricSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  securityNoticeCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'flex-start',
    gap: 10,
  },
  securityIcon: {
    marginTop: 2,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 2,
  },
  securityText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
});
