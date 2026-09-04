import React, { useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocationStore } from '@/features/map/store/location-store';
import { useVendorsStore, Vendor } from '@/features/map/store/vendors-store';

export default function ListScreen() {
  const { currentLocation } = useLocationStore();
  const { vendors, fetchVendors, isLoading } = useVendorsStore();

  useEffect(() => {
    fetchVendors();
  }, []);

  const renderItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.type}</Text>
          </View>
        </View>
        
        <View style={styles.detailsRow}>
          <Text style={styles.price}>{item.priceRange}</Text>
          <View style={styles.dot} />
          {/* Aquí se calcularía la distancia real si estuviera en producción */}
          <Text style={styles.distance}>Cerca de ti</Text> 
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Descubre</Text>
        <Text style={styles.subtitle}>
          {currentLocation ? 'Trabajadores cerca de tu ubicación' : 'Encuentra los mejores servicios'}
        </Text>
      </View>

      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <FlashList
            data={vendors}
            renderItem={renderItem}
            estimatedItemSize={120}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    backgroundColor: '#F8FAFC', // Slate 50
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A', // Slate 900
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B', // Slate 500
    marginTop: 4,
    fontWeight: '500',
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2E8F0',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B', // Slate 800
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#EFF6FF', // Blue 50
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#2563EB', // Blue 600
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    color: '#10B981', // Emerald 500
    fontWeight: '600',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1', // Slate 300
    marginHorizontal: 8,
  },
  distance: {
    fontSize: 14,
    color: '#64748B', // Slate 500
    fontWeight: '500',
  },
  separator: {
    height: 16,
  },
});
