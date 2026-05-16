import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../api/agent';
import type { UserProfile, ProfileValues, ProfileDecision, ProfileEmotion, ProfileRelationship, ProfileFear } from '../types';

export function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      navigate('/onboarding');
      return;
    }

    async function fetchProfile() {
      try {
        setLoading(true);
        const data = await profileApi.getFullProfile(sessionId!);
        setProfile(data);
      } catch (err) {
        setError('加载档案失败，请稍后重试');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>正在读取你的画像...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-error">
        <p>{error || '加载失败'}</p>
        <button onClick={() => window.location.reload()}>重新加载</button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>你的画像</h1>
        <p className="subtitle">这是我眼中的你</p>
      </header>

      <main className="profile-main">
        <section className="profile-section values-section">
          <ValuesCard values={profile.values} />
        </section>

        <section className="profile-section decisions-section">
          <DecisionsCard decisions={profile.decisions} />
        </section>

        <section className="profile-section emotions-section">
          <EmotionsCard emotions={profile.emotions} />
        </section>

        <section className="profile-section relationships-section">
          <RelationshipsCard relationships={profile.relationships} />
        </section>

        <section className="profile-section fears-section">
          <FearsCard fears={profile.fears} />
        </section>
      </main>

      <footer className="profile-footer">
        <button className="btn-chat" onClick={() => navigate('/chat')}>
          去聊聊
        </button>
      </footer>
    </div>
  );
}

function ValuesCard({ values }: { values: ProfileValues[] }) {
  if (!values || values.length === 0) {
    return (
      <div className="card">
        <h2>💎 价值观</h2>
        <p className="empty-state">还没有收集到价值观信息，多和我聊聊吧~</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>💎 价值观</h2>
      <p className="card-description">你最在意的东西</p>
      <div className="values-grid">
        {values.map((value) => (
          <div key={value.id} className="value-item">
            <div className="value-header">
              <span className="value-item-name">{value.item}</span>
              <span className="confidence-badge">
                {Math.round(value.confidence * 100)}%
              </span>
            </div>
            <p className="value-preference">{value.preference}</p>
            {value.evidence && value.evidence.length > 0 && (
              <div className="evidence">
                <span className="evidence-label">证据：</span>
                <ul>
                  {value.evidence.slice(0, 2).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionsCard({ decisions }: { decisions: ProfileDecision[] }) {
  if (!decisions || decisions.length === 0) {
    return (
      <div className="card">
        <h2>📋 决策历史</h2>
        <p className="empty-state">还没有记录决策历史</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>📋 决策历史</h2>
      <p className="card-description">你做过的重大选择</p>
      <div className="decisions-list">
        {decisions.map((decision) => (
          <div key={decision.id} className="decision-item">
            <div className="decision-header">
              <span className="decision-topic">{decision.topic}</span>
              {decision.decisionDate && (
                <span className="decision-date">{decision.decisionDate}</span>
              )}
            </div>
            <p className="decision-choice">{decision.choice}</p>
            {decision.reason && (
              <p className="decision-reason">
                <strong>理由：</strong>{decision.reason}
              </p>
            )}
            {decision.satisfaction && (
              <div className="satisfaction">
                <span>满意度：</span>
                <div className="satisfaction-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={star <= decision.satisfaction ? 'filled' : ''}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmotionsCard({ emotions }: { emotions: ProfileEmotion[] }) {
  if (!emotions || emotions.length === 0) {
    return (
      <div className="card">
        <h2>🌊 情绪模式</h2>
        <p className="empty-state">还没有识别到情绪模式</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>🌊 情绪模式</h2>
      <p className="card-description">你在什么情况下会有这样的反应</p>
      <div className="emotions-list">
        {emotions.map((emotion) => (
          <div key={emotion.id} className="emotion-item">
            <div className="emotion-trigger">
              <span className="trigger-label">触发情境：</span>
              <span>{emotion.triggerDesc}</span>
            </div>
            <div className="emotion-type">
              <span className="emotion-emoji">
                {emotion.emotion.includes('焦虑') ? '😰' :
                  emotion.emotion.includes('逃避') ? '🏃' :
                    emotion.emotion.includes('果断') ? '💪' : '💭'}
              </span>
              <span>{emotion.emotion}</span>
            </div>
            {emotion.behavior && (
              <p className="emotion-behavior">
                <strong>行为：</strong>{emotion.behavior}
              </p>
            )}
            {emotion.agentNote && (
              <p className="agent-note">💡 {emotion.agentNote}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RelationshipsCard({ relationships }: { relationships: ProfileRelationship[] }) {
  if (!relationships || relationships.length === 0) {
    return (
      <div className="card">
        <h2>👥 关系图谱</h2>
        <p className="empty-state">还没有记录重要的人</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>👥 关系图谱</h2>
      <p className="card-description">你生命中的重要人物</p>
      <div className="relationships-grid">
        {relationships.map((rel) => (
          <div key={rel.id} className="relationship-item">
            <div className="relationship-avatar">
              {rel.name.charAt(0)}
            </div>
            <div className="relationship-info">
              <h3>{rel.name}</h3>
              <p className="relationship-role">{rel.role}</p>
              <div className="influence-badge">
                <span className={`influence-level ${rel.influenceLevel}`}>
                  影响力：{rel.influenceLevel}
                </span>
              </div>
              {rel.influenceStyle && (
                <p className="influence-style">{rel.influenceStyle}</p>
              )}
              {rel.note && (
                <p className="relationship-note">{rel.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FearsCard({ fears }: { fears: ProfileFear[] }) {
  if (!fears || fears.length === 0) {
    return (
      <div className="card">
        <h2>⚡ 恐惧与边界</h2>
        <p className="empty-state">还没有发现明确的恐惧或边界</p>
      </div>
    );
  }

  const fearItems = fears.filter(f => f.type === 'fear');
  const boundaryItems = fears.filter(f => f.type === 'boundary');

  return (
    <div className="card">
      <h2>⚡ 恐惧与边界</h2>
      <p className="card-description">你的深层恐惧和心理红线</p>

      {fearItems.length > 0 && (
        <div className="fears-section">
          <h3>深层恐惧</h3>
          {fearItems.map((fear) => (
            <div key={fear.id} className="fear-item">
              <div className="fear-header">
                <span>😨 {fear.description}</span>
                {fear.confidence && (
                  <span className="confidence-badge">
                    {Math.round(fear.confidence * 100)}%
                  </span>
                )}
              </div>
              {fear.manifestation && (
                <p className="fear-manifestation">{fear.manifestation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {boundaryItems.length > 0 && (
        <div className="boundaries-section">
          <h3>心理边界</h3>
          {boundaryItems.map((boundary) => (
            <div key={boundary.id} className={`boundary-item ${boundary.boundaryType}`}>
              <span className="boundary-icon">
                {boundary.boundaryType === 'hard' ? '🚫' : '⚠️'}
              </span>
              <span className="boundary-text">{boundary.description}</span>
              <span className="boundary-type">
                {boundary.boundaryType === 'hard' ? '硬边界' : '软边界'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
