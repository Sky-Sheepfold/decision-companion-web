import type {
  ApiResponse,
  AuthResponse,
  AuthUser,
  User,
  UserProfile,
  OnboardingQuestion,
  OnboardingStatus,
  ProfileValues,
  ProfileDecision,
  ProfileEmotion,
  ProfileRelationship,
  ProfileFear
} from '../types';

export const AUTH_TOKEN_KEY = 'decision_companion_token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  const result: ApiResponse<T> | null = await readJson(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
    }
    throw new Error(result?.message || `API Error: ${response.status}`);
  }

  if (!result || result.code !== 200) {
    throw new Error(result?.message || 'Request failed');
  }

  return result.data;
}

async function readJson<T>(response: Response): Promise<ApiResponse<T> | null> {
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text) as ApiResponse<T>;
}

export const agentApi = {
  chat: (message: string): Promise<{ reply: string }> => {
    return fetchApi('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  chatStream: (message: string): Promise<Response> => {
    const token = getAuthToken();
    const params = new URLSearchParams({ message });
    return fetch(`${API_BASE_URL}/agent/chat/stream?${params}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },
};

export const authApi = {
  me: (): Promise<AuthUser> => {
    return fetchApi('/auth/me');
  },

  login: (username: string, password: string): Promise<AuthResponse> => {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register: (username: string, password: string): Promise<AuthResponse> => {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout: (): Promise<void> => {
    return fetchApi('/auth/logout', {
      method: 'POST',
    });
  },
};

export const profileApi = {
  getFullProfile: (): Promise<UserProfile> => {
    return fetchApi('/profile');
  },

  getStatus: (): Promise<User> => {
    return fetchApi('/profile/status');
  },

  getValues: (): Promise<ProfileValues[]> => {
    return fetchApi('/profile/values');
  },

  getDecisions: (): Promise<ProfileDecision[]> => {
    return fetchApi('/profile/decisions');
  },

  getEmotions: (): Promise<ProfileEmotion[]> => {
    return fetchApi('/profile/emotions');
  },

  getRelationships: (): Promise<ProfileRelationship[]> => {
    return fetchApi('/profile/relationships');
  },

  getFears: (): Promise<ProfileFear[]> => {
    return fetchApi('/profile/fears');
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
      body: JSON.stringify({ step, answer }),
    });
  },

  getStatus: (): Promise<OnboardingStatus> => {
    return fetchApi('/onboarding/status');
  },
};
