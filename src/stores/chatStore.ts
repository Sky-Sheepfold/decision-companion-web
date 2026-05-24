import { create } from 'zustand';
import type { ChatConversation, ChatMessage, PersistedChatMessage } from '../types';
import { agentApi, getApiErrorMessage, getAuthToken, readApiError } from '../api/agent';
import { readSessionCache, removeSessionCache, writeSessionCache } from '../utils/sessionCache';

const CONVERSATIONS_CACHE_TTL_MS = 3000;
export const CONVERSATIONS_SESSION_CACHE_KEY = 'decision_companion_conversations_cache';

let conversationsRequest: Promise<void> | null = null;

interface LoadConversationsOptions {
  force?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  conversations: ChatConversation[];
  currentConversationId: number | null;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isStreaming: boolean;
  error: string | null;
  conversationsFetchedAt: number;
  loadConversations: (options?: LoadConversationsOptions) => Promise<void>;
  openConversation: (conversationId: number) => Promise<void>;
  startNewConversation: () => void;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversations: [],
  currentConversationId: null,
  isLoadingConversations: false,
  isLoadingMessages: false,
  isStreaming: false,
  error: null,
  conversationsFetchedAt: 0,

  loadConversations: async (options = {}) => {
    if (conversationsRequest) {
      await conversationsRequest;
      if (!options.force) return;
    }

    const { conversationsFetchedAt } = get();
    if (!options.force && conversationsFetchedAt && Date.now() - conversationsFetchedAt < CONVERSATIONS_CACHE_TTL_MS) {
      return;
    }

    const token = getAuthToken();
    const cachedConversations = !options.force
      ? readSessionCache<ChatConversation[]>(CONVERSATIONS_SESSION_CACHE_KEY, token, CONVERSATIONS_CACHE_TTL_MS)
      : null;
    if (cachedConversations) {
      set({
        conversations: cachedConversations,
        isLoadingConversations: false,
        conversationsFetchedAt: Date.now(),
      });
      return;
    }

    conversationsRequest = (async () => {
      set({ isLoadingConversations: true });
      try {
        const conversations = await agentApi.listConversations();
        writeSessionCache(CONVERSATIONS_SESSION_CACHE_KEY, token, conversations);
        set({
          conversations,
          isLoadingConversations: false,
          conversationsFetchedAt: Date.now(),
        });
      } catch (err) {
        console.error('Load conversations error:', err);
        set({ isLoadingConversations: false, error: getApiErrorMessage(err, '读取历史对话失败，请稍后重试') });
      }
    })().finally(() => {
      conversationsRequest = null;
    });

    return conversationsRequest;
  },

  openConversation: async (conversationId: number) => {
    const { isStreaming } = get();
    if (isStreaming) return;

    set({
      currentConversationId: conversationId,
      isLoadingMessages: true,
      error: null,
    });

    try {
      const messages = await agentApi.listMessages(conversationId);
      set({
        messages: messages.length > 0
          ? messages.map(toChatMessage)
          : [createInitialAssistantMessage()],
        isLoadingMessages: false,
      });
    } catch (err) {
      console.error('Load conversation messages error:', err);
      set({ isLoadingMessages: false, error: getApiErrorMessage(err, '读取对话内容失败，请稍后重试') });
    }
  },

  startNewConversation: () => {
    const { isStreaming } = get();
    if (isStreaming) return;

    set({
      messages: [createInitialAssistantMessage()],
      currentConversationId: null,
      error: null,
      isLoadingMessages: false,
    });
  },

  sendMessage: async (text: string) => {
    const { isStreaming, currentConversationId } = get();
    if (!text.trim() || isStreaming) return;
    const trimmedText = text.trim();

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmedText,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isStreaming: true,
      error: null,
    }));

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, assistantMessage],
    }));

    try {
      const response = await agentApi.chatStream(trimmedText, currentConversationId ?? undefined);
      if (!response.ok) {
        throw await readApiError(response, '发送消息失败，请稍后重试');
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let pendingText = '';

      if (!reader) {
        throw new Error('无法获取响应流');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        pendingText += decoder.decode(value, { stream: true });
        const parsedEvents = extractSseEvents(pendingText);
        pendingText = parsedEvents.remaining;

        for (const event of parsedEvents.events) {
          handleSseEvent(event, set);
        }
      }

      pendingText += decoder.decode();
      if (pendingText.trim()) {
        const parsedEvents = extractSseEvents(`${pendingText}\n\n`);
        for (const event of parsedEvents.events) {
          handleSseEvent(event, set);
        }
      }
      await get().loadConversations({ force: true });
    } catch (err) {
      console.error('Chat error:', err);
      set({ error: getApiErrorMessage(err, '发送消息失败，请稍后重试') });
      set((state) => ({
        messages: state.messages.slice(0, -1),
      }));
    } finally {
      set({ isStreaming: false });
    }
  },

  clearMessages: () => {
    removeSessionCache(CONVERSATIONS_SESSION_CACHE_KEY);
    set({
      messages: [],
      conversations: [],
      currentConversationId: null,
      isLoadingConversations: false,
      isLoadingMessages: false,
      isStreaming: false,
      error: null,
      conversationsFetchedAt: 0,
    });
  },
}));

function createInitialAssistantMessage(): ChatMessage {
  return {
    role: 'assistant',
    content: '你好，很高兴见到你。今天有什么想聊的吗？',
    timestamp: new Date().toISOString(),
  };
}

function toChatMessage(message: PersistedChatMessage): ChatMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role,
    content: message.content,
    timestamp: message.createdAt,
  };
}

function appendToAssistantMessage(
  content: string,
  set: (partial: ChatState | Partial<ChatState> | ((state: ChatState) => ChatState | Partial<ChatState>)) => void
) {
  set((state) => {
    const messages = [...state.messages];
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'assistant') {
      messages[messages.length - 1] = {
        ...lastMsg,
        content: lastMsg.content + content,
      };
    }
    return { messages };
  });
}

interface SseEvent {
  event: string;
  data: string;
}

function handleSseEvent(
  event: SseEvent,
  set: (partial: ChatState | Partial<ChatState> | ((state: ChatState) => ChatState | Partial<ChatState>)) => void
) {
  if (event.data === '[DONE]') return;

  if (event.event === 'conversation') {
    try {
      const payload = JSON.parse(event.data) as { conversationId?: number };
      if (payload.conversationId) {
        set({ currentConversationId: payload.conversationId });
      }
    } catch (err) {
      console.warn('Parse conversation event error:', err);
    }
    return;
  }

  appendToAssistantMessage(event.data, set);
}

function extractSseEvents(text: string) {
  const normalized = text.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');
  const remaining = blocks.pop() ?? '';
  const events = blocks
    .map(parseSseBlock)
    .filter((event): event is SseEvent => event !== null);

  return { events, remaining };
}

function parseSseBlock(block: string): SseEvent | null {
  let event = 'message';
  const data: string[] = [];

  for (const line of block.split('\n')) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      event = readSseValue(line, 'event:').trim();
      continue;
    }
    if (line.startsWith('data:')) {
      data.push(readSseValue(line, 'data:'));
    }
  }

  if (data.length === 0) return null;
  return { event, data: data.join('\n') };
}

function readSseValue(line: string, prefix: string) {
  const value = line.slice(prefix.length);
  return value.startsWith(' ') ? value.slice(1) : value;
}
