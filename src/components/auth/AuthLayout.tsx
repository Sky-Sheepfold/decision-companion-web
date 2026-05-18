import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircleOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  SmileOutlined,
} from '@ant-design/icons';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  switchText: string;
  switchTo: string;
  switchLabel: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, switchText, switchTo, switchLabel, children }: AuthLayoutProps) {
  return (
    <main className="auth-page page-fade">
      <div className="auth-shell">
        <section className="auth-brand-panel">
          <div className="auth-logo-row">
            <img className="auth-logo-mark" src="/decision-companion-logo.png" alt="决策伙伴" />
            <div>
              <div className="auth-logo-title">决策伙伴</div>
              <div className="auth-logo-subtitle">安静地记住你，也把解释权留给你</div>
            </div>
          </div>

          <h1 className="auth-hero-title">每一次想清楚自己，都值得被稳妥地保存。</h1>
          <p className="auth-hero-copy">
            登录后，你的价值观、情绪模式、关系线索和决策历史会逐渐沉淀成长期档案。
          </p>

          <div className="auth-preview-panel">
            <div className="auth-preview-head">
              <span>初始档案预览</span>
              <span>注册后慢慢点亮</span>
            </div>
            <div className="auth-preview-list">
              <PreviewRow icon={<HeartOutlined />} label="价值观" text="从选择里看见你真正重视什么" />
              <PreviewRow icon={<SmileOutlined />} label="情绪" text="先听见感受，再进入分析" />
              <PreviewRow icon={<SafetyCertificateOutlined />} label="边界" text="不确定时不贸然下判断" />
            </div>
            <div className="auth-safe-note">
              <CheckCircleOutlined />
              <span>你可以在全景档案里查看和修正这些理解。</span>
            </div>
          </div>
        </section>

        <section className="auth-form-column">
          <div className="auth-mobile-brand">
            <img className="auth-logo-mark" src="/decision-companion-logo.png" alt="决策伙伴" />
            <div>
              <div className="auth-logo-title">决策伙伴</div>
              <div className="auth-logo-subtitle">安静地记住你，也把解释权留给你</div>
            </div>
          </div>

          <div className="auth-form-panel">
            <div className="auth-form-head">
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>
            {children}
          </div>

          <div className="auth-switch">
            {switchText}
            <Link to={switchTo}>
              {switchLabel}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function PreviewRow({ icon, label, text }: { icon: ReactNode; label: string; text: string }) {
  return (
    <div className="auth-preview-row">
      <span>{icon}</span>
      <div>
        <div>{label}</div>
        <p>{text}</p>
      </div>
    </div>
  );
}
