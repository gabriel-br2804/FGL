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
// Quantos contratos (maior valor primeiro) recebem uma segunda chamada
// para buscar o fornecedor real — cada um custa mais uma requisição ao
// PNCP, que já está perto do limite de taxa.
const SUPPLIER_LOOKUP_LIMIT = 40;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildPayload({ allTargets, allRecords, sourceErrors, rawSamplesByScope, supplierLookupTargets, resultadosErrors, resultadosRawSamples }) {
  return {
    generatedAt: new Date().toISOString(),
    source: "PNCP — Portal Nacional de Contratações Públicas (API de Consulta)",
    dateRange: dateRange(),
    modalitiesQueried: MODALITIES.map((m) => m.label),
    records: allRecords,
    stats: {
      entitiesQueried: allTargets.length,
      recordsFetched: allRecords.length,
      entitiesWithErrors: sourceErrors.length,
      supplierLookupsAttempted: supplierLookupTargets.length,
      supplierLookupsResolved: supplierLookupTargets.filter((r) => r.supplierCnpj).length,
    },
    errors: sourceErrors,
    resultadosErrors,
    rawSampleByScope: rawSamplesByScope,
    resultadosRawSample: resultadosRawSamples,
  };
}

async function writePayload(payload) {
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "contracts.json"), JSON.stringify(payload, null, 2));
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
    // Confirmado com uma resposta real do PNCP: `contratacoes/publicacao` é
    // o AVISO da contratação, não o contrato assinado — no pregão
    // eletrônico o fornecedor ainda não é conhecido nesse estágio (não há
    // nenhum campo de fornecedor no payload). valorTotalHomologado (quando
    // presente) já reflete o valor apurado/definido, mais próximo do real
    // do que a mera estimativa — por isso vem primeiro na prioridade.
    const valor = pick(raw, ["valorTotalHomologado", "valorTotalEstimado", "valorGlobal", "valorTotal"]);
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
      // Identificadores da compra na PNCP — necessários para buscar o
      // fornecedor/resultado num segundo passo (ver fetchSupplierForRecord).
      anoCompra: pick(raw, ["anoCompra"]),
      sequencialCompra: pick(raw, ["sequencialCompra"]),
      scope,
    };
  } catch (err) {
    console.warn(`[ingest] falha ao normalizar registro PNCP (${scope}): ${err.message}`);
    return null;
  }
}

/**
 * `contratacoes/publicacao` não traz o fornecedor quando a contratação
 * ainda depende de disputa (pregão). O fornecedor/vencedor de cada item
 * fica em `/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/resultados` — este
 * segundo passo busca isso para os registros de município mais relevantes
 * (maior valor), já que consultar todos multiplicaria as chamadas ao PNCP
 * (que já está no limite de requisições).
 */
async function fetchSupplierForRecord(record) {
  if (!record.agencyCnpj || !record.anoCompra || !record.sequencialCompra) return null;
  const url = `https://pncp.gov.br/api/consulta/v1/orgaos/${record.agencyCnpj}/compras/${record.anoCompra}/${record.sequencialCompra}/resultados`;
  const res = await fetchJson(url, { label: `PNCP resultados ${record.pncpId}`, retries: 2, retryDelayMs: 2000, timeoutMs: 25_000 });
  await sleep(DELAY_BETWEEN_REQUESTS_MS);
  if (!res.ok) return { error: res.error };

  const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : null;
  const first = list?.[0];
  if (!first) return { rawSample: res.data };

  const fornecedor = first.fornecedor ?? first.niFornecedor ? first : first.resultado ?? first;
  return {
    supplierCnpj: pick(fornecedor, ["niFornecedor", "cnpjFornecedor", "ni"]),
    supplierName: pick(fornecedor, ["nomeRazaoSocialFornecedor", "razaoSocialFornecedor", "nomeFornecedor", "nome"]),
    rawSample: first,
  };
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
        // Menos tentativas: numa entidade persistentemente lenta/instável,
        // 4 retries x 35s de timeout podia significar minutos só numa
        // chamada. Falhar mais rápido e seguir para a próxima entidade vale
        // mais que insistir — o erro fica registrado em errors[] de qualquer
        // forma.
        retries: 2,
        retryDelayMs: 2500,
        // Municípios muito grandes (ex.: São Paulo, Rio de Janeiro) têm
        // volume alto o bastante para o PNCP demorar mais que os 20s
        // padrão para responder — confirmado numa execução real.
        timeoutMs: 30_000,
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

  // Segundo passo: busca o fornecedor real dos contratos de município mais
  // relevantes (maior valor) — é o que faltava para o enriquecimento via
  // BrasilAPI ter algo para consultar.
  const supplierLookupTargets = allRecords
    .filter((r) => r.scope.startsWith("município") && r.value && !r.supplierCnpj)
    .sort((a, b) => b.value - a.value)
    .slice(0, SUPPLIER_LOOKUP_LIMIT);

  // Checkpoint: grava o que já foi coletado ANTES de começar a fase de
  // busca de fornecedor (mais lenta e menos testada contra a API real). Se
  // o processo for interrompido dali pra frente, o progresso do passo
  // principal não se perde — só falta o enriquecimento de fornecedor, que
  // fica pra próxima execução.
  await writePayload(
    buildPayload({
      allTargets,
      allRecords,
      sourceErrors,
      rawSamplesByScope,
      supplierLookupTargets,
      resultadosErrors: [],
      resultadosRawSamples: [],
    })
  );
  console.log(`[ingest] checkpoint gravado em src/lib/data/real/contracts.json (antes da busca de fornecedor).`);

  const resultadosRawSamples = [];
  const resultadosErrors = [];
  if (supplierLookupTargets.length > 0) {
    console.log(`[ingest] buscando fornecedor real de ${supplierLookupTargets.length} contrato(s) de município (maior valor primeiro)...`);
    let resolved = 0;
    let processed = 0;
    for (const record of supplierLookupTargets) {
      const result = await fetchSupplierForRecord(record);
      processed++;
      if (result) {
        if (result.error) {
          resultadosErrors.push({ pncpId: record.pncpId, error: result.error });
        } else {
          if (result.supplierCnpj) {
            record.supplierCnpj = result.supplierCnpj;
            record.supplierName = result.supplierName;
            resolved++;
          }
          if (resultadosRawSamples.length < 2 && result.rawSample) resultadosRawSamples.push(result.rawSample);
        }
      }
      // Checkpoint intermediário a cada 10 itens: essa fase é a menos
      // testada contra a API real e a mais lenta (uma chamada por
      // registro) — interromper no meio não deve perder o que já foi
      // resolvido até aqui.
      if (processed % 10 === 0) {
        await writePayload(
          buildPayload({ allTargets, allRecords, sourceErrors, rawSamplesByScope, supplierLookupTargets, resultadosErrors, resultadosRawSamples })
        );
      }
    }
    console.log(`[ingest] fornecedor real encontrado em ${resolved}/${supplierLookupTargets.length} contrato(s) consultados.`);
  }

  const payload = buildPayload({ allTargets, allRecords, sourceErrors, rawSamplesByScope, supplierLookupTargets, resultadosErrors, resultadosRawSamples });
  await writePayload(payload);
  console.log(`[ingest] escrito em src/lib/data/real/contracts.json`);
  return payload;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.error(
    "Rode via `npm run ingest` (usa scripts/ingest/run.mjs), que primeiro busca a geografia no IBGE para saber quais municípios consultar."
  );
  process.exit(1);
}
