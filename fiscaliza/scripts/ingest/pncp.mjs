/**
 * Ingestão PNCP (Portal Nacional de Contratações Públicas) — a fonte oficial
 * que, desde a Lei 14.133/2021, TODOS os entes públicos (municípios,
 * estados e União) são obrigados a publicar suas contratações. É por isso
 * a única fonte real que cobre as três esferas com o mesmo formato.
 *
 * Documentação: https://pncp.gov.br/api/consulta/swagger-ui/index.html
 * Endpoint usado: GET /v1/contratacoes/publicacao
 *   (dataInicial, dataFinal, uf, codigoMunicipioIbge, codigoModalidadeContratacao)
 *
 * IMPORTANTE — honestidade sobre confiabilidade: este script não pôde ser
 * testado contra a API real (a sessão que o escreveu está com a rede
 * bloqueada para domínios externos). O formato dos campos foi implementado
 * com base na documentação pública do PNCP, mas com parsing defensivo: se
 * o formato de resposta vier diferente do esperado, o script LOGA o motivo
 * e segue para a próxima entidade em vez de quebrar a ingestão inteira.
 * Guarda também `rawSample` (2 registros crus por consulta) no manifest
 * para facilitar depuração caso algo precise de ajuste.
 *
 * Saída: src/lib/data/real/contracts.json
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchJson, logSection, mapWithConcurrency } from "./lib/http.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "..", "src", "lib", "data", "real");

// Modalidades mais comuns (Lei 14.133/2021, Anexo) — cobre a maior parte do
// volume de contratações sem precisar iterar todos os códigos possíveis.
const MODALITIES = [
  { code: 6, label: "Pregão Eletrônico" },
  { code: 8, label: "Dispensa de Licitação" },
  { code: 9, label: "Inexigibilidade" },
];

const DAYS_BACK = 180;
const PAGE_SIZE_CAP = 1; // páginas por (entidade x modalidade) — controla volume/tempo
// O PNCP tem um limite de requisições bem mais apertado do que parecia à
// primeira vista (muitos 429 num teste real com concurrency=4 e sem
// espaçamento). Concorrência baixa + espaço entre chamadas + mais
// tentativas com backoff é mais lento, mas chega a bem mais entidades.
const CONCURRENCY = 2;
const DELAY_BETWEEN_REQUESTS_MS = 700;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatDateYYYYMMDD(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function dateRange() {
  const to = new Date();
  const from = new Date(to.getTime() - DAYS_BACK * 24 * 3600 * 1000);
  return { dataInicial: formatDateYYYYMMDD(from), dataFinal: formatDateYYYYMMDD(to) };
}

function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== "") return obj[k];
  }
  return null;
}

function normalizeRecord(raw, scope) {
  try {
    const orgao = raw.orgaoEntidade ?? raw.orgao ?? {};
    const unidade = raw.unidadeOrgao ?? {};
    const valor = pick(raw, ["valorTotalEstimado", "valorTotalHomologado", "valorGlobal", "valorTotal"]);
    return {
      pncpId: pick(raw, ["numeroControlePNCP", "numeroControlePncp", "id"]),
      object: pick(raw, ["objetoCompra", "objeto", "descricaoObjeto"]) ?? "(objeto não informado)",
      value: typeof valor === "number" ? valor : Number(valor) || null,
      modality: pick(raw, ["modalidadeNome", "modalidadeId"]),
      publishedAt: pick(raw, ["dataPublicacaoPncp", "dataAberturaProposta", "dataInclusao"]),
      agencyName: pick(orgao, ["razaoSocial", "nome"]) ?? pick(unidade, ["nomeUnidade"]),
      agencyCnpj: pick(orgao, ["cnpj"]),
      municipalityIbge: pick(unidade, ["codigoIbge"]) ?? pick(raw, ["codigoMunicipioIbge"]),
      uf: pick(unidade, ["ufSigla"]) ?? pick(raw, ["uf"]),
      sphere: pick(orgao, ["esferaId", "esfera"]),
      supplierCnpj: pick(raw, ["niFornecedor", "cnpjFornecedor"]),
      supplierName: pick(raw, ["nomeRazaoSocialFornecedor", "razaoSocialFornecedor", "nomeFornecedor"]),
      participants: pick(raw, ["quantidadeParticipantes", "numeroParticipantes"]),
      scope,
    };
  } catch (err) {
    console.warn(`[ingest] falha ao normalizar registro PNCP (${scope}): ${err.message}`);
    return null;
  }
}

async function queryEntity({ uf, codigoMunicipioIbge, scopeLabel }) {
  const { dataInicial, dataFinal } = dateRange();
  const records = [];
  const rawSamples = [];
  const errors = [];

  for (const modality of MODALITIES) {
    for (let pagina = 1; pagina <= PAGE_SIZE_CAP; pagina++) {
      const params = new URLSearchParams({
        dataInicial,
        dataFinal,
        codigoModalidadeContratacao: String(modality.code),
        pagina: String(pagina),
      });
      if (uf) params.set("uf", uf);
      if (codigoMunicipioIbge) params.set("codigoMunicipioIbge", String(codigoMunicipioIbge));

      const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?${params.toString()}`;
      const res = await fetchJson(url, {
        label: `PNCP ${scopeLabel} · ${modality.label} · pág ${pagina}`,
        retries: 4,
        retryDelayMs: 3000,
      });
      await sleep(DELAY_BETWEEN_REQUESTS_MS);

      if (!res.ok) {
        errors.push(`${modality.label}: ${res.error}`);
        continue;
      }

      const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : null;
      if (!list) {
        errors.push(`${modality.label}: formato de resposta inesperado (nem array, nem {data: []})`);
        continue;
      }
      if (rawSamples.length < 2 && list.length > 0) rawSamples.push(list[0]);

      for (const item of list) {
        const normalized = normalizeRecord(item, scopeLabel);
        if (normalized) records.push(normalized);
      }

      // PNCP costuma paginar com tamanho fixo — se veio menos que o
      // esperado, não há próxima página a buscar.
      if (list.length === 0) break;
    }
  }

  return { records, rawSamples, errors };
}

/**
 * @param {{ municipalities: {ibgeId: string, name: string, stateId: string}[], states: {id: string}[] }} targets
 */
