import { useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { Section } from '../../ui/Section';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { addSymbol, removeSymbol } from '../../../core/automata/operations';
import { isValidSymbol } from '../../../core/automata/validation';
import type { AutomatonDefinition } from '../../../core/automata/types';
import { useActiveProject } from '../../../hooks/useActiveProject';

/** Alfabeto Σ: símbolos de exatamente um caractere. */
export function AlphabetSection({ definition }: { definition: AutomatonDefinition }) {
  const { edit } = useActiveProject();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // Permite adicionar vários símbolos de uma vez: "a, b, c" ou "abc".
    const symbols = [...new Set(value.split(/[\s,]+/).flatMap((chunk) => Array.from(chunk)).filter(Boolean))];
    if (symbols.length === 0) return;
    const invalid = symbols.filter((s) => !isValidSymbol(s));
    if (invalid.length > 0) return setError(`Símbolo inválido: ${invalid.join(' ')} (ε é reservado).`);
    edit((p) => symbols.reduce(addSymbol, p));
    setValue('');
    setError(null);
  };

  return (
    <Section title={`Alfabeto (Σ) · ${definition.alphabet.length}`} hint="Cada símbolo tem um único caractere">
      {definition.alphabet.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {definition.alphabet.map((symbol, i) => {
            const uses = definition.transitions.filter((t) => t.symbol === symbol).length;
            return (
              <span
                key={`${symbol}-${i}`}
                className="group inline-flex h-7 items-center gap-1 rounded-md border border-line bg-surface-2 pr-1 pl-2.5 font-mono text-sm font-semibold"
              >
                {symbol}
                <button
                  type="button"
                  aria-label={`Remover símbolo ${symbol}`}
                  title={uses > 0 ? `Remove também ${uses} transição(ões) com '${symbol}'` : `Remover '${symbol}'`}
                  onClick={() => edit((p) => removeSymbol(p, symbol))}
                  className="flex h-5 w-5 items-center justify-center rounded text-fg-subtle hover:bg-danger-soft hover:text-danger"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="ex.: 0, 1"
          aria-label="Novos símbolos"
          aria-invalid={error ? true : undefined}
          className="h-8 font-mono"
        />
        <Button type="submit" size="sm" className="h-8" disabled={!value.trim()}>
          <Plus size={14} /> Símbolo
        </Button>
      </form>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </Section>
  );
}
