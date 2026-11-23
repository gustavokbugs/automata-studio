# Automata Studio

Simulador interativo de **Autômatos Finitos Determinísticos (AFD)** e **Não Determinísticos (AFND)**, desenvolvido para a disciplina de Computabilidade (Opção A da proposta de trabalho).

O programa lê a especificação formal de um autômato, M = (Q, Σ, δ, q₀, F), a partir de um **arquivo JSON** ou da **interface gráfica**, processa uma sentença **etapa por etapa** e informa se ela foi **aceita** ou **rejeitada**, mostrando o caminho percorrido pelos estados.

---

## 1. Como executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) **20.19 ou superior** (testado com a versão 22)
- npm (já vem com o Node.js)

### Instalação

```bash
git clone https://github.com/gustavokbugs/automata-studio.git
cd automata-studio
npm install
```

### Interface gráfica (navegador)

```bash
npm run dev
```

Abra o endereço exibido no terminal (normalmente `http://localhost:5173`). Para usar:

1. Clique em **Novo autômato** e escolha AFD ou AFND, ou abra um dos **Exemplos**.
2. Dê um **duplo clique** no canvas para criar estados (o primeiro vira o estado inicial).
3. Adicione símbolos ao alfabeto no painel **Configuração**.
4. Arraste a **alça** à direita de um estado até outro (ou até ele mesmo) para criar transições.
5. Marque os estados finais na lista de estados.
6. Digite a sentença e use **Executar**, **Próxima etapa** (→) ou **Executar automaticamente** (espaço).

Também é possível **importar** e **exportar** a especificação em JSON pelos botões da barra lateral e do cabeçalho. Os projetos ficam salvos no armazenamento local do navegador.

### Linha de comando (CLI)

Lê um arquivo JSON e mostra a execução passo a passo no terminal:

```bash
npm run cli -- <arquivo.json> [sentença ...]

# exemplos
npm run cli -- examples/afd-par-de-zeros.json 1001 0
npm run cli -- examples/afnd-contem-01.json 1101 110
npm run cli -- examples/afd-par-de-zeros.json ""      # sentença vazia (ε)
```

### Outros comandos

| Comando             | O que faz                                          |
| ------------------- | -------------------------------------------------- |
| `npm test`          | Executa todos os testes automatizados              |
| `npm run coverage`  | Executa os testes e gera o relatório de cobertura  |
| `npm run build`     | Verifica os tipos e gera a versão de produção      |
| `npm run preview`   | Serve a versão de produção gerada pelo `build`     |

---

## 2. Formato do arquivo de entrada (JSON)

```json
{
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
  ]
}
```

| Campo          | Obrigatório | Descrição                                              |
| -------------- | ----------- | ------------------------------------------------------ |
| `type`         | sim         | `"AFD"` ou `"AFND"`                                    |
| `states`       | sim         | Q — lista de nomes de estados                          |
| `alphabet`     | sim         | Σ — lista de símbolos de **um caractere** cada         |
| `initialState` | sim         | q₀ — nome do estado inicial                            |
| `finalStates`  | sim         | F — lista de estados finais                            |
| `transitions`  | sim         | δ — lista de `{ from, symbol, to }`                    |
| `name`, `description`, `layout` | não | Metadados e posições dos estados no editor |

No AFND, o mesmo par (estado, símbolo) pode aparecer com vários destinos. As transições também podem ser escritas como tabela: `{ "q0": { "0": ["q0", "q1"], "1": "q0" } }`.

---

## 3. Estrutura de arquivos

