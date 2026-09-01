/**
 * Ingestão SICONFI (Sistema de Informações Contábeis e Fiscais do Setor
 * Público Brasileiro — Secretaria do Tesouro Nacional) para orçamento e
 * despesa orçamentária REAIS de municípios e estados, substituindo a
 * estimativa por população usada no MVP.
 *
 * Documentação: https://apidatalake.tesouro.gov.br/docs/siconfi/
 * Endpoint usado: GET /api/siconfi/rreo (Relatório Resumido de Execução
 * Orçamentária), Anexo 01 (Balanço Orçamentário) — traz receita e despesa
 * orçamentária REALIZADA no ano.
 *
 * IMPORTANTE — honestidade sobre confiabilidade: diferente do IBGE e do
 * PNCP, esta integração NUNCA foi testada contra a API real (a sessão do
 * Claude que escreveu isso tem a rede bloqueada para domínios externos, e
 * essa foi a única fonte real ainda não validada num round anterior de
 * ajuste). O formato dos parâmetros/campos foi implementado com base na
 * documentação pública e em exemplos conhecidos da API, mas é o
 * componente com MAIOR chance de precisar de ajuste na primeira execução
 * real — se `npm run ingest` mostrar erro ou 0 registros aqui, cole a
 * saída do terminal (e, se possível, o corpo de uma resposta de erro) que
 * o parsing é ajustado a partir disso, como já foi feito com o PNCP.
 *
 * Estratégia: em vez de consultar município por município (~5.571
 * chamadas), a API do RREO permite consultar SEM o filtro `id_ente` e
 * retorna todos os entes que reportaram aquele exercício/período/anexo de
 * uma vez, paginado — isso deveria reduzir a coleta a algumas dezenas de
 * páginas por esfera (municipal/estadual) em vez de milhares de chamadas
 * individuais. Se essa suposição sobre a paginação estiver errada, o
 * script para (não trava) e loga o que recebeu.
 *
 * Saída: src/lib/data/real/siconfi.json
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchJson, logSection } from "./lib/http.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "..", "src", "lib", "data", "real");
const BASE = "https://apidatalake.tesouro.gov.br/api/siconfi";

// 2026 ainda não fechou o exercício contábil (só temos até ~o 4º bimestre
// em setembro) — usa o último ano com o 6º bimestre (ano completo) já
// consolidado por praticamente todos os entes.
const REFERENCE_YEAR = 2025;
const LAST_BIMESTER = 6;
const ANEXO = "RREO-Anexo 01";
const MAX_PAGES_PER_SWEEP = 400; // rede de segurança contra loop infinito se a paginação não terminar como esperado
const DELAY_BETWEEN_REQUESTS_MS = 400;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== "") return obj[k];
  }
  return null;
}

/** A "conta" de cada linha do Anexo 01 é hierárquica e o texto exato pode
 * variar (acentuação, espaçamento) — casa por substring em vez de
 * igualdade exata. */
function matchesConta(conta, needle) {
  if (!conta) return false;
  const norm = (s) =>
    s
      .toString()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  return norm(conta).includes(norm(needle));
}

function extractValor(row) {
  const v = pick(row, ["valor", "saldo", "vl_item", "valorRealizado"]);
  return typeof v === "number" ? v : Number(v) || null;
}

/**
 * Varre todas as páginas do RREO para uma esfera (sem id_ente), agregando
 * por ente as linhas de receita/despesa orçamentária total do anexo 01.
 * @param {"M"|"E"} coEsfera
 */
