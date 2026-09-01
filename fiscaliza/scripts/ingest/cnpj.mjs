/**
 * Enriquecimento de empresas via BrasilAPI (espelha dados públicos da
 * Receita Federal — CNPJ, razão social, data de abertura, situação
 * cadastral, CNAE e quadro de sócios). Gratuita, sem chave.
 *
 * Por quê: o PNCP só informa o CNPJ e o nome do fornecedor tal como
 * digitado no processo de contratação — não é raro vir abreviado ou até
 * divergente do nome empresarial oficial, e não traz data de abertura nem
 * sócios. Isso é o que a Receita Federal (via BrasilAPI) resolve, e é a
 * fonte que corrige o problema de "empresa com contrato anterior à
 * própria abertura": aqui a data de abertura passa a ser a real.
 *
 * Documentação: https://brasilapi.com.br/docs#tag/CNPJ
 * Endpoint: GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}
 *
 * IMPORTANTE: o endpoint de CNPJ da BrasilAPI espelha o serviço (rate
 * limitado) da Receita Federal — por isso as chamadas aqui são
 * sequenciais e espaçadas, e o total de empresas enriquecidas por
 * execução é limitado (CNPJ_ENRICH_LIMIT, padrão 30) para não travar o
 * `npm run ingest` por dezenas de minutos.
 *
 * Saída: src/lib/data/real/companies.json
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchJson, logSection } from "./lib/http.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "..", "src", "lib", "data", "real");

const DEFAULT_LIMIT = 30;
const DELAY_BETWEEN_CALLS_MS = 1500;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function onlyDigits(s) {
  return (s ?? "").replace(/\D/g, "");
}

/**
 * @param {{ records: any[] }} contractsPayload — o conteúdo já lido de contracts.json
 */
export async function ingestCnpj(contractsPayload) {
  logSection("BrasilAPI — enriquecimento de empresas (Receita Federal)");

  const limit = Number(process.env.CNPJ_ENRICH_LIMIT) || DEFAULT_LIMIT;

  const valueByCnpj = new Map();
  const nameByCnpj = new Map();
  for (const r of contractsPayload.records ?? []) {
    if (!r.scope?.startsWith("município")) continue;
    const digits = onlyDigits(r.supplierCnpj);
    if (!digits) continue;
    valueByCnpj.set(digits, (valueByCnpj.get(digits) ?? 0) + (r.value ?? 0));
    if (!nameByCnpj.has(digits)) nameByCnpj.set(digits, r.supplierName);
  }

  const targets = Array.from(valueByCnpj.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([cnpj]) => cnpj);

  if (targets.length === 0) {
    console.warn("[ingest] nenhum CNPJ de fornecedor encontrado em contracts.json — rode pncp.mjs primeiro. Pulando.");
    const payload = { generatedAt: new Date().toISOString(), source: null, byCnpj: {}, stats: { requested: 0, resolved: 0 }, errors: [] };
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(path.join(OUT_DIR, "companies.json"), JSON.stringify(payload, null, 2));
    return payload;
  }

  console.log(
    `[ingest] consultando ${targets.length} CNPJ(s) na BrasilAPI (prioridade: maior valor total contratado). Isso é sequencial e pode levar alguns minutos.`
  );

  const byCnpj = {};
  const errors = [];
  for (let i = 0; i < targets.length; i++) {
    const cnpj = targets[i];
    const res = await fetchJson(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      label: `BrasilAPI CNPJ ${cnpj} (${i + 1}/${targets.length})`,
      retries: 2,
      retryDelayMs: 3000,
    });
    if (!res.ok) {
      errors.push({ cnpj, error: res.error, pncpName: nameByCnpj.get(cnpj) });
    } else {
      const d = res.data;
      byCnpj[cnpj] = {
        razaoSocial: d.razao_social ?? d.nome ?? null,
        nomeFantasia: d.nome_fantasia ?? null,
        dataInicioAtividade: d.data_inicio_atividade ?? null,
        situacaoCadastral: d.descricao_situacao_cadastral ?? null,
        cnaeDescricao: d.cnae_fiscal_descricao ?? null,
        municipio: d.municipio ?? null,
        uf: d.uf ?? null,
        socios: Array.isArray(d.qsa)
          ? d.qsa.map((s) => ({ nome: s.nome_socio ?? null, qualificacao: s.qualificacao_socio ?? null }))
          : [],
      };
    }
    if (i < targets.length - 1) await sleep(DELAY_BETWEEN_CALLS_MS);
  }

  const resolved = Object.keys(byCnpj).length;
  console.log(`[ingest] BrasilAPI: ${resolved}/${targets.length} CNPJ(s) enriquecidos com dados reais da Receita Federal.`);
  if (errors.length > 0) {
    console.warn(`[ingest] ${errors.length} CNPJ(s) não puderam ser consultados (rate limit ou CNPJ inválido) — mantidos com os dados do PNCP.`);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "BrasilAPI — espelho da Receita Federal (CNPJ)",
    byCnpj,
    stats: { requested: targets.length, resolved },
    errors,
  };
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "companies.json"), JSON.stringify(payload, null, 2));
  console.log(`[ingest] escrito em src/lib/data/real/companies.json`);
  return payload;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const contractsPath = path.join(OUT_DIR, "contracts.json");
  const contractsPayload = JSON.parse(await readFile(contractsPath, "utf-8"));
  ingestCnpj(contractsPayload).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
