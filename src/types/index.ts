export interface User {
  id: number;
  sessionId: string;
  nickname?: string;
  onboarded: boolean;
  createdAt: string;
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
  tags: string[];
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

export interface UserProfile {
  user: User;
  values: ProfileValues[];
  decisions: ProfileDecision[];
  emotions: ProfileEmotion[];
  relationships: ProfileRelationship[];
  fears: ProfileFear[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface OnboardingQuestion {
  step: number;
  question: string;
  hint?: string;
}

export interface OnboardingStatus {
  onboarded: boolean;
  currentStep: number;
  totalSteps: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
