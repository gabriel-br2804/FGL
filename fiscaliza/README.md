# Fiscaliza

**Seu dinheiro. Nossa lupa.**

Plataforma brasileira de inteligência sobre gastos públicos. O Fiscaliza cruza dados
públicos de transparência governamental para mostrar onde o dinheiro é gasto, quais
padrões merecem atenção e onde existem sinais fora do comum — sempre com linguagem
juridicamente responsável, sem acusar pessoas ou empresas de corrupção.

> Os indicadores apresentados pelo Fiscaliza são análises automatizadas baseadas em
> dados públicos e não constituem acusação, prova de irregularidade ou conclusão sobre
> responsabilidade civil ou criminal. Situações classificadas como pontos de atenção
> devem ser verificadas nas fontes oficiais e, quando necessário, pelas autoridades
> competentes.

## Status deste repositório: MVP

Esta é a primeira versão funcional da plataforma. Todos os dados de municípios,
empresas, contratos, licitações e obras exibidos hoje são **simulados** (gerados de
forma determinística, ver `src/lib/data/generate.ts`) para demonstrar a experiência
completa do produto enquanto os conectores de dados reais (Portal da Transparência,
Compras.gov.br, TCEs, portais estaduais/municipais) são integrados em produção. Nenhum
nome de empresa ou pessoa exibido é real. Veja `/fontes` no app para o detalhamento.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts
- **Dados (MVP):** camada de dados em memória, gerada de forma determinística
  (`src/lib/data`), servida por trás da mesma interface (`src/lib/types.ts`) que o
  schema de produção (`prisma/schema.prisma`, PostgreSQL) modela — trocar a fixture
  pelo banco real é uma troca de repositório, não de telas.
- **Motor de análise:** `src/lib/engine` — estatística, detecção de outliers,
  concentração de fornecedores, crescimento anormal e cálculo do Fiscaliza Score,
  com separação explícita entre **dado**, **análise** e **interpretação**.
- **Conectores:** `src/lib/connectors` — um módulo por fonte de dados
  (`FederalTransparencyConnector`, `ComprasGovConnector`, `TCEConnector`,
  `StateConnector`, `MunicipalConnector`), todos com a mesma interface
  `DataConnector`, hoje retornando fixtures simuladas com notas de onde a API real
  deve ser plugada.
- **Fiscaliza IA:** `src/lib/ia/answer.ts` — interpreta a pergunta (identifica
  município, categoria, ano e intenção), consulta a camada de dados real e monta a
  resposta a partir de números reais da base, sempre citando fontes. Pronta para
  evoluir a etapa de interpretação de linguagem natural para um LLM, mantendo a regra
  de que o LLM nunca gera números — apenas traduz texto em consulta estruturada.

## Rodando localmente

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # build de produção
npm run typecheck # checagem de tipos
```

## Estrutura

```
src/
  app/                 rotas (App Router): home, dashboard, mapa, municípios,
                        empresas, contratos, obras, IA, alertas, metodologia,
                        fontes, sobre, como-funciona, dados, busca, api/*
  components/          UI compartilhada (cards, tabelas, gráficos, timeline,
                        grafo de relações, mapa em grade do Brasil, chat da IA)
  lib/
    types.ts           modelo de domínio (entidades e enums)
    data/               geração determinística dos dados simulados + API de leitura
    engine/             Fiscaliza Intelligence Engine (score, sinais de risco, formatação)
    connectors/          um conector por fonte oficial de dados
    ia/                  camada de resposta em linguagem natural da Fiscaliza IA
prisma/schema.prisma    modelo de dados de produção (PostgreSQL) — não conectado no MVP
```

## Roadmap além do MVP

- Conectar os conectores às APIs reais (Portal da Transparência, Compras.gov.br/PNCP,
  TCEs, demais portais estaduais e municipais), com ingestão via filas/workers.
- Persistência em PostgreSQL (schema já modelado em `prisma/schema.prisma`) e cache em
  Redis.
- Autenticação e alertas assíncronos de verdade (hoje "Monitorar" grava só no
  `localStorage` do navegador).
- Fiscaliza IA usando um LLM para a etapa de interpretação da pergunta, mantendo a
  resposta final sempre derivada de consultas estruturadas à base real.
- API pública de dados tratados (ver `/dados`).
