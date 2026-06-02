import { create } from 'zustand';
import type { ProfileMemoryCandidate, ProfileMemoryCorrectionRequest, UserProfile } from '../types';
import { ApiCode, getAuthToken, isApiError, profileApi } from '../api/agent';
import { readSessionCache, removeSessionCache, writeSessionCache } from '../utils/sessionCache';

const PROFILE_CACHE_TTL_MS = 3000;
export const PROFILE_SESSION_CACHE_KEY = 'decision_companion_profile_cache';

let profileRequest: Promise<void> | null = null;
let profileStateGeneration = 0;

interface FetchProfileOptions {
  force?: boolean;
}

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  pendingMemories: ProfileMemoryCandidate[];
  pendingMemoryCount: number;
  governanceLoading: boolean;
  governanceError: string | null;
  completeness: number;
  chatCount: number;
  lastFetchedAt: number;
  fetchProfile: (options?: FetchProfileOptions) => Promise<void>;
  fetchPendingMemories: () => Promise<void>;
  confirmPendingMemory: (id: number) => Promise<void>;
  rejectPendingMemory: (id: number, reason?: string) => Promise<void>;
  correctPendingMemory: (id: number, request: ProfileMemoryCorrectionRequest) => Promise<void>;
  correctProfileMemory: (profileType: string, id: number, request: ProfileMemoryCorrectionRequest) => Promise<void>;
  deleteProfileMemory: (profileType: string, id: number, reason?: string) => Promise<void>;
  resetProfileState: () => void;
  getCompletenessText: () => string;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  pendingMemories: [],
  pendingMemoryCount: 0,
  governanceLoading: false,
  governanceError: null,
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
    const requestGeneration = profileStateGeneration;
    const cachedProfile = !options.force
      ? readSessionCache<UserProfile>(PROFILE_SESSION_CACHE_KEY, token, PROFILE_CACHE_TTL_MS)
      : null;
    if (cachedProfile && hasProfileRecords(cachedProfile)) {
      setProfileSnapshot(cachedProfile, set);
      await get().fetchPendingMemories();
      return;
    }

    const request = (async () => {
      try {
        set({ loading: true, error: null });
        const data = await profileApi.getFullProfile();
        if (!isCurrentProfileRequest(token, requestGeneration)) {
          return;
        }
        if (hasProfileRecords(data)) {
          writeSessionCache(PROFILE_SESSION_CACHE_KEY, token, data);
        } else {
          removeSessionCache(PROFILE_SESSION_CACHE_KEY);
        }
        setProfileSnapshot(data, set);
        await get().fetchPendingMemories();
      } catch (err) {
        if (!isCurrentProfileRequest(token, requestGeneration)) {
          return;
        }

        if (isApiError(err) && err.code === ApiCode.USER_NOT_FOUND) {
          removeSessionCache(PROFILE_SESSION_CACHE_KEY);
          set({
            profile: null,
            pendingMemories: [],
            pendingMemoryCount: 0,
            completeness: 0,
            chatCount: parseInt(sessionStorage.getItem('chatCount') || '0', 10),
            error: null,
            loading: false,
            governanceLoading: false,
            governanceError: null,
            lastFetchedAt: Date.now(),
          });
          return;
        }

        console.error('Fetch profile error:', err);
        set({
          error: '加载档案失败，请稍后重试',
          loading: false,
          governanceLoading: false,
        });
      }
    })().finally(() => {
      if (profileRequest === request) {
        profileRequest = null;
      }
    });

    profileRequest = request;
    return profileRequest;
  },

  fetchPendingMemories: async () => {
    const token = getAuthToken();
    const requestGeneration = profileStateGeneration;

    try {
      set({ governanceLoading: true, governanceError: null });
      const pendingMemories = await profileApi.getPendingMemories();
      if (!isCurrentProfileRequest(token, requestGeneration)) {
        return;
      }
      set({
        pendingMemories,
        pendingMemoryCount: pendingMemories.length,
        governanceLoading: false,
        governanceError: null,
      });
    } catch (err) {
      if (!isCurrentProfileRequest(token, requestGeneration)) {
        return;
      }

      console.error('Fetch pending memories error:', err);
      set({
        governanceLoading: false,
        governanceError: '加载待确认记忆失败，请稍后重试',
      });
    }
  },

  confirmPendingMemory: async (id: number) => {
    await runGovernanceMutation(set, get, () => profileApi.confirmPendingMemory(id));
  },

  rejectPendingMemory: async (id: number, reason?: string) => {
    await runGovernanceMutation(set, get, () => profileApi.rejectPendingMemory(id, reason));
  },

  correctPendingMemory: async (id: number, request: ProfileMemoryCorrectionRequest) => {
    await runGovernanceMutation(set, get, () => profileApi.correctPendingMemory(id, request));
  },

  correctProfileMemory: async (profileType: string, id: number, request: ProfileMemoryCorrectionRequest) => {
    await runGovernanceMutation(set, get, () => profileApi.correctProfileMemory(profileType, id, request));
  },

  deleteProfileMemory: async (profileType: string, id: number, reason?: string) => {
    await runGovernanceMutation(set, get, () => profileApi.deleteProfileMemory(profileType, id, reason));
  },

  resetProfileState: () => {
    profileStateGeneration += 1;
    profileRequest = null;
    removeSessionCache(PROFILE_SESSION_CACHE_KEY);
    set({
      profile: null,
      loading: false,
      error: null,
      pendingMemories: [],
      pendingMemoryCount: 0,
      governanceLoading: false,
      governanceError: null,
      completeness: 0,
      chatCount: 0,
      lastFetchedAt: 0,
    });
  },

  getCompletenessText: () => {
    const { completeness } = get();
    if (completeness <= 30) return '刚刚认识你';
    if (completeness <= 60) return '慢慢了解中';
    if (completeness <= 90) return '越来越懂你';
    return '已经很了解你了';
  },
}));

function isCurrentProfileRequest(token: string | null, generation: number) {
  return generation === profileStateGeneration && token === getAuthToken();
}

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
    pendingMemoryCount: data.pendingMemoryCount ?? 0,
    completeness,
    chatCount,
    loading: false,
    error: null,
    lastFetchedAt: Date.now(),
  });
}

async function runGovernanceMutation(
  set: (partial: ProfileState | Partial<ProfileState> | ((state: ProfileState) => ProfileState | Partial<ProfileState>)) => void,
  get: () => ProfileState,
  mutate: () => Promise<unknown>
) {
  try {
    set({ governanceLoading: true, governanceError: null });
    await mutate();
    removeSessionCache(PROFILE_SESSION_CACHE_KEY);
    await get().fetchProfile({ force: true });
  } catch (err) {
    console.error('Memory governance mutation error:', err);
    set({
      governanceLoading: false,
      governanceError: '记忆更新失败，请稍后重试',
    });
    throw err;
  }
}
