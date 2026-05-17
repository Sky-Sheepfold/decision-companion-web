import { useEffect, useMemo } from 'react';
import { Typography, Space, Tag, Divider, Tooltip, Button, Progress } from 'antd';
import {
    HeartOutlined,
    BookOutlined,
    SmileOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
    EyeOutlined,
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

const { Text, Title } = Typography;

export function MemoryCompass() {
    const navigate = useNavigate();
    const { sessionId, isStreaming, messages } = useChatStore();
    const {
        profile,
        loading,
        error,
        completeness,
        fetchProfile,
        getCompletenessText,
    } = useProfileStore();

    useEffect(() => {
        if (!sessionId) return;
        void fetchProfile();
    }, [fetchProfile, sessionId]);

    useEffect(() => {
        if (!sessionId || isStreaming || messages.length <= 1) return;

        const refreshTimer = window.setTimeout(() => {
            void fetchProfile();
        }, 900);

        return () => window.clearTimeout(refreshTimer);
    }, [fetchProfile, isStreaming, messages.length, sessionId]);

    const snapshot = useMemo(() => {
        const values = profile?.values ?? [];
        const decisions = profile?.decisions ?? [];
        const emotions = profile?.emotions ?? [];
        const relationships = profile?.relationships ?? [];
        const fears = profile?.fears ?? [];

        return {
            values: values.slice(0, 5),
            latestDecision: decisions[0],
            latestEmotion: emotions[0],
            relationships: relationships.slice(0, 3),
            hardBoundaries: fears.filter((fear) => fear.type === 'boundary' || fear.boundaryType === 'hard').slice(0, 3),
            recentFear: fears[0],
            total:
                values.length +
                decisions.length +
                emotions.length +
                relationships.length +
                fears.length,
        };
    }, [profile]);

    const statusText = loading ? '同步中' : isStreaming ? '分析中' : profile ? '已同步' : '待建立';
    const statusClass = loading || isStreaming
        ? '!bg-[var(--color-primary-light)] !text-[var(--color-primary-dark)]'
        : profile
            ? '!bg-[#E8F5EE] !text-[#0F6E56]'
            : '!bg-[#FAFAFA] !text-[#B09880]';

    return (
        <div className="h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#FBF6EF] border-l border-[#E8D8C8]">
            <div className="p-5 pb-4">
                <Space className="w-full justify-between" align="start">
                    <div>
                        <Title level={5} className="!mb-0 !text-[#8B5737]">灵魂投影</Title>
                        <Text type="secondary" className="text-[12px]">正在形成对你的长期理解</Text>
                    </div>
                    <Tag className={`!rounded-full !border-0 ${statusClass}`}>
                        {statusText}
                    </Tag>
                </Space>

                <div className="mt-4 rounded-lg border border-[#E8D8C8] bg-white/70 px-3.5 py-3">
                    <div className="mb-2 flex items-center justify-between">
                        <Text className="text-[13px] text-[var(--color-text-muted)]">{getCompletenessText()}</Text>
                        <Text className="text-[12px] text-[var(--color-text-muted)]">{completeness}%</Text>
                    </div>
                    <Progress
                        percent={completeness}
                        showInfo={false}
                        strokeColor="#C8845A"
                        railColor="#F0DFC8"
                        size="small"
                    />
                    <Text className="mt-2 block text-[12px] text-[var(--color-text-muted)]">
                        已积累 {snapshot.total} 条档案线索
                    </Text>
                </div>

                {error && (
                    <div className="mt-3 rounded-lg border border-[#F5D5CB] bg-[#FAECE7] px-3 py-2 text-[12px] text-[#993C1D]">
                        {error}
                    </div>
                )}
            </div>

            <div className="px-5 pb-5">
                <ProfileSection
                    icon={<HeartOutlined />}
                    title="价值观"
                    tone="value"
                    empty="还没有稳定的价值偏好，继续聊会慢慢浮现。"
                >
                    {snapshot.values.length > 0 && (
                        <Space size={[0, 8]} wrap>
                            {snapshot.values.map((value) => (
                                <Tooltip key={value.id} title={formatEvidence(value.evidence)}>
                                    <Tag className="!border-[var(--color-border)] !bg-[var(--color-primary-light)] !text-[var(--color-text-warm)]">
                                        {formatValue(value)}
                                    </Tag>
                                </Tooltip>
                            ))}
                        </Space>
                    )}
                </ProfileSection>

                <ProfileSection
                    icon={<SmileOutlined />}
                    title="情绪状态"
                    tone="emotion"
                    empty="还没有明显情绪模式，我会先多听一听。"
                >
                    {snapshot.latestEmotion && <EmotionSummary emotion={snapshot.latestEmotion} />}
                </ProfileSection>

                <ProfileSection
                    icon={<SafetyCertificateOutlined />}
                    title="恐惧与边界"
                    tone="fear"
                    empty="暂时没有高置信边界，不会贸然下判断。"
                >
                    {(snapshot.hardBoundaries.length > 0 || snapshot.recentFear) && (
                        <div className="space-y-2">
                            {(snapshot.hardBoundaries.length > 0 ? snapshot.hardBoundaries : [snapshot.recentFear])
                                .filter(Boolean)
                                .map((fear) => (
                                    <BoundaryItem key={fear!.id} fear={fear!} />
                                ))}
                        </div>
                    )}
                </ProfileSection>

                <Divider className="!my-1 !border-dashed !border-[#E8D8C8]" />

                <ProfileSection
                    icon={<TeamOutlined />}
                    title="关系图谱"
                    tone="relationship"
                    empty="还没有出现足够重要的关系节点。"
                >
                    {snapshot.relationships.length > 0 && (
                        <div className="space-y-2">
                            {snapshot.relationships.map((relationship) => (
                                <RelationshipItem key={relationship.id} relationship={relationship} />
                            ))}
                        </div>
                    )}
                </ProfileSection>

                <ProfileSection
                    icon={<BookOutlined />}
                    title="决策历史"
                    tone="decision"
                    empty="还没有形成可复盘的决策记录。"
                >
                    {snapshot.latestDecision && <DecisionSummary decision={snapshot.latestDecision} />}
                </ProfileSection>

                <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => navigate('/profile')}
                    className="mt-4 w-full !rounded-lg !text-[#A06040] hover:!bg-[#F0DFC8]"
                >
                    查看全景人生档案
                </Button>
            </div>
        </div>
    );
}

