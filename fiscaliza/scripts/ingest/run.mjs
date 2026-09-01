/**
 * Orquestrador da ingestão real de dados do Fiscaliza.
 *
 * Uso:
 *   npm run ingest
 *   PORTAL_TRANSPARENCIA_API_KEY=xxxx npm run ingest   (inclui União/federal)
 *   INGEST_LIMIT=10 npm run ingest                      (teste rápido, lote pequeno)
 *   INGEST_LIMIT=800 npm run ingest                     (lote maior, execução mais longa)
 *
 * Roda IBGE (geografia + população de todos os municípios) -> seleciona um LOTE de
 * municípios ainda não consultados pelo PNCP (os maiores por população primeiro —
 * ver selectBatch/pncp-progress.json) -> PNCP (contratos reais nas 3 esferas,
 * preservando o que já foi coletado de lotes anteriores) -> Portal da Transparência
 * (União, se houver chave) -> grava um manifest.json consolidado que o app lê em
 * build/runtime para saber o que é real e o que continua simulado. Rodar
 * `npm run ingest` repetidamente amplia a cobertura até cobrir o Brasil inteiro.
 *
 * PRECISA rodar num ambiente com acesso normal à internet — a sessão do
 * Claude que escreveu isso tem a rede bloqueada para domínios externos e
 * não conseguiu testar as chamadas reais. Rode localmente e, se algo
 * falhar de um jeito inesperado, me manda a saída do terminal.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ingestIbge } from "./ibge.mjs";
import { ingestPncp } from "./pncp.mjs";
import { ingestPortalTransparencia } from "./portalTransparencia.mjs";
import { ingestCnpj } from "./cnpj.mjs";
import { logSection } from "./lib/http.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "..", "src", "lib", "data", "real");
const PROGRESS_FILE = path.join(OUT_DIR, "pncp-progress.json");

// Batch por execução — o Brasil tem ~5.571 municípios e o PNCP não aguenta
// consultar todos numa execução só (ver rate limiting em pncp.mjs). Em vez
// disso, cada execução de `npm run ingest` consome um novo lote de
// municípios ainda não consultados (os maiores primeiro), grava o que
// coletou (preservando o que já tinha vindo de execuções anteriores — ver
// merge em pncp.mjs) e anota o progresso em pncp-progress.json. Rodando
// `npm run ingest` repetidamente, a cobertura cresce até cobrir o Brasil
// inteiro; depois disso, novas execuções voltam a atualizar os municípios
// com dado mais antigo primeiro.
const DEFAULT_BATCH_SIZE = 400;

async function loadProgress() {
  try {
    const raw = await readFile(PROGRESS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function selectBatch(municipalities, progress, batchSize) {
  const withPop = municipalities.filter((m) => m.population != null);
  const unqueried = withPop.filter((m) => !progress[String(m.ibgeId)]);
  const alreadyQueried = withPop.filter((m) => progress[String(m.ibgeId)]);
  // Nunca consultados primeiro, priorizando os maiores por população —
  // depois de cobrir o Brasil inteiro uma vez, passa a atualizar primeiro
  // quem está com dado mais antigo.
  unqueried.sort((a, b) => b.population - a.population);
  alreadyQueried.sort((a, b) => progress[String(a.ibgeId)].localeCompare(progress[String(b.ibgeId)]));
  return [...unqueried, ...alreadyQueried].slice(0, batchSize);
}

async function main() {
  const batchSize = Number(process.env.INGEST_LIMIT) || DEFAULT_BATCH_SIZE;

  const geo = await ingestIbge();

  if (geo.municipalities.length === 0) {
    console.error("[ingest] sem municípios do IBGE — abortando PNCP (não há o que consultar). Verifique sua conexão e rode de novo.");
    return writeManifest({ geo, pncp: null, cnpj: null, federal: null, batchCount: 0, municipiosCoveredTotal: 0, municipiosTotal: 0 });
  }

  const progress = await loadProgress();
  const batch = selectBatch(geo.municipalities, progress, batchSize);
  const alreadyCovered = Object.keys(progress).length;
  console.log(
    `\n[ingest] ${batch.length} município(s) selecionados para esta execução (cobertura acumulada até agora: ${alreadyCovered}/${geo.municipalities.length}).`
  );

  const pncp = await ingestPncp({ municipalities: batch, states: geo.states });

  const now = new Date().toISOString();
  for (const m of batch) progress[String(m.ibgeId)] = now;
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  const coveredAfter = Object.keys(progress).length;
  console.log(`[ingest] cobertura PNCP após esta execução: ${coveredAfter}/${geo.municipalities.length} município(s) já consultados pelo menos uma vez.`);
  const cnpj = await ingestCnpj(pncp);
  const federal = await ingestPortalTransparencia();

  await writeManifest({
    geo,
    pncp,
    cnpj,
    federal,
    batchCount: batch.length,
    municipiosCoveredTotal: coveredAfter,
    municipiosTotal: geo.municipalities.length,
  });

  logSection("Resumo");
  console.log(`IBGE:                 ${geo.municipalities.length} municípios, ${geo.states.length} estados`);
  console.log(`PNCP:                 ${pncp.stats.recordsFetched} registros reais (${pncp.stats.entitiesWithErrors} entidades com erro)`);
  console.log(`BrasilAPI (CNPJ):     ${cnpj.stats.resolved}/${cnpj.stats.requested} empresas enriquecidas com dados da Receita Federal`);
  console.log(`Portal Transparência: ${federal.skipped ? "pulado (" + federal.reason + ")" : federal.contracts.length + " contratos federais"}`);
  console.log(`\nPronto. Rode "npm run dev" e confira /fontes para ver o status de cada fonte.`);
}

async function writeManifest({ geo, pncp, cnpj, federal, batchCount, municipiosCoveredTotal, municipiosTotal }) {
  await mkdir(OUT_DIR, { recursive: true });
  const manifest = {
    generatedAt: new Date().toISOString(),
    ibge: geo
      ? { ok: geo.municipalities.length > 0, statesFetched: geo.states.length, municipalitiesFetched: geo.municipalities.length, errors: geo.errors }
      : { ok: false },
    pncp: pncp
      ? { ok: pncp.stats.recordsFetched > 0, recordsFetched: pncp.stats.recordsFetched, entitiesQueried: pncp.stats.entitiesQueried, entitiesWithErrors: pncp.stats.entitiesWithErrors }
      : { ok: false, skipped: true },
    cnpj: cnpj
      ? { ok: cnpj.stats.resolved > 0, requested: cnpj.stats.requested, resolved: cnpj.stats.resolved }
      : { ok: false, skipped: true },
    portalTransparencia: federal
      ? federal.skipped
        ? { ok: false, skipped: true, reason: federal.reason }
        : { ok: federal.contracts.length > 0, contractsFetched: federal.contracts.length }
      : { ok: false, skipped: true },
    // Batch desta execução + cobertura acumulada de todas as execuções de
    // `npm run ingest` já rodadas (ver pncp-progress.json) — usado em
    // /fontes para mostrar quanto do Brasil já foi consultado pelo menos
    // uma vez, não só o que essa execução específica trouxe.
    municipiosBatchCount: batchCount,
    municipiosCoveredTotal,
    municipiosTotal,
  };
  await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`[ingest] manifest escrito em src/lib/data/real/manifest.json`);
}

main().catch((err) => {
  console.error("[ingest] falha não tratada:", err);
  process.exit(1);
});
