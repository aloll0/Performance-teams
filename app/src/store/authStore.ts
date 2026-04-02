import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState, LoginCredentials } from '@/types';
import * as authApi from '@/services/authApi';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(credentials);
          const { token, user } = response.data;
          
          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
      },

      fetchCurrentUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await authApi.getCurrentUser();
          set({ user: response.data });
        } catch (error) {
          console.error('Failed to fetch current user:', error);
        }
      },

      updateUser: (user) => {
        set({ user });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
);
