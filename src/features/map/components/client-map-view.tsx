import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Compass, RefreshCw } from 'lucide-react-native';
import { useLocationStore } from '@/features/map/store/location-store';
import { useVendorsStore } from '@/features/map/store/vendors-store';
import { socketService } from '@/core/services/socket';
import { OSMMap } from '@/components/OSMMap';
import { VendorDetailModal } from '@/features/vendor/components/vendor-detail-modal';

const CATEGORIES = ['Todos', 'Desayuno', 'Snack', 'Bebidas', 'Postres', 'Almuerzo'] as const;

export const ClientMapView: React.FC = () => {
  const { currentLocation, isLoading, errorMsg, requestPermissionsAndFetchLocation } =
    useLocationStore();
  const { vendors, selectedVendor, fetchVendors, updateVendors, setSelectedVendor } =
    useVendorsStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [detailModalVendorId, setDetailModalVendorId] = useState<string | null>(null);

  useEffect(() => {
    void requestPermissionsAndFetchLocation();
    void fetchVendors();
  }, [requestPermissionsAndFetchLocation, fetchVendors]);

  useEffect(() => {
    socketService.connect();

    socketService.onVendorsUpdated((updates) => {
      if (!Array.isArray(updates) || updates.length === 0) {
        return;
      }

      const currentVendors = useVendorsStore.getState().vendors;
      const updatesMap = new Map(updates.map((item) => [item.vendorId, item]));

      const nextVendors = currentVendors.map((vendor) => {
        const matchingUpdate = updatesMap.get(vendor.id);
        if (matchingUpdate) {
          return {
            ...vendor,
            lat: matchingUpdate.lat,
            lng: matchingUpdate.lng,
            isLive: true,
            locationType: 'realtime' as const,
          };
        }
        return vendor;
      });

      updateVendors(nextVendors);
    });

    return () => {
      socketService.offVendorsUpdated();
      socketService.disconnect();
    };
  }, [updateVendors]);

  const filteredVendors = useMemo(() => {
    if (selectedCategory === 'Todos') {
      return vendors;
    }
    return vendors.filter(
      (vendor) => vendor.type?.toLowerCase() === selectedCategory.toLowerCase(),
    );
  }, [vendors, selectedCategory]);

  const handleSelectVendorFromMap = (vendorId: string) => {
    setDetailModalVendorId(vendorId);
  };

  if (isLoading && !currentLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Localizando tu posición y cargando mapa...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed ? styles.retryButtonPressed : null]}
          onPress={requestPermissionsAndFetchLocation}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Reintentar obtener ubicación"
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <View style={styles.searchBarContainer}>
          <Compass size={18} color="#0284C7" style={styles.searchIcon} />
          <Text style={styles.topBarTitle}>Radar de Puestos Cercanos</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredVendors.length} disponibles</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={({ pressed }) => [
                  styles.filterChip,
                  isSelected ? styles.filterChipSelected : null,
                  pressed ? styles.filterChipPressed : null,
                ]}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${category}`}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected ? styles.filterChipTextSelected : null,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.mapWrapper}>
        <OSMMap
          initialRegion={
            currentLocation
              ? {
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                }
              : {
                  latitude: -13.1606,
                  longitude: -74.2258,
                }
          }
          vendors={filteredVendors}
          focusVendor={selectedVendor}
          onSelectVendor={handleSelectVendorFromMap}
        />
      </View>

      <Pressable
        onPress={() => fetchVendors()}
        style={({ pressed }) => [styles.floatingRefresh, pressed ? styles.floatingPressed : null]}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Actualizar radar de puestos"
      >
        <RefreshCw size={20} color="#0F172A" />
      </Pressable>

      <VendorDetailModal
        vendorId={detailModalVendorId}
        visible={Boolean(detailModalVendorId)}
        onClose={() => setDetailModalVendorId(null)}
        onFocusOnMap={(lat, lng) => {
          const target = vendors.find((v) => v.id === detailModalVendorId);
          if (target) {
            setSelectedVendor({ ...target, lat, lng });
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  topBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterChipPressed: {
    opacity: 0.8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  mapWrapper: {
    flex: 1,
  },
  floatingRefresh: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 20,
  },
  floatingPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
