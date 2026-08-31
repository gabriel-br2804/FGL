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

## Status deste repositório: MVP com dados reais opcionais

A base do app é gerada de forma determinística e simulada (`src/lib/data/generate.ts`),
para que a experiência completa funcione sem depender de nenhuma fonte externa. Por
cima disso, há um pipeline real (`npm run ingest` — ver seção abaixo) que busca
municípios, população, contratos e licitações reais no **IBGE** e no **PNCP** e os
mescla na base: onde a coleta funciona, o dado real substitui o simulado e cada
página mostra um selo "Dado real" ou "Dado simulado" deixando isso explícito. Veja
`/fontes` no app para o status atual da ingestão nesta instância.

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

## Trazendo dados reais (`npm run ingest`)

```bash
npm run ingest                                    # IBGE + PNCP (municípios, estados, União)
PORTAL_TRANSPARENCIA_API_KEY=xxxx npm run ingest  # inclui União com mais detalhe
INGEST_LIMIT=10 npm run ingest                    # teste rápido, poucos municípios
```

O script roda em três passos (`scripts/ingest/`):

1. **IBGE** (`ibge.mjs`) — geografia e população reais via API de Localidades/Agregados.
   Sem chave, alta confiança de que funciona de primeira.
2. **PNCP** (`pncp.mjs`) — contratos e licitações reais de municípios, estados e União,
   via API de Consulta do Portal Nacional de Contratações Públicas (a fonte que, desde
   a Lei 14.133/2021, todo ente público é obrigado a publicar). Sem chave. Implementado
   com parsing defensivo — se o formato de algum endpoint mudar, o script loga o erro e
   segue para a próxima entidade em vez de quebrar a ingestão inteira.
3. **Portal da Transparência** (`portalTransparencia.mjs`) — contratos federais com mais
   detalhe. Precisa de uma chave gratuita pessoal, obtida em
   https://api.portaldatransparencia.gov.br/swagger-ui/index.html. Sem a chave, esse
   passo é pulado e a União continua representada pelo que o PNCP trouxer.

O resultado é gravado em `src/lib/data/real/*.json` (sempre existem no repo, vazios por
padrão) e `src/lib/data/generate.ts` mescla automaticamente o que encontrar por cima da
base simulada na próxima vez que o app rodar/buildar — não precisa reiniciar nada além
disso. Depois de rodar, `git status` mostra os arquivos atualizados; faça commit deles
para que o build de produção (Vercel etc.) já suba com os dados reais coletados,
já que esses ambientes normalmente não têm por que rodar o ingest sozinhos.

> A sessão do Claude que escreveu este pipeline tem a rede bloqueada para domínios
> externos (só alcança npm, GitHub e a API da Anthropic) e não conseguiu testar as
> chamadas reais ao IBGE/PNCP. O código foi validado localmente com fixtures que
> simulam o formato de resposta dessas APIs — rode `npm run ingest` de verdade e, se
> algo vier diferente do esperado, cole a saída do terminal para ajuste.

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
    data/               geração determinística dos dados simulados + merge com dados
                        reais (data/real/*.json) + API de leitura (data/index.ts)
    engine/             Fiscaliza Intelligence Engine (score, sinais de risco, formatação)
    connectors/          um conector por fonte oficial de dados
    ia/                  camada de resposta em linguagem natural da Fiscaliza IA
scripts/ingest/         pipeline real (IBGE, PNCP, Portal da Transparência) — `npm run ingest`
prisma/schema.prisma    modelo de dados de produção (PostgreSQL) — não conectado no MVP
```

## Roadmap além do MVP

- Ampliar a cobertura do PNCP para além dos maiores municípios por população (hoje um
  recorte de ~60 + todos os 27 estados + uma amostra federal).
- Buscar aditivos e histórico de pagamentos reais por contrato (endpoint de
  atualizações do PNCP), hoje só o valor e o objeto na publicação inicial.
- Quadro societário real de empresas (Receita Federal/CNPJ) e cadastros de sanções
  (CEIS, CNEP, CEPIM), TCEs das demais UFs.
- Persistência em PostgreSQL (schema já modelado em `prisma/schema.prisma`) e cache em
  Redis, com o ingest rodando como job agendado em vez de script manual.
- Autenticação e alertas assíncronos de verdade (hoje "Monitorar" grava só no
  `localStorage` do navegador).
- Fiscaliza IA usando um LLM para a etapa de interpretação da pergunta, mantendo a
  resposta final sempre derivada de consultas estruturadas à base real.
- API pública de dados tratados (ver `/dados`).
