import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { addSymbol, setEdgeSymbols } from '../../core/automata/operations';
import { isValidSymbol } from '../../core/automata/validation';
import { useActiveProject } from '../../hooks/useActiveProject';
import { useUiStore } from '../../stores/uiStore';
import { cn } from '../../utils/cn';

/**
 * Define quais símbolos levam de um estado a outro. Aberto ao conectar dois
 * estados no grafo ou ao dar duplo clique no rótulo de uma aresta.
 */
export function TransitionDialog() {
  const draft = useUiStore((s) => s.transitionDraft);
  const close = useUiStore((s) => s.openTransitionDraft);
  const select = useUiStore((s) => s.select);
  const { project, edit } = useActiveProject();

  const [selected, setSelected] = useState<string[]>([]);
  const [pendingSymbols, setPendingSymbols] = useState<string[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [error, setError] = useState<string | null>(null);

  const definition = project?.definition;
  const existing = useMemo(
    () =>
      draft && definition
        ? definition.transitions.filter((t) => t.from === draft.from && t.to === draft.to).map((t) => t.symbol)
        : [],
    [draft, definition],
  );

  useEffect(() => {
    if (!draft) return;
    setSelected([...new Set(existing)]);
    setPendingSymbols([]);
    setNewSymbol('');
    setError(null);
    // Reinicia o formulário apenas quando um novo rascunho é aberto.
  }, [draft]);

  if (!draft || !definition) return null;

  const alphabet = [...definition.alphabet, ...pendingSymbols];
  const isDfa = definition.type === 'AFD';

  /** Em um AFD, δ(origem, a) já usado para outro destino bloqueia o símbolo. */
  const conflict = (symbol: string) =>
    isDfa
      ? definition.transitions.find((t) => t.from === draft.from && t.symbol === symbol && t.to !== draft.to)
      : undefined;

  const toggle = (symbol: string) =>
    setSelected((s) => (s.includes(symbol) ? s.filter((x) => x !== symbol) : [...s, symbol]));

  const addNewSymbol = (event?: FormEvent) => {
    event?.preventDefault();
    const symbol = newSymbol.trim();
    if (!symbol) return;
    if (!isValidSymbol(symbol)) {
      setError('Cada símbolo deve ter exatamente um caractere visível (ε é reservado).');
      return;
    }
    if (!alphabet.includes(symbol)) setPendingSymbols((s) => [...s, symbol]);
    if (!conflict(symbol)) setSelected((s) => (s.includes(symbol) ? s : [...s, symbol]));
    setNewSymbol('');
    setError(null);
  };

  const save = () => {
    const symbols = alphabet.filter((s) => selected.includes(s));
    edit((p) => setEdgeSymbols(pendingSymbols.reduce(addSymbol, p), draft.from, draft.to, symbols));
    select(symbols.length > 0 ? { kind: 'edge', from: draft.from, to: draft.to } : null);
    close(null);
  };

  const remove = () => {
    edit((p) => setEdgeSymbols(p, draft.from, draft.to, []));
    select(null);
    close(null);
  };

  return (
    <Dialog
      open
      onClose={() => close(null)}
      title={existing.length > 0 ? 'Editar transições' : 'Nova transição'}
      description={
        <span className="inline-flex items-center gap-2 font-mono text-fg">
          {draft.from} <ArrowRight size={14} className="text-fg-subtle" /> {draft.to}
        </span>
      }
      footer={
        <>
          {existing.length > 0 && (
            <Button variant="danger" className="mr-auto" onClick={remove}>
              <Trash2 size={15} /> Remover
            </Button>
          )}
          <Button variant="ghost" onClick={() => close(null)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={save} disabled={selected.length === 0 && existing.length === 0}>
            Salvar
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-fg-muted">
        Selecione os símbolos que levam de <span className="font-mono text-fg">{draft.from}</span> para{' '}
        <span className="font-mono text-fg">{draft.to}</span>:
      </p>

      {alphabet.length === 0 ? (
        <p className="mb-3 rounded-lg border border-dashed border-line px-3 py-2 text-sm text-fg-subtle">
          O alfabeto está vazio. Adicione um símbolo abaixo.
        </p>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {alphabet.map((symbol) => {
            const blocked = conflict(symbol);
            const active = selected.includes(symbol);
            return (
              <button
                key={symbol}
                type="button"
                disabled={Boolean(blocked)}
                onClick={() => toggle(symbol)}
                title={blocked ? `AFD: δ(${blocked.from}, ${symbol}) já leva a ${blocked.to}` : undefined}
                className={cn(
                  'h-9 min-w-9 rounded-lg border px-2.5 font-mono text-sm font-semibold transition-colors',
                  active
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg',
                  blocked && 'cursor-not-allowed line-through opacity-40',
                )}
              >
                {symbol}
              </button>
            );
          })}
        </div>
      )}

      <form onSubmit={addNewSymbol} className="flex gap-2">
        <Input
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          placeholder="Novo símbolo (ex.: a)"
          maxLength={2}
          aria-invalid={error ? true : undefined}
          className="font-mono"
        />
        <Button type="submit" disabled={!newSymbol.trim()}>
          <Plus size={15} /> Adicionar a Σ
        </Button>
      </form>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {isDfa && (
        <p className="mt-3 text-xs text-fg-subtle">
          AFD: símbolos já usados por {draft.from} para outro destino ficam bloqueados, garantindo δ: Q × Σ → Q.
        </p>
      )}
    </Dialog>
  );
}
