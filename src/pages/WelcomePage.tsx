import { ArrowRight, FileUp, MousePointer2, Play, Plus, Settings2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MenuButton } from '../components/layout/WorkspaceHeader';
import { EXAMPLES } from '../data/examples';
import { useProjectActions } from '../hooks/useProjectActions';
import { useUiStore } from '../stores/uiStore';

const steps = [
  { icon: Settings2, title: 'Defina', text: 'Estados, alfabeto, estado inicial, finais e transições — no grafo ou no painel.' },
  { icon: MousePointer2, title: 'Visualize', text: 'Arraste estados, conecte-os e veja a tabela δ e a quíntupla formal.' },
  { icon: Play, title: 'Simule', text: 'Processe sentenças etapa por etapa e veja o veredito de aceitação.' },
];

/** Tela inicial exibida quando nenhum autômato está aberto. */
export function WelcomePage() {
  const setNewProjectOpen = useUiStore((s) => s.setNewProjectOpen);
  const setView = useUiStore((s) => s.setView);
  const { importFromFile, openExample } = useProjectActions();

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 lg:hidden">
        <MenuButton />
      </div>
      <div className="mx-auto max-w-4xl px-5 py-10 sm:py-16">
        <p className="mb-3 font-mono text-xs text-accent">M = (Q, Σ, δ, q₀, F)</p>
        <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">Automata Studio</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-fg-muted">
          Um ambiente para construir, visualizar e simular Autômatos Finitos Determinísticos (AFD) e Não Determinísticos
          (AFND), acompanhando o processamento de cada símbolo da sentença.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => setNewProjectOpen(true)}>
            <Plus size={16} /> Novo autômato
          </Button>
          <Button onClick={() => void importFromFile()}>
            <FileUp size={16} /> Importar JSON
          </Button>
          <Button variant="ghost" onClick={() => setView('docs')}>
            Documentação <ArrowRight size={15} />
          </Button>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="rounded-xl border border-line bg-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon size={15} />
                </span>
                <span className="font-mono text-xs text-fg-subtle">0{i + 1}</span>
              </div>
              <p className="text-sm font-medium text-fg">{title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 mb-3 flex items-end justify-between">
          <h2 className="text-sm font-semibold text-fg">Comece por um exemplo</h2>
          <button type="button" onClick={() => setView('examples')} className="text-xs text-accent hover:underline">
            Ver especificações
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {EXAMPLES.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() => openExample(example)}
              className="group flex items-start gap-3 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-line-strong hover:bg-surface-2"
            >
              <Badge tone={example.definition.type === 'AFD' ? 'accent' : 'warning'}>{example.definition.type}</Badge>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{example.name.replace(/^AFN?D — /, '')}</p>
                <p className="mt-1 truncate font-mono text-[11px] text-fg-subtle">{example.language}</p>
              </div>
              <ArrowRight size={16} className="mt-0.5 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
