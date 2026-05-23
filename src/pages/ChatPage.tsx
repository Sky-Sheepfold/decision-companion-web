import { useEffect, useMemo, useRef, useState } from 'react';
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

export function ChatPage() {
  const { messages, isStreaming, error, sendMessage, loadConversations } = useChatStore();
  const { profile, fetchProfile } = useProfileStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      if (messages.length === 0) {
        useChatStore.setState(() => ({
          messages: [createInitialMessage()],
        }));
      }
    }
  }, [messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (isStreaming || messages.length <= 1) return;
    const timer = window.setTimeout(() => {
      void fetchProfile();
    }, 900);

    return () => window.clearTimeout(timer);
  }, [fetchProfile, isStreaming, messages.length]);

  const contextSummary = useMemo(() => buildContextSummary(messages, profile), [messages, profile]);
  const shouldShowTyping = isStreaming && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content.trim();
  const hasUserMessages = messages.some((message) => message.role === 'user');

  const handleSend = async (text: string) => {
    await sendMessage(text);

    const chatCount = parseInt(sessionStorage.getItem('chatCount') || '0', 10);
    sessionStorage.setItem('chatCount', String(chatCount + 1));
  };

  return (
    <Layout className="chat-root page-fade" hasSider>
      {/* PC Sider - Standard History Sidebar */}
      <Sider width={240} breakpoint="lg" collapsedWidth="0" trigger={null} className="chat-left-sider hidden lg:block">
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

      <Layout className="chat-app-area">
        <ChatHeader
          showMenuButton
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        <div className="chat-board">
          <Content className="chat-conversation-card">
            <div className="chat-thread-scroll custom-scrollbar">
              <div className="chat-thread">
                <ChatContextBar summary={contextSummary} />

                {messages.map((msg, idx) => (
                  msg.role === 'assistant' && !msg.content.trim()
                    ? null
                    : <MessageBubble key={idx} message={msg} />
                ))}

                {!hasUserMessages && !isStreaming && (
                  <DecisionStarterPanel onPick={handleSend} />
                )}

                {shouldShowTyping && (
                  <div className="message-enter chat-message-row assistant typing">
                    <img
                      className="chat-message-avatar assistant"
                      src="/decision-companion-logo.png"
                      alt="决策伙伴正在输入"
                    />
                    <div className="chat-message-bubble assistant typing">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                {error && (
                  <Alert
                    title={error}
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

            <div className="chat-composer-shell">
              <div className="chat-composer-inner">
                <ChatInput onSend={handleSend} disabled={isStreaming} />
                <div className="chat-composer-note">
                  只记录足够稳定的理解；不确定的部分会继续观察。
                </div>
              </div>
            </div>
          </Content>

          <aside className="chat-memory-rail">
            <MemoryCompass />
          </aside>
        </div>
      </Layout>
    </Layout>
  );
}

function createInitialMessage(): ChatMessage {
  return {
    role: 'assistant',
    content: '你好，很高兴见到你。今天有什么想聊的吗？',
    timestamp: new Date().toISOString(),
  };
}

function DecisionStarterPanel({ onPick }: { onPick: (text: string) => void }) {
  const suggestions = [
    '我有点乱，想先说说',
    '帮我梳理一个职业选择',
    '我想复盘一次过去的决定',
    '有个关系问题让我卡住了',
  ];

  return (
    <section className="chat-starter-panel">
      <div>
        <span>可以从这里开始</span>
        <strong>把脑子里的结先放到桌面上。</strong>
        <p>你不需要一次说完整，我会先听，再慢慢帮你拆出价值、情绪、关系和边界。</p>
      </div>
      <div className="chat-starter-actions">
        {suggestions.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => onPick(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>
    </section>
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
    <section className="chat-context-card">
      <div className="chat-context-main">
        <div className="chat-context-copy">
          <div className="chat-context-title-row">
            <span className="chat-mode-pill">
              {summary.mode}
            </span>
            <strong>
              {summary.focus}
            </strong>
          </div>
          <p>{summary.note}</p>
        </div>
        <div className="chat-recall-list">
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
    </section>
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
