export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span
        className="w-2 h-2 bg-[var(--color-typing)] rounded-full"
        style={{ animation: 'typing 1.4s infinite' }}
      />
      <span
        className="w-2 h-2 bg-[var(--color-typing)] rounded-full"
        style={{ animation: 'typing 1.4s infinite 0.2s' }}
      />
      <span
        className="w-2 h-2 bg-[var(--color-typing)] rounded-full"
        style={{ animation: 'typing 1.4s infinite 0.4s' }}
      />
    </div>
  );
}
