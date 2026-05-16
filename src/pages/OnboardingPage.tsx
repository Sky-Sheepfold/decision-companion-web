import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../api/agent';
import type { OnboardingQuestion } from '../types';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(5);
  const [question, setQuestion] = useState<OnboardingQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  let sessionId = sessionStorage.getItem('sessionId');

  useEffect(() => {
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem('sessionId', sessionId);
    }

    checkOnboardingStatus();
  }, []);

  function generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }

  async function checkOnboardingStatus() {
    try {
      const status = await onboardingApi.getStatus(sessionId!);
      if (status.onboarded) {
        navigate('/chat');
        return;
      }
      setCurrentStep(status.currentStep);
      setTotalSteps(status.totalSteps);
      await loadQuestion(status.currentStep);
    } catch (err) {
      console.error('Check status error:', err);
      await loadQuestion(1);
    }
  }

  async function loadQuestion(step: number) {
    try {
      setIsLoading(true);
      const data = await onboardingApi.getQuestion(step);
      setQuestion(data);
    } catch (err) {
      console.error('Load question error:', err);
      setError('加载问题失败');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    if (!answer.trim() || !sessionId) return;

    setIsSubmitting(true);
    setError(null);

    const userMessage = { role: 'user', content: answer };
    setConversation((prev) => [...prev, userMessage]);

    try {
      const result = await onboardingApi.submitAnswer(sessionId, currentStep, answer);
      
      const assistantMessage = { role: 'assistant', content: result.reply };
      setConversation((prev) => [...prev, assistantMessage]);

      if (result.isCompleted) {
        setTimeout(() => {
          navigate('/chat');
        }, 2000);
      } else {
        setCurrentStep(result.currentStep + 1);
        setAnswer('');
        await loadQuestion(result.currentStep + 1);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  if (isLoading) {
    return (
      <div className="onboarding-loading">
        <div className="loading-spinner"></div>
        <p>正在准备问题...</p>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <header className="onboarding-header">
        <h1>认识你</h1>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        <p className="progress-text">
          {currentStep} / {totalSteps}
        </p>
      </header>

      <main className="onboarding-main">
        {conversation.length === 0 ? (
          <div className="question-section">
            <div className="question-card">
              <p className="question-text">{question?.question}</p>
              {question?.hint && (
                <p className="question-hint">{question.hint}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="conversation-container">
            {conversation.map((msg, idx) => (
              <div key={idx} className={`conversation-message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '😊' : '🤖'}
                </div>
                <div className="message-content">
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>关闭</button>
          </div>
        )}

        <div className="answer-section">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="在这里输入你的回答..."
            rows={4}
            disabled={isSubmitting}
          />
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={!answer.trim() || isSubmitting}
          >
            {isSubmitting ? '发送中...' : '发送'}
          </button>
        </div>
      </main>
    </div>
  );
}