export async function ingestPncp(targets) {
  logSection("PNCP — contratações reais (municípios, estados e União)");

  const municipioTargets = targets.municipalities.map((m) => ({
    kind: "municipality",
    id: m.ibgeId,
    label: `${m.name}/${m.stateId}`,
    query: { codigoMunicipioIbge: m.ibgeId, uf: m.stateId, scopeLabel: `município ${m.name}-${m.stateId}` },
  }));
  const stateTargets = targets.states.map((s) => ({
    kind: "state",
    id: s.id,
    label: s.id,
    query: { uf: s.id, scopeLabel: `estado ${s.id}` },
  }));
  const federalTarget = {
    kind: "federal",
    id: "uniao",
    label: "União",
    query: { scopeLabel: "União (federal)" },
  };

  const allTargets = [...municipioTargets, ...stateTargets, federalTarget];
  console.log(`[ingest] consultando PNCP para ${allTargets.length} entidades (${MODALITIES.length} modalidades cada)...`);

  const allRecords = [];
  const sourceErrors = [];
  const rawSamplesByScope = {};

  await mapWithConcurrency(allTargets, CONCURRENCY, async (target) => {
    const { records, rawSamples, errors } = await queryEntity(target.query);
    allRecords.push(...records);
    if (rawSamples.length) rawSamplesByScope[target.label] = rawSamples;
    if (errors.length) sourceErrors.push({ target: target.label, errors });
  });

  console.log(`[ingest] PNCP: ${allRecords.length} registros normalizados de ${allTargets.length} entidades consultadas.`);
  if (sourceErrors.length > 0) {
    console.warn(`[ingest] PNCP teve problemas em ${sourceErrors.length} entidade(s) — ver contracts.json > errors para detalhes.`);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "PNCP — Portal Nacional de Contratações Públicas (API de Consulta)",
    dateRange: dateRange(),
    modalitiesQueried: MODALITIES.map((m) => m.label),
    records: allRecords,
    stats: {
      entitiesQueried: allTargets.length,
      recordsFetched: allRecords.length,
      entitiesWithErrors: sourceErrors.length,
    },
    errors: sourceErrors,
    rawSampleByScope: rawSamplesByScope,
  };
  await writeFile(path.join(OUT_DIR, "contracts.json"), JSON.stringify(payload, null, 2));
  console.log(`[ingest] escrito em src/lib/data/real/contracts.json`);
  return payload;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.error(
    "Rode via `npm run ingest` (usa scripts/ingest/run.mjs), que primeiro busca a geografia no IBGE para saber quais municípios consultar."
  );
  process.exit(1);
}
