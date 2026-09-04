import { io, Socket } from 'socket.io-client';

// Use environment variable or default to localhost (10.0.2.2 is localhost for Android Emulator)
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emitLocation(vendorId: string, lat: number, lng: number, isPremium: boolean = false) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('updateLocation', { vendorId, lat, lng, isPremium });
    }
  }

  onVendorsUpdated(callback: (vendors: any[]) => void) {
    if (this.socket) {
      this.socket.on('vendorsUpdated', callback);
    }
  }

  offVendorsUpdated() {
    if (this.socket) {
      this.socket.off('vendorsUpdated');
    }
  }
}

export const socketService = new SocketService();
