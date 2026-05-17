import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntApp, Button, Input, Card, Spin, Typography } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { onboardingApi } from '../api/agent';
import type { OnboardingQuestion } from '../types';
import { StepIndicator } from '../components/common/StepIndicator';

const { TextArea } = Input;
const { Paragraph } = Typography;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(5);
  const [question, setQuestion] = useState<OnboardingQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId] = useState(() => {
    const storedSessionId = sessionStorage.getItem('sessionId');
    if (storedSessionId) return storedSessionId;

    const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('sessionId', newSessionId);
    return newSessionId;
  });

  const loadQuestion = useCallback(async (step: number) => {
    try {
      setIsLoading(true);
      const data = await onboardingApi.getQuestion(step);
      setQuestion(data);
    } catch (err) {
      console.error('Load question error:', err);
      message.error('加载问题失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const status = await onboardingApi.getStatus(sessionId);
        if (status.onboarded) {
          navigate('/chat');
          return;
        }
        setCurrentStep(status.currentStep);
        await loadQuestion(status.currentStep);
      } catch (err) {
        console.error('Check status error:', err);
        await loadQuestion(1);
      }
    }

    checkOnboardingStatus();
  }, [loadQuestion, navigate, sessionId]);

  async function handleSubmit() {
    if (!answer.trim()) return;

    setIsSubmitting(true);

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
      message.error('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSkip() {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setAnswer('');
      loadQuestion(currentStep + 1);
    } else {
      navigate('/chat');
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const latestAssistantReply = [...conversation]
    .reverse()
    .find((msg) => msg.role === 'assistant')?.content;

  if (isLoading && !question) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--color-background)]">
        <Spin size="large" description="正在准备问题..." />
      </div>
    );
  }

  return (
    <div className="page-fade flex min-h-[100dvh] flex-col items-center justify-center bg-[#FAFAF8] px-6 py-8">
      <div className="w-full max-w-[640px]">
        <Card
          variant="borderless"
          className="shadow-[0_12px_40px_rgba(200,132,90,0.06)] bg-[#FFFFFF] !rounded-[24px]"
          style={{ padding: '32px 16px', border: '1px solid var(--color-border)' }}
        >
          <StepIndicator total={totalSteps} current={currentStep - 1} />

          <div key={currentStep} className="mt-12 space-y-10">
            <div className="text-center space-y-5">
              <div className="mb-4 text-[48px] opacity-80 transition-all duration-500 ease-out transform translate-y-0">🛋️</div>
              <Paragraph className="text-[24px] font-serif font-medium leading-relaxed text-[#2C2C2A] m-0 max-w-lg mx-auto">
                {question?.question}
              </Paragraph>
              {question?.hint && (
                <Paragraph className="text-[14px] leading-relaxed text-[#C8845A] opacity-90 m-0">
                  {question.hint}
                </Paragraph>
              )}
            </div>

            {latestAssistantReply && (
              <div className="mx-auto max-w-lg rounded-[16px] border border-[var(--color-border)] bg-[#FDFBF9] px-6 py-4 text-[14px] leading-relaxed text-[#4A3C31] shadow-sm italic">
                {latestAssistantReply}
              </div>
            )}

            <div className="mx-auto max-w-lg space-y-6">
              <Spin spinning={isSubmitting}>
                <TextArea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="慢慢说，我在听……"
                  autoSize={{ minRows: 4, maxRows: 6 }}
                  disabled={isSubmitting}
                  className="bg-[#FAFAF8] text-[15px] !rounded-[16px] !border-transparent hover:!border-[#C8845A]/30 focus:!border-[#C8845A] focus:!shadow-[0_0_0_2px_rgba(200,132,90,0.1)] transition-all p-4"
                />
              </Spin>

              <div className="flex flex-col gap-3">
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmit}
                  disabled={!answer.trim() || isSubmitting}
                  icon={<RightOutlined />}
                  iconPlacement="end"
                  className="w-full font-medium h-12 !rounded-[16px] shadow-sm hover:opacity-90 bg-[#C8845A]"
                >
                  {isSubmitting ? '记录中...' : '继续'}
                </Button>

                <Button
                  type="text"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="w-full text-[#B09880] hover:text-[#A06040] hover:bg-transparent !rounded-[16px]"
                >
                  这个跳过，先聊别的
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
