import type {
  ApiResponse,
  AuthResponse,
  AuthUser,
  User,
  UserProfile,
  OnboardingQuestion,
  OnboardingStepResult,
  OnboardingStatus,
  ProfileValues,
  ProfileDecision,
  ProfileEmotion,
  ProfileRelationship,
  ProfileFear,
  ProfileMemoryAuditLog,
  ProfileMemoryCandidate,
  ProfileMemoryCorrectionRequest,
  ProfileMemoryGovernanceResult,
  ProfileMemoryReasonRequest,
  ChatConversation,
  ChatResponse,
  PersistedChatMessage
} from '../types';

export const AUTH_TOKEN_KEY = 'decision_companion_token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const CLIENT_TAB_KEY = 'decision_companion_tab_id';
let onboardingStatusRequest: Promise<OnboardingStatus> | null = null;
let requestSequence = 0;

const CLIENT_TAB_ID = getOrCreateClientTabId();
const PAGE_LOAD_ID = createTraceId();

export const ApiCode = {
  SUCCESS: 200,
  UNAUTHORIZED: 40100,
  TOKEN_INVALID: 40102,
  USER_NOT_FOUND: 40401,
} as const;

export class ApiError extends Error {
  readonly code: number;
  readonly httpStatus: number;
  readonly response: ApiResponse<unknown> | null;

  constructor(message: string, code: number, httpStatus: number, response: ApiResponse<unknown> | null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.response = response;
  }

  get isUnauthorized() {
    return this.httpStatus === 401 || this.code === ApiCode.UNAUTHORIZED || this.code === ApiCode.TOKEN_INVALID;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error) && error.message) return error.message;
  return fallback;
}

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
  const traceHeaders = nextTraceHeaders(endpoint);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...traceHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  const result: ApiResponse<T> | null = await readJson(response);

  if (!response.ok) {
    throw createApiError(response, result, `API Error: ${response.status}`);
  }

  if (!result || result.code !== ApiCode.SUCCESS) {
    throw createApiError(response, result, 'Request failed');
  }

  return result.data;
}

async function readJson<T>(response: Response): Promise<ApiResponse<T> | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return null;
  }
}

export async function readApiError(response: Response, fallback: string) {
  return createApiError(response, await readJson(response), fallback);
}

function createApiError<T>(response: Response, result: ApiResponse<T> | null, fallback: string) {
  const error = new ApiError(
    result?.message || fallback,
    result?.code ?? response.status,
    response.status,
    result as ApiResponse<unknown> | null
  );

  if (error.isUnauthorized) {
    clearAuthToken();
  }

  return error;
}

function getOrCreateClientTabId() {
  const existing = sessionStorage.getItem(CLIENT_TAB_KEY);
  if (existing) return existing;

  const created = createTraceId();
  sessionStorage.setItem(CLIENT_TAB_KEY, created);
  return created;
}

function createTraceId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

function nextTraceHeaders(endpoint: string) {
  requestSequence += 1;
  return {
    'X-DC-Tab-Id': CLIENT_TAB_ID,
    'X-DC-Page-Load-Id': PAGE_LOAD_ID,
    'X-DC-Request-Seq': String(requestSequence),
    'X-DC-Endpoint': endpoint,
  };
}

export const agentApi = {
  chat: (message: string, conversationId?: number): Promise<ChatResponse> => {
    return fetchApi('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    });
  },

  chatStream: (message: string, conversationId?: number): Promise<Response> => {
    const token = getAuthToken();
    const params = new URLSearchParams({ message });
    if (conversationId) {
      params.set('conversationId', String(conversationId));
    }
    return fetch(`${API_BASE_URL}/agent/chat/stream?${params}`, {
      headers: {
        ...nextTraceHeaders('/agent/chat/stream'),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },

  listConversations: (limit = 50): Promise<ChatConversation[]> => {
    const params = new URLSearchParams({ limit: String(limit) });
    return fetchApi(`/agent/conversations?${params}`);
  },

  listMessages: (conversationId: number): Promise<PersistedChatMessage[]> => {
    return fetchApi(`/agent/conversations/${conversationId}/messages`);
  },

  deleteConversation: (conversationId: number): Promise<void> => {
    return fetchApi(`/agent/conversations/${conversationId}`, {
      method: 'DELETE',
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

  getPendingMemories: (): Promise<ProfileMemoryCandidate[]> => {
    return fetchApi('/profile/pending-memories');
  },

  getMemoryAudits: (limit?: number): Promise<ProfileMemoryAuditLog[]> => {
    const params = new URLSearchParams();
    if (limit !== undefined) {
      params.set('limit', String(limit));
    }
    const query = params.toString();
    return fetchApi(`/profile/memory-audits${query ? `?${query}` : ''}`);
  },

  confirmPendingMemory: (id: number): Promise<ProfileMemoryGovernanceResult> => {
    return fetchApi(`/profile/pending-memories/${id}/confirm`, {
      method: 'POST',
    });
  },

  rejectPendingMemory: (id: number, reason?: string): Promise<ProfileMemoryGovernanceResult> => {
    const request: ProfileMemoryReasonRequest | undefined = reason ? { reason } : undefined;
    return fetchApi(`/profile/pending-memories/${id}/reject`, {
      method: 'POST',
      ...(request ? { body: JSON.stringify(request) } : {}),
    });
  },

  correctPendingMemory: (
    id: number,
    request: ProfileMemoryCorrectionRequest
  ): Promise<ProfileMemoryGovernanceResult> => {
    return fetchApi(`/profile/pending-memories/${id}/correct`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  correctProfileMemory: (
    profileType: string,
    id: number,
    request: ProfileMemoryCorrectionRequest
  ): Promise<ProfileMemoryGovernanceResult> => {
    return fetchApi(`/profile/${profileType}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  },

  deleteProfileMemory: (
    profileType: string,
    id: number,
    reason?: string
  ): Promise<ProfileMemoryGovernanceResult> => {
    const request: ProfileMemoryReasonRequest | undefined = reason ? { reason } : undefined;
    return fetchApi(`/profile/${profileType}/${id}`, {
      method: 'DELETE',
      ...(request ? { body: JSON.stringify(request) } : {}),
    });
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
  ): Promise<OnboardingStepResult> => {
    return fetchApi('/onboarding/answer', {
      method: 'POST',
      body: JSON.stringify({ step, answer }),
    });
  },

  skipStep: (step: number): Promise<OnboardingStepResult> => {
    return fetchApi('/onboarding/skip', {
      method: 'POST',
      body: JSON.stringify({ step }),
    });
  },

  getStatus: (): Promise<OnboardingStatus> => {
    onboardingStatusRequest ??= fetchApi<OnboardingStatus>('/onboarding/status')
      .finally(() => {
        onboardingStatusRequest = null;
      });
    return onboardingStatusRequest;
  },
};
