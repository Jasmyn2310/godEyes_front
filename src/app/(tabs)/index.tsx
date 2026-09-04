import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocationStore } from '@/features/map/store/location-store';
import { OSMMap } from '@/components/OSMMap';
import { useVendorsStore } from '@/features/map/store/vendors-store';
import { socketService } from '@/core/services/socket';
export default function MapScreen() {
  const { currentLocation, isLoading, errorMsg, requestPermissionsAndFetchLocation } = useLocationStore();
  const { vendors, fetchVendors, updateVendors } = useVendorsStore();

  useEffect(() => {
    requestPermissionsAndFetchLocation();
    fetchVendors(); // Initial fetch from DB
  }, []);

  // Connect to socket when component mounts
  useEffect(() => {
    socketService.connect();

    socketService.onVendorsUpdated((updatedVendors) => {
      // Assuming socket updates have same structure as DB or we merge them
      // For now, let's keep DB data as base, and only update positions for connected vendors
      // If backend sends full vendor objects, just replace:
      // updateVendors(updatedVendors);
    });

    return () => {
      socketService.offVendorsUpdated();
      socketService.disconnect();
    };
  }, []);

  // Emitir mi ubicación al backend cada vez que cambie significativamente
  useEffect(() => {
    if (currentLocation) {
      const lat = currentLocation.coords.latitude;
      const lng = currentLocation.coords.longitude;
      
      const myVendorId = 'vendor-' + Math.floor(Math.random() * 1000);
      
      socketService.emitLocation(myVendorId, lat, lng, true);
    }
  }, [currentLocation]);

  if (isLoading && !currentLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Obteniendo tu ubicación y cargando mapa...</Text>
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
      <OSMMap 
        initialRegion={
          currentLocation
            ? {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
              }
            : undefined
        }
        vendors={vendors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
