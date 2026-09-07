import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/core/config/api.config';

const SOCKET_URL = API_BASE_URL;

export interface VendorLocationUpdate {
  vendorId: string;
  lat: number;
  lng: number;
  isPremium?: boolean;
}

class SocketService {
  private socket: Socket | null = null;

  connect(): void {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emitLocation(vendorId: string, lat: number, lng: number, isPremium: boolean = false): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('updateLocation', { vendorId, lat, lng, isPremium });
    }
  }

  onVendorsUpdated(callback: (updates: VendorLocationUpdate[]) => void): void {
    if (this.socket) {
      this.socket.on('vendorsUpdated', callback);
    }
  }

  offVendorsUpdated(): void {
    if (this.socket) {
      this.socket.off('vendorsUpdated');
    }
  }
}

export const socketService = new SocketService();
