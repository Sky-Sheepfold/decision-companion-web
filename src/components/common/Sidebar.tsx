import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  FormOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { App as AntApp } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import type { ChatConversation } from '../../types';

interface SidebarProps {
  className?: string;
}

interface ChatHistoryItem extends ChatConversation {
  title: string;
  date: string;
  group: string;
  summary: string;
}

const HISTORY_GROUP_ORDER = ['今天', '昨天', '更早'];

export function Sidebar({ className = '' }: SidebarProps) {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const { user, logout } = useAuthStore();
  const {
    conversations,
    currentConversationId,
    isLoadingConversations,
    isLoadingMessages,
    isStreaming,
    openConversation,
    startNewConversation,
  } = useChatStore();

  const resetChat = () => {
    startNewConversation();
    navigate('/chat');
  };

  const groups = useMemo(() => groupConversations(conversations), [conversations]);

  const handleOpenConversation = async (conversationId: number) => {
    navigate('/chat');
    await openConversation(conversationId);
  };

  return (
    <aside className={`chat-sidebar ${className}`}>
      <header className="chat-sidebar-brand">
        <img className="chat-sidebar-mark" src="/decision-companion-logo.png" alt="决策伙伴" />
        <div className="chat-sidebar-brand-copy">
          <strong>决策伙伴</strong>
          <span>安静地记住你</span>
        </div>
      </header>

      <button type="button" className="chat-new-thread" onClick={resetChat} disabled={isStreaming}>
        <FormOutlined />
        <span>开启新的决策整理</span>
      </button>

      <section className="chat-history-panel custom-scrollbar">
        <div className="chat-history-title">
          <ClockCircleOutlined />
          <span>历史对话</span>
        </div>
        {conversations.length === 0 ? (
          <div className="chat-history-empty">
            {isLoadingConversations ? '正在读取历史对话...' : '还没有历史对话'}
          </div>
        ) : (
          <div className="chat-history-groups">
            {HISTORY_GROUP_ORDER.filter((group) => groups[group]?.length).map((group) => (
              <section key={group} className="chat-history-group">
                <div className="chat-history-group-label">{group}</div>
                <div className="chat-history-list">
                  {groups[group].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`chat-history-row ${item.id === currentConversationId ? 'active' : ''}`}
                      onClick={() => {
                        void handleOpenConversation(item.id);
                      }}
                      disabled={isStreaming || isLoadingMessages}
                    >
                      <div className="chat-history-row-main">
                        <strong>{item.title}</strong>
                        <span>{item.summary}</span>
                      </div>
                      <time>{item.date}</time>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <footer className="chat-sidebar-footer">
        <div className="chat-sidebar-user">
          <UserOutlined className="text-[#A06040]" />
          <span>{user?.username || '未登录'}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="chat-sidebar-profile-button"
        >
          <span>
            <UserOutlined />
            <span>全景画像</span>
          </span>
          <ArrowRightOutlined />
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              await logout();
            } catch {
              // Local auth state is cleared in the store even if the server request fails.
            } finally {
              message.success('已退出登录');
              navigate('/login', { replace: true });
            }
          }}
          className="chat-sidebar-logout"
        >
          <LogoutOutlined />
          退出登录
        </button>
      </footer>
    </aside>
  );
}

function groupConversations(conversations: ChatConversation[]) {
  return conversations
    .filter((conversation) => !conversation.deleted)
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .reduce<Record<string, ChatHistoryItem[]>>((acc, conversation) => {
      const group = getConversationGroup(conversation.updatedAt);
      acc[group] = [
        ...(acc[group] || []),
        {
          ...conversation,
          title: conversation.title || '未命名对话',
          date: formatConversationDate(conversation.updatedAt, group),
          group,
          summary: `${conversation.messageCount} 条消息`,
        },
      ];
      return acc;
    }, {});
}

function getConversationGroup(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (toDateKey(date) === toDateKey(today)) return '今天';
  if (toDateKey(date) === toDateKey(yesterday)) return '昨天';
  return '更早';
}

function formatConversationDate(value: string, group: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  if (group === '今天') {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  if (group === '昨天') return '昨天';
  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
}

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
