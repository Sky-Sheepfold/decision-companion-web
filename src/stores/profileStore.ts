import { create } from 'zustand';
import type { UserProfile } from '../types';
import { ApiCode, getAuthToken, isApiError, profileApi } from '../api/agent';
import { readSessionCache, removeSessionCache, writeSessionCache } from '../utils/sessionCache';

const PROFILE_CACHE_TTL_MS = 3000;
export const PROFILE_SESSION_CACHE_KEY = 'decision_companion_profile_cache';

let profileRequest: Promise<void> | null = null;

interface FetchProfileOptions {
  force?: boolean;
}

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  completeness: number;
  chatCount: number;
  lastFetchedAt: number;
  fetchProfile: (options?: FetchProfileOptions) => Promise<void>;
  getCompletenessText: () => string;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  completeness: 0,
  chatCount: 0,
  lastFetchedAt: 0,

  fetchProfile: async (options = {}) => {
    if (profileRequest) {
      await profileRequest;
      if (!options.force) return;
    }

    const { profile, lastFetchedAt } = get();
    if (!options.force && hasProfileRecords(profile) && Date.now() - lastFetchedAt < PROFILE_CACHE_TTL_MS) {
      return;
    }

    const token = getAuthToken();
    const cachedProfile = !options.force
      ? readSessionCache<UserProfile>(PROFILE_SESSION_CACHE_KEY, token, PROFILE_CACHE_TTL_MS)
      : null;
    if (cachedProfile && hasProfileRecords(cachedProfile)) {
      setProfileSnapshot(cachedProfile, set);
      return;
    }

    profileRequest = (async () => {
      try {
        set({ loading: true, error: null });
        const data = await profileApi.getFullProfile();
        if (hasProfileRecords(data)) {
          writeSessionCache(PROFILE_SESSION_CACHE_KEY, token, data);
        } else {
          removeSessionCache(PROFILE_SESSION_CACHE_KEY);
        }
        setProfileSnapshot(data, set);
      } catch (err) {
        if (isApiError(err) && err.code === ApiCode.USER_NOT_FOUND) {
          removeSessionCache(PROFILE_SESSION_CACHE_KEY);
          set({
            profile: null,
            completeness: 0,
            chatCount: parseInt(sessionStorage.getItem('chatCount') || '0', 10),
            error: null,
            loading: false,
            lastFetchedAt: Date.now(),
          });
          return;
        }

        console.error('Fetch profile error:', err);
        set({
          error: '加载档案失败，请稍后重试',
          loading: false,
        });
      }
    })().finally(() => {
      profileRequest = null;
    });

    return profileRequest;
  },

  getCompletenessText: () => {
    const { completeness } = get();
    if (completeness <= 30) return '刚刚认识你';
    if (completeness <= 60) return '慢慢了解中';
    if (completeness <= 90) return '越来越懂你';
    return '已经很了解你了';
  },
}));

export function countProfileRecords(data: UserProfile | null | undefined) {
  if (!data) return 0;

  return [
    ...(data.values || []),
    ...(data.decisions || []),
    ...(data.emotions || []),
    ...(data.relationships || []),
    ...(data.fears || []),
  ].length;
}

export function hasProfileRecords(data: UserProfile | null | undefined) {
  return countProfileRecords(data) > 0;
}

function setProfileSnapshot(
  data: UserProfile,
  set: (partial: ProfileState | Partial<ProfileState> | ((state: ProfileState) => ProfileState | Partial<ProfileState>)) => void
) {
  const allItems = [
    ...(data.values || []),
    ...(data.decisions || []),
    ...(data.emotions || []),
    ...(data.relationships || []),
    ...(data.fears || []),
  ];

  const highConfidenceItems = allItems.filter(
    item => 'confidence' in item && (item as { confidence?: number }).confidence !== undefined
      ? (item as { confidence: number }).confidence >= 0.6
      : true
  );

  const completeness = allItems.length > 0
    ? Math.min(Math.round((highConfidenceItems.length / allItems.length) * 100), 100)
    : 0;

  const chatCount = parseInt(sessionStorage.getItem('chatCount') || '0', 10);

  set({
    profile: data,
    completeness,
    chatCount,
    loading: false,
    error: null,
    lastFetchedAt: Date.now(),
  });
}
