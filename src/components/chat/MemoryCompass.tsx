import { useEffect, useMemo, type ReactNode } from 'react';
import { Button, Progress, Tag } from 'antd';
import {
  BookOutlined,
  EyeOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  SmileOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../stores/chatStore';
import { useProfileStore } from '../../stores/profileStore';
import type {
  Evidence,
  ProfileDecision,
  ProfileEmotion,
  ProfileFear,
  ProfileRelationship,
  ProfileValues,
} from '../../types';

export function MemoryCompass() {
  const navigate = useNavigate();
  const { isStreaming, messages } = useChatStore();
  const {
    profile,
    loading,
    error,
    completeness,
    fetchProfile,
    getCompletenessText,
  } = useProfileStore();

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (isStreaming || messages.length <= 1) return;

    const refreshTimer = window.setTimeout(() => {
      void fetchProfile();
    }, 900);

    return () => window.clearTimeout(refreshTimer);
  }, [fetchProfile, isStreaming, messages.length]);

  const snapshot = useMemo(() => {
    const values = profile?.values ?? [];
    const decisions = profile?.decisions ?? [];
    const emotions = profile?.emotions ?? [];
    const relationships = profile?.relationships ?? [];
    const fears = profile?.fears ?? [];

    return {
      values: values.slice(0, 3),
      latestDecision: decisions[0],
      latestEmotion: emotions[0],
      relationships: relationships.slice(0, 2),
      hardBoundaries: fears.filter((fear) => fear.type === 'boundary' || fear.boundaryType === 'hard').slice(0, 2),
      recentFear: fears[0],
      total: values.length + decisions.length + emotions.length + relationships.length + fears.length,
    };
  }, [profile]);

  const statusText = loading ? '同步中' : isStreaming ? '分析中' : profile ? '已同步' : '待建立';
  const statusTone = loading || isStreaming ? 'syncing' : profile ? 'ready' : 'quiet';

  return (
    <aside className="memory-compass">
      <header className="memory-head">
        <div className="memory-title-block">
          <span>Memory Compass</span>
          <h2>灵魂投影</h2>
          <p>Agent 当前如何理解你</p>
        </div>
        <Tag className={`memory-status ${statusTone}`}>{statusText}</Tag>
      </header>

      <section className="memory-current-card">
        <div className="memory-progress-row">
          <span>{getCompletenessText()}</span>
          <strong>{completeness}%</strong>
        </div>
        <Progress percent={completeness} showInfo={false} strokeColor="#C8845A" railColor="#F0DFC8" size="small" />
        <p>{isStreaming ? '正在分析本轮对话中的稳定线索。' : `已积累 ${snapshot.total} 条档案线索。`}</p>
      </section>

      {error && <div className="memory-error">{error}</div>}

      <div className="memory-scroll custom-scrollbar">
        <MemoryCard
          icon={<HeartOutlined />}
          title="价值观"
          tone="value"
          empty="继续聊会慢慢看见你真正重视什么。"
          active={snapshot.values.length > 0}
        >
          <div className="memory-chip-list">
            {snapshot.values.map((value) => (
              <span key={value.id} className="memory-chip value" title={formatEvidence(value.evidence)}>
                {formatValue(value)}
              </span>
            ))}
          </div>
        </MemoryCard>

        <MemoryCard
          icon={<SmileOutlined />}
          title="情绪状态"
          tone="emotion"
          empty="还没有明显情绪模式，我会先多听一听。"
          active={Boolean(snapshot.latestEmotion)}
        >
          {snapshot.latestEmotion && <EmotionSummary emotion={snapshot.latestEmotion} />}
        </MemoryCard>

        <MemoryCard
          icon={<SafetyCertificateOutlined />}
          title="恐惧与边界"
          tone="fear"
          empty="暂时没有高置信边界，不会贸然下判断。"
          active={Boolean(snapshot.recentFear)}
        >
          {(snapshot.hardBoundaries.length > 0 || snapshot.recentFear) && (
            <div className="memory-stack">
              {(snapshot.hardBoundaries.length > 0 ? snapshot.hardBoundaries : [snapshot.recentFear])
                .filter(Boolean)
                .map((fear) => (
                  <BoundaryItem key={fear!.id} fear={fear!} />
                ))}
            </div>
          )}
        </MemoryCard>

        <MemoryCard
          icon={<TeamOutlined />}
          title="关系图谱"
          tone="relationship"
          empty="还没有出现足够重要的关系节点。"
          active={snapshot.relationships.length > 0}
        >
          <div className="memory-stack">
            {snapshot.relationships.map((relationship) => (
              <RelationshipItem key={relationship.id} relationship={relationship} />
            ))}
          </div>
        </MemoryCard>

        <MemoryCard
          icon={<BookOutlined />}
          title="决策历史"
          tone="decision"
          empty="还没有形成可复盘的决策记录。"
          active={Boolean(snapshot.latestDecision)}
        >
          {snapshot.latestDecision && <DecisionSummary decision={snapshot.latestDecision} />}
        </MemoryCard>
      </div>

      <footer className="memory-footer">
        <Button type="text" icon={<EyeOutlined />} onClick={() => navigate('/profile')}>
          查看全景人生档案
        </Button>
      </footer>
    </aside>
  );
}

