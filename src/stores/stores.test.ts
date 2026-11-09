import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addState, addSymbol, addTransitions, setFinalState } from '../core/automata/operations';
import { parseAutomatonJson, serializeAutomaton } from '../core/automata/serialization';
import { EXAMPLES } from '../data/examples';
import { selectActiveProject, useProjectStore } from './projectStore';
import { useSimulationStore } from './simulationStore';

// Em Node não há localStorage: o middleware de persistência apenas avisa.
vi.spyOn(console, 'warn').mockImplementation(() => undefined);

const active = () => {
  const project = selectActiveProject(useProjectStore.getState());
  if (!project) throw new Error('Nenhum projeto ativo');
  return project;
};

beforeEach(() => {
  useProjectStore.setState({ projects: [], activeId: null });
  useSimulationStore.setState({ input: '', result: null, stepIndex: 0, playing: false });
});

describe('fluxo de edição (integração)', () => {
  it('cria um AFD do zero, edita e simula', () => {
    const store = useProjectStore.getState();
    const id = store.createProject('Somente a', 'AFD');
    store.editProject(id, (p) => addState(addState(p)));
    store.editProject(id, (p) => addSymbol(p, 'a'));
    store.editProject(id, (p) => setFinalState(p, 'q1', true));
    store.editProject(id, (p) =>
      addTransitions(p, [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q1' },
      ]),
    );

    const { definition } = active();
    expect(definition.initialState).toBe('q0');

    const sim = useSimulationStore.getState();
    sim.setInput('aaa');
    sim.run(definition);
    const { result, stepIndex } = useSimulationStore.getState();
    expect(result?.accepted).toBe(true);
    expect(stepIndex).toBe(3);
  });

  it('nomes de projeto repetidos recebem sufixo', () => {
    const store = useProjectStore.getState();
    store.createProject('Teste', 'AFD');
    store.createProject('Teste', 'AFND');
    expect(useProjectStore.getState().projects.map((p) => p.name)).toEqual(['Teste (2)', 'Teste']);
  });

  it('duplica e exclui projetos mantendo um projeto ativo', () => {
    const store = useProjectStore.getState();
    const id = store.importProject(EXAMPLES[0] as (typeof EXAMPLES)[number]);
    const copyId = store.duplicateProject(id);
    expect(useProjectStore.getState().activeId).toBe(copyId);
    expect(active().definition).toEqual(EXAMPLES[0]?.definition);

    store.deleteProject(copyId as string);
    expect(useProjectStore.getState().activeId).toBe(id);
    store.deleteProject(id);
    expect(useProjectStore.getState().activeId).toBeNull();
  });

  it('a cópia é independente do original', () => {
    const store = useProjectStore.getState();
    const id = store.importProject(EXAMPLES[2] as (typeof EXAMPLES)[number]);
    const copyId = store.duplicateProject(id) as string;
    store.editProject(copyId, (p) => addState(p, 'extra'));
    const original = useProjectStore.getState().projects.find((p) => p.id === id);
    expect(original?.definition.states).not.toContain('extra');
  });

  it('exportar e importar reproduz o mesmo autômato', () => {
    const store = useProjectStore.getState();
    store.importProject(EXAMPLES[1] as (typeof EXAMPLES)[number]);
    const parsed = parseAutomatonJson(serializeAutomaton(active()));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    store.importProject(parsed.value);
    const [imported, original] = useProjectStore.getState().projects;
    expect(imported?.definition).toEqual(original?.definition);
    expect(imported?.layout).toEqual(original?.layout);
  });
});

describe('controles de simulação (integração)', () => {
  const definition = (EXAMPLES[2] as (typeof EXAMPLES)[number]).definition; // AFND contém 01

  it('próxima etapa calcula o trace e percorre etapa por etapa', () => {
    const sim = useSimulationStore.getState();
    sim.setInput('101');
    sim.next(definition);
    expect(useSimulationStore.getState().stepIndex).toBe(0);
    sim.next(definition);
    sim.next(definition);
    expect(useSimulationStore.getState().stepIndex).toBe(2);
    expect(useSimulationStore.getState().result?.steps[2]?.activeStates).toEqual(['q0', 'q1']);
    sim.previous();
    expect(useSimulationStore.getState().stepIndex).toBe(1);
  });

  it('não ultrapassa os limites do trace', () => {
    const sim = useSimulationStore.getState();
    sim.setInput('0');
    sim.run(definition);
    sim.next(definition);
    expect(useSimulationStore.getState().stepIndex).toBe(1);
    sim.restart();
    sim.previous();
    expect(useSimulationStore.getState().stepIndex).toBe(0);
  });

  it('executar automaticamente recomeça do início quando já terminou', () => {
    const sim = useSimulationStore.getState();
    sim.setInput('01');
    sim.run(definition);
    sim.play(definition);
    expect(useSimulationStore.getState()).toMatchObject({ stepIndex: 0, playing: true });
    sim.pause();
    expect(useSimulationStore.getState().playing).toBe(false);
  });

  it('alterar a sentença ou invalidar descarta o trace', () => {
    const sim = useSimulationStore.getState();
    sim.setInput('01');
    sim.run(definition);
    sim.setInput('011');
    expect(useSimulationStore.getState().result).toBeNull();
    sim.run(definition);
    sim.invalidate();
    expect(useSimulationStore.getState().result).toBeNull();
  });
});
