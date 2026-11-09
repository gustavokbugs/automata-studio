import { useState, type FormEvent } from 'react';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Section } from '../../ui/Section';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { addState, nextStateName, removeState, setFinalState, setInitialState } from '../../../core/automata/operations';
import { isValidStateName } from '../../../core/automata/validation';
import type { AutomatonDefinition } from '../../../core/automata/types';
import { useActiveProject } from '../../../hooks/useActiveProject';
import { useUiStore } from '../../../stores/uiStore';
import { cn } from '../../../utils/cn';

/** Conjunto de estados Q, com q₀ e F. */
export function StatesSection({ definition }: { definition: AutomatonDefinition }) {
  const { edit } = useActiveProject();
  const selection = useUiStore((s) => s.selection);
  const select = useUiStore((s) => s.select);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const stateName = name.trim() || nextStateName(definition);
    if (!isValidStateName(stateName)) return setError('Nome inválido: não use espaços, vírgulas, chaves ou parênteses.');
    if (definition.states.includes(stateName)) return setError(`O estado '${stateName}' já existe.`);
    edit((p) => addState(p, stateName));
    setName('');
    setError(null);
  };

  return (
    <Section title={`Estados (Q) · ${definition.states.length}`} hint="Seta: inicial (q₀) · círculo duplo: final (F)">
      <ul className="mb-3 space-y-1">
        {definition.states.map((state, index) => {
          const isInitial = definition.initialState === state;
          const isFinal = definition.finalStates.includes(state);
          const isSelected = selection?.kind === 'state' && selection.name === state;
          return (
            <li
              key={`${state}-${index}`}
              className={cn(
                'group flex items-center gap-1 rounded-lg border px-1.5 py-1 transition-colors',
                isSelected ? 'border-accent/60 bg-accent-soft' : 'border-transparent hover:bg-surface-2',
              )}
            >
              <button
                type="button"
                title={isInitial ? 'Estado inicial' : 'Definir como inicial'}
                aria-label={`Definir ${state} como inicial`}
                aria-pressed={isInitial}
                onClick={() => edit((p) => setInitialState(p, state))}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
                  isInitial ? 'text-accent' : 'text-fg-subtle/40 hover:text-fg-muted',
                )}
              >
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => select({ kind: 'state', name: state })}
                className="min-w-0 flex-1 truncate text-left font-mono text-sm text-fg"
              >
                {state}
              </button>
              <button
                type="button"
                title={isFinal ? 'Remover de F' : 'Tornar final'}
                aria-label={`Alternar ${state} como final`}
                aria-pressed={isFinal}
                onClick={() => edit((p) => setFinalState(p, state, !isFinal))}
                className={cn(
                  'flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium transition-colors',
                  isFinal ? 'bg-accent-soft text-accent' : 'text-fg-subtle hover:text-fg-muted',
                )}
              >
                <span className={cn('flex h-3 w-3 items-center justify-center rounded-full border-[1.5px] border-current')}>
                  {isFinal && <span className="h-1.5 w-1.5 rounded-full border border-current" />}
                </span>
                final
              </button>
              <button
                type="button"
                aria-label={`Excluir ${state}`}
                onClick={() => {
                  edit((p) => removeState(p, state));
                  if (isSelected) select(null);
                }}
                className="flex h-6 w-6 items-center justify-center rounded-md text-fg-subtle opacity-0 transition hover:text-danger group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </li>
          );
        })}
      </ul>
      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder={nextStateName(definition)}
          aria-label="Nome do novo estado"
          aria-invalid={error ? true : undefined}
          className="h-8 font-mono"
        />
        <Button type="submit" size="sm" className="h-8">
          <Plus size={14} /> Estado
        </Button>
      </form>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </Section>
  );
}
