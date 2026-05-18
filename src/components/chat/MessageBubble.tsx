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
    <div
      className={`
        message-enter flex items-start gap-3
        ${isUser ? 'flex-row-reverse' : 'flex-row'}
      `}
    >
      {showAvatar && (
        <Avatar
          size={34}
          src={isUser ? undefined : '/decision-companion-logo.png'}
          alt={isUser ? '你' : '决策伙伴'}
          className={`
            mt-0.5 flex-shrink-0 flex items-center justify-center text-[12px] font-medium
            ${isUser ? 'bg-[#C8845A] text-white' : 'bg-white text-[#7A634F] border border-[#E9D8C8] shadow-sm'}
          `}
        >
          {isUser ? '你' : null}
        </Avatar>
      )}

      <div
        className={`
          flex max-w-[82%] flex-col md:max-w-[72%]
          ${isUser ? 'items-end' : 'items-start'}
        `}
      >
        {showMemoryHint && (
          <Text className="mb-1 rounded-full border border-[#DAD6F7] bg-[var(--color-memory-bg)] px-2.5 py-0.5 text-[12px] text-[var(--color-memory-text)]">
            我记得你说过……
          </Text>
        )}
        <div
          className={`
            whitespace-pre-wrap break-words px-4 py-2.5 text-[15px] leading-7
            ${isUser
              ? 'bg-[#D49A73] text-white rounded-[14px_14px_2px_14px] shadow-[0_4px_12px_rgba(200,132,90,0.18)]'
              : 'bg-white text-[#2C2C2A] rounded-[2px_14px_14px_14px] border border-[#E9D8C8] shadow-[0_3px_10px_rgba(106,64,32,0.06)]'
            }
          `}
        >
          {message.content}
        </div>
        {message.timestamp && (
          <Text type="secondary" className="text-xs mt-1 px-1">
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
