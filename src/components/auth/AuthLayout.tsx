import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Archive, HeartHandshake, History } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  switchText: string;
  switchTo: string;
  switchLabel: string;
  children: ReactNode;
}

const fade = (delay: string): CSSProperties => ({ '--auth-delay': delay }) as CSSProperties;

const VALUE_POINTS = [
  {
    icon: Archive,
    title: '长期记忆档案',
    text: '价值观、情绪模式、决策历史，随对话自然沉淀',
  },
  {
    icon: History,
    title: '决策复盘',
    text: '回看每次选择背后的思考过程与结果满意度',
  },
  {
    icon: HeartHandshake,
    title: '情绪先行的陪伴',
    text: '先被听见，再一起分析',
  },
];

export function AuthLayout({ title, subtitle, switchText, switchTo, switchLabel, children }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-brand-panel">
          <div className="auth-logo-row auth-anim" style={fade('0s')}>
            <img className="auth-logo-mark" src="/decision-companion-logo.png" alt="决策伙伴" />
            <div>
              <div className="auth-logo-title">决策伙伴</div>
              <div className="auth-logo-subtitle">安静地记住你，也把解释权留给你</div>
            </div>
          </div>

          <h1 className="auth-hero-title auth-anim" style={fade('0.08s')}>
            每一次想清楚自己，都值得被稳妥地保存。
          </h1>
          <p className="auth-hero-copy auth-anim" style={fade('0.16s')}>
            一个像懂你的朋友一样的智能体，陪你想清楚人生里那些重要的决定。
          </p>

          <ul className="auth-value-list">
            {VALUE_POINTS.map((point, index) => (
              <li className="auth-value-row auth-anim" style={fade(`${0.24 + index * 0.07}s`)} key={point.title}>
                <span className="auth-value-icon">
                  <point.icon />
                </span>
                <div>
                  <strong>{point.title}</strong>
                  <p>{point.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="auth-brand-foot auth-anim" style={fade('0.32s')}>
            你的档案随时可查看、可修正，解释权始终在你手里。
          </p>
        </section>

        <section className="auth-form-column">
          <div className="auth-mobile-brand auth-anim" style={fade('0s')}>
            <img className="auth-logo-mark" src="/decision-companion-logo.png" alt="决策伙伴" />
            <div>
              <div className="auth-logo-title">决策伙伴</div>
              <div className="auth-logo-subtitle">安静地记住你，也把解释权留给你</div>
            </div>
          </div>

          <div className="auth-form-panel auth-anim" style={fade('0.12s')}>
            <div className="auth-form-head">
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>
            {children}

            <div className="auth-switch">
              {switchText}
              <Link to={switchTo}>
                {switchLabel}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
