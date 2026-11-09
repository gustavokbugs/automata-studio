import { useEffect, useState, type FormEvent } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { AutomatonType } from '../../core/automata/types';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';
import { cn } from '../../utils/cn';

const types: Array<{ value: AutomatonType; title: string; signature: string; text: string }> = [
  {
    value: 'AFD',
    title: 'AFD',
    signature: 'δ: Q × Σ → Q',
    text: 'Determinístico: um único estado ativo; cada símbolo leva a no máximo um estado.',
  },
  {
    value: 'AFND',
    title: 'AFND',
    signature: 'δ: Q × Σ → P(Q)',
    text: 'Não determinístico: vários estados ativos simultaneamente; todos os caminhos são seguidos.',
  },
];

/** Diálogo de criação de um novo autômato. */
export function NewAutomatonDialog() {
  const open = useUiStore((s) => s.newProjectOpen);
  const setOpen = useUiStore((s) => s.setNewProjectOpen);
  const setView = useUiStore((s) => s.setView);
  const createProject = useProjectStore((s) => s.createProject);
  const [name, setName] = useState('');
  const [type, setType] = useState<AutomatonType>('AFD');

  useEffect(() => {
    if (open) {
      setName('');
      setType('AFD');
    }
  }, [open]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    createProject(name.trim() || 'Novo autômato', type);
    setView('editor');
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title="Novo autômato"
      description="Escolha o nome e o tipo. Estados, alfabeto e transições são definidos no editor."
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => submit()}>
            Criar autômato
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="new-name" className="mb-1.5 block text-xs text-fg-muted">
            Nome
          </label>
          <Input id="new-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Número par de a's" />
        </div>
        <fieldset>
          <legend className="mb-1.5 block text-xs text-fg-muted">Tipo</legend>
          <div className="grid grid-cols-2 gap-2">
            {types.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                aria-pressed={type === t.value}
                className={cn(
                  'rounded-xl border p-3 text-left transition-colors',
                  type === t.value ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2 hover:border-line-strong',
                )}
              >
                <p className={cn('text-sm font-semibold', type === t.value ? 'text-accent' : 'text-fg')}>{t.title}</p>
                <p className="mt-0.5 font-mono text-[11px] text-fg-muted">{t.signature}</p>
                <p className="mt-1.5 text-xs leading-snug text-fg-subtle">{t.text}</p>
              </button>
            ))}
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
