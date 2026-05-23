import { Avatar, Typography } from 'antd';
import type { ChatMessage } from '../../types';

const { Text } = Typography;

interface MessageBubbleProps {
  message: ChatMessage;
  showAvatar?: boolean;
}

export function MessageBubble({ message, showAvatar = true }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const showMemoryHint = !isUser && /我记得|你之前|之前说过|上次/.test(message.content);

  return (
    <div className={`message-enter chat-message-row ${isUser ? 'user' : 'assistant'}`}>
      {showAvatar && (
        <Avatar
          size={34}
          src={isUser ? undefined : '/decision-companion-logo.png'}
          alt={isUser ? '你' : '决策伙伴'}
          className={`chat-message-avatar ${isUser ? 'user' : 'assistant'}`}
        >
          {isUser ? '你' : null}
        </Avatar>
      )}

      <div className={`chat-message-stack ${isUser ? 'user' : 'assistant'}`}>
        {showMemoryHint && (
          <Text className="chat-memory-hint">
            我记得你说过……
          </Text>
        )}
        <div className={`chat-message-bubble ${isUser ? 'user' : 'assistant'}`}>
          {message.content}
        </div>
        {message.timestamp && (
          <Text type="secondary" className="chat-message-time">
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </div>
    </div>
  );
}
