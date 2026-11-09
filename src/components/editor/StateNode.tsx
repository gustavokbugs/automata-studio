import { memo } from 'react';
import { Handle, Position, useConnection, type NodeProps } from '@xyflow/react';
import { X } from 'lucide-react';
import { NODE_SIZE } from './geometry';
import type { StateFlowNode, StateVisual } from './flowElements';
import { cn } from '../../utils/cn';

const visuals: Record<StateVisual, { ring: string; body: string; text: string }> = {
  idle: { ring: 'border-line-strong', body: 'bg-surface', text: 'text-fg' },
  active: {
    ring: 'border-accent',
    body: 'bg-surface shadow-[0_0_0_6px_var(--as-accent-soft),0_0_28px_var(--as-accent-soft)]',
    text: 'text-accent',
  },
  accepted: {
    ring: 'border-success',
    body: 'bg-surface shadow-[0_0_0_6px_var(--as-success-soft),0_0_32px_var(--as-success-soft)]',
    text: 'text-success',
  },
  rejected: {
    ring: 'border-danger',
    body: 'bg-surface shadow-[0_0_0_6px_var(--as-danger-soft)]',
    text: 'text-danger',
  },
  discarded: { ring: 'border-danger/60 border-dashed', body: 'bg-surface opacity-70', text: 'text-danger/80' },
};

/** Seta de entrada que identifica o estado inicial. */
function InitialArrow({ className }: { className: string }) {
  return (
    <svg
      width="38"
      height="16"
      viewBox="0 0 38 16"
      aria-hidden
      className={cn('pointer-events-none absolute top-1/2 right-full mr-0.5 -translate-y-1/2', className)}
    >
      <path d="M0 8 H30" stroke="currentColor" strokeWidth="2" />
      <path d="M28 2 L37 8 L28 14 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Estado do autômato: nó circular, com dupla circunferência quando final e
 * seta de entrada quando inicial. A alça à direita cria transições; durante
 * a conexão, o nó inteiro aceita ser o destino.
 */
export const StateNode = memo(function StateNode({ data, selected }: NodeProps<StateFlowNode>) {
  const connecting = useConnection((c) => c.inProgress);
  const { name, initial, final, visual, invalid } = data;
  const style = visuals[visual];
  const ring = invalid && visual === 'idle' ? 'border-danger' : style.ring;

  return (
    <div className="group relative" style={{ width: NODE_SIZE, height: NODE_SIZE }}>
      {initial && (
        <InitialArrow className={visual === 'idle' ? 'text-fg-subtle' : style.text} />
      )}

      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center rounded-full border-2 transition-all duration-300',
          ring,
          style.body,
          selected && 'outline-2 outline-offset-4 outline-accent/70',
        )}
      >
        {final && <div className={cn('absolute inset-[5px] rounded-full border-2 transition-colors duration-300', ring)} />}
        <span
          className={cn(
            'relative max-w-[46px] truncate font-mono text-[13px] font-semibold transition-colors duration-300',
            visual === 'idle' ? (invalid ? 'text-danger' : 'text-fg') : style.text,
          )}
          title={name}
        >
          {name}
        </span>
      </div>

      {visual === 'discarded' && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-on-accent shadow">
          <X size={12} strokeWidth={3} />
        </span>
      )}

      <Handle
        type="target"
        position={Position.Left}
        isConnectableStart={false}
        className={cn('as-handle-target', connecting && 'as-handle-target--active')}
      />
      <Handle type="source" position={Position.Right} className="as-handle-source" title="Arraste para criar uma transição" />
    </div>
  );
});
