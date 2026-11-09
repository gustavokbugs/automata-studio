import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface SectionProps {
  title: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Bloco com título usado nos painéis laterais. */
export function Section({ title, hint, actions, children, className }: SectionProps) {
  return (
    <section className={cn('border-b border-line px-4 py-4 last:border-b-0', className)}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[11px] font-semibold tracking-[0.08em] text-fg-subtle uppercase">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-fg-subtle">{hint}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </header>
      {children}
    </section>
  );
}
