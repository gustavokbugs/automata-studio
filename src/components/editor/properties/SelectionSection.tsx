import { useEffect, useState } from 'react';
import { ArrowRight, Flag, PencilLine, Trash2, X } from 'lucide-react';
import { Section } from '../../ui/Section';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { removeState, renameState, setEdgeSymbols, setFinalState, setInitialState } from '../../../core/automata/operations';
import { isValidStateName } from '../../../core/automata/validation';
import type { AutomatonDefinition, StateName } from '../../../core/automata/types';
import { useActiveProject } from '../../../hooks/useActiveProject';
import { useUiStore } from '../../../stores/uiStore';
import { cn } from '../../../utils/cn';

function StateDetails({ definition, name }: { definition: AutomatonDefinition; name: StateName }) {
  const { edit } = useActiveProject();
  const select = useUiStore((s) => s.select);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(name);
    setError(null);
  }, [name]);

  const commit = () => {
    const next = draft.trim();
    if (next === name) return setError(null);
    if (!isValidStateName(next)) return setError('Use um nome não vazio, sem espaços, vírgulas, chaves ou parênteses.');
    if (definition.states.includes(next)) return setError(`Já existe um estado chamado '${next}'.`);
    edit((p) => renameState(p, name, next));
    select({ kind: 'state', name: next });
    setError(null);
  };

  const isInitial = definition.initialState === name;
  const isFinal = definition.finalStates.includes(name);
  const outgoing = definition.transitions.filter((t) => t.from === name);

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs text-fg-muted" htmlFor="state-name">
          Nome do estado
        </label>
        <Input
          id="state-name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setDraft(name);
          }}
          aria-invalid={error ? true : undefined}
          className="font-mono"
        />
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant={isInitial ? 'primary' : 'secondary'}
          onClick={() => edit((p) => setInitialState(p, isInitial ? null : name))}
          title="Definir como estado inicial (q₀)"
        >
          <ArrowRight size={14} /> Inicial
        </Button>
        <Button
          size="sm"
          variant={isFinal ? 'primary' : 'secondary'}
          onClick={() => edit((p) => setFinalState(p, name, !isFinal))}
          title="Incluir/excluir do conjunto de estados finais (F)"
        >
          <Flag size={14} /> Final
        </Button>
      </div>

      {outgoing.length > 0 && (
        <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
          <p className="mb-1 text-[11px] text-fg-subtle">Transições de saída</p>
          <ul className="space-y-0.5 font-mono text-xs text-fg-muted">
            {outgoing.map((t, i) => (
              <li key={`${t.symbol}-${t.to}-${i}`}>
                δ({t.from}, {t.symbol}) → <span className="text-fg">{t.to}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button
        variant="danger"
        size="sm"
        className="w-full"
        onClick={() => {
          edit((p) => removeState(p, name));
          select(null);
        }}
      >
        <Trash2 size={14} /> Excluir estado
      </Button>
    </div>
  );
}

function EdgeDetails({ definition, from, to }: { definition: AutomatonDefinition; from: StateName; to: StateName }) {
  const { edit } = useActiveProject();
  const select = useUiStore((s) => s.select);
  const openTransitionDraft = useUiStore((s) => s.openTransitionDraft);
  const symbols = definition.transitions.filter((t) => t.from === from && t.to === to).map((t) => t.symbol);

  if (symbols.length === 0) return <p className="text-sm text-fg-subtle">Esta transição não existe mais.</p>;

  return (
    <div className="space-y-3">
      <ul className="space-y-1 font-mono text-sm">
        {symbols.map((symbol, i) => (
          <li key={`${symbol}-${i}`} className="flex items-center justify-between rounded-md bg-surface-2 px-2.5 py-1.5">
            <span>
              δ({from}, <span className="text-accent">{symbol}</span>) → {to}
            </span>
            <button
              type="button"
              aria-label={`Remover símbolo ${symbol}`}
              className="text-fg-subtle hover:text-danger"
              onClick={() => edit((p) => setEdgeSymbols(p, from, to, symbols.filter((s) => s !== symbol)))}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" onClick={() => openTransitionDraft({ from, to })}>
          <PencilLine size={14} /> Editar
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => {
            edit((p) => setEdgeSymbols(p, from, to, []));
            select(null);
          }}
        >
          <Trash2 size={14} /> Excluir
        </Button>
      </div>
    </div>
  );
}

/** Detalhes e ações do elemento selecionado no grafo. */
export function SelectionSection({ definition }: { definition: AutomatonDefinition }) {
  const selection = useUiStore((s) => s.selection);
  const select = useUiStore((s) => s.select);

  if (!selection) return null;
  if (selection.kind === 'state' && !definition.states.includes(selection.name)) return null;

  return (
    <Section
      title={selection.kind === 'state' ? 'Estado selecionado' : 'Transição selecionada'}
      className={cn('animate-fade-in bg-accent-soft/40')}
      hint={
        selection.kind === 'edge' ? (
          <span className="font-mono">
            {selection.from} → {selection.to}
          </span>
        ) : undefined
      }
      actions={
        <Button variant="ghost" size="icon-sm" aria-label="Limpar seleção" onClick={() => select(null)}>
          <X size={14} />
        </Button>
      }
    >
      {selection.kind === 'state' ? (
        <StateDetails definition={definition} name={selection.name} />
      ) : (
        <EdgeDetails definition={definition} from={selection.from} to={selection.to} />
      )}
    </Section>
  );
}
