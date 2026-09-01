/**
 * Ingestão IBGE — geografia oficial (estados, municípios) e estimativas de
 * população, via API de Localidades e API de Agregados (SIDRA) do IBGE.
 * Nenhuma chave é necessária. Documentação:
 *   https://servicodados.ibge.gov.br/api/docs/localidades
 *   https://servicodados.ibge.gov.br/api/docs/agregados
 *
 * Saída: src/lib/data/real/geo.json
 *   { states: [...], municipalities: [...], generatedAt, populationSource }
 *
 * Este arquivo roda com `node scripts/ingest/ibge.mjs` (chamado pelo
 * orquestrador `run.mjs`) — precisa de acesso normal à internet, que a
 * sessão do Claude não tem; rode na sua máquina.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchJson, logSection } from "./lib/http.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "..", "src", "lib", "data", "real");

const POP_TABLE = 6579; // "População residente estimada"
const POP_VARIABLE_FALLBACK = 9324;

async function fetchEstados() {
  const res = await fetchJson("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome", {
    label: "IBGE estados",
  });
  if (!res.ok) return { ok: false, states: [], error: res.error };
  const states = res.data.map((s) => ({
    id: s.sigla,
    ibgeId: s.id,
    name: s.nome,
    region: s.regiao?.nome ?? null,
  }));
  return { ok: true, states, error: null };
}

async function fetchMunicipios() {
  const res = await fetchJson("https://servicodados.ibge.gov.br/api/v1/localidades/municipios", {
    label: "IBGE municípios (todos)",
    timeoutMs: 40_000,
  });
  if (!res.ok) return { ok: false, municipalities: [], error: res.error };
  const municipalities = res.data.map((m) => {
    const uf = m.microrregiao?.mesorregiao?.UF ?? m["regiao-imediata"]?.["regiao-intermediaria"]?.UF;
    return {
      ibgeId: m.id,
      name: m.nome,
      stateId: uf?.sigla ?? null,
    };
  });
  return { ok: true, municipalities, error: null };
}

/** Descobre dinamicamente o id da variável de "população" na tabela do
 * SIDRA, em vez de confiar cegamente num número fixo — a API de metadados
 * é estável mesmo que o código da variável mude entre revisões da tabela. */
async function resolvePopulationVariable() {
  const res = await fetchJson(`https://servicodados.ibge.gov.br/api/v3/agregados/${POP_TABLE}/metadados`, {
    label: "IBGE metadados tabela população",
  });
  if (res.ok) {
    const variables = res.data?.variaveis ?? [];
    const match = variables.find((v) => /popula/i.test(v.nome ?? ""));
    if (match?.id) return match.id;
  }
  console.warn(`[ingest] não consegui resolver a variável de população via metadados, usando fallback ${POP_VARIABLE_FALLBACK}`);
  return POP_VARIABLE_FALLBACK;
}

async function fetchPopulationByMunicipio() {
  const variable = await resolvePopulationVariable();
  const url = `https://servicodados.ibge.gov.br/api/v3/agregados/${POP_TABLE}/periodos/-1/variaveis/${variable}?localidades=N6[all]`;
  const res = await fetchJson(url, { label: "IBGE população por município", timeoutMs: 60_000 });
  if (!res.ok) return { ok: false, byIbgeId: new Map(), error: res.error };

  const byIbgeId = new Map();
  try {
    for (const resultado of res.data?.[0]?.resultados ?? []) {
      for (const serie of resultado.series ?? []) {
        const localidadeId = serie.localidade?.id;
        const values = Object.values(serie.serie ?? {});
        const latest = values[values.length - 1];
        const num = Number(latest);
        if (localidadeId && Number.isFinite(num)) byIbgeId.set(String(localidadeId), num);
      }
    }
  } catch (err) {
    return { ok: false, byIbgeId: new Map(), error: `formato inesperado na resposta do SIDRA: ${err.message}` };
  }
  return { ok: byIbgeId.size > 0, byIbgeId, error: byIbgeId.size > 0 ? null : "nenhum valor de população extraído" };
}

export async function ingestIbge() {
  logSection("IBGE — geografia e população");

  const [estadosResult, municipiosResult, populationResult] = await Promise.all([
    fetchEstados(),
    fetchMunicipios(),
    fetchPopulationByMunicipio(),
  ]);

  if (!estadosResult.ok) {
    console.error(`[ingest] IBGE estados falhou: ${estadosResult.error}`);
  }
  if (!municipiosResult.ok) {
    console.error(`[ingest] IBGE municípios falhou: ${municipiosResult.error}`);
  }
  if (!populationResult.ok) {
    console.warn(`[ingest] IBGE população falhou ou incompleta: ${populationResult.error} — municípios ficarão sem população real.`);
  }

  const municipalities = municipiosResult.municipalities.map((m) => ({
    ...m,
    population: populationResult.byIbgeId.get(String(m.ibgeId)) ?? null,
  }));

  const withPopulation = municipalities.filter((m) => m.population != null).length;
  console.log(
    `[ingest] IBGE: ${estadosResult.states.length} estados, ${municipalities.length} municípios (${withPopulation} com população real).`
  );

  await mkdir(OUT_DIR, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "IBGE — API de Localidades e Agregados (SIDRA)",
    states: estadosResult.states,
    municipalities,
    stats: {
      statesFetched: estadosResult.states.length,
      municipalitiesFetched: municipalities.length,
      municipalitiesWithPopulation: withPopulation,
    },
    errors: [estadosResult.error, municipiosResult.error, populationResult.error].filter(Boolean),
  };
  await writeFile(path.join(OUT_DIR, "geo.json"), JSON.stringify(payload, null, 2));
  console.log(`[ingest] escrito em src/lib/data/real/geo.json`);
  return payload;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestIbge().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
