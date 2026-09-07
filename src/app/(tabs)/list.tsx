import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  MapPin,
  Navigation,
  Search,
  Star,
  Store,
  X,
} from 'lucide-react-native';
import { useLocationStore } from '@/features/map/store/location-store';
import { useVendorsStore, Vendor } from '@/features/map/store/vendors-store';
import { useAuthStore } from '@/features/auth/store/auth-store';

const CATEGORIES = ['Todos', 'Desayuno', 'Snack', 'Bebidas', 'Almuerzo', 'Postres'] as const;

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

interface VendorWithDistance extends Vendor {
  readonly distanceKm: number | null;
}

interface VendorCardProps {
  readonly vendor: VendorWithDistance;
  readonly onLocate: (vendor: VendorWithDistance) => void;
}

const VendorCard = React.memo<VendorCardProps>(({ vendor, onLocate }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Image
          source={{ uri: vendor.photoUrl }}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.vendorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {vendor.name}
            </Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{vendor.type}</Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingScore}>{vendor.rating ?? 4.8}</Text>
            </View>
            <Text style={styles.reviewsCount}>({vendor.reviewsCount ?? 45} opiniones)</Text>
            <View style={styles.dotSeparator} />
            <Text style={styles.priceRangeText}>{vendor.priceRange}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.distanceBadge}>
          <MapPin size={14} color="#0284C7" />
          <Text style={styles.distanceText}>
            {vendor.distanceKm !== null ? `A ${formatDistance(vendor.distanceKm)} de ti` : 'Ubicación activa'}
          </Text>
        </View>

        <Pressable
          onPress={() => onLocate(vendor)}
          style={({ pressed }) => [styles.locateButton, pressed ? styles.locateButtonPressed : null]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Ubicar puesto de ${vendor.name} en el mapa`}
        >
          <Navigation size={14} color="#FFFFFF" />
          <Text style={styles.locateButtonText}>Ubicar en Mapa</Text>
        </Pressable>
      </View>
    </View>
  );
});

export default function ListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentLocation } = useLocationStore();
  const { vendors, fetchVendors, setSelectedVendor, isLoading } = useVendorsStore();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  useEffect(() => {
    void fetchVendors();
  }, [fetchVendors]);

  const processedVendors = useMemo(() => {
    let list: VendorWithDistance[] = vendors.map((vendor) => {
      let distanceKm: number | null = null;
      if (currentLocation) {
        distanceKm = calculateDistanceKm(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          vendor.lat,
          vendor.lng,
        );
      }
      return {
        ...vendor,
        distanceKm,
      };
    });

    if (selectedCategory !== 'Todos') {
      list = list.filter((v) => v.type?.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter(
        (v) =>
          v.name?.toLowerCase().includes(query) ||
          v.type?.toLowerCase().includes(query) ||
          v.priceRange?.toLowerCase().includes(query),
      );
    }

    if (currentLocation) {
      list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    return list;
  }, [vendors, currentLocation, selectedCategory, searchQuery]);

  const handleLocateVendor = useCallback(
    (vendor: VendorWithDistance) => {
      setSelectedVendor(vendor);
      router.replace('/(tabs)');
    },
    [router, setSelectedVendor],
  );

  const renderItem = useCallback(
    ({ item }: { item: VendorWithDistance }) => (
      <VendorCard vendor={item} onLocate={handleLocateVendor} />
    ),
    [handleLocateVendor],
  );

  const isVendor = user?.role === 'vendor';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Store size={22} color="#0284C7" style={styles.headerIcon} />
          <View>
            <Text style={styles.title}>Mejores Puestos</Text>
            <Text style={styles.subtitle}>
              {isVendor
                ? 'Directorio de referencia de servicios'
                : 'Puestos valorados y ordenados por cercanía'}
            </Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, comida o precio..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                style={({ pressed }) => [
                  styles.categoryPill,
                  isSelected ? styles.categoryPillActive : null,
                  pressed ? styles.categoryPillPressed : null,
                ]}
                onPress={() => setSelectedCategory(category)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar categoría ${category}`}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected ? styles.categoryPillTextActive : null,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={styles.loadingText}>Cargando puestos destacados...</Text>
          </View>
        ) : processedVendors.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptySubtitle}>
              No se encontraron puestos que coincidan con tu búsqueda.
            </Text>
          </View>
        ) : (
          <FlashList
            data={processedVendors}
            renderItem={renderItem}
            estimatedItemSize={140}
            contentContainerStyle={styles.flashListContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  categoriesContainer: {
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  categoryPillPressed: {
    opacity: 0.8,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
  },
  flashListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  vendorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vendorName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  reviewsCount: {
    fontSize: 12,
    color: '#64748B',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  priceRangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  locateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    minHeight: 36,
  },
  locateButtonPressed: {
    backgroundColor: '#0369A1',
    transform: [{ scale: 0.98 }],
  },
  locateButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
