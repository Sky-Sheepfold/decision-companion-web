import { useNavigate } from 'react-router-dom';
import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  FormOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';

interface SidebarProps {
  className?: string;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  date: string;
  group: string;
  summary: string;
  active?: boolean;
}

const mockHistory: ChatHistoryItem[] = [
  { id: '1', title: '关于职业选择', date: '21:20', group: '今天', summary: '重大决策探索', active: true },
  { id: '2', title: '和父母的沟通', date: '昨天', group: '昨天', summary: '关系沟通' },
  { id: '3', title: '是否要换城市', date: '5月10日', group: '更早', summary: '城市与工作权衡' },
  { id: '4', title: '考研还是工作', date: '5月8日', group: '更早', summary: '长期规划复盘' },
];

export function Sidebar({ className = '' }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const resetChat = () => {
    useChatStore.setState({
      messages: [{
        role: 'assistant',
        content: '你好，很高兴见到你。今天有什么想聊的吗？',
        timestamp: new Date().toISOString(),
      }],
      error: null,
      isStreaming: false,
    });
    navigate('/chat');
  };
  const groups = mockHistory.reduce<Record<string, ChatHistoryItem[]>>((acc, item) => {
    acc[item.group] = [...(acc[item.group] || []), item];
    return acc;
  }, {});

  return (
    <aside className={`chat-sidebar ${className}`}>
      <header className="chat-sidebar-brand">
        <img className="chat-sidebar-mark" src="/decision-companion-logo.png" alt="决策伙伴" />
        <div className="chat-sidebar-brand-copy">
          <strong>决策伙伴</strong>
          <span>安静地记住你</span>
        </div>
        <button type="button" className="chat-sidebar-icon-button" onClick={resetChat} aria-label="新建对话">
          <FormOutlined />
        </button>
      </header>

      <button type="button" className="chat-new-thread" onClick={resetChat}>
        <FormOutlined />
        <span>开启新的决策整理</span>
      </button>

      <section className="chat-history-panel custom-scrollbar">
        <div className="chat-history-title">
          <ClockCircleOutlined />
          <span>历史对话</span>
        </div>
        {mockHistory.length === 0 ? (
          <div className="chat-history-empty">还没有历史对话</div>
        ) : (
          <div className="chat-history-groups">
            {Object.entries(groups).map(([group, items]) => (
              <section key={group} className="chat-history-group">
                <div className="chat-history-group-label">{group}</div>
                <div className="chat-history-list">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`chat-history-row ${item.active ? 'active' : ''}`}
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
            await logout();
            navigate('/login', { replace: true });
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
