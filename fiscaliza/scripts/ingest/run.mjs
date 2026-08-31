/**
 * Orquestrador da ingestão real de dados do Fiscaliza.
 *
 * Uso:
 *   npm run ingest
 *   PORTAL_TRANSPARENCIA_API_KEY=xxxx npm run ingest   (inclui União/federal)
 *   INGEST_LIMIT=10 npm run ingest                      (teste rápido, poucos municípios)
 *
 * Roda IBGE (geografia + população) -> seleciona os "principais" municípios
 * (capitais + maiores por população) -> PNCP (contratos reais nas 3
 * esferas) -> Portal da Transparência (União, se houver chave) -> grava um
 * manifest.json consolidado que o app lê em build/runtime para saber o que
 * é real e o que continua simulado.
 *
 * PRECISA rodar num ambiente com acesso normal à internet — a sessão do
 * Claude que escreveu isso tem a rede bloqueada para domínios externos e
 * não conseguiu testar as chamadas reais. Rode localmente e, se algo
 * falhar de um jeito inesperado, me manda a saída do terminal.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ingestIbge } from "./ibge.mjs";
import { ingestPncp } from "./pncp.mjs";
import { ingestPortalTransparencia } from "./portalTransparencia.mjs";
import { ingestCnpj } from "./cnpj.mjs";
import { logSection } from "./lib/http.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "..", "src", "lib", "data", "real");

const DEFAULT_LIMIT = 60;

function pickPrincipais(municipalities, limit) {
  const withPop = municipalities.filter((m) => m.population != null);
  const sorted = [...withPop].sort((a, b) => b.population - a.population);
  return sorted.slice(0, limit);
}

async function main() {
  const limit = Number(process.env.INGEST_LIMIT) || DEFAULT_LIMIT;

  const geo = await ingestIbge();

  if (geo.municipalities.length === 0) {
    console.error("[ingest] sem municípios do IBGE — abortando PNCP (não há o que consultar). Verifique sua conexão e rode de novo.");
    return writeManifest({ geo, pncp: null, federal: null, principaisCount: 0 });
  }

  const principais = pickPrincipais(geo.municipalities, limit);
  console.log(`\n[ingest] ${principais.length} município(s) selecionados para consulta detalhada de contratos (maiores por população).`);

  const pncp = await ingestPncp({ municipalities: principais, states: geo.states });
  const cnpj = await ingestCnpj(pncp);
  const federal = await ingestPortalTransparencia();

  await writeManifest({ geo, pncp, cnpj, federal, principaisCount: principais.length });

  logSection("Resumo");
  console.log(`IBGE:                 ${geo.municipalities.length} municípios, ${geo.states.length} estados`);
  console.log(`PNCP:                 ${pncp.stats.recordsFetched} registros reais (${pncp.stats.entitiesWithErrors} entidades com erro)`);
  console.log(`BrasilAPI (CNPJ):     ${cnpj.stats.resolved}/${cnpj.stats.requested} empresas enriquecidas com dados da Receita Federal`);
  console.log(`Portal Transparência: ${federal.skipped ? "pulado (" + federal.reason + ")" : federal.contracts.length + " contratos federais"}`);
  console.log(`\nPronto. Rode "npm run dev" e confira /fontes para ver o status de cada fonte.`);
}

async function writeManifest({ geo, pncp, cnpj, federal, principaisCount }) {
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
    principaisMunicipiosCount: principaisCount,
  };
  await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`[ingest] manifest escrito em src/lib/data/real/manifest.json`);
}

main().catch((err) => {
  console.error("[ingest] falha não tratada:", err);
  process.exit(1);
});
