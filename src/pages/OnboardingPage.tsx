import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntApp, Button, Input, Spin } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { onboardingApi } from '../api/agent';
import { useAuthStore } from '../stores/authStore';
import type { OnboardingQuestion } from '../types';
import { StepIndicator } from '../components/common/StepIndicator';

const { TextArea } = Input;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const markOnboarded = useAuthStore((state) => state.markOnboarded);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(5);
  const [question, setQuestion] = useState<OnboardingQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, [message]);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const status = await onboardingApi.getStatus();
        setTotalSteps(status.totalSteps);
        if (status.onboarded) {
          markOnboarded();
          navigate('/chat', { replace: true });
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
  }, [loadQuestion, markOnboarded, navigate]);

  async function handleSubmit() {
    if (!answer.trim()) return;

    setIsSubmitting(true);

    const userMessage = { role: 'user', content: answer };
    setConversation((prev) => [...prev, userMessage]);

    try {
      const result = await onboardingApi.submitAnswer(currentStep, answer);

      if (result.reply) {
        const assistantMessage = { role: 'assistant', content: result.reply };
        setConversation((prev) => [...prev, assistantMessage]);
      }

      setTotalSteps(result.totalSteps);

      if (result.isCompleted) {
        markOnboarded();
        navigate('/chat', { replace: true });
      } else {
        setCurrentStep(result.nextStep);
        setAnswer('');
        await loadQuestion(result.nextStep);
      }
    } catch (err) {
      console.error('Submit error:', err);
      message.error('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSkip() {
    setIsSubmitting(true);

    try {
      const result = await onboardingApi.skipStep(currentStep);
      setTotalSteps(result.totalSteps);

      if (result.isCompleted) {
        markOnboarded();
        navigate('/chat', { replace: true });
        return;
      }

      setCurrentStep(result.nextStep);
      setAnswer('');
      await loadQuestion(result.nextStep);
    } catch (err) {
      console.error('Skip error:', err);
      message.error('跳过失败，请稍后重试');
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
    <main className="onboarding-page page-fade">
      <section className="onboarding-card">
        <StepIndicator total={totalSteps} current={currentStep - 1} />

        <div key={currentStep} className="space-y-8">
          <div className="onboarding-question">
            <h1>{question?.question}</h1>
            {question?.hint && <p>{question.hint}</p>}
          </div>

          {latestAssistantReply && (
            <div className="mx-auto max-w-lg rounded-xl border border-[var(--color-border)] bg-[#FDFBF9] px-5 py-4 text-[14px] leading-relaxed text-[#4A3C31] shadow-sm">
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
                className="bg-[#FAFAF8] text-[15px] !rounded-xl !border-transparent hover:!border-[#C8845A]/30 focus:!border-[#C8845A] focus:!shadow-[0_0_0_2px_rgba(200,132,90,0.1)] transition-all p-4"
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
                className="w-full font-medium h-12 !rounded-xl shadow-sm hover:opacity-90 bg-[#C8845A]"
              >
                {isSubmitting ? '记录中...' : '继续'}
              </Button>

              <Button
                type="text"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="w-full text-[#B09880] hover:text-[#A06040] hover:bg-transparent !rounded-xl"
              >
                这个跳过，先聊别的
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