```
automata-studio/
├── examples/                    Especificações JSON prontas
│   ├── afd-par-de-zeros.json        AFD: quantidade par de zeros
│   ├── afd-termina-em-01.json       AFD: palavras terminadas em 01
│   ├── afnd-contem-01.json          AFND: palavras que contêm 01
│   ├── afnd-penultimo-1.json        AFND: penúltimo símbolo é 1
│   └── invalidos/                   Arquivos com erros, para demonstrar a robustez
├── scripts/
│   └── cli.ts                   Interface de linha de comando
├── src/
│   ├── core/                    NÚCLEO — TypeScript puro, sem React
│   │   ├── automata/
│   │   │   ├── types.ts             Tipos da quíntupla M = (Q, Σ, δ, q₀, F)
│   │   │   ├── afd.ts               Algoritmo de simulação do AFD
│   │   │   ├── afnd.ts              Algoritmo de simulação do AFND (conjuntos de estados)
│   │   │   ├── validation.ts        Validação da especificação e das sentenças
│   │   │   ├── serialization.ts     Leitura e escrita de JSON
│   │   │   ├── operations.ts        Operações de edição (renomear, remover…)
│   │   │   ├── layout.ts            Posicionamento automático dos estados
│   │   │   └── notation.ts          Notação: ε, ∅, {q0, q1}
│   │   └── simulation/
│   │       ├── types.ts             Tipos das etapas da execução
│   │       ├── simulator.ts         Valida e escolhe AFD ou AFND
│   │       └── execution.ts         Navegação entre etapas e visão da fita
│   ├── components/              Interface (React)
│   │   ├── editor/                  Grafo (React Flow) e painel de propriedades
│   │   ├── simulation/              Fita, controles, etapas e resultado
│   │   ├── automata/                Especificação formal, validação, lista de projetos
│   │   ├── layout/                  Barra lateral e cabeçalho
│   │   └── ui/                      Componentes básicos (botões, diálogos…)
│   ├── data/examples/           Carrega os exemplos da pasta examples/
│   ├── hooks/                   Hooks React (projeto ativo, reprodução, ações)
│   ├── stores/                  Estado global (Zustand) com persistência local
│   ├── pages/                   Editor, Exemplos, Documentação, Tela inicial
│   └── utils/                   Utilitários (arquivos, ids, classes CSS)
└── *.test.ts                    Testes ao lado do código que testam
```

**Decisão principal de arquitetura:** os algoritmos ficam em `src/core/` e não dependem da interface. A simulação calcula todas as etapas de uma vez e devolve uma lista imutável (o *trace*); a interface e o CLI apenas exibem essa lista. Por isso a CLI e a interface gráfica usam exatamente o mesmo código, e avançar ou voltar etapas nunca diverge do algoritmo.

---

## 4. Exemplos de testes bem-sucedidos

### 4.1 Execução da suíte automatizada

```
$ npm test

 ✓ src/core/automata/afd.test.ts            (21 tests)
 ✓ src/core/automata/afnd.test.ts           (27 tests)
 ✓ src/core/automata/validation.test.ts     (24 tests)
 ✓ src/core/automata/serialization.test.ts  (14 tests)
 ✓ src/core/automata/operations.test.ts     (20 tests)
 ✓ src/core/simulation/simulator.test.ts    ( 9 tests)
 ✓ src/data/examples/examples.test.ts       (18 tests)
 ✓ src/stores/stores.test.ts                ( 9 tests)
 ✓ src/components/editor/flowElements.test.ts ( 7 tests)
 ✓ src/components/editor/geometry.test.ts   ( 3 tests)

 Test Files  10 passed (10)
      Tests  152 passed (152)
```

Cobertura do núcleo (`src/core`): cerca de **98% das linhas**. Os testes verificam, entre outros pontos:

- AFD aceitando e rejeitando sentenças, sentença vazia e símbolos fora do alfabeto;
- AFND com vários estados ativos, aceitando quando **ao menos um** caminho termina em estado final e rejeitando quando nenhum termina;
- todas as regras de validação e a leitura de arquivos JSON válidos e inválidos;
- **cada exemplo comparado com a definição da linguagem em todas as 2.047 sentenças binárias de até 10 símbolos**.

### 4.2 AFD — quantidade par de zeros (aceita e rejeita)

