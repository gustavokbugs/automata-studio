import { Check, Download, ExternalLink, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MenuButton } from '../components/layout/WorkspaceHeader';
import { TransitionTable, TupleView } from '../components/automata/FormalSpec';
import { EXAMPLES } from '../data/examples';
import { formatSentence } from '../core/automata/notation';
import { serializeAutomaton } from '../core/automata/serialization';
import { useProjectActions } from '../hooks/useProjectActions';
import { downloadTextFile } from '../utils/files';

/** Galeria de exemplos prontos, com especificação formal e sentenças de teste. */
export function ExamplesPage() {
  const { openExample } = useProjectActions();

  return (
    <div className="h-full overflow-y-auto">
      <header className="flex h-14 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4">
        <MenuButton />
        <h1 className="text-[15px] font-semibold text-fg">Exemplos</h1>
        <span className="text-xs text-fg-subtle">· especificações prontas para estudo e demonstração</span>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 p-4 sm:p-6 xl:grid-cols-2">
        {EXAMPLES.map((example) => (
          <article key={example.id} className="flex flex-col rounded-xl border border-line bg-surface">
            <div className="border-b border-line p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[15px] font-semibold text-fg">{example.name}</h2>
                <Badge tone={example.definition.type === 'AFD' ? 'accent' : 'warning'}>{example.definition.type}</Badge>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">{example.description}</p>
              <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs text-fg">{example.language}</p>
            </div>

            <div className="grid flex-1 gap-5 p-5 sm:grid-cols-2">
              <TupleView definition={example.definition} />
              <TransitionTable definition={example.definition} compact />
            </div>

            <div className="border-t border-line px-5 py-4">
              <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-fg-subtle uppercase">Sentenças de teste</p>
              <div className="flex flex-wrap gap-1.5">
                {example.samples.map((sample) => (
                  <span
                    key={sample.input}
                    className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 px-2 py-0.5 font-mono text-xs"
                  >
                    {sample.accepted ? <Check size={12} className="text-success" /> : <X size={12} className="text-danger" />}
                    {formatSentence(sample.input)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 border-t border-line px-5 py-3">
              <Button variant="primary" size="sm" onClick={() => openExample(example)}>
                <ExternalLink size={14} /> Abrir no editor
              </Button>
              <Button size="sm" onClick={() => downloadTextFile(`${example.id}.json`, serializeAutomaton(example))}>
                <Download size={14} /> Baixar JSON
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
