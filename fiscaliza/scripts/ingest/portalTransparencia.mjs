/**
 * Ingestão Portal da Transparência (Governo Federal) — cobre a esfera
 * União com mais detalhe do que o PNCP sozinho (despesas, órgãos SIAFI).
 *
 * Requer uma chave de API gratuita, pessoal, obtida em:
 *   https://api.portaldatransparencia.gov.br/swagger-ui/index.html
 *   (botão "Cadastre-se" -> chave enviada por e-mail)
 *
 * Defina a variável de ambiente PORTAL_TRANSPARENCIA_API_KEY antes de
 * rodar `npm run ingest`. Sem a chave, este passo é pulado e a União
 * continua representada apenas pelos dados agregados do PNCP (ver
 * pncp.mjs) — o app deixa isso explícito em /fontes.
 *
 * Documentação: https://api.portaldatransparencia.gov.br/swagger-ui/index.html
 * Saída: src/lib/data/real/federal.json
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchJson, logSection } from "./lib/http.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "..", "src", "lib", "data", "real");
const BASE = "https://api.portaldatransparencia.gov.br/api-de-dados";

// Palavras-chave para localizar dinamicamente alguns ministérios relevantes
// na lista de órgãos SIAFI, em vez de arriscar códigos SIAFI incorretos
// hardcoded.
const AGENCY_KEYWORDS = ["Saúde", "Educação", "Infraestrutura", "Desenvolvimento Social"];

async function apiGet(pathAndQuery, apiKey, label) {
  return fetchJson(`${BASE}${pathAndQuery}`, {
    headers: { "chave-api-dados": apiKey },
    label,
    retries: 1,
  });
}

export async function ingestPortalTransparencia() {
  logSection("Portal da Transparência — União");

  const apiKey = process.env.PORTAL_TRANSPARENCIA_API_KEY;
  if (!apiKey) {
    console.warn(
      "[ingest] PORTAL_TRANSPARENCIA_API_KEY não definida — pulando Portal da Transparência.\n" +
        "  Obtenha uma chave gratuita em https://api.portaldatransparencia.gov.br/swagger-ui/index.html\n" +
        "  e rode de novo com: PORTAL_TRANSPARENCIA_API_KEY=sua-chave npm run ingest"
    );
    const payload = { generatedAt: new Date().toISOString(), skipped: true, reason: "missing_api_key", contracts: [] };
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(path.join(OUT_DIR, "federal.json"), JSON.stringify(payload, null, 2));
    return payload;
  }

  const orgaosRes = await apiGet("/orgaos-siafi?pagina=1", apiKey, "Portal Transparência órgãos SIAFI");
  if (!orgaosRes.ok) {
    console.error(`[ingest] não consegui listar órgãos SIAFI (chave inválida? rate limit?): ${orgaosRes.error}`);
    const payload = { generatedAt: new Date().toISOString(), skipped: true, reason: orgaosRes.error, contracts: [] };
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(path.join(OUT_DIR, "federal.json"), JSON.stringify(payload, null, 2));
    return payload;
  }

  const orgaos = Array.isArray(orgaosRes.data) ? orgaosRes.data : [];
  const matched = AGENCY_KEYWORDS.map((kw) =>
    orgaos.find((o) => (o.descricao ?? o.nome ?? "").toLowerCase().includes(kw.toLowerCase()))
  ).filter(Boolean);

  console.log(`[ingest] ${matched.length} órgão(s) federais identificados para consulta: ${matched.map((m) => m.descricao ?? m.nome).join(", ")}`);

  const allContracts = [];
  const errors = [];
  for (const orgao of matched) {
    const codigo = orgao.codigo ?? orgao.codigoSIAFI ?? orgao.codigoOrgao;
    if (!codigo) continue;
    const res = await apiGet(`/contratos?codigoOrgao=${codigo}&pagina=1`, apiKey, `Portal Transparência contratos ${codigo}`);
    if (!res.ok) {
      errors.push({ orgao: orgao.descricao ?? orgao.nome, error: res.error });
      continue;
    }
    const list = Array.isArray(res.data) ? res.data : [];
    for (const item of list) {
      allContracts.push({
        agencyName: orgao.descricao ?? orgao.nome,
        agencyCode: codigo,
        object: item.objeto ?? item.descricaoObjeto ?? "(objeto não informado)",
        value: Number(item.valorInicialCompra ?? item.valorFinalCompra ?? item.valor) || null,
        supplierName: item.fornecedor?.nome ?? item.nomeRazaoSocialFornecedor ?? null,
        supplierCnpj: item.fornecedor?.cnpjFormatado ?? item.fornecedor?.codigoFormatado ?? null,
        signedAt: item.dataAssinatura ?? item.dataInicioVigencia ?? null,
      });
    }
  }

  console.log(`[ingest] Portal da Transparência: ${allContracts.length} contrato(s) federais coletados.`);

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "Portal da Transparência — Governo Federal (API de Dados)",
    skipped: false,
    agenciesQueried: matched.map((m) => m.descricao ?? m.nome),
    contracts: allContracts,
    errors,
  };
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "federal.json"), JSON.stringify(payload, null, 2));
  console.log(`[ingest] escrito em src/lib/data/real/federal.json`);
  return payload;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestPortalTransparencia().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
