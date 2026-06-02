export interface User {
  id: number;
  username: string;
  onboarded: boolean;
  createdAt: string;
}

export interface AuthUser {
  id: number;
  username: string;
  onboarded: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export type Evidence = string[] | string | Record<string, unknown> | null;

export interface ProfileValues {
  id: number;
  userId: number;
  item: string;
  preference: string;
  confidence: number;
  evidence: Evidence;
  updatedAt: string;
}

export interface ProfileDecision {
  id: number;
  userId: number;
  topic: string;
  choice: string;
  reason: string;
  outcome: string;
  satisfaction: number;
  tags: string[] | string | null;
  decisionDate: string;
  createdAt: string;
}

export interface ProfileEmotion {
  id: number;
  userId: number;
  triggerDesc: string;
  emotion: string;
  behavior: string;
  agentNote: string;
  updatedAt: string;
}

export interface ProfileRelationship {
  id: number;
  userId: number;
  name: string;
  role: string;
  influenceLevel: string;
  influenceStyle: string;
  note: string;
  updatedAt: string;
}

export interface ProfileFear {
  id: number;
  userId: number;
  type: 'fear' | 'boundary';
  description: string;
  manifestation: string;
  confidence: number;
  evidence: Evidence;
  boundaryType?: 'hard' | 'soft';
  updatedAt: string;
}

export interface ProfileMemoryCandidate {
  id: number;
  userId: number;
  profileType: string;
  subject: string;
  content: string;
  detail?: string | null;
  confidence?: number | string | null;
  evidence?: Evidence;
  source?: string | null;
  sourceConversationId?: number | null;
  status: string;
  expiresAt?: string | null;
  handledAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ProfileMemoryAuditLog {
  id: number;
  userId: number;
  profileType: string;
  profileRecordId?: number | null;
  candidateId?: number | null;
  action: string;
  beforeSnapshot?: string | null;
  afterSnapshot?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface ProfileMemoryGovernanceResult {
  success: boolean;
  action: string;
  profileType?: string | null;
  profileRecordId?: number | null;
  candidateId?: number | null;
  message?: string | null;
}

export interface ProfileMemoryReasonRequest {
  reason?: string;
}

export interface ProfileMemoryCorrectionRequest {
  subject?: string;
  content?: string;
  detail?: string;
  reason?: string;
}

export interface UserProfile {
  user: User;
  values: ProfileValues[];
  decisions: ProfileDecision[];
  emotions: ProfileEmotion[];
  relationships: ProfileRelationship[];
  fears: ProfileFear[];
  pendingMemoryCount?: number;
}

export interface ChatMessage {
  id?: number;
  conversationId?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatConversation {
  id: number;
  userId: number;
  title: string;
  messageCount: number;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersistedChatMessage {
  id: number;
  conversationId: number;
  userId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatResponse {
  conversationId: number;
  reply: string;
}

export interface OnboardingQuestion {
  step: number;
  type: string;
  question: string;
  hint?: string;
}

export interface OnboardingStatus {
  onboarded: boolean;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  answeredSteps: number;
  skippedSteps: number;
}

export interface OnboardingStepResult {
  reply?: string | null;
  isCompleted: boolean;
  currentStep: number;
  nextStep: number;
  totalSteps: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp?: string;
}
