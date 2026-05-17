interface StepIndicatorProps {
  total: number;
  current: number;
}

export function StepIndicator({ total, current }: StepIndicatorProps) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-4"
      aria-label={`第 ${current + 1} 步，共 ${total} 步`}
    >
      {Array.from({ length: total }, (_, index) => {
        const isCompleted = index < current;
        const isCurrent = index === current;

        return (
          <span
            key={index}
            aria-current={isCurrent ? 'step' : undefined}
            className={`
              transition-all duration-300
              ${isCompleted ? 'h-2 w-2 rounded-full bg-[var(--color-primary)]' : ''}
              ${isCurrent ? 'h-2 w-8 rounded-full bg-[var(--color-primary)]' : ''}
              ${!isCompleted && !isCurrent ? 'h-2 w-2 rounded-full border border-[var(--color-border)] bg-transparent' : ''}
            `}
          />
        );
      })}
    </div>
  );
}
