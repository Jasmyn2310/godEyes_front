import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocationStore } from '@/features/map/store/location-store';

// Modelo simulado, después vendrá del Backend (NestJS / FastAPI)
interface Vendor {
  id: string;
  name: string;
  type: string;
  priceRange: string;
  distance: string;
}

const MOCK_DATA: Vendor[] = [
  { id: '1', name: 'Desayunos Doña Flor', type: 'Desayuno', priceRange: '$1 - $3', distance: '120m' },
  { id: '2', name: 'Empanadas El Tío', type: 'Snack', priceRange: '$0.5 - $2', distance: '250m' },
  { id: '3', name: 'Jugos Naturales', type: 'Bebidas', priceRange: '$1.5', distance: '400m' },
];

export default function ListScreen() {
  const { currentLocation } = useLocationStore();

  const renderItem = ({ item }: { item: Vendor }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.type}>{item.type} • {item.priceRange}</Text>
      <Text style={styles.distance}>A {item.distance} de ti</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Vendedores Cercanos</Text>
        
        {currentLocation ? (
          <Text style={styles.subHeader}>Mostrando resultados cerca de tu ubicación actual</Text>
        ) : (
          <Text style={styles.subHeader}>Esperando ubicación...</Text>
        )}

        <View style={styles.listContainer}>
          <FlashList
            data={MOCK_DATA}
            renderItem={renderItem}
            estimatedItemSize={100}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Tailwind gray-100 fallback
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827', // Tailwind gray-900
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 14,
    color: '#6B7280', // Tailwind gray-500
    marginBottom: 16,
  },
  listContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  distance: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB', // Tailwind blue-600
  },
  separator: {
    height: 12,
  },
});
