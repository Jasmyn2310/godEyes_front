import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useLocationStore } from '@/features/map/store/location-store';

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const { currentLocation, isLoading, errorMsg, requestPermissionsAndFetchLocation } = useLocationStore();
  
  // Estado para simular vendedores moviéndose
  const [vendors, setVendors] = useState([
    { id: '1', name: 'Desayunos Doña Flor', lat: 0, lng: 0 },
    { id: '2', name: 'Empanadas El Tío', lat: 0, lng: 0 },
  ]);

  useEffect(() => {
    requestPermissionsAndFetchLocation();
  }, []);

  // Centrar el mapa y setear posiciones iniciales de los vendedores basadas en el usuario
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      const lat = currentLocation.coords.latitude;
      const lng = currentLocation.coords.longitude;
      
      mapRef.current.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Posicionar vendedores de prueba un poco alejado del usuario
      setVendors([
        { id: '1', name: 'Desayunos Doña Flor', lat: lat + 0.001, lng: lng + 0.002 },
        { id: '2', name: 'Empanadas El Tío', lat: lat - 0.002, lng: lng - 0.001 },
      ]);
    }
  }, [currentLocation]);

  // Simular movimiento en "tiempo real" cada 2 segundos
  useEffect(() => {
    if (!currentLocation) return;
    
    const interval = setInterval(() => {
      setVendors((prev) => 
        prev.map(v => ({
          ...v,
          lat: v.lat + (Math.random() - 0.5) * 0.0002,
          lng: v.lng + (Math.random() - 0.5) * 0.0002,
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [currentLocation]);

  if (isLoading && !currentLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Obteniendo tu ubicación...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestPermissionsAndFetchLocation}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={true}
        showsMyLocationButton={true}
        initialRegion={
          currentLocation
            ? {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : undefined
        }
      >
        {/* Renderizar vendedores en el mapa */}
        {vendors.map((vendor) => (
          <Marker 
            key={vendor.id} 
            coordinate={{ latitude: vendor.lat, longitude: vendor.lng }} 
            title={vendor.name}
            description="Moviéndose en tiempo real"
            pinColor="green"
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
