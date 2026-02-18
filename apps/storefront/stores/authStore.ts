import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';

type User = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role?: 'USER' | 'ADMIN' | 'COURIER';
  createdAt?: string;
  updatedAt?: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.auth.login({ email, password });
          const { token, user } = response.data;
          
          // Salvează token și user în localStorage
          localStorage.setItem('jester_token', token);
          localStorage.setItem('jester_user', JSON.stringify(user));
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const apiError = error.response?.data?.error;
          let errorMessage: string;
          if (error.code === 'ERR_NETWORK' || !error.response) {
            errorMessage = 'Nu ne putem conecta la server. Verifică conexiunea și că API-ul rulează.';
          } else if (typeof apiError === 'string') {
            errorMessage = apiError;
          } else {
            errorMessage = 'Eroare la autentificare. Încearcă din nou.';
          }
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          throw new Error(errorMessage);
        }
      },

      register: async (email: string, password: string, name: string, phone?: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.auth.register({ email, password, name, phone });
          const { token, user } = response.data;
          
          // Salvează token și user în localStorage
          localStorage.setItem('jester_token', token);
          localStorage.setItem('jester_user', JSON.stringify(user));
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const apiError = error.response?.data?.error;
          let errorMessage: string;
          if (error.code === 'ERR_NETWORK' || !error.response) {
            errorMessage = 'Nu ne putem conecta la server. Verifică conexiunea și că API-ul rulează.';
          } else if (typeof apiError === 'string') {
            errorMessage = apiError;
          } else {
            errorMessage = 'Eroare la înregistrare. Încearcă din nou.';
          }
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        localStorage.removeItem('jester_token');
        localStorage.removeItem('jester_user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      fetchUser: async () => {
        try {
          const token = localStorage.getItem('jester_token');
          if (!token) {
            set({ isAuthenticated: false, user: null });
            return;
          }

          set({ isLoading: true });
          const response = await api.auth.me();
          const { user } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Token invalid sau expirat
          localStorage.removeItem('jester_token');
          localStorage.removeItem('jester_user');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'jester-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
