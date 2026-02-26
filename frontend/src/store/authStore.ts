/**
 * Global auth state management with Zustand.
 * Adapted for FastAPI-Users (no refresh tokens).
 */

import { create } from 'zustand';
import type { User } from '@/types';
import { api } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, cfHandle?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await api.login({ email, password });
      const user = await api.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || (err instanceof Error ? err.message : 'Login failed');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (email, username, password, cfHandle) => {
    set({ isLoading: true, error: null });
    try {
      await api.register({ email, username, password, cf_handle: cfHandle });
      // Auto-login after registration
      await api.login({ email, password });
      const user = await api.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || (err instanceof Error ? err.message : 'Registration failed');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    api.logout();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    if (!localStorage.getItem('access_token')) {
      set({ isAuthenticated: false });
      return;
    }
    set({ isLoading: true });
    try {
      const user = await api.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      localStorage.removeItem('access_token');
    }
  },

  updateUser: async (data) => {
    set({ isLoading: true });
    try {
      const user = await api.updateMe(data);
      set({ user, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
