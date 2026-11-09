import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const field =
  'h-9 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm text-fg placeholder:text-fg-subtle ' +
  'transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft ' +
  'disabled:opacity-50 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger-soft';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(field, className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={cn(field, 'cursor-pointer', className)} {...props} />;
});
