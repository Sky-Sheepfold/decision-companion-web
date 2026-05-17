import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spin, Typography, Space, Empty, Timeline, Row, Col, Progress, Tag, Tooltip, Card } from 'antd';
import {
  HeartOutlined,
  LeftOutlined,
  BlockOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  BranchesOutlined
} from '@ant-design/icons';
import { useProfileStore } from '../stores/profileStore';
import type {
  Evidence,
  ProfileValues,
  ProfileDecision,
  ProfileEmotion,
  ProfileRelationship,
  ProfileFear,
} from '../types';

const { Title, Text } = Typography;

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, loading, error, completeness, fetchProfile, getCompletenessText } = useProfileStore();

  useEffect(() => {
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      navigate('/onboarding');
      return;
    }
    fetchProfile();
  }, [navigate, fetchProfile]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#FAFAF8]">
        <Spin size="large" description="正在构建全景档案..." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#FAFAF8] px-6 text-center">
        <Empty
          description={<Text className="text-[#A06040]">档案还不够完整，去多聊几次吧</Text>}
          className="mb-4"
        />
        <Button size="large" onClick={() => navigate('/chat')} className="!rounded-xl bg-[#C8845A] text-white hover:opacity-90">
          返回工作台
        </Button>
      </div>
    );
  }

  return (
    <div className="page-fade min-h-[100dvh] bg-[#FAFAF8] pb-16">
      <div className="sticky top-0 z-50 bg-[#FAFAF8]/90 backdrop-blur-md border-b border-[#EDE0D4] px-6 py-4 flex items-center justify-between">
        <Space align="center" size="middle">
          <Button type="text" icon={<LeftOutlined />} onClick={() => navigate('/chat')} className="hover:!bg-[#F2EBE5]">
            返回
          </Button>
          <Title level={4} className="!mb-0 font-serif text-[#2C2C2A]">全景人生档案</Title>
        </Space>
        <div className="hidden md:flex items-center gap-3">
          <Text type="secondary" className="text-[13px]">{getCompletenessText()}</Text>
          <Progress percent={completeness} strokeColor="#C8845A" railColor="#F0DFC8" showInfo={false} className="w-24 m-0" />
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8} className="space-y-6">
            <ValuesCard values={profile.values || []} delay={0} />
            <FearCard fears={profile.fears || []} delay={150} />
            <RelationshipsCard relationships={profile.relationships || []} delay={300} />
          </Col>
          <Col xs={24} lg={16} className="space-y-6">
            <EmotionsCard emotions={profile.emotions || []} delay={100} />
            <DecisionsCard decisions={profile.decisions || []} delay={200} />
          </Col>
        </Row>
      </main>
    </div>
  );
}

function ProfileCard({ title, description, children, delay }: any) {
  return (
    <Card
      variant="borderless"
      className="shadow-[0_16px_48px_rgba(200,132,90,0.04)] bg-white !rounded-2xl border border-[var(--color-border)] profile-card"
      style={{ animationDelay: `${delay}ms` }}
      styles={{ body: { padding: '24px' } }}
    >
      <Title level={5} className="!mb-1 text-[18px] font-medium text-[#2C2C2A]">
        {title}
      </Title>
      <Text type="secondary" className="block mb-6 text-[13px] opacity-80">{description}</Text>
      {children}
    </Card>
  );
}

