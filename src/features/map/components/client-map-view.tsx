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
import { Compass, Filter, RefreshCw } from 'lucide-react-native';
import { useLocationStore } from '@/features/map/store/location-store';
import { useVendorsStore } from '@/features/map/store/vendors-store';
import { socketService } from '@/core/services/socket';
import { OSMMap } from '@/components/OSMMap';

const CATEGORIES = ['Todos', 'Desayuno', 'Snack', 'Bebidas', 'Postres', 'Almuerzo'] as const;

export const ClientMapView: React.FC = () => {
  const { currentLocation, isLoading, errorMsg, requestPermissionsAndFetchLocation } =
    useLocationStore();
  const { vendors, selectedVendor, fetchVendors, updateVendors } = useVendorsStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

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
          accessible={true}
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
            <Text style={styles.countText}>{filteredVendors.length} activos</Text>
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
                accessible={true}
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
              : undefined
          }
          vendors={filteredVendors}
          focusVendor={selectedVendor}
        />
      </View>

      <Pressable
        onPress={() => fetchVendors()}
        style={({ pressed }) => [styles.floatingRefresh, pressed ? styles.floatingPressed : null]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Actualizar radar de puestos"
      >
        <RefreshCw size={20} color="#0F172A" />
      </Pressable>
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
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
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
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  mapWrapper: {
    flex: 1,
  },
  floatingRefresh: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  floatingPressed: {
    backgroundColor: '#F1F5F9',
    transform: [{ scale: 0.95 }],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 15,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonPressed: {
    backgroundColor: '#0369A1',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