async function sweepEsfera(coEsfera, label) {
  const byEnte = new Map();
  const rawSamples = [];
  const errors = [];
  let pagina = 1;
  let totalRows = 0;

  while (pagina <= MAX_PAGES_PER_SWEEP) {
    const params = new URLSearchParams({
      an_exercicio: String(REFERENCE_YEAR),
      nr_periodo: String(LAST_BIMESTER),
      co_tipo_demonstrativo: "RREO",
      no_anexo: ANEXO,
      co_esfera: coEsfera,
      pagina: String(pagina),
    });
    const url = `${BASE}/rreo?${params.toString()}`;
    const res = await fetchJson(url, { label: `SICONFI ${label} pág ${pagina}`, retries: 2, retryDelayMs: 2000, timeoutMs: 30_000 });
    await sleep(DELAY_BETWEEN_REQUESTS_MS);

    if (!res.ok) {
      errors.push(`página ${pagina}: ${res.error}`);
      // Erro de parâmetro (400) provavelmente se repete em toda página —
      // não faz sentido continuar tentando as próximas 400 páginas.
      break;
    }

    const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.items) ? res.data.items : null;
    if (!list) {
      errors.push(`página ${pagina}: formato de resposta inesperado (nem array, nem {items: []}) — ${JSON.stringify(res.data).slice(0, 300)}`);
      break;
    }
    if (list.length === 0) break; // fim da paginação

    if (rawSamples.length < 3) rawSamples.push(...list.slice(0, 3 - rawSamples.length));
    totalRows += list.length;

    for (const row of list) {
      const idEnte = pick(row, ["id_ente", "cod_ibge", "codIbge", "id_ente_"]);
      const conta = pick(row, ["conta", "co_conta", "coluna"]);
      const nomeConta = pick(row, ["conta", "rotulo", "nome_conta"]);
      if (!idEnte) continue;

      const key = String(idEnte);
      const entry = byEnte.get(key) ?? { idEnte: key, despesaOrcamentaria: null, receitaOrcamentaria: null };

      if (matchesConta(nomeConta ?? conta, "TOTAL DAS DESPESAS")) {
        const v = extractValor(row);
        if (v != null) entry.despesaOrcamentaria = v;
      } else if (matchesConta(nomeConta ?? conta, "TOTAL DAS RECEITAS")) {
        const v = extractValor(row);
        if (v != null) entry.receitaOrcamentaria = v;
      }
      byEnte.set(key, entry);
    }

    pagina++;
  }

  console.log(`[ingest] SICONFI ${label}: ${totalRows} linha(s) em ${pagina - 1} página(s), ${byEnte.size} ente(s) identificados.`);
  return { byEnte, rawSamples, errors };
}

export async function ingestSiconfi() {
  logSection("SICONFI — orçamento e despesa orçamentária reais (municípios e estados)");

  const [municipios, estados] = await Promise.all([
    sweepEsfera("M", "municípios"),
    sweepEsfera("E", "estados"),
  ]);

  const records = [
    ...Array.from(municipios.byEnte.values()).map((r) => ({ ...r, sphere: "municipio" })),
    ...Array.from(estados.byEnte.values()).map((r) => ({ ...r, sphere: "estado" })),
  ].filter((r) => r.despesaOrcamentaria != null || r.receitaOrcamentaria != null);

  const errors = [...municipios.errors.map((e) => `municípios: ${e}`), ...estados.errors.map((e) => `estados: ${e}`)];
  if (errors.length > 0) {
    console.warn(`[ingest] SICONFI teve ${errors.length} problema(s) — ver siconfi.json > errors.`);
  }
  console.log(`[ingest] SICONFI: ${records.length} ente(s) com orçamento/despesa real identificados (exercício ${REFERENCE_YEAR}).`);

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "SICONFI — Secretaria do Tesouro Nacional (RREO, Anexo 01)",
    referenceYear: REFERENCE_YEAR,
    referenceBimester: LAST_BIMESTER,
    records,
    stats: {
      municipiosEncontrados: municipios.byEnte.size,
      estadosEncontrados: estados.byEnte.size,
    },
    errors,
    rawSample: [...municipios.rawSamples, ...estados.rawSamples],
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "siconfi.json"), JSON.stringify(payload, null, 2));
  console.log(`[ingest] escrito em src/lib/data/real/siconfi.json`);
  return payload;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestSiconfi().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
