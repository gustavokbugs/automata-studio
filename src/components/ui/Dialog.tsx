import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Janela modal acessível: fecha com Esc ou clique fora e foca o primeiro
 * campo ao abrir.
 */
export function Dialog({ open, onClose, title, description, children, footer, className }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    const focusable = panelRef.current?.querySelector<HTMLElement>('input, select, textarea, [data-autofocus]');
    focusable?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'animate-fade-in w-full max-w-md rounded-xl border border-line bg-surface shadow-2xl shadow-black/40',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
            {description && <div className="mt-1 text-sm text-fg-muted">{description}</div>}
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Fechar" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        {children && <div className="px-5 py-4">{children}</div>}
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
