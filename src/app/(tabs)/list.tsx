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
  Signal,
  Star,
  Store,
  X,
} from 'lucide-react-native';
import { useLocationStore } from '@/features/map/store/location-store';
import { useVendorsStore, Vendor } from '@/features/map/store/vendors-store';
import { formatMediaUrl } from '@/features/vendor/services/vendor-api.service';
import { VendorDetailModal } from '@/features/vendor/components/vendor-detail-modal';

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
  readonly onOpenDetail: (vendor: VendorWithDistance) => void;
  readonly onLocate: (vendor: VendorWithDistance) => void;
}

const VendorCard = React.memo<VendorCardProps>(({ vendor, onOpenDetail, onLocate }) => {
  const isLive = vendor.isLive || vendor.locationType === 'realtime';

  return (
    <Pressable
      onPress={() => onOpenDetail(vendor)}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      <View style={styles.cardHeaderRow}>
        {vendor.photoUrl ? (
          <Image
            source={{ uri: formatMediaUrl(vendor.photoUrl) }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Store size={26} color="#0284C7" />
          </View>
        )}

        <View style={styles.vendorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {vendor.name}
            </Text>
            {isLive ? (
              <View style={styles.liveTag}>
                <Signal size={10} color="#15803D" />
                <Text style={styles.liveTagText}>EN VIVO</Text>
              </View>
            ) : (
              <View style={styles.fixedTag}>
                <MapPin size={10} color="#0369A1" />
                <Text style={styles.fixedTagText}>PUESTO FIJO</Text>
              </View>
            )}
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingScore}>{vendor.rating ?? 4.8}</Text>
            </View>
            <Text style={styles.reviewsCount}>({vendor.reviewsCount ?? 45})</Text>
            <View style={styles.dotSeparator} />
            <Text style={styles.categoryBadgeText}>{vendor.type || 'Comercio'}</Text>
          </View>

          {vendor.fixedAddress ? (
            <Text style={styles.addressText} numberOfLines={1}>
              {vendor.fixedAddress}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.distanceBadge}>
          <MapPin size={13} color="#0284C7" />
          <Text style={styles.distanceText}>
            {vendor.distanceKm !== null
              ? `A ${formatDistance(vendor.distanceKm)} de ti`
              : 'Ubicación activa'}
          </Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onLocate(vendor);
            }}
            style={({ pressed }) => [
              styles.locateIconButton,
              pressed ? styles.locateButtonPressed : null,
            ]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Ubicar puesto de ${vendor.name} en el mapa`}
          >
            <Navigation size={14} color="#0284C7" />
          </Pressable>

          <Pressable
            onPress={() => onOpenDetail(vendor)}
            style={({ pressed }) => [
              styles.detailButton,
              pressed ? styles.detailButtonPressed : null,
            ]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Ver menú y promociones de ${vendor.name}`}
          >
            <Text style={styles.detailButtonText}>Ver Catálogo</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

export default function ListScreen() {
  const router = useRouter();
  const { currentLocation } = useLocationStore();
  const { vendors, fetchVendors, setSelectedVendor, isLoading } = useVendorsStore();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedVendorForModal, setSelectedVendorForModal] =
    useState<VendorWithDistance | null>(null);

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

  const handleOpenDetail = useCallback((vendor: VendorWithDistance) => {
    setSelectedVendorForModal(vendor);
  }, []);

  const handleLocateVendor = useCallback(
    (vendor: VendorWithDistance) => {
      setSelectedVendor(vendor);
      router.replace('/(tabs)');
    },
    [router, setSelectedVendor],
  );

  const renderItem = useCallback(
    ({ item }: { item: VendorWithDistance }) => (
      <VendorCard
        vendor={item}
        onOpenDetail={handleOpenDetail}
        onLocate={handleLocateVendor}
      />
    ),
    [handleOpenDetail, handleLocateVendor],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Store size={22} color="#0284C7" style={styles.headerIcon} />
          <View>
            <Text style={styles.title}>Mejores Puestos</Text>
            <Text style={styles.subtitle}>
              Explora cartas, productos y promociones de cada vendedor
            </Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, comida o precio..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  isSelected ? styles.categoryChipSelected : null,
                  pressed ? styles.categoryChipPressed : null,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected ? styles.categoryChipTextSelected : null,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && vendors.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Cargando puestos disponibles...</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={processedVendors}
            renderItem={renderItem}
            estimatedItemSize={140}
            keyExtractor={(item: VendorWithDistance) => item.id}
            contentContainerStyle={styles.flashListContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Store size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No se encontraron puestos</Text>
                <Text style={styles.emptySubtitle}>
                  Intenta cambiar el término de búsqueda o seleccionar otra categoría.
                </Text>
              </View>
            }
          />
        </View>
      )}

      <VendorDetailModal
        vendorId={selectedVendorForModal?.id ?? null}
        distanceText={
          selectedVendorForModal?.distanceKm !== null && selectedVendorForModal?.distanceKm !== undefined
            ? formatDistance(selectedVendorForModal.distanceKm)
            : null
        }
        visible={Boolean(selectedVendorForModal)}
        onClose={() => setSelectedVendorForModal(null)}
        onFocusOnMap={() => {
          if (selectedVendorForModal) {
            handleLocateVendor(selectedVendorForModal);
          }
        }}
      />
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 6,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  categoryChipPressed: {
    opacity: 0.8,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextSelected: {
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
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.95,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  fixedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fixedTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369A1',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  reviewsCount: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 3,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  addressText: {
    fontSize: 11,
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 8,
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
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locateIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateButtonPressed: {
    opacity: 0.7,
  },
  detailButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  detailButtonPressed: {
    opacity: 0.8,
  },
  detailButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});
