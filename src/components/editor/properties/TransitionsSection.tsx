import { useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Section } from '../../ui/Section';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Input';
import { addTransitions, removeTransition, updateTransition } from '../../../core/automata/operations';
import type { AutomatonDefinition, Transition, ValidationIssue } from '../../../core/automata/types';
import { useActiveProject } from '../../../hooks/useActiveProject';
import { cn } from '../../../utils/cn';

/** Opções de um select, incluindo o valor atual mesmo que inválido. */
function options(values: readonly string[], current?: string) {
  const all = current !== undefined && current !== '' && !values.includes(current) ? [...values, current] : values;
  return [...new Set(all)];
}

const cellSelect = 'h-7 w-auto min-w-[3.25rem] flex-1 rounded-md px-1.5 font-mono text-xs';

/** Função de transição δ em forma de tabela editável. */
export function TransitionsSection({
  definition,
  issues,
}: {
  definition: AutomatonDefinition;
  issues: readonly ValidationIssue[];
}) {
  const { edit } = useActiveProject();
  const [draft, setDraft] = useState<Transition>({ from: '', symbol: '', to: '' });

  /** Mensagens de erro por índice de transição. */
  const errorsByIndex = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const issue of issues) {
      if (issue.severity !== 'error') continue;
      for (const index of issue.transitionIndexes ?? []) map.set(index, [...(map.get(index) ?? []), issue.message]);
    }
    return map;
  }, [issues]);

  const from = draft.from || definition.states[0] || '';
  const symbol = draft.symbol || definition.alphabet[0] || '';
  const to = draft.to || definition.states[0] || '';
  const canAdd = definition.states.length > 0 && definition.alphabet.length > 0;
  const duplicate = definition.transitions.some((t) => t.from === from && t.symbol === symbol && t.to === to);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canAdd || duplicate) return;
    edit((p) => addTransitions(p, [{ from, symbol, to }]));
  };

  return (
    <Section
      title={
        <>
          Transições <span className="normal-case">(δ)</span> · {definition.transitions.length}
        </>
      }
      hint="Também é possível criá-las arrastando entre estados no grafo"
    >
      {definition.transitions.length > 0 && (
        <ul className="mb-3 space-y-1">
          {definition.transitions.map((t, index) => {
            const errors = errorsByIndex.get(index);
            const set = (patch: Partial<Transition>) => edit((p) => updateTransition(p, index, { ...t, ...patch }));
            return (
              <li
                key={index}
                title={errors?.join('\n')}
                className={cn(
                  'group flex items-center gap-1 rounded-lg border px-1 py-1',
                  errors ? 'border-danger/50 bg-danger-soft' : 'border-transparent hover:bg-surface-2',
                )}
              >
                <span className="pl-1 font-mono text-xs text-fg-subtle">δ(</span>
                <Select className={cellSelect} value={t.from} onChange={(e) => set({ from: e.target.value })} aria-label="Origem">
                  {options(definition.states, t.from).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
                <span className="font-mono text-xs text-fg-subtle">,</span>
                <Select className={cellSelect} value={t.symbol} onChange={(e) => set({ symbol: e.target.value })} aria-label="Símbolo">
                  {options(definition.alphabet, t.symbol).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
                <span className="font-mono text-xs text-fg-subtle">)</span>
                <ArrowRight size={13} className="shrink-0 text-fg-subtle" />
                <Select className={cellSelect} value={t.to} onChange={(e) => set({ to: e.target.value })} aria-label="Destino">
                  {options(definition.states, t.to).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
                <button
                  type="button"
                  aria-label="Remover transição"
                  onClick={() => edit((p) => removeTransition(p, index))}
                  className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-fg-subtle opacity-0 transition hover:text-danger group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {canAdd ? (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-1 rounded-lg border border-dashed border-line p-1.5">
          <span className="pl-1 font-mono text-xs text-fg-subtle">δ(</span>
          <Select className={cellSelect} value={from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} aria-label="Nova origem">
            {definition.states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <span className="font-mono text-xs text-fg-subtle">,</span>
          <Select className={cellSelect} value={symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} aria-label="Novo símbolo">
            {definition.alphabet.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <span className="font-mono text-xs text-fg-subtle">)</span>
          <ArrowRight size={13} className="text-fg-subtle" />
          <Select className={cellSelect} value={to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} aria-label="Novo destino">
            {definition.states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Button type="submit" size="sm" variant="primary" className="ml-auto h-7" disabled={duplicate} title={duplicate ? 'Transição já existe' : undefined}>
            <Plus size={14} />
          </Button>
        </form>
      ) : (
        <p className="text-xs text-fg-subtle">Defina estados e símbolos para criar transições.</p>
      )}
    </Section>
  );
}
