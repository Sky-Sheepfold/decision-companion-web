import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntApp, Button, Spin, Typography, Space, Empty, Progress, Tag, Tooltip, Modal, Input, Popconfirm } from 'antd';
import {
  HeartOutlined,
  LeftOutlined,
  BlockOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
  SmileOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useProfileStore } from '../stores/profileStore';
import type {
  Evidence,
  MemoryInsight,
  ProfileMemoryCandidate,
  ProfileMemoryCorrectionRequest,
  ProfileValues,
  ProfileDecision,
  ProfileEmotion,
  ProfileRelationship,
  ProfileFear,
} from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

type EditableProfileType = 'value' | 'emotion' | 'relationship' | 'fear' | 'boundary';

interface MemoryEditTarget {
  id: number;
  profileType: EditableProfileType;
  title: string;
  subject: string;
  content: string;
  detail?: string;
  pending?: boolean;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const {
    profile,
    loading,
    error,
    completeness,
    pendingMemories,
    pendingMemoryCount,
    insights,
    insightUnjudgedCount,
    insightLoading,
    governanceLoading,
    governanceError,
    fetchProfile,
    fetchInsights,
    judgeInsight,
    confirmPendingMemory,
    rejectPendingMemory,
    correctPendingMemory,
    correctProfileMemory,
    deleteProfileMemory,
    getCompletenessText,
  } = useProfileStore();
  const [editingMemory, setEditingMemory] = useState<MemoryEditTarget | null>(null);
  const [editDraft, setEditDraft] = useState<ProfileMemoryCorrectionRequest>({});

  useEffect(() => {
    fetchProfile();
    fetchInsights();
  }, [navigate, fetchProfile, fetchInsights]);

  function openEdit(target: MemoryEditTarget) {
    setEditingMemory(target);
    setEditDraft({
      subject: target.subject,
      content: target.content,
      detail: target.detail || '',
      reason: target.pending ? '用户修正后确认' : '用户修正',
    });
  }

  async function handleConfirmPending(id: number) {
    if (governanceLoading) return;

    try {
      await confirmPendingMemory(id);
      message.success('已确认');
    } catch {
      message.error('确认失败，请稍后重试');
    }
  }

  async function handleRejectPending(id: number) {
    if (governanceLoading) return;

    try {
      await rejectPendingMemory(id, '用户不采纳');
      message.success('已不采纳');
    } catch {
      message.error('操作失败，请稍后重试');
    }
  }

  async function handleConfirmInsight(id: number) {
    if (insightLoading) return;

    try {
      await judgeInsight(id, 'confirm');
      message.success('已确认这条洞察');
    } catch {
      message.error('操作失败，请稍后重试');
    }
  }

  async function handleRejectInsight(id: number) {
    if (insightLoading) return;

    try {
      await judgeInsight(id, 'reject');
      message.success('已否定这条洞察');
    } catch {
      message.error('操作失败，请稍后重试');
    }
  }

  async function handleDeleteProfileMemory(profileType: EditableProfileType, id: number) {
    if (governanceLoading) return;

    try {
      await deleteProfileMemory(profileType, id, '用户删除');
      message.success('已删除');
    } catch {
      message.error('删除失败，请稍后重试');
    }
  }

