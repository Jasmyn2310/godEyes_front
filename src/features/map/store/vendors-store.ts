import { create } from 'zustand';
import { ENDPOINTS } from '@/core/config/api.config';

export interface Vendor {
  id: string;
  name: string;
  type: string;
  priceRange: string;
  photoUrl: string;
  lat: number;
  lng: number;
  rating?: number;
  reviewsCount?: number;
}

interface VendorsState {
  vendors: Vendor[];
  selectedVendor: Vendor | null;
  isLoading: boolean;
  errorMsg: string | null;
  fetchVendors: () => Promise<void>;
  updateVendors: (vendors: Vendor[]) => void;
  setSelectedVendor: (vendor: Vendor | null) => void;
}

function calculateMockRating(id: string): { rating: number; reviewsCount: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const rating = Number((4.5 + (positiveHash % 50) / 100).toFixed(1));
  const reviewsCount = 20 + (positiveHash % 180);
  return { rating, reviewsCount };
}

export const useVendorsStore = create<VendorsState>((set) => ({
  vendors: [],
  selectedVendor: null,
  isLoading: false,
  errorMsg: null,

  fetchVendors: async () => {
    set({ isLoading: true, errorMsg: null });
    try {
      const response = await fetch(ENDPOINTS.vendors);
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      const data = (await response.json()) as Vendor[];
      const enriched = data.map((v) => {
        const { rating, reviewsCount } = calculateMockRating(v.id);
        return {
          ...v,
          rating,
          reviewsCount,
        };
      });
      set({ vendors: enriched, isLoading: false });
    } catch (error) {
      set({
        errorMsg: 'No se pudieron cargar los vendedores. Verifica tu conexión e inténtalo de nuevo.',
        isLoading: false,
      });
    }
  },

  updateVendors: (newVendors) =>
    set((state) => {
      const enriched = newVendors.map((v) => {
        const existing = state.vendors.find((item) => item.id === v.id);
        return {
          ...v,
          rating: existing?.rating ?? 4.8,
          reviewsCount: existing?.reviewsCount ?? 64,
        };
      });
      return { vendors: enriched };
    }),

  setSelectedVendor: (vendor) => set({ selectedVendor: vendor }),
}));
