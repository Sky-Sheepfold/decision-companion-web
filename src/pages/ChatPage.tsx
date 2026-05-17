import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Drawer, Alert } from 'antd';
import { useChatStore } from '../stores/chatStore';
import { useProfileStore } from '../stores/profileStore';
import { Sidebar } from '../components/common/Sidebar';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatInput } from '../components/chat/ChatInput';
import { MessageBubble } from '../components/chat/MessageBubble';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { MemoryCompass } from '../components/chat/MemoryCompass';
import type { ChatMessage, UserProfile } from '../types';

const { Content, Sider } = Layout;

const INITIAL_MESSAGE = {
  role: 'assistant' as const,
  content: '你好，很高兴见到你。今天有什么想聊的吗？',
  timestamp: new Date().toISOString(),
};

export function ChatPage() {
  const navigate = useNavigate();
  const { messages, isStreaming, error, sessionId, sendMessage, initSession } = useChatStore();
  const { profile, fetchProfile } = useProfileStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    initSession();
  }, [initSession]);

  useEffect(() => {
    if (!sessionId) return;

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      if (messages.length === 0) {
        useChatStore.setState(() => ({
          messages: [INITIAL_MESSAGE],
        }));
      }
    }
  }, [messages.length, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!sessionId) return;
    void fetchProfile();
  }, [fetchProfile, sessionId]);

  useEffect(() => {
    if (!sessionId || isStreaming || messages.length <= 1) return;
    const timer = window.setTimeout(() => {
      void fetchProfile();
    }, 900);

    return () => window.clearTimeout(timer);
  }, [fetchProfile, isStreaming, messages.length, sessionId]);

  const contextSummary = useMemo(() => buildContextSummary(messages, profile), [messages, profile]);
  const shouldShowTyping = isStreaming && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content.trim();

  const handleSend = async (text: string) => {
    if (!sessionId) {
      navigate('/onboarding');
      return;
    }
    await sendMessage(text);

    const chatCount = parseInt(sessionStorage.getItem('chatCount') || '0', 10);
    sessionStorage.setItem('chatCount', String(chatCount + 1));
  };

  return (
    <Layout className="page-fade h-[100dvh] overflow-hidden bg-[#F7F2EC]" hasSider>
      {/* PC Sider - Standard History Sidebar */}
      <Sider width={232} breakpoint="lg" collapsedWidth="0" trigger={null} className="hidden lg:block !bg-[#F8F3ED] border-r border-[#E8D8C8] z-10">
        <Sidebar />
      </Sider>

      {/* Mobile Drawer Sider */}
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setIsMobileSidebarOpen(false)}
        open={isMobileSidebarOpen}
        styles={{ body: { padding: 0 } }}
        size={260}
        className="lg:hidden"
      >
        <Sidebar className="h-full bg-[var(--color-header-bg)]" />
      </Drawer>

      <Layout className="bg-transparent flex flex-col h-[100dvh]">
        <ChatHeader
          showMenuButton
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        <Layout className="flex-1 overflow-hidden flex flex-row bg-transparent">
          {/* Main Chat Canvas */}
          <Content className="flex-1 flex flex-col h-full bg-[#FFFCF8] relative">
            <div className="flex-1 overflow-y-auto px-5 py-6 custom-scrollbar md:px-8">
              <div className="mx-auto w-full max-w-[760px] space-y-5">
                <ChatContextBar summary={contextSummary} />

                {messages.map((msg, idx) => (
                  msg.role === 'assistant' && !msg.content.trim()
                    ? null
                    : <MessageBubble key={idx} message={msg} />
                ))}

                {shouldShowTyping && (
                  <div className="message-enter flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#E9D8C8] bg-white text-[12px] font-medium text-[#7A634F] shadow-sm">
                      伴
                    </div>
                    <div className="rounded-[0_14px_14px_14px] bg-white px-4 py-2.5 shadow-sm border border-[#E9D8C8]">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                {error && (
                  <Alert
                    message={error}
                    type="error"
                    showIcon
                    className="rounded-[var(--radius-md)]"
                    closable
                    afterClose={() => useChatStore.setState({ error: null })}
                  />
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Float Input Area */}
            <div className="flex-shrink-0 border-t border-[#EFE2D6]/70 bg-[#FFFCF8]/92 px-5 py-4 backdrop-blur md:px-8">
              <div className="mx-auto w-full max-w-[760px]">
                <ChatInput onSend={handleSend} disabled={isStreaming} />
                <div className="mt-2 text-center text-[11px] text-[#B09880]">
                  只记录足够稳定的理解；不确定的部分会继续观察。
                </div>
              </div>
            </div>
          </Content>

          {/* Right Knowledge/Profile Sider (The Paradigm Shift) */}
          <Sider width={328} className="hidden xl:block bg-transparent" trigger={null}>
            <MemoryCompass />
          </Sider>
        </Layout>
      </Layout>
    </Layout>
  );
}

interface ContextSummary {
  mode: string;
  focus: string;
  recallItems: Array<{ label: string; count: number; tone: string }>;
  note: string;
}

function ChatContextBar({ summary }: { summary: ContextSummary }) {
  return (
    <div className="rounded-lg border border-[#E9D8C8] bg-[#FFF8F1] px-3.5 py-2.5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F0DFC8] px-2.5 py-0.5 text-[12px] font-medium text-[#8B5737]">
              {summary.mode}
            </span>
            <span className="truncate text-[13px] font-medium text-[#4A3C31]">
              {summary.focus}
            </span>
          </div>
          <div className="text-[12px] text-[#9B8069]">{summary.note}</div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1">
          {summary.recallItems.length > 0 ? summary.recallItems.map((item) => (
            <span key={item.label} className={`rounded-full border px-2 py-0.5 text-[12px] ${item.tone}`}>
              {item.label} {item.count}
            </span>
          )) : (
            <span className="rounded-full border border-dashed border-[#E2CDBA] px-2 py-0.5 text-[12px] text-[#9B8069]">
              档案会慢慢浮现
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function buildContextSummary(messages: ChatMessage[], profile: UserProfile | null): ContextSummary {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content ?? '';
  const recallItems = [
    { label: '价值观', count: profile?.values?.length ?? 0, tone: 'border-[#DEB888]/60 bg-[var(--color-primary-light)] text-[var(--color-text-warm)]' },
    { label: '情绪', count: profile?.emotions?.length ?? 0, tone: 'border-[#D7CDC1] bg-[var(--color-emotion-bg)] text-[var(--color-emotion-text)]' },
    { label: '关系', count: profile?.relationships?.length ?? 0, tone: 'border-[#DEB888]/50 bg-[var(--color-relationship-bg)] text-[var(--color-relationship-text)]' },
    { label: '边界', count: profile?.fears?.length ?? 0, tone: 'border-[#F5D5CB] bg-[var(--color-fear-bg)] text-[var(--color-fear-text)]' },
    { label: '决策', count: profile?.decisions?.length ?? 0, tone: 'border-[#CFE7DC] bg-[var(--color-decision-bg)] text-[var(--color-decision-text)]' },
  ].filter((item) => item.count > 0);

  return {
    mode: inferMode(latestUserMessage),
    focus: latestUserMessage ? `当前焦点：${inferFocus(latestUserMessage)}` : '可以从一句简单的“我有点乱”开始',
    recallItems,
    note: recallItems.length > 0
      ? '已建立的档案只作参考，不会替你下结论。'
      : '我会先听你多说一点，再形成稳定理解。',
  };
}

function inferMode(text: string) {
  if (!text) return '日常倾诉';
  if (/选|决定|offer|考研|工作|城市|要不要|纠结/.test(text)) return '重大决策探索';
  if (/父母|妈妈|爸爸|朋友|同事|对象|他|她/.test(text)) return '关系沟通';
  if (/后悔|以前|当时|复盘|后来/.test(text)) return '复盘回看';
  return '日常倾诉';
}

function inferFocus(text: string) {
  if (!text) return '等待你开口';
  const normalized = text.replace(/\s+/g, '');
  return normalized.length > 22 ? `${normalized.slice(0, 22)}...` : normalized;
}
