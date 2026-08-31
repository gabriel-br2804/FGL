/**
 * Ponte entre os arquivos gerados por `npm run ingest` (src/lib/data/real/*.json)
 * e o gerador de dados do app (`generate.ts`).
 *
 * Os arquivos em `real/` sempre existem no repositório (com conteúdo vazio
 * por padrão) para que o `import` estático funcione tanto no bundle do
 * servidor quanto no do cliente sem depender de `fs` em runtime — rodar
 * `npm run ingest` apenas sobrescreve esse conteúdo com dados reais.
 */
import geo from "./real/geo.json";
import contracts from "./real/contracts.json";
import federal from "./real/federal.json";
import manifest from "./real/manifest.json";
import type { SpendingArea } from "../types";

export interface RealMunicipio {
  ibgeId: string | number;
  name: string;
  stateId: string | null;
  population: number | null;
}

export interface RealContractRecord {
  pncpId: string | null;
  object: string;
  value: number | null;
  modality: string | null;
  publishedAt: string | null;
  agencyName: string | null;
  agencyCnpj: string | null;
  municipalityIbge: string | number | null;
  uf: string | null;
  sphere: string | null;
  supplierCnpj: string | null;
  supplierName: string | null;
  participants: number | null;
  scope: string;
}

export const REAL_GEO = geo as {
  generatedAt: string | null;
  states: { id: string; ibgeId: number; name: string; region: string | null }[];
  municipalities: RealMunicipio[];
};

export const REAL_CONTRACTS = contracts as {
  generatedAt: string | null;
  records: RealContractRecord[];
};

export const REAL_FEDERAL = federal as {
  generatedAt: string | null;
  skipped: boolean;
  reason?: string;
  contracts: {
    agencyName: string | null;
    agencyCode: string | null;
    object: string;
    value: number | null;
    supplierName: string | null;
    supplierCnpj: string | null;
    signedAt: string | null;
  }[];
};

export const REAL_MANIFEST = manifest as {
  generatedAt: string | null;
  ibge: { ok: boolean; statesFetched?: number; municipalitiesFetched?: number };
  pncp: { ok: boolean; recordsFetched?: number; entitiesQueried?: number; skipped?: boolean };
  portalTransparencia: { ok: boolean; contractsFetched?: number; skipped?: boolean; reason?: string };
  principaisMunicipiosCount: number;
};

export function hasRealGeoData(): boolean {
  return REAL_GEO.municipalities.length > 0;
}

export function hasRealContractData(): boolean {
  return REAL_CONTRACTS.records.length > 0;
}

/** Classificação por palavra-chave do texto livre do objeto da contratação
 * nas 7 áreas de gasto do Fiscaliza. É uma heurística (não uma
 * classificação oficial) — documentado em /metodologia e /fontes. */
const CATEGORY_KEYWORDS: [SpendingArea, RegExp][] = [
  ["Saúde", /sa[uú]de|hospital|m[eé]dic|medicamento|ambulat[oó]rio|enferm/i],
  ["Educação", /educa[cç][aã]o|escola|merenda|ensino|creche|universidade/i],
  ["Segurança", /seguran[cç]a|guarda municipal|policia|pol[ií]cia|viatura|videomonitoramento/i],
  ["Transporte", /transporte|frota|combust[ií]vel|ve[ií]culo/i],
  [
    "Infraestrutura",
    /obra|pavimenta[cç][aã]o|constru[cç][aã]o|reforma|drenagem|infraestrutura|engenharia|ilumina[cç][aã]o p[uú]blica/i,
  ],
  ["Administração", /limpeza|conserva[cç][aã]o|administrat|tecnologia da informa[cç][aã]o|consultoria|assessoria/i],
];

export function classifyCategory(objectText: string): SpendingArea {
  for (const [area, regex] of CATEGORY_KEYWORDS) {
    if (regex.test(objectText)) return area;
  }
  return "Outros";
}
