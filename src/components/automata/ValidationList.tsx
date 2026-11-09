import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { ValidationIssue } from '../../core/automata/types';
import { cn } from '../../utils/cn';

/** Lista os problemas da especificação, erros primeiro. */
export function ValidationList({ issues }: { issues: readonly ValidationIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success-soft px-3.5 py-3 text-sm">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
        <div>
          <p className="font-medium text-fg">Especificação válida</p>
          <p className="mt-0.5 text-xs text-fg-muted">O autômato está pronto para processar sentenças.</p>
        </div>
      </div>
    );
  }

  const sorted = [...issues].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1));

  return (
    <ul className="space-y-2">
      {sorted.map((issue, i) => {
        const error = issue.severity === 'error';
        const Icon = error ? XCircle : AlertTriangle;
        return (
          <li
            key={`${issue.code}-${i}`}
            className={cn(
              'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] leading-snug',
              error ? 'border-danger/30 bg-danger-soft' : 'border-warning/30 bg-warning-soft',
            )}
          >
            <Icon size={16} className={cn('mt-0.5 shrink-0', error ? 'text-danger' : 'text-warning')} />
            <div className="min-w-0">
              <p className="text-fg">{issue.message}</p>
              <p className="mt-1 font-mono text-[10px] tracking-wide text-fg-subtle">
                {error ? 'ERRO' : 'AVISO'} · {issue.code}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