  async function handleSubmitEdit() {
    if (!editingMemory || governanceLoading) return;

    const request = {
      subject: editDraft.subject?.trim(),
      content: editDraft.content?.trim(),
      detail: editDraft.detail?.trim(),
      reason: editDraft.reason?.trim(),
    };

    if (!request.subject || !request.content) {
      message.warning('主题和内容不能为空');
      return;
    }

    try {
      if (editingMemory.pending) {
        await correctPendingMemory(editingMemory.id, request);
        message.success('已修正并确认');
      } else {
        await correctProfileMemory(editingMemory.profileType, editingMemory.id, request);
        message.success('已修正');
      }
      setEditingMemory(null);
    } catch {
      message.error('修正失败，请稍后重试');
    }
  }

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
    <div className="app-soft-page page-fade pb-12">
      <div className="app-sticky-header profile-header">
        <Space align="center" size="middle">
          <Button type="text" icon={<LeftOutlined />} onClick={() => navigate('/chat')} className="hover:!bg-[#F2EBE5]">
            返回
          </Button>
          <Title level={4} className="!mb-0 font-serif text-[#2C2C2A]">全景人生档案</Title>
        </Space>
        <div className="profile-header-progress">
          <Text type="secondary">{getCompletenessText()}</Text>
          <Progress percent={completeness} strokeColor="#C8845A" railColor="#F0DFC8" showInfo={false} />
        </div>
      </div>

      <main className="profile-page-shell">
        <ProfileSummary
          completeness={completeness}
          completenessText={getCompletenessText()}
          counts={{
            values: profile.values?.length ?? 0,
            emotions: profile.emotions?.length ?? 0,
            fears: profile.fears?.length ?? 0,
            relationships: profile.relationships?.length ?? 0,
            decisions: profile.decisions?.length ?? 0,
          }}
        />

        <PendingMemoryPanel
          pendingMemories={pendingMemories}
          pendingMemoryCount={pendingMemoryCount}
          loading={governanceLoading}
          error={governanceError}
          onConfirm={handleConfirmPending}
          onReject={handleRejectPending}
          onEdit={openEdit}
        />

        <InsightPanel
          insights={insights}
          unjudgedCount={insightUnjudgedCount}
          loading={insightLoading}
          onConfirm={handleConfirmInsight}
          onReject={handleRejectInsight}
        />

        <div className="profile-layout">
          <div className="profile-column">
            <ValuesCard values={profile.values || []} delay={0} disabled={governanceLoading} onEdit={openEdit} onDelete={handleDeleteProfileMemory} />
            <FearCard fears={profile.fears || []} delay={120} disabled={governanceLoading} onEdit={openEdit} onDelete={handleDeleteProfileMemory} />
            <RelationshipsCard relationships={profile.relationships || []} delay={240} disabled={governanceLoading} onDelete={handleDeleteProfileMemory} />
          </div>
          <div className="profile-main-column">
            <EmotionsCard emotions={profile.emotions || []} delay={80} disabled={governanceLoading} onEdit={openEdit} onDelete={handleDeleteProfileMemory} />
            <DecisionsCard decisions={profile.decisions || []} delay={180} />
          </div>
        </div>
      </main>

