import { useNavigate } from 'react-router-dom';
import { Button, Typography, Space, Badge } from 'antd';
import { MenuOutlined, UserOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface ChatHeaderProps {
  showMenuButton?: boolean;
  isMenuActive?: boolean;
  menuButtonLabel?: string;
  onMenuClick?: () => void;
}

export function ChatHeader({
  showMenuButton = false,
  isMenuActive = false,
  menuButtonLabel = '打开历史对话',
  onMenuClick,
}: ChatHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="chat-topbar">
      <Space size="middle" className="min-w-0">
        {showMenuButton && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onMenuClick}
            aria-label={menuButtonLabel}
            aria-pressed={isMenuActive}
            className={`chat-menu-toggle text-[18px] text-[var(--color-text)] hover:bg-[var(--color-border)] ${isMenuActive ? 'is-active' : ''}`}
          />
        )}
        <div className="min-w-0 flex items-center gap-3">
          <Title level={4} className="!mb-0 truncate text-[18px] font-medium text-[#2C2C2A]">
            你的决策伙伴
          </Title>
          <Badge status="success" text="在线" className="hidden sm:flex items-center text-[var(--color-text-muted)]" />
        </div>
      </Space>
      <Button
        type="text"
        icon={<UserOutlined />}
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-[var(--color-text)] hover:bg-[var(--color-border)] lg:hidden"
      >
        <span className="hidden sm:inline">我的画像</span>
      </Button>
    </header>
  );
}
