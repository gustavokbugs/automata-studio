import type { ReactNode } from 'react';
import { MenuButton } from '../components/layout/WorkspaceHeader';

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mt-12 mb-3 scroll-mt-6 text-lg font-semibold tracking-tight text-fg first:mt-0">
      {children}
    </h2>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-[14px] leading-relaxed text-fg-muted">{children}</p>;
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <pre className="mb-4 overflow-x-auto rounded-lg border border-line bg-surface px-4 py-3 font-mono text-[13px] leading-relaxed text-fg">
      {children}
    </pre>
  );
}

function M({ children }: { children: ReactNode }) {
  return <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[12.5px] text-fg">{children}</code>;
}

const toc = [
  ['fundamentos', 'Fundamentos'],
  ['afd', 'AFD'],
  ['afnd', 'AFND'],
  ['algoritmos', 'Algoritmos de simulação'],
  ['uso', 'Como usar'],
  ['json', 'Formato JSON'],
  ['validacao', 'Validações'],
] as const;

/** Documentação teórica e guia de uso. */
export function DocsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-line bg-surface/95 px-3 backdrop-blur sm:px-4">
        <MenuButton />
        <h1 className="text-[15px] font-semibold text-fg">Documentação</h1>
      </header>

      <div className="mx-auto flex max-w-5xl gap-10 px-5 py-8 sm:py-10">
        <nav className="sticky top-20 hidden h-fit w-44 shrink-0 md:block" aria-label="Seções">
          <ul className="space-y-1 border-l border-line">
            {toc.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="-ml-px block border-l border-transparent py-1 pl-3 text-[13px] text-fg-muted hover:border-accent hover:text-fg">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 max-w-3xl flex-1">
          <H2 id="fundamentos">Fundamentos</H2>
          <P>
            Um <strong className="text-fg">autômato finito</strong> é um modelo matemático de computação com memória
            limitada a um número finito de estados. Ele lê uma sentença (palavra) símbolo a símbolo, da esquerda para a
            direita, mudando de estado conforme a função de transição. Ao final da leitura, a sentença é{' '}
            <strong className="text-fg">aceita</strong> ou <strong className="text-fg">rejeitada</strong>. O conjunto de
            todas as sentenças aceitas é a <em>linguagem reconhecida</em> pelo autômato, e as linguagens reconhecidas por
            autômatos finitos são exatamente as <em>linguagens regulares</em>.
          </P>
          <Formula>{`M = (Q, Σ, δ, q₀, F)

Q   conjunto finito de estados
Σ   alfabeto (conjunto finito de símbolos)
δ   função de transição
q₀  estado inicial, q₀ ∈ Q
F   conjunto de estados finais, F ⊆ Q`}</Formula>
          <P>
            A sentença vazia é denotada por <M>ε</M>. Neste simulador cada símbolo do alfabeto possui exatamente um
            caractere, então a sentença <M>0110</M> é lida como os símbolos <M>0</M>, <M>1</M>, <M>1</M>, <M>0</M>.
          </P>

          <H2 id="afd">Autômato Finito Determinístico (AFD)</H2>
          <Formula>{`δ: Q × Σ → Q

δ̂(q, ε)  = q
δ̂(q, wa) = δ(δ̂(q, w), a)

L(M) = { w ∈ Σ* | δ̂(q₀, w) ∈ F }`}</Formula>
          <P>
            Em um AFD, para cada estado e cada símbolo existe <strong className="text-fg">no máximo um</strong> estado de
            destino. Há sempre um único estado ativo. Quando <M>δ(q, a)</M> não está definida (função parcial), a
            computação para e a sentença é rejeitada.
          </P>

          <H2 id="afnd">Autômato Finito Não Determinístico (AFND)</H2>
          <Formula>{`δ: Q × Σ → P(Q)

δ̂(q, ε)  = { q }
δ̂(q, wa) = ⋃ { δ(p, a) | p ∈ δ̂(q, w) }

L(M) = { w ∈ Σ* | δ̂(q₀, w) ∩ F ≠ ∅ }`}</Formula>
          <P>
            Em um AFND, um par (estado, símbolo) pode levar a <strong className="text-fg">vários</strong> estados — ou a
            nenhum (<M>∅</M>). A máquina segue todos os caminhos possíveis simultaneamente; por isso, em cada etapa existe
            um <em>conjunto</em> de estados ativos. A sentença é aceita se ao menos um caminho termina em um estado final.
            Caminhos que chegam a um estado sem transição para o símbolo lido são descartados.
          </P>
          <P>
            Esta versão não implementa transições vazias (<M>ε</M>). A arquitetura já isola o cálculo do fecho
            (<M>closure</M>) para que o ε-fecho possa ser adicionado sem alterar o restante do algoritmo.
          </P>

          <H2 id="algoritmos">Algoritmos de simulação</H2>
          <Formula>{`simularAFD(M, w):
  q ← q₀
  para cada símbolo a de w:
    se a ∉ Σ: rejeita
    se δ(q, a) indefinida: rejeita
    q ← δ(q, a)
  aceita se q ∈ F

simularAFND(M, w):
  S ← { q₀ }
  para cada símbolo a de w:
    se a ∉ Σ: rejeita
    S ← ⋃ { δ(q, a) | q ∈ S }
    se S = ∅: rejeita
  aceita se S ∩ F ≠ ∅`}</Formula>
          <P>
            O núcleo executa a computação inteira de uma só vez e produz um <em>trace</em> imutável: uma lista de
            configurações (etapas) contendo o símbolo lido, os estados antes e depois, as transições usadas e os caminhos
            descartados. A interface apenas navega por esse trace — por isso é possível avançar, voltar e reiniciar sem
            recalcular nada, e a animação nunca diverge do algoritmo. A complexidade é <M>O(|w|·|δ|)</M> por simulação.
          </P>

          <H2 id="uso">Como usar</H2>
          <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-fg-muted">
            <li>Crie um autômato em <strong className="text-fg">Novo autômato</strong>, escolhendo AFD ou AFND, ou abra um exemplo.</li>
            <li>Dê um <strong className="text-fg">duplo clique</strong> no canvas para criar estados (o primeiro vira o inicial).</li>
            <li>Adicione símbolos ao alfabeto no painel <strong className="text-fg">Configuração</strong>.</li>
            <li>Arraste a <strong className="text-fg">alça</strong> à direita de um estado até outro (ou até ele mesmo) para criar transições.</li>
            <li>Marque estados finais e o inicial na lista de estados ou selecionando o nó.</li>
            <li>Digite a sentença e use <strong className="text-fg">Executar</strong>, <strong className="text-fg">Próxima etapa</strong> ou a <strong className="text-fg">execução automática</strong>.</li>
          </ol>
          <P>
            Atalhos durante a simulação: <M>→</M> próxima etapa, <M>←</M> etapa anterior, <M>espaço</M> executar/pausar,{' '}
            <M>Home</M> reiniciar. No editor, <M>Delete</M> remove o estado ou a transição selecionada. Os projetos ficam
            salvos automaticamente no armazenamento local do navegador.
          </P>

          <H2 id="json">Formato JSON</H2>
          <Formula>{`{
  "format": "automata-studio",
  "version": 1,
  "name": "AFD — quantidade par de zeros",
  "type": "AFD",
  "states": ["q0", "q1"],
  "alphabet": ["0", "1"],
  "initialState": "q0",
  "finalStates": ["q0"],
  "transitions": [
    { "from": "q0", "symbol": "0", "to": "q1" },
    { "from": "q0", "symbol": "1", "to": "q0" },
    { "from": "q1", "symbol": "0", "to": "q0" },
    { "from": "q1", "symbol": "1", "to": "q1" }
  ],
  "layout": { "q0": { "x": 0, "y": 0 }, "q1": { "x": 260, "y": 0 } }
}`}</Formula>
          <P>
            Os campos <M>format</M>, <M>version</M>, <M>name</M>, <M>description</M> e <M>layout</M> são opcionais. As
            transições também podem ser escritas como tabela: <M>{'{ "q0": { "0": "q1", "1": ["q0", "q1"] } }'}</M>.
          </P>

          <H2 id="validacao">Validações</H2>
          <P>Erros impedem a simulação; avisos indicam situações permitidas, mas suspeitas.</P>
          <ul className="mb-3 list-disc space-y-1 pl-5 text-[14px] leading-relaxed text-fg-muted">
            <li><strong className="text-danger">Erros:</strong> Q ou Σ vazios; nomes de estado inválidos ou duplicados; símbolos inválidos ou duplicados; ausência de estado inicial ou inicial inexistente; estados finais inexistentes; transições partindo de/para estados inexistentes; símbolos fora de Σ; transições duplicadas; AFD com mais de um destino para o mesmo par (estado, símbolo).</li>
            <li><strong className="text-warning">Avisos:</strong> F vazio; AFD com função de transição parcial; estados inalcançáveis; estado final repetido.</li>
            <li><strong className="text-fg">Arquivos:</strong> arquivo vazio, JSON malformado, campos obrigatórios ausentes ou com tipos incorretos são rejeitados com a lista de problemas.</li>
            <li><strong className="text-fg">Sentenças:</strong> símbolos fora de Σ são sinalizados antes da execução; a sentença vazia é aceita se, e somente se, q₀ ∈ F.</li>
          </ul>
        </article>
      </div>
    </div>
  );
}
