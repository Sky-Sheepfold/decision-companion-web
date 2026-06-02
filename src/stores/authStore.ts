import { create } from 'zustand';
import { authApi, clearAuthToken, getApiErrorMessage, getAuthToken, setAuthToken } from '../api/agent';
import type { AuthUser } from '../types';
import { readSessionCache, removeSessionCache, writeSessionCache } from '../utils/sessionCache';
import { useChatStore } from './chatStore';
import { useProfileStore } from './profileStore';

const AUTH_CACHE_KEY = 'decision_companion_auth_me_cache';
const AUTH_CACHE_TTL_MS = 3000;
export const ONBOARDING_PROFILE_REFRESH_KEY = 'decision_companion_onboarding_profile_refresh_at';

let initAuthRequest: Promise<void> | null = null;

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
    const token = getAuthToken();
    if (!token) {
      resetUserScopedState();
      set({ user: null, loading: false, error: null });
      return;
    }

    const cachedUser = readSessionCache<AuthUser>(AUTH_CACHE_KEY, token, AUTH_CACHE_TTL_MS);
    if (cachedUser) {
      set({ user: cachedUser, loading: false, error: null });
      return;
    }

    if (initAuthRequest) {
      return initAuthRequest;
    }

    initAuthRequest = (async () => {
      try {
        set({ loading: true, error: null });
        const user = await authApi.me();
        writeSessionCache(AUTH_CACHE_KEY, token, user);
        set({ user, loading: false });
      } catch (err) {
        console.error('Init auth error:', err);
        clearAuthToken();
        removeSessionCache(AUTH_CACHE_KEY);
        resetUserScopedState();
        set({ user: null, loading: false });
      }
    })().finally(() => {
      initAuthRequest = null;
    });

    return initAuthRequest;
  },

  login: async (username: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const response = await authApi.login(username, password);
      setAuthToken(response.token);
      resetUserScopedState();
      writeSessionCache(AUTH_CACHE_KEY, response.token, response.user);
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
      writeSessionCache(AUTH_CACHE_KEY, response.token, response.user);
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
      removeSessionCache(AUTH_CACHE_KEY);
      resetUserScopedState();
      set({ user: null, loading: false, error: null });
    }
  },

  markOnboarded: () => {
    requestInitialProfileRefresh();
    resetProfileSnapshot();
    set((state) => ({
      user: markCachedOnboarded(state.user),
    }));
  },
}));

function markCachedOnboarded(user: AuthUser | null) {
  if (!user) return user;

  const onboardedUser = { ...user, onboarded: true };
  const token = getAuthToken();
  if (token) {
    writeSessionCache(AUTH_CACHE_KEY, token, onboardedUser);
  }
  return onboardedUser;
}

function resetUserScopedState() {
  sessionStorage.removeItem('chatCount');
  useChatStore.getState().clearMessages();
  useProfileStore.getState().resetProfileState();
}

function resetProfileSnapshot() {
  useProfileStore.getState().resetProfileState();
}

function requestInitialProfileRefresh() {
  try {
    sessionStorage.setItem(ONBOARDING_PROFILE_REFRESH_KEY, String(Date.now()));
  } catch {
    // Session storage can be unavailable in privacy modes; profile refresh still works on normal page load.
  }
}
