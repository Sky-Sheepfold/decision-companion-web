import type {
  ApiResponse,
  UserProfile,
  OnboardingQuestion,
  OnboardingStatus,
  ProfileValues,
  ProfileDecision,
  ProfileEmotion,
  ProfileRelationship,
  ProfileFear
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();

  if (result.code !== 200) {
    throw new Error(result.message || 'Request failed');
  }

  return result.data;
}

export const agentApi = {
  chat: (sessionId: string, message: string): Promise<{ reply: string }> => {
    return fetchApi('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message }),
    });
  },

  chatStream: (sessionId: string, message: string): Promise<Response> => {
    const params = new URLSearchParams({ sessionId, message });
    return fetch(`${API_BASE_URL}/agent/chat/stream?${params}`);
  },
};

export const profileApi = {
  getFullProfile: (sessionId: string): Promise<UserProfile> => {
    return fetchApi(`/profile/${sessionId}`);
  },

  getStatus: (sessionId: string): Promise<{
    id: number;
    sessionId: string;
    nickname: string;
    onboarded: boolean;
    createdAt: string;
  }> => {
    return fetchApi(`/profile/${sessionId}/status`);
  },

  getValues: (sessionId: string): Promise<ProfileValues[]> => {
    return fetchApi(`/profile/${sessionId}/values`);
  },

  getDecisions: (sessionId: string): Promise<ProfileDecision[]> => {
    return fetchApi(`/profile/${sessionId}/decisions`);
  },

  getEmotions: (sessionId: string): Promise<ProfileEmotion[]> => {
    return fetchApi(`/profile/${sessionId}/emotions`);
  },

  getRelationships: (sessionId: string): Promise<ProfileRelationship[]> => {
    return fetchApi(`/profile/${sessionId}/relationships`);
  },

  getFears: (sessionId: string): Promise<ProfileFear[]> => {
    return fetchApi(`/profile/${sessionId}/fears`);
  },
};

export const onboardingApi = {
  getQuestions: (): Promise<OnboardingQuestion[]> => {
    return fetchApi('/onboarding/questions');
  },

  getQuestion: (step: number): Promise<OnboardingQuestion> => {
    return fetchApi(`/onboarding/questions/${step}`);
  },

  submitAnswer: (
    sessionId: string,
    step: number,
    answer: string
  ): Promise<{
    reply: string;
    isCompleted: boolean;
    currentStep: number;
    totalSteps: number;
  }> => {
    return fetchApi('/onboarding/answer', {
      method: 'POST',
      body: JSON.stringify({ sessionId, step, answer }),
    });
  },

  getStatus: (sessionId: string): Promise<OnboardingStatus> => {
    return fetchApi(`/onboarding/status/${sessionId}`);
  },
};
