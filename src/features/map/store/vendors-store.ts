import { create } from 'zustand';

export interface Vendor {
  id: string;
  name: string;
  type: string;
  priceRange: string;
  photoUrl: string;
  lat: number;
  lng: number;
}

interface VendorsState {
  vendors: Vendor[];
  isLoading: boolean;
  errorMsg: string | null;
  fetchVendors: () => Promise<void>;
  updateVendors: (vendors: Vendor[]) => void;
}

// Adjust URL as needed (if testing on Android Emulator, use 10.0.2.2. If on real device, use local IP)
// Using local IP as fallback placeholder
const API_URL = 'http://192.168.1.100:3000/vendors';

export const useVendorsStore = create<VendorsState>((set) => ({
  vendors: [],
  isLoading: false,
  errorMsg: null,

  fetchVendors: async () => {
    set({ isLoading: true, errorMsg: null });
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      const data = await response.json();
      set({ vendors: data, isLoading: false });
    } catch (error) {
      set({
        errorMsg: 'No se pudieron cargar los vendedores. Asegúrate de estar conectado a la misma red y actualiza el API_URL.',
        isLoading: false,
      });
      console.error('Error fetching vendors:', error);
    }
  },

  updateVendors: (newVendors) => set({ vendors: newVendors }),
}));