function MemoryCard({
  icon,
  title,
  tone,
  empty,
  active,
  children,
}: {
  icon: ReactNode;
  title: string;
  tone: 'value' | 'emotion' | 'fear' | 'relationship' | 'decision';
  empty: string;
  active: boolean;
  children?: ReactNode;
}) {
  return (
    <section className={`memory-card ${tone} ${active ? 'active' : 'empty'}`}>
      <div className="memory-card-head">
        <span className="memory-card-icon">{icon}</span>
        <strong>{title}</strong>
        <span>{active ? '已记录' : '观察中'}</span>
      </div>
      <div className="memory-card-body">
        {active && children ? children : <p className="memory-empty-text">{empty}</p>}
      </div>
    </section>
  );
}

function EmotionSummary({ emotion }: { emotion: ProfileEmotion }) {
  return (
    <div className="memory-summary">
      <strong>{formatReadableToken(emotion.emotion)}</strong>
      {emotion.behavior && <p>{formatReadableToken(emotion.behavior)}</p>}
      <p><span>触发器：</span>{emotion.triggerDesc}</p>
    </div>
  );
}

function BoundaryItem({ fear }: { fear: ProfileFear }) {
  const label = fear.boundaryType === 'hard' ? '硬边界' : fear.type === 'boundary' ? '边界' : '恐惧';

  return (
    <article className="memory-boundary-item">
      <div>
        <strong>{label}</strong>
        <span>{formatConfidence(fear.confidence)}</span>
      </div>
      <p>{fear.description}</p>
    </article>
  );
}

function RelationshipItem({ relationship }: { relationship: ProfileRelationship }) {
  return (
    <article className="memory-person-item">
      <div>
        <strong>{relationship.name}</strong>
        <span>{relationship.role}</span>
      </div>
      <Tag className="memory-person-tag">{formatInfluenceLevel(relationship.influenceLevel)}</Tag>
    </article>
  );
}

function DecisionSummary({ decision }: { decision: ProfileDecision }) {
  return (
    <div className="memory-summary decision">
      <strong>{decision.topic}</strong>
      <p><span>选择：</span>{decision.choice}</p>
    </div>
  );
}

function formatValue(value: ProfileValues) {
  return value.preference || value.item;
}

function formatEvidence(evidence?: Evidence) {
  const items = normalizeEvidence(evidence);
  if (!items.length) return '仍在观察中';
  return `证据：${items.slice(0, 2).join(' / ')}`;
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

function formatConfidence(confidence?: number) {
  if (confidence === undefined || confidence < 0.6) return '仍在观察';
  if (confidence < 0.8) return '待确认';
  return '较确定';
}

function formatInfluenceLevel(level: string) {
  if (['high', '高', '强'].includes(level)) return '影响强';
  if (['low', '低', '弱'].includes(level)) return '影响弱';
  return '影响中';
}

function formatReadableToken(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}
