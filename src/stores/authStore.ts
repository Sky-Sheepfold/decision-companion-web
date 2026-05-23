import { create } from 'zustand';
import { authApi, clearAuthToken, getApiErrorMessage, getAuthToken, setAuthToken } from '../api/agent';
import type { AuthUser } from '../types';
import { useChatStore } from './chatStore';
import { useProfileStore } from './profileStore';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  initAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<AuthUser>;
  register: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  markOnboarded: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  initAuth: async () => {
    if (!getAuthToken()) {
      set({ user: null, loading: false, error: null });
      return;
    }

    try {
      set({ loading: true, error: null });
      const user = await authApi.me();
      set({ user, loading: false });
    } catch (err) {
      console.error('Init auth error:', err);
      clearAuthToken();
      set({ user: null, loading: false });
    }
  },

  login: async (username: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const response = await authApi.login(username, password);
      setAuthToken(response.token);
      resetUserScopedState();
      set({ user: response.user, loading: false });
      return response.user;
    } catch (err) {
      const error = getApiErrorMessage(err, '登录失败');
      set({ error, loading: false });
      throw err;
    }
  },

  register: async (username: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const response = await authApi.register(username, password);
      setAuthToken(response.token);
      resetUserScopedState();
      set({ user: response.user, loading: false });
      return response.user;
    } catch (err) {
      const error = getApiErrorMessage(err, '注册失败');
      set({ error, loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      if (getAuthToken()) {
        await authApi.logout();
      }
    } finally {
      clearAuthToken();
      resetUserScopedState();
      set({ user: null, loading: false, error: null });
    }
  },

  markOnboarded: () => {
    set((state) => ({
      user: state.user ? { ...state.user, onboarded: true } : state.user,
    }));
  },
}));

function resetUserScopedState() {
  sessionStorage.removeItem('chatCount');
  useChatStore.getState().clearMessages();
  useProfileStore.setState({
    profile: null,
    error: null,
    completeness: 0,
    chatCount: 0,
  });
}
