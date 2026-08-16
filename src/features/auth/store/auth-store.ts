import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  userToken: string | null;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userToken: null,

  login: (token) => {
    // Aquí iría la lógica para guardar el token en SecureStore/AsyncStorage
    set({ isAuthenticated: true, userToken: token });
  },
  
  logout: () => {
    // Aquí iría la lógica para borrar el token de SecureStore/AsyncStorage
    set({ isAuthenticated: false, userToken: null });
  },
}));
