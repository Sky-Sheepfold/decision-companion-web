import { useState } from 'react';
import { Input, Button } from 'antd';
import { SendOutlined, PlusOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder = '说说你在想什么……' }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-[18px] shadow-[0_8px_24px_rgba(106,64,32,0.07)] border border-[#E8D8C8] p-2.5 mx-auto w-full transition-shadow focus-within:shadow-[0_10px_28px_rgba(106,64,32,0.1)] focus-within:border-[#C8845A]">
      <div className="flex items-end gap-3">
        <Button
          type="text"
          shape="circle"
          icon={<PlusOutlined />}
          size="large"
          className="text-[#B09880] hover:!text-[#A06040] hover:!bg-[#F2EBE5] flex-shrink-0 mb-1"
        />
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoSize={{ minRows: 1, maxRows: 6 }}
          variant="borderless"
          className="flex-1 bg-transparent px-2 py-2 text-[15px] resize-none shadow-none focus:shadow-none !mb-0 text-[#2C2C2A]"
        />
        <Button
          type="primary"
          shape="circle"
          icon={<SendOutlined />}
          size="large"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="flex-shrink-0 mb-1 shadow-sm bg-[#C8845A] hover:bg-[#A06040] border-none disabled:!bg-[#F0DFC8] disabled:!text-white"
        />
      </div>
    </div>
  );
}
