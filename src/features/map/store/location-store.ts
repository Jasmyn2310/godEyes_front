import { create } from 'zustand';
import * as Location from 'expo-location';

interface LocationState {
  currentLocation: Location.LocationObject | null;
  hasPermissions: boolean;
  errorMsg: string | null;
  isLoading: boolean;
  setLocation: (location: Location.LocationObject) => void;
  requestPermissionsAndFetchLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  hasPermissions: false,
  errorMsg: null,
  isLoading: false,

  setLocation: (location) => set({ currentLocation: location }),

  requestPermissionsAndFetchLocation: async () => {
    set({ isLoading: true, errorMsg: null });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({
          hasPermissions: false,
          errorMsg: 'Se denegó el permiso para acceder a la ubicación.',
          isLoading: false,
        });
        return;
      }

      set({ hasPermissions: true });

      const location = await Location.getCurrentPositionAsync({});
      set({ currentLocation: location, isLoading: false });
    } catch (error) {
      set({
        errorMsg: 'Ocurrió un error al intentar obtener la ubicación.',
        isLoading: false,
      });
      console.error('Error fetching location:', error);
    }
  },
}));