```
$ npm run cli -- examples/afd-par-de-zeros.json 1001 0

Sentença: 1001
  início    ▸1001     Configuração inicial: estado atual q0.
  etapa 1   [1]001    δ(q0, 1) = q0.
  etapa 2   1[0]01    δ(q0, 0) = q1.
  etapa 3   10[0]1    δ(q1, 0) = q0.
  etapa 4   100[1]    δ(q0, 1) = q0 — fim da sentença: q0 ∈ F.
  Caminho: q0 → q0 → q1 → q0 → q0
  ✔ ACEITA — Aceita: a leitura de "1001" termina no estado final q0.
  Símbolos processados: 4/4

Sentença: 0
  início    ▸0        Configuração inicial: estado atual q0.
  etapa 1   [0]       δ(q0, 0) = q1 — fim da sentença: q1 ∉ F.
  Caminho: q0 → q1
  ✘ REJEITADA — Rejeitada: a leitura de "0" termina em q1, que não é final.
  Símbolos processados: 1/1
```

### 4.3 AFND — palavras que contêm 01 (vários estados ativos)

```
$ npm run cli -- examples/afnd-contem-01.json 1101 110

Sentença: 1101
  início    ▸1101     Configuração inicial: estados ativos {q0}.
  etapa 1   [1]101    move({q0}, 1) = {q0}.
  etapa 2   1[1]01    move({q0}, 1) = {q0}.
  etapa 3   11[0]1    move({q0}, 0) = {q0, q1}.
  etapa 4   110[1]    move({q0, q1}, 1) = {q0, q2} — fim da sentença: {q0, q2} ∩ F ≠ ∅.
  ✔ ACEITA — Aceita: ao terminar "1101", os estados ativos {q0, q2} incluem o(s) final(is) {q2}.

Sentença: 110
  ...
  etapa 3   11[0]     move({q0}, 0) = {q0, q1} — fim da sentença: {q0, q1} ∩ F = ∅.
  ✘ REJEITADA — Rejeitada: ao terminar "110", nenhum dos estados ativos {q0, q1} é final.
```

### 4.4 Sentença vazia e símbolo fora do alfabeto

```
$ npm run cli -- examples/afd-par-de-zeros.json "" 102

Sentença: ε
  início    ▸         Sentença vazia (ε): q0 ∈ F.
  ✔ ACEITA — Aceita: a leitura de "ε" termina no estado final q0.

Sentença: 102
  etapa 1   [1]02     δ(q0, 1) = q0.
  etapa 2   1[0]2     δ(q0, 0) = q1.
  etapa 3   10[2]     O símbolo '2' (posição 3) não pertence ao alfabeto Σ.
  ✘ REJEITADA — Rejeitada: '2' não pertence ao alfabeto.
  Símbolos processados: 2/3
```

### 4.5 Tratamento de arquivos inválidos

```
$ npm run cli -- examples/invalidos/especificacao-incompleta.json

Especificação inválida:
  • Campo obrigatório ausente: "alphabet".
  • Campo obrigatório ausente: "finalStates".
  • Campo obrigatório ausente: "initialState".
  • "transitions[0]" está incompleta: "symbol" ausente(s) ou inválido(s).
```

```
$ npm run cli -- examples/invalidos/afd-nao-deterministico.json

  erro  A transição δ(q1, c) → q2 aponta para um estado inexistente ('q2').
  erro  A transição δ(q1, c) → q2 usa o símbolo 'c', que não pertence ao alfabeto Σ.
  erro  AFD com mais de um destino para δ(q0, a): {q0, q1}. ...
  aviso A função de transição é parcial: δ(q0, b), δ(q1, a), δ(q1, b) não estão definidas. ...
```

O arquivo `examples/invalidos/json-malformado.json` é rejeitado com a mensagem `JSON inválido: …`.

---

## 5. Tecnologias

React 19, TypeScript, Vite, Tailwind CSS, React Flow (`@xyflow/react`), Zustand, Lucide e Vitest. Não há backend: tudo roda no navegador. A página **Documentação**, dentro da aplicação, traz a fundamentação teórica (definições formais e algoritmos).
