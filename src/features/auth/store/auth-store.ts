import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name?: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  userToken: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userToken: null,
  user: null,

  setAuth: (token: string, user: AuthUser) => {
    set({ isAuthenticated: true, userToken: token, user });
  },

  logout: () => {
    set({ isAuthenticated: false, userToken: null, user: null });
  },
}));
