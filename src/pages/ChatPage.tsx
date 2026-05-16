import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentApi } from '../api/agent';
import type { ChatMessage } from '../types';

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: '你好，很高兴见到你。今天有什么想聊的吗？',
  timestamp: new Date().toISOString(),
};

export function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  const sessionId = sessionStorage.getItem('sessionId');

  useEffect(() => {
    if (!sessionId) {
      navigate('/onboarding');
      return;
    }
    if (!hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true;
      setMessages([INITIAL_MESSAGE]);
    }
  }, [sessionId, navigate]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendMessage() {
    if (!inputText.trim() || !sessionId || isStreaming) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsStreaming(true);
    setError(null);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await agentApi.chatStream(sessionId, userMessage.content);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法获取响应流');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.role === 'assistant') {
            return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + chunk }];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('发送消息失败，请稍后重试');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat-container">
      <header className="chat-header">
        <button className="btn-profile" onClick={() => navigate('/profile')}>
          查看画像
        </button>
        <h1>人生决策伙伴</h1>
      </header>

      <main className="chat-main">
        <div className="messages-container">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '😊' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
                {msg.timestamp && (
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setError(null)}>关闭</button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="chat-footer">
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入你的想法..."
            rows={1}
            disabled={isStreaming}
          />
          <button
            className="btn-send"
            onClick={sendMessage}
            disabled={!inputText.trim() || isStreaming}
          >
            发送
          </button>
        </div>
      </footer>
    </div>
  );
}
