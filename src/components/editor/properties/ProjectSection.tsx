import { Section } from '../../ui/Section';
import { Tabs } from '../../ui/Tabs';
import { setType } from '../../../core/automata/operations';
import type { AutomatonProject, AutomatonType } from '../../../core/automata/types';
import { useActiveProject } from '../../../hooks/useActiveProject';
import { useProjectStore } from '../../../stores/projectStore';

/** Tipo do autômato (AFD/AFND) e descrição do projeto. */
export function ProjectSection({ project }: { project: AutomatonProject }) {
  const { edit } = useActiveProject();
  const setDescription = useProjectStore((s) => s.setDescription);
  const type = project.definition.type;

  return (
    <Section title="Modelo">
      <Tabs<AutomatonType>
        className="w-full"
        value={type}
        onChange={(t) => edit((p) => setType(p, t))}
        items={[
          { value: 'AFD', label: 'AFD — determinístico' },
          { value: 'AFND', label: 'AFND — não determinístico' },
        ]}
        size="sm"
      />
      <p className="mt-2.5 font-mono text-xs text-fg-muted">
        δ: Q × Σ → {type === 'AFD' ? 'Q' : 'P(Q)'}
      </p>
      <p className="mt-1 text-xs text-fg-subtle">
        {type === 'AFD'
          ? 'Cada par (estado, símbolo) leva a no máximo um estado. Se δ for indefinida, a sentença é rejeitada.'
          : 'Cada par (estado, símbolo) pode levar a um conjunto de estados; todos os caminhos são seguidos simultaneamente.'}
      </p>
      <textarea
        value={project.description}
        onChange={(e) => setDescription(project.id, e.target.value)}
        placeholder="Descrição da linguagem reconhecida (opcional)"
        rows={2}
        className="mt-3 w-full resize-y rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-fg-subtle hover:border-line-strong focus:border-accent focus:ring-2 focus:ring-accent-soft focus:outline-none"
      />
    </Section>
  );
}