      <Modal
        title={editingMemory?.pending ? '修正后确认' : '修正档案'}
        open={Boolean(editingMemory)}
        onCancel={() => setEditingMemory(null)}
        onOk={handleSubmitEdit}
        okText={editingMemory?.pending ? '确认写入' : '保存修正'}
        cancelText="取消"
        confirmLoading={governanceLoading}
        okButtonProps={{ disabled: governanceLoading }}
        className="profile-memory-edit-modal"
      >
        <div className="profile-edit-form">
          <label>
            <span>{editingMemory?.profileType === 'relationship' ? '对象' : '主题'}</span>
            <Input
              value={editDraft.subject}
              disabled={governanceLoading}
              onChange={(event) => setEditDraft((draft) => ({ ...draft, subject: event.target.value }))}
              placeholder="主题"
            />
          </label>
          <label>
            <span>内容</span>
            <TextArea
              value={editDraft.content}
              disabled={governanceLoading}
              onChange={(event) => setEditDraft((draft) => ({ ...draft, content: event.target.value }))}
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder="内容"
            />
          </label>
          <label>
            <span>{getDetailLabel(editingMemory?.profileType)}</span>
            <Input
              value={editDraft.detail}
              disabled={governanceLoading}
              onChange={(event) => setEditDraft((draft) => ({ ...draft, detail: event.target.value }))}
              placeholder={getDetailLabel(editingMemory?.profileType)}
            />
          </label>
          <label>
            <span>原因</span>
            <Input
              value={editDraft.reason}
              disabled={governanceLoading}
              onChange={(event) => setEditDraft((draft) => ({ ...draft, reason: event.target.value }))}
              placeholder="可选"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

function ProfileSummary({
  completeness,
  completenessText,
  counts,
}: {
  completeness: number;
  completenessText: string;
  counts: {
    values: number;
    emotions: number;
    fears: number;
    relationships: number;
    decisions: number;
  };
}) {
  const total = counts.values + counts.emotions + counts.fears + counts.relationships + counts.decisions;

  return (
    <section className="profile-summary">
      <div className="profile-summary-copy">
        <div className="profile-kicker">长期理解档案</div>
        <h1>这些理解只作参考，你始终可以修正。</h1>
        <p>系统会把对话中较稳定的价值、情绪、边界、关系和决策线索整理出来，避免用一次回答给你贴标签。</p>
      </div>
      <div className="profile-summary-panel">
        <div className="profile-score-row">
          <span>{completenessText}</span>
          <strong>{completeness}%</strong>
        </div>
        <Progress percent={completeness} strokeColor="#C8845A" railColor="#F0DFC8" showInfo={false} />
        <div className="profile-stat-grid">
          <StatItem label="价值" value={counts.values} />
          <StatItem label="情绪" value={counts.emotions} />
          <StatItem label="边界" value={counts.fears} />
          <StatItem label="关系" value={counts.relationships} />
          <StatItem label="决策" value={counts.decisions} />
        </div>
        <div className="profile-total-note">已整理 {total} 条可复盘线索</div>
      </div>
    </section>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="profile-stat-item">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PendingMemoryPanel({
  pendingMemories,
  pendingMemoryCount,
  loading,
  error,
  onConfirm,
  onReject,
  onEdit,
}: {
  pendingMemories: ProfileMemoryCandidate[];
  pendingMemoryCount: number;
  loading: boolean;
  error: string | null;
  onConfirm: (id: number) => void;
  onReject: (id: number) => void;
  onEdit: (target: MemoryEditTarget) => void;
}) {
  return (
    <section className="profile-pending-panel">
      <div className="profile-pending-head">
        <div>
          <div className="profile-kicker">待确认记忆</div>
          <h2>{pendingMemoryCount > 0 ? `${pendingMemoryCount} 条需要过目` : '暂无待确认线索'}</h2>
        </div>
        {loading && <Spin size="small" />}
      </div>

      {error && <div className="profile-governance-error">{error}</div>}

      {pendingMemories.length === 0 ? (
        <div className="profile-pending-empty">新的画像线索会先放在这里。</div>
      ) : (
        <div className="profile-pending-list">
          {pendingMemories.map((candidate) => {
            const sensitive = isSensitiveProfileType(candidate.profileType);

            return (
              <article key={candidate.id} className={`profile-pending-item ${sensitive ? 'sensitive' : ''}`}>
                <div className="profile-pending-main">
                  <div className="profile-pending-meta">
                    <Tag className="profile-memory-type-tag">{getProfileTypeLabel(candidate.profileType)}</Tag>
                    <ConfidenceBadge confidence={toNumber(candidate.confidence)} danger={sensitive} />
                    <span>{formatExpiry(candidate.expiresAt)}</span>
                  </div>
                  <h3>{candidate.subject}</h3>
                  <p>{candidate.content}</p>
                  {candidate.detail && <div className="profile-item-subtle">{candidate.detail}</div>}
                  <SensitiveEvidence evidence={candidate.evidence} sensitive={sensitive} />
                </div>
                <div className="profile-compact-actions">
                  <Button size="small" icon={<CheckCircleOutlined />} disabled={loading} loading={loading} onClick={() => onConfirm(candidate.id)}>
                    确认
                  </Button>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    disabled={loading}
                    onClick={() => onEdit({
                      id: candidate.id,
                      profileType: normalizeEditableProfileType(candidate.profileType),
                      title: candidate.subject,
                      subject: candidate.subject,
                      content: candidate.content,
                      detail: candidate.detail || '',
                      pending: true,
                    })}
                  >
                    修正
                  </Button>
                  <Popconfirm
                    title="不采纳这条记忆？"
                    okText="不采纳"
                    cancelText="取消"
                    onConfirm={() => onReject(candidate.id)}
                    okButtonProps={{ disabled: loading, loading }}
                    cancelButtonProps={{ disabled: loading }}
                  >
                    <Button size="small" icon={<CloseCircleOutlined />} disabled={loading}>
                      不采纳
                    </Button>
                  </Popconfirm>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function InsightPanel({
  insights,
  unjudgedCount,
  loading,
  onConfirm,
  onReject,
}: {
  insights: MemoryInsight[];
  unjudgedCount: number;
  loading: boolean;
  onConfirm: (id: number) => void;
  onReject: (id: number) => void;
}) {
  return (
    <section className="profile-insight-panel">
      <div className="profile-pending-head">
        <div>
          <div className="profile-kicker">行为动机洞察</div>
          <h2>{unjudgedCount > 0 ? `${unjudgedCount} 条假设等你判定` : insights.length > 0 ? '对你的理解假设' : '还在积累观察'}</h2>
        </div>
        {loading && <Spin size="small" />}
      </div>
      <p className="profile-insight-hint">
        系统从近期对话中形成的"你为什么会这样"的解释假设。它只是假设，不是定论——你可以判定准不准，帮助它更懂你。
      </p>

      {insights.length === 0 ? (
        <div className="profile-pending-empty">再多聊几次，这里会浮现对行为动机的理解。</div>
      ) : (
        <div className="profile-insight-list">
          {insights.map((insight) => {
            const confirmed = insight.verdict === 'confirmed';
            const rejected = insight.verdict === 'rejected';

            return (
              <article key={insight.id} className={`profile-insight-item ${confirmed ? 'confirmed' : ''}`}>
                <div className="profile-insight-main">
                  <div className="profile-insight-meta">
                    <BulbOutlined className="profile-insight-icon" />
                    <Tag className={`profile-insight-tag ${confirmed ? 'confirmed' : ''}`}>
                      {confirmed ? '已确认' : rejected ? '已否定' : '待验证'}
                    </Tag>
                    <ConfidenceBadge confidence={toNumber(insight.confidence)} />
                  </div>
                  <p className="profile-insight-text">{insight.hypothesis}</p>
                  <InsightEvidence evidence={insight.evidence} />
                </div>
                {!confirmed && !rejected && (
                  <div className="profile-compact-actions">
                    <Button
                      size="small"
                      icon={<CheckCircleOutlined />}
                      disabled={loading}
                      loading={loading}
                      onClick={() => onConfirm(insight.id)}
                    >
                      挺准
                    </Button>
                    <Popconfirm
                      title="否定这条洞察？"
                      okText="否定"
                      cancelText="取消"
                      onConfirm={() => onReject(insight.id)}
                      okButtonProps={{ disabled: loading, loading }}
                      cancelButtonProps={{ disabled: loading }}
                    >
                      <Button size="small" icon={<CloseCircleOutlined />} disabled={loading}>
                        不准
                      </Button>
                    </Popconfirm>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function InsightEvidence({ evidence }: { evidence?: Evidence }) {
  const items = normalizeEvidence(evidence);

  if (!items.length) return null;

  return (
    <div className="profile-insight-evidence">
      {items.slice(0, 2).map((item, index) => (
        <div key={`${item}-${index}`} className="profile-evidence-line">
          依据：{item}
        </div>
      ))}
    </div>
  );
}

function ProfileCard({
  title,
  description,
  children,
  delay,
}: {
  title: ReactNode;
  description: string;
  children: ReactNode;
  delay: number;
}) {
  return (
    <section className="profile-section-card profile-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="profile-section-head">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

function ValuesCard({
  values,
  delay,
  disabled,
  onEdit,
  onDelete,
}: {
  values: ProfileValues[];
  delay: number;
  disabled: boolean;
  onEdit: (target: MemoryEditTarget) => void;
  onDelete: (profileType: EditableProfileType, id: number) => void;
}) {
  return (
    <ProfileCard title={<span className="text-[#A06040]"><HeartOutlined className="mr-2" />价值观引擎</span>} description="驱动你选择的核心动力" delay={delay}>
      {values.length === 0 ? <EmptyText /> : (
        <div className="profile-item-list">
          {values.map((value) => (
            <article key={value.id} className="profile-item-panel">
              <div className="profile-item-head">
                <div className="profile-item-title">
                  <span>{value.item}</span>
                  <strong>{value.preference}</strong>
                </div>
                <ConfidenceBadge confidence={value.confidence} />
              </div>
              <EvidenceList evidence={value.evidence} />
              <MemoryGovernanceActions
                disabled={disabled}
                onEdit={() => onEdit({
                  id: value.id,
                  profileType: 'value',
                  title: value.item,
                  subject: value.item,
                  content: value.preference,
                })}
                onDelete={() => onDelete('value', value.id)}
              />
            </article>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}

function FearCard({
  fears,
  delay,
  disabled,
  onEdit,
  onDelete,
}: {
  fears: ProfileFear[];
  delay: number;
  disabled: boolean;
  onEdit: (target: MemoryEditTarget) => void;
  onDelete: (profileType: EditableProfileType, id: number) => void;
}) {
  return (
    <ProfileCard title={<span className="text-[#993C1D]"><SafetyCertificateOutlined className="mr-2" />绝对边界</span>} description="不可触碰的底线与深层恐惧" delay={delay}>
      {fears.length === 0 ? <EmptyText /> : (
        <ul className="profile-item-list m-0 list-none p-0">
          {fears.map((fear) => (
            <li key={fear.id} className="profile-item-panel profile-item-danger">
              <BlockOutlined className="profile-item-icon" />
              <div className="profile-item-content">
                <div className="profile-item-head">
                  <strong className="profile-readable-text">{fear.description}</strong>
                  <ConfidenceBadge confidence={fear.confidence} danger />
                </div>
                {(fear.manifestation || fear.boundaryType) && (
                  <div className="profile-item-subtle danger">
                    {fear.manifestation || (fear.boundaryType === 'hard' ? '硬边界' : '软边界')}
                  </div>
                )}
                <EvidenceList evidence={fear.evidence} danger />
                <MemoryGovernanceActions
                  danger
                  disabled={disabled}
                  onEdit={() => onEdit({
                    id: fear.id,
                    profileType: fear.type,
                    title: fear.description,
                    subject: fear.description,
                    content: fear.manifestation,
                    detail: fear.boundaryType || '',
                  })}
                  onDelete={() => onDelete(fear.type, fear.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ProfileCard>
  );
}

function RelationshipsCard({
  relationships,
  delay,
  disabled,
  onDelete,
}: {
  relationships: ProfileRelationship[];
  delay: number;
  disabled: boolean;
  onDelete: (profileType: EditableProfileType, id: number) => void;
}) {
  return (
    <ProfileCard title={<span className="text-[#A07050]"><BranchesOutlined className="mr-2" />关系引力网</span>} description="重要节点与能量场" delay={delay}>
      {relationships.length === 0 ? <EmptyText /> : (
        <div className="profile-item-list">
          {relationships.map((rel) => (
            <article key={rel.id} className="profile-relationship-row">
              <div className="profile-avatar">
                {rel.name.charAt(0)}
              </div>
              <div className="profile-relationship-main">
                <div className="profile-item-head">
                  <div className="profile-item-title">
                    <strong>{rel.name}</strong>
                    <span>{rel.role}</span>
                  </div>
                  <Tag color={isHighInfluence(rel.influenceLevel) ? 'orange' : 'default'} className="!m-0 !rounded-full !border-0 text-[12px]">
                    引力 {formatInfluenceLevel(rel.influenceLevel)}
                  </Tag>
                </div>
                {rel.influenceStyle && <div className="profile-item-subtle">{rel.influenceStyle}</div>}
                {rel.note && <div className="profile-readable-text mt-2 text-[13px] text-[#6A5A4B]">{rel.note}</div>}
                <MemoryGovernanceActions
                  disabled={disabled}
                  onDelete={() => onDelete('relationship', rel.id)}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}

function EmotionsCard({
  emotions,
  delay,
  disabled,
  onEdit,
  onDelete,
}: {
  emotions: ProfileEmotion[];
  delay: number;
  disabled: boolean;
  onEdit: (target: MemoryEditTarget) => void;
  onDelete: (profileType: EditableProfileType, id: number) => void;
}) {
  return (
    <ProfileCard title={<span className="text-[#C8845A]"><SmileOutlined className="mr-2" />情绪雷达</span>} description="心理能量起伏特征" delay={delay}>
      {emotions.length === 0 ? <EmptyText /> : (
        <div className="profile-emotion-list">
          {emotions.map((emotion) => (
            <article key={emotion.id} className="profile-emotion-row">
              <div className="profile-emotion-marker">
                <TeamOutlined />
              </div>
              <div className="profile-item-content">
                <div className="profile-item-head">
                  <strong className="profile-readable-text">{formatReadableToken(emotion.emotion)}</strong>
                  <Tag className="profile-soft-tag">{formatReadableToken(emotion.behavior || '持续观察')}</Tag>
                </div>
                <div className="profile-readable-text text-[13px] text-[#6A5A4B]">
                  <span className="text-[#C8845A]">触发器：</span>{emotion.triggerDesc}
                </div>
                {emotion.agentNote && (
                  <div className="profile-note-block">
                    {emotion.agentNote}
                  </div>
                )}
                <MemoryGovernanceActions
                  disabled={disabled}
                  onEdit={() => onEdit({
                    id: emotion.id,
                    profileType: 'emotion',
                    title: emotion.emotion,
                    subject: emotion.emotion,
                    content: emotion.behavior,
                    detail: emotion.triggerDesc,
                  })}
                  onDelete={() => onDelete('emotion', emotion.id)}
                />
              </div>
            </article>
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
        <div className="profile-decision-list">
          {decisions.map((decision) => {
            const tags = normalizeTags(decision.tags);

            return (
              <article key={decision.id} className="profile-decision-row">
                <div className="profile-decision-dot">
                  {decision.satisfaction && decision.satisfaction > 3 ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                </div>
                <div className="profile-item-content">
                  <div className="profile-item-head">
                    <strong className="profile-readable-text">{decision.topic}</strong>
                    {decision.decisionDate && <span className="profile-date">{decision.decisionDate}</span>}
                  </div>
                  <div className="profile-choice-block">
                    <span>最终选择：</span>{decision.choice}
                  </div>
                  {decision.reason && (
                    <div className="profile-readable-text text-[13px] text-[#6A5A4B]">
                      <span className="text-[#B09880]">当时理由：</span>{decision.reason}
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div className="profile-tag-row">
                      {tags.map((tag, index) => (
                        <Tag key={`${tag}-${index}`} className="!m-0 !border-[#CFE7DC] !bg-[#E8F5EE] !text-[#0F6E56] !rounded-full">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                  {decision.outcome && (
                    <div className="profile-outcome-row">
                      <span><span className="text-[#0F6E56]">事后反馈：</span>{decision.outcome}</span>
                      {decision.satisfaction && <SatisfactionBars value={decision.satisfaction} />}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </ProfileCard>
  );
}

function MemoryGovernanceActions({
  danger = false,
  disabled,
  onEdit,
  onDelete,
}: {
  danger?: boolean;
  disabled: boolean;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`profile-compact-actions formal ${danger ? 'danger' : ''}`}>
      {onEdit && (
        <Button size="small" type="text" icon={<EditOutlined />} disabled={disabled} onClick={onEdit}>
          修正
        </Button>
      )}
      <Popconfirm
        title="删除这条档案？"
        okText="删除"
        cancelText="取消"
        onConfirm={onDelete}
        okButtonProps={{ disabled, loading: disabled }}
        cancelButtonProps={{ disabled }}
      >
        <Button size="small" type="text" icon={<DeleteOutlined />} disabled={disabled}>
          删除
        </Button>
      </Popconfirm>
    </div>
  );
}

function SensitiveEvidence({ evidence, sensitive }: { evidence?: Evidence; sensitive: boolean }) {
  const items = normalizeEvidence(evidence);

  if (!items.length) return null;

  if (!sensitive) {
    return <EvidenceList evidence={items} />;
  }

  return (
    <details className="profile-sensitive-evidence">
      <summary>查看依据</summary>
      <div className="profile-sensitive-evidence-list">
        {items.slice(0, 2).map((item, index) => (
          <div key={`${item}-${index}`}>{item}</div>
        ))}
      </div>
    </details>
  );
}

function SatisfactionBars({ value }: { value: number }) {
  return (
    <Tooltip title={`满意度 ${value}/5`}>
      <div className="profile-satisfaction-bars">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={i < value ? 'active' : ''} />
        ))}
      </div>
    </Tooltip>
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
    <Tag className={`profile-confidence-tag ${className}`}>
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
        <div key={`${item}-${index}`} className={`profile-evidence-line ${danger ? 'danger' : ''}`}>
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

function normalizeTags(tags?: ProfileDecision['tags']) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);

  const trimmed = tags.trim();
  if (!trimmed || trimmed === '[]') return [];

  try {
    const parsed = JSON.parse(trimmed);
    return normalizeTags(parsed);
  } catch {
    return trimmed
      .split(/[,，、]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}

function getConfidenceText(confidence?: number) {
  if (confidence === undefined || confidence < 0.6) return '仍在观察';
  if (confidence < 0.8) return '待确认';
  return '较确定';
}

function formatReadableToken(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}

function normalizeEditableProfileType(profileType: string): EditableProfileType {
  if (profileType === 'emotion') return 'emotion';
  if (profileType === 'relationship') return 'relationship';
  if (profileType === 'fear') return 'fear';
  if (profileType === 'boundary') return 'boundary';
  return 'value';
}

function isSensitiveProfileType(profileType: string) {
  return profileType === 'fear' || profileType === 'boundary';
}

function getProfileTypeLabel(profileType: string) {
  const labels: Record<string, string> = {
    value: '价值',
    values: '价值',
    emotion: '情绪',
    relationship: '关系',
    fear: '恐惧',
    boundary: '边界',
  };

  return labels[profileType] || '画像';
}

function getDetailLabel(profileType?: EditableProfileType) {
  if (profileType === 'emotion') return '触发器';
  if (profileType === 'relationship') return '角色';
  if (profileType === 'boundary') return '边界类型';
  return '补充';
}

function toNumber(value?: number | string | null) {
  if (value === null || value === undefined) return undefined;
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function formatExpiry(expiresAt?: string | null) {
  if (!expiresAt) return '有效期未标注';

  const expiresTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresTime)) return '有效期未标注';

  const diffDays = Math.ceil((expiresTime - Date.now()) / 86400000);
  if (diffDays <= 0) return '即将过期';
  if (diffDays === 1) return '剩余 1 天';
  return `剩余 ${diffDays} 天`;
}

function EmptyText({ children = '档案仍在观察与积累中...' }: { children?: React.ReactNode }) {
  return <div className="text-[#B09880] text-[13px] py-4 text-center italic">{children}</div>;
}
