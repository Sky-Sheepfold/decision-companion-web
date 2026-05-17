import { create } from 'zustand';
import type { UserProfile } from '../types';
import { profileApi } from '../api/agent';

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  completeness: number;
  chatCount: number;
  fetchProfile: () => Promise<void>;
  getCompletenessText: () => string;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  completeness: 0,
  chatCount: 0,

  fetchProfile: async () => {
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) return;

    try {
      set({ loading: true, error: null });
      const data = await profileApi.getFullProfile(sessionId);
      
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
      });
    } catch (err) {
      if (err instanceof Error && err.message === '用户不存在') {
        set({
          profile: null,
          completeness: 0,
          chatCount: parseInt(sessionStorage.getItem('chatCount') || '0', 10),
          error: null,
          loading: false,
        });
        return;
      }

      console.error('Fetch profile error:', err);
      set({
        error: '加载档案失败，请稍后重试',
        loading: false,
      });
    }
  },

  getCompletenessText: () => {
    const { completeness } = get();
    if (completeness <= 30) return '刚刚认识你';
    if (completeness <= 60) return '慢慢了解中';
    if (completeness <= 90) return '越来越懂你';
    return '已经很了解你了';
  },
}));
