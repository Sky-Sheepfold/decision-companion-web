type BadgeVariant = 'default' | 'values' | 'decision' | 'emotion' | 'relationship' | 'fear';

interface TagBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  confidence?: number;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]',
  values: 'bg-[var(--color-emotion-bg)] text-[var(--color-emotion-text)]',
  decision: 'bg-[var(--color-decision-bg)] text-[var(--color-decision-text)]',
  emotion: 'bg-[var(--color-emotion-bg)] text-[var(--color-emotion-text)]',
  relationship: 'bg-[var(--color-relationship-bg)] text-[var(--color-relationship-text)]',
  fear: 'bg-[var(--color-fear-bg)] text-[var(--color-fear-text)]',
};

export function TagBadge({ children, variant = 'default', confidence }: TagBadgeProps) {
  return (
    <span
      className={`
        inline-flex max-w-full items-center gap-1 rounded-[var(--radius-pill)] px-3 py-1
        text-xs font-medium leading-5
        ${variantStyles[variant]}
      `}
    >
      <span className="min-w-0 break-words">{children}</span>
      {confidence !== undefined && confidence >= 0.6 && confidence < 0.8 && (
        <span className="text-[10px] opacity-60">待确认</span>
      )}
    </span>
  );
}

interface ConfidenceBadgeProps {
  value: number;
}

export function ConfidenceBadge({ value }: ConfidenceBadgeProps) {
  const percentage = Math.round(value * 100);
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
        ${percentage >= 80 
          ? 'bg-[var(--color-decision-bg)] text-[var(--color-decision-text)]' 
          : percentage >= 60 
          ? 'bg-[var(--color-emotion-bg)] text-[var(--color-emotion-text)]'
          : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
        }
      `}
    >
      {percentage}%
    </span>
  );
}
