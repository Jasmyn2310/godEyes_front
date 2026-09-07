import React from 'react';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { VendorOperationView } from '@/features/vendor/components/vendor-operation-view';
import { ClientMapView } from '@/features/map/components/client-map-view';

export default function HomeScreen() {
  const { user } = useAuthStore();

  if (user?.role === 'vendor') {
    return <VendorOperationView />;
  }

  return <ClientMapView />;
}