function ValuesCard({ values, delay }: { values: ProfileValues[]; delay: number }) {
  return (
    <ProfileCard title={<span className="text-[#A06040]"><HeartOutlined className="mr-2" />价值观引擎</span>} description="驱动你选择的核心动力" delay={delay}>
      {values.length === 0 ? <EmptyText /> : (
        <div className="space-y-3 pt-2">
          {values.map((value) => (
            <div key={value.id} className="rounded-xl border border-[#EDE0D4] bg-[#FAFAF8] p-3 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] text-[#B09880]">{value.item}</div>
                  <div className="mt-0.5 text-[14px] font-medium text-[#4A3C31]">{value.preference}</div>
                </div>
                <ConfidenceBadge confidence={value.confidence} />
              </div>
              <EvidenceList evidence={value.evidence} />
            </div>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}

function FearCard({ fears, delay }: { fears: ProfileFear[]; delay: number }) {
  return (
    <ProfileCard title={<span className="text-[#993C1D]"><SafetyCertificateOutlined className="mr-2" />绝对边界</span>} description="不可触碰的底线与深层恐惧" delay={delay}>
      {fears.length === 0 ? <EmptyText /> : (
        <ul className="space-y-3 pt-2 m-0 pl-1 list-none">
          {fears.map((fear) => (
            <li key={fear.id} className="flex items-start gap-2 bg-[#FAECE7] p-3 rounded-xl border border-[#F5D5CB]/50">
              <BlockOutlined className="text-[#993C1D] mt-1 text-[13px]" />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <div className="text-[#A64A2F] font-medium text-[14px]">{fear.description}</div>
                  <ConfidenceBadge confidence={fear.confidence} danger />
                </div>
                {(fear.manifestation || fear.boundaryType) && (
                  <div className="text-[#C87E6A] text-[12px] mt-1">
                    {fear.manifestation || (fear.boundaryType === 'hard' ? '硬边界' : '软边界')}
                  </div>
                )}
                <EvidenceList evidence={fear.evidence} danger />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ProfileCard>
  );
}

function RelationshipsCard({ relationships, delay }: { relationships: ProfileRelationship[]; delay: number }) {
  return (
    <ProfileCard title={<span className="text-[#A07050]"><BranchesOutlined className="mr-2" />关系引力网</span>} description="重要节点与能量场" delay={delay}>
      {relationships.length === 0 ? <EmptyText /> : (
        <div className="flex flex-col gap-3 pt-2">
          {relationships.map((rel) => (
            <div key={rel.id} className="flex items-center justify-between bg-[#F5EDE0] px-4 py-3 rounded-xl border border-[#DEB888]/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E8D1B5] flex items-center justify-center text-[#8C5D3B] font-bold">
                  {rel.name.charAt(0)}
                </div>
                <div>
                  <div className="text-[#6B462C] font-medium text-[14px]">{rel.name}</div>
                  <div className="text-[#A07050] text-[12px]">{rel.role}</div>
                  {rel.influenceStyle && <div className="mt-1 text-[12px] text-[#8C6A50]">{rel.influenceStyle}</div>}
                </div>
              </div>
              <Tag color={isHighInfluence(rel.influenceLevel) ? 'orange' : 'default'} className="!rounded-full !border-0 text-[12px]">
                引力 {formatInfluenceLevel(rel.influenceLevel)}
              </Tag>
            </div>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}

function EmotionsCard({ emotions, delay }: { emotions: ProfileEmotion[]; delay: number }) {
  return (
    <ProfileCard title={<span className="text-[#C8845A]"><TeamOutlined className="mr-2" />情绪雷达</span>} description="心理能量起伏特征" delay={delay}>
      {emotions.length === 0 ? <EmptyText /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {emotions.map((emotion) => (
            <div key={emotion.id} className="bg-[#FFFFFF] p-4 rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Text strong className="text-[15px]">{emotion.emotion}</Text>
                <Tag className="!border-[#EDE0D4] !bg-[#FDFBF9] !text-[#A06040] !rounded-full">{emotion.behavior || '持续观察'}</Tag>
              </div>
              <div className="text-[13px] text-gray-500 mb-3 min-h-[40px]">
                <span className="text-[#C8845A]">触发器：</span>{emotion.triggerDesc}
              </div>
              {emotion.agentNote && (
                <div className="bg-[#FAF6F1] px-3 py-2 rounded-lg text-[12px] text-[#A06040] italic border-l-2 border-[#C8845A]">
                  "{emotion.agentNote}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}

function DecisionsCard({ decisions, delay }: { decisions: ProfileDecision[]; delay: number }) {
  return (
    <ProfileCard title={<span className="text-[#0F6E56]"><ClockCircleOutlined className="mr-2" />决策时间轴</span>} description="历史的选择与复盘" delay={delay}>
      {decisions.length === 0 ? <EmptyText /> : (
        <div className="pt-4 px-2">
          <Timeline
            mode="left"
            items={decisions.map((decision) => ({
              color: decision.satisfaction && decision.satisfaction > 3 ? '#0F6E56' : '#C8845A',
              dot: decision.satisfaction && decision.satisfaction > 3 ? <CheckCircleOutlined className="text-[16px]" /> : <ClockCircleOutlined className="text-[16px]" />,
              children: (
                <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[var(--color-border)] shadow-sm mt-[-8px] mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Text strong className="text-[15px]">{decision.topic}</Text>
                    {decision.decisionDate && <Text type="secondary" className="text-[12px]">{decision.decisionDate}</Text>}
                  </div>
                  <div className="text-[14px] text-[#4A3C31] mb-3 bg-[#FAFAF8] p-3 rounded-lg border border-[#EDE0D4]/50">
                    <span className="font-medium">最终选择：</span>{decision.choice}
                  </div>
                  {decision.reason && (
                    <div className="text-[13px] text-[#6A5A4B] mb-3">
                      <span className="text-[#B09880]">当时理由：</span>{decision.reason}
                    </div>
                  )}
                  {decision.tags?.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {decision.tags.map((tag) => (
                        <Tag key={tag} className="!border-[#CFE7DC] !bg-[#E8F5EE] !text-[#0F6E56] !rounded-full">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                  {decision.outcome && (
                    <div className="text-[13px] text-gray-500 flex items-center justify-between">
                      <span><span className="text-[#0F6E56]">事后反馈：</span>{decision.outcome}</span>
                      {decision.satisfaction && (
                        <Tooltip title={`满意度 ${decision.satisfaction}/5`}>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className={`w-1.5 h-3 rounded-sm ${i < decision.satisfaction! ? 'bg-[#0F6E56]' : 'bg-[#E5E7EB]'}`} />
                            ))}
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
              )
            }))}
          />
        </div>
      )}
    </ProfileCard>
  );
}

function isHighInfluence(level: string) {
  return ['high', '高', '强'].includes(level);
}

function formatInfluenceLevel(level: string) {
  if (isHighInfluence(level)) return '强';
  if (['low', '低', '弱'].includes(level)) return '弱';
  return '中';
}

function ConfidenceBadge({ confidence, danger = false }: { confidence?: number; danger?: boolean }) {
  const text = getConfidenceText(confidence);
  const className = danger
    ? '!border-[#F5D5CB] !bg-white/70 !text-[#993C1D]'
    : '!border-[#EDE0D4] !bg-white !text-[#A06040]';

  return (
    <Tag className={`shrink-0 !m-0 !rounded-full text-[12px] ${className}`}>
      {text}
    </Tag>
  );
}

function EvidenceList({ evidence, danger = false }: { evidence?: Evidence; danger?: boolean }) {
  const items = normalizeEvidence(evidence);

  if (!items.length) {
    return (
      <div className={`mt-2 text-[12px] ${danger ? 'text-[#C87E6A]' : 'text-[#B09880]'}`}>
        证据仍在积累中
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      {items.slice(0, 2).map((item, index) => (
        <div key={`${item}-${index}`} className={`rounded-lg px-2.5 py-1.5 text-[12px] ${danger ? 'bg-white/60 text-[#A64A2F]' : 'bg-white text-[#6A5A4B]'}`}>
          证据：{item}
        </div>
      ))}
    </div>
  );
}

function normalizeEvidence(evidence?: Evidence) {
  if (!evidence) return [];
  if (Array.isArray(evidence)) return evidence.filter(Boolean);
  if (typeof evidence === 'string') {
    const trimmed = evidence.trim();
    if (!trimmed || trimmed === '{}' || trimmed === '[]') return [];

    try {
      const parsed = JSON.parse(trimmed);
      return normalizeEvidence(parsed);
    } catch {
      return [trimmed];
    }
  }

  return Object.values(evidence)
    .flatMap((value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value;
      return [];
    })
    .filter(Boolean);
}

function getConfidenceText(confidence?: number) {
  if (confidence === undefined || confidence < 0.6) return '仍在观察';
  if (confidence < 0.8) return '待确认';
  return '较确定';
}

function EmptyText({ children = '档案仍在观察与积累中...' }: { children?: React.ReactNode }) {
  return <div className="text-[#B09880] text-[13px] py-4 text-center italic">{children}</div>;
}