function ProfileSection({
    icon,
    title,
    tone,
    empty,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    tone: 'value' | 'emotion' | 'fear' | 'relationship' | 'decision';
    empty: string;
    children?: React.ReactNode;
}) {
    const colors = {
        value: 'text-[var(--color-primary-dark)]',
        emotion: 'text-[var(--color-emotion-text)]',
        fear: 'text-[var(--color-fear-text)]',
        relationship: 'text-[var(--color-relationship-text)]',
        decision: 'text-[var(--color-decision-text)]',
    };

    return (
        <section className="border-t border-[#E8D8C8] py-4">
            <div className="mb-2 flex items-center gap-2">
                <span className={colors[tone]}>{icon}</span>
                <Text strong className="text-[14px]">{title}</Text>
            </div>
            {children || <EmptyHint>{empty}</EmptyHint>}
        </section>
    );
}

function EmotionSummary({ emotion }: { emotion: ProfileEmotion }) {
    return (
        <div className="space-y-2 text-[13px] text-[#5F554B]">
            <div>
                <Text strong className="text-[var(--color-emotion-text)]">{emotion.emotion}</Text>
                {emotion.behavior && <span className="ml-1">{emotion.behavior}</span>}
            </div>
            <div className="rounded-lg bg-[var(--color-emotion-bg)] px-3 py-2 text-[12px] text-[var(--color-emotion-text)]">
                触发器：{emotion.triggerDesc}
            </div>
            {emotion.agentNote && (
                <div className="border-l-2 border-[var(--color-primary)] pl-3 text-[12px] text-[var(--color-primary-dark)]">
                    {emotion.agentNote}
                </div>
            )}
        </div>
    );
}

function BoundaryItem({ fear }: { fear: ProfileFear }) {
    const label = fear.boundaryType === 'hard' ? '硬边界' : fear.type === 'boundary' ? '边界' : '恐惧';

    return (
        <div className="rounded-lg border border-[#F5D5CB] bg-[var(--color-fear-bg)] px-3 py-2">
            <div className="mb-1 flex items-center justify-between gap-2">
                <Text strong className="text-[13px] text-[var(--color-fear-text)]">{label}</Text>
                <Text className="text-[11px] text-[#C87E6A]">{formatConfidence(fear.confidence)}</Text>
            </div>
            <div className="text-[13px] text-[#A64A2F]">{fear.description}</div>
            {fear.manifestation && (
                <div className="mt-1 text-[12px] text-[#C87E6A]">{fear.manifestation}</div>
            )}
        </div>
    );
}

function RelationshipItem({ relationship }: { relationship: ProfileRelationship }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-[#DEB888]/30 bg-[var(--color-relationship-bg)] px-3 py-2">
            <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-[#6B462C]">{relationship.name}</div>
                <div className="truncate text-[12px] text-[var(--color-relationship-text)]">{relationship.role}</div>
            </div>
            <Tag className="ml-2 shrink-0 !rounded-full !border-0 !bg-white/70 !text-[var(--color-relationship-text)]">
                {formatInfluenceLevel(relationship.influenceLevel)}
            </Tag>
        </div>
    );
}

function DecisionSummary({ decision }: { decision: ProfileDecision }) {
    return (
        <div className="rounded-lg border border-[#CFE7DC] bg-[var(--color-decision-bg)] px-3 py-2">
            <div className="text-[13px] font-medium text-[var(--color-decision-text)]">{decision.topic}</div>
            <div className="mt-1 text-[12px] text-[#3E7062]">选择：{decision.choice}</div>
            {decision.satisfaction && (
                <div className="mt-2 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <span
                            key={index}
                            className={`h-2 w-1.5 rounded-sm ${index < decision.satisfaction ? 'bg-[var(--color-decision-text)]' : 'bg-white/80'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function EmptyHint({ children }: { children: string }) {
    return <div className="rounded-lg border border-dashed border-[#E2CDBA] bg-white/45 px-3 py-2 text-[12px] text-[#A58A72]">{children}</div>;
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
