import { useMemo, type ReactNode } from 'react';
import { Button, Progress } from 'antd';
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
  ProfileDecision,
  ProfileEmotion,
  ProfileFear,
  ProfileRelationship,
  ProfileValues,
} from '../../types';

type MemoryTone = 'value' | 'emotion' | 'fear' | 'relationship' | 'decision';

export function MemoryCompass() {
  const navigate = useNavigate();
  const { isStreaming } = useChatStore();
  const {
    profile,
    loading,
    error,
    completeness,
    getCompletenessText,
  } = useProfileStore();

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
      <header className="memory-overview">
        <div className="memory-overview-main">
          <div className="memory-overview-copy">
            <span>Memory Compass</span>
            <div className="memory-title-row">
              <h2>灵魂投影</h2>
              <span className={`memory-status ${statusTone}`}>{statusText}</span>
            </div>
            <p>Agent 当前如何理解你</p>
          </div>

          <div className="memory-score">
            <strong>{completeness}%</strong>
            <span>{getCompletenessText()}</span>
          </div>
        </div>

        <Progress className="memory-overview-progress" percent={completeness} showInfo={false} strokeColor="#C8845A" railColor="#F0DFC8" size="small" />
        <p className="memory-overview-note">
          {isStreaming ? '正在分析本轮对话中的稳定线索。' : `已积累 ${snapshot.total} 条档案线索。`}
        </p>
      </header>

      {error && <div className="memory-error">{error}</div>}

      <div className="memory-scroll custom-scrollbar">
        <div className="memory-insight-list">
          <MemoryInsightRow
            icon={<HeartOutlined />}
            title="价值观"
            tone="value"
            status={snapshot.values.length > 0 ? '已记录' : '观察中'}
            summary={formatValuesSummary(snapshot.values)}
            active={snapshot.values.length > 0}
          />
          <MemoryInsightRow
            icon={<SmileOutlined />}
            title="情绪状态"
            tone="emotion"
            status={snapshot.latestEmotion ? '已记录' : '观察中'}
            summary={formatEmotionSummary(snapshot.latestEmotion)}
            active={Boolean(snapshot.latestEmotion)}
          />
          <MemoryInsightRow
            icon={<SafetyCertificateOutlined />}
            title="恐惧与边界"
            tone="fear"
            status={snapshot.recentFear ? '已记录' : '观察中'}
            summary={formatFearSummary(snapshot.hardBoundaries, snapshot.recentFear)}
            active={Boolean(snapshot.recentFear)}
          />
          <MemoryInsightRow
            icon={<TeamOutlined />}
            title="关系图谱"
            tone="relationship"
            status={snapshot.relationships.length > 0 ? '已记录' : '观察中'}
            summary={formatRelationshipSummary(snapshot.relationships)}
            active={snapshot.relationships.length > 0}
          />
          <MemoryInsightRow
            icon={<BookOutlined />}
            title="决策历史"
            tone="decision"
            status={snapshot.latestDecision ? '已记录' : '观察中'}
            summary={formatDecisionSummary(snapshot.latestDecision)}
            active={Boolean(snapshot.latestDecision)}
          />
        </div>
      </div>

      <footer className="memory-footer">
        <Button type="text" icon={<EyeOutlined />} onClick={() => navigate('/profile')}>
          查看全景人生档案
        </Button>
      </footer>
    </aside>
  );
}

function MemoryInsightRow({
  icon,
  title,
  tone,
  status,
  summary,
  active,
}: {
  icon: ReactNode;
  title: string;
  tone: MemoryTone;
  status: string;
  summary: string;
  active: boolean;
}) {
  return (
    <section className={`memory-insight-row ${tone} ${active ? 'active' : 'empty'}`}>
      <span className="memory-insight-icon">{icon}</span>
      <div className="memory-insight-copy">
        <div className="memory-insight-head">
          <strong>{title}</strong>
        </div>
        <p title={summary}>{summary}</p>
      </div>
      <span className="memory-insight-status">{status}</span>
    </section>
  );
}

function formatValuesSummary(values: ProfileValues[]) {
  if (!values.length) return '继续聊会慢慢看见你真正重视什么。';
  return values.map(formatValue).join(' · ');
}

function formatEmotionSummary(emotion?: ProfileEmotion) {
  if (!emotion) return '还没有明显情绪模式，我会先多听一听。';
  const parts = [
    formatReadableToken(emotion.emotion),
    emotion.behavior ? formatReadableToken(emotion.behavior) : '',
    emotion.triggerDesc ? `触发器：${emotion.triggerDesc}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

function formatFearSummary(boundaries: ProfileFear[], recentFear?: ProfileFear) {
  const targets = boundaries.length > 0 ? boundaries : recentFear ? [recentFear] : [];
  if (!targets.length) return '暂时没有高置信边界，不会贸然下判断。';
  return targets.map((fear) => {
    const label = fear.boundaryType === 'hard' ? '硬边界' : fear.type === 'boundary' ? '边界' : '恐惧';
    return `${label}：${fear.description}`;
  }).join(' · ');
}

function formatRelationshipSummary(relationships: ProfileRelationship[]) {
  if (!relationships.length) return '还没有出现足够重要的关系节点。';
  return relationships.map((relationship) => {
    const role = relationship.role ? ` / ${relationship.role}` : '';
    return `${relationship.name}${role} · ${formatInfluenceLevel(relationship.influenceLevel)}`;
  }).join(' · ');
}

function formatDecisionSummary(decision?: ProfileDecision) {
  if (!decision) return '还没有形成可复盘的决策记录。';
  return decision.choice ? `${decision.topic} · 选择：${decision.choice}` : decision.topic;
}

function formatValue(value: ProfileValues) {
  return value.preference || value.item;
}

function formatInfluenceLevel(level: string) {
  if (['high', '高', '强'].includes(level)) return '影响强';
  if (['low', '低', '弱'].includes(level)) return '影响弱';
  return '影响中';
}

function formatReadableToken(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}
