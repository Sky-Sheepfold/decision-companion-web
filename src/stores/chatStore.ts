import { create } from 'zustand';
import type { ChatMessage } from '../types';
import { agentApi } from '../api/agent';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sessionId: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
  setSessionId: (sessionId: string) => void;
  initSession: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  error: null,
  sessionId: null,

  initSession: () => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('sessionId', sessionId);
    }
    set({ sessionId });
  },

  setSessionId: (sessionId: string) => {
    sessionStorage.setItem('sessionId', sessionId);
    set({ sessionId });
  },

  sendMessage: async (text: string) => {
    const { sessionId, isStreaming } = get();
    if (!text.trim() || !sessionId || isStreaming) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: text.trim(),
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
      const response = await agentApi.chatStream(sessionId, text);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let pendingChunk = '';

      if (!reader) {
        throw new Error('无法获取响应流');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        pendingChunk += decoder.decode(value, { stream: true });
        const parsedText = extractStreamText(pendingChunk);
        pendingChunk = parsedText.remaining;

        if (parsedText.content) {
          appendToAssistantMessage(parsedText.content, set);
        }
      }

      if (pendingChunk.trim()) {
        appendToAssistantMessage(extractStreamText(`${pendingChunk}\n`).content, set);
      }
    } catch (err) {
      console.error('Chat error:', err);
      set({ error: '发送消息失败，请稍后重试' });
      set((state) => ({
        messages: state.messages.slice(0, -1),
      }));
    } finally {
      set({ isStreaming: false });
    }
  },

  clearMessages: () => {
    set({ messages: [], error: null });
  },
}));

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

function extractStreamText(chunk: string) {
  const lines = chunk.split(/\r?\n/);
  const remaining = lines.pop() ?? '';
  const content = lines
    .map((line) => {
      if (!line.trim()) return '';
      if (line.startsWith('data:')) {
        const value = line.slice(5).trimStart();
        return value === '[DONE]' ? '' : value;
      }
      return line;
    })
    .join('');

  return { content, remaining };
}
