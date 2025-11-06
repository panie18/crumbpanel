import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  picture?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setAuth: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        console.log('✅ [AUTH] Login:', user.email, 'Token:', token.substring(0, 20) + '...');
        localStorage.setItem('authToken', token);
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        console.log('🚪 [AUTH] Logout');
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      setAuth: (user, token) => {
        console.log('🔐 [AUTH] SetAuth:', user.email, 'Token:', token.substring(0, 20) + '...');
        localStorage.setItem('authToken', token);
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('💾 [AUTH] Rehydrated from storage:', {
          hasUser: !!state?.user,
          hasToken: !!state?.token,
          isAuthenticated: state?.isAuthenticated,
        });
      },
    }
  )
);
