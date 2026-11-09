import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { validateSentence } from '../../core/automata/validation';
import type { AutomatonDefinition } from '../../core/automata/types';
import { useSimulationStore } from '../../stores/simulationStore';
import { cn } from '../../utils/cn';

interface SentenceInputProps {
  definition: AutomatonDefinition;
  disabled: boolean;
}

/** Campo da sentença de entrada, com aviso imediato de símbolos fora de Σ. */
export function SentenceInput({ definition, disabled }: SentenceInputProps) {
  const input = useSimulationStore((s) => s.input);
  const setInput = useSimulationStore((s) => s.setInput);
  const run = useSimulationStore((s) => s.run);
  const issues = useMemo(() => validateSentence(definition, input), [definition, input]);
  const invalidPositions = new Set(issues.map((i) => i.position));

  return (
    <div className="min-w-0 flex-1">
      <div
        className={cn(
          'flex h-9 items-center rounded-lg border bg-surface-2 transition-colors focus-within:ring-2',
          issues.length > 0
            ? 'border-warning/60 focus-within:ring-warning-soft'
            : 'border-line focus-within:border-accent focus-within:ring-accent-soft hover:border-line-strong',
        )}
      >
        <span className="pl-3 font-mono text-xs text-fg-subtle select-none">w =</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !disabled) run(definition);
          }}
          placeholder="ε (sentença vazia)"
          spellCheck={false}
          autoComplete="off"
          aria-label="Sentença de entrada"
          className="h-full min-w-0 flex-1 bg-transparent px-2 font-mono text-sm tracking-wider text-fg placeholder:tracking-normal placeholder:text-fg-subtle focus:outline-none"
        />
        <span className="pr-3 font-mono text-[11px] text-fg-subtle select-none">|w| = {Array.from(input).length}</span>
      </div>
      {issues.length > 0 && (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-warning">
          <AlertCircle size={13} className="mt-px shrink-0" />
          <span>
            {issues.length === 1
              ? issues[0]?.message
              : `${issues.length} símbolos não pertencem ao alfabeto (posições ${[...invalidPositions].map((p) => p + 1).join(', ')}).`}{' '}
            A sentença será rejeitada ao alcançá-los.
          </span>
        </p>
      )}
    </div>
  );
}
