import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type Tone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-fg-muted',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
