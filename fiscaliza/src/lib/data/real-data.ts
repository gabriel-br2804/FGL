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
import companiesReal from "./real/companies.json";
import governance from "./real/governance.json";
import siconfi from "./real/siconfi.json";
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

export interface RealFederalBid {
  id: string | number | null;
  agencyName: string | null;
  agencyCode: string | null;
  number: string | null;
  modality: string | null;
  object: string;
  estimatedValue: number | null;
  openedAt: string | null;
  /** Nº real de participantes vindo de /licitacoes/participantes — null quando não foi consultado (ver LICITACAO_PARTICIPANTS_LIMIT no ingest). */
  participantsCount: number | null;
}

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
  bids?: RealFederalBid[];
  bidErrors?: unknown[];
};

export const REAL_MANIFEST = manifest as {
  generatedAt: string | null;
  ibge: { ok: boolean; statesFetched?: number; municipalitiesFetched?: number };
  pncp: { ok: boolean; recordsFetched?: number; entitiesQueried?: number; skipped?: boolean };
  cnpj?: { ok: boolean; requested?: number; resolved?: number; skipped?: boolean };
  portalTransparencia: { ok: boolean; contractsFetched?: number; skipped?: boolean; reason?: string };
  siconfi?: { ok: boolean; entesFetched?: number; referenceYear?: number; skipped?: boolean };
  municipiosBatchCount?: number;
  municipiosCoveredTotal?: number;
  municipiosTotal?: number;
};

export interface RealPortalLink {
  url: string | null;
  /** "API" | "dados abertos" | "CSV" | "só HTML" | "não encontrado" — texto livre vindo da pesquisa, exibido como está. */
  type: string | null;
}

export interface RealStateGovernance {
  governor: { name: string | null; party: string | null; sourceUrl: string | null };
  statePortal: RealPortalLink;
  capital: {
    name: string | null;
    mayor: { name: string | null; party: string | null; sourceUrl: string | null };
    portal: RealPortalLink;
  };
}

/** Governador (com partido), prefeito da capital e portais de transparência
 * por estado — pesquisado manualmente com fonte citada por item (não é um
 * ingest automático como IBGE/PNCP). Ver `disclaimer` e `/fontes` no app. */
export const REAL_GOVERNANCE = governance as {
  asOf: string | null;
  disclaimer: string;
  states: Record<string, RealStateGovernance>;
};

export interface RealSiconfiRecord {
  idEnte: string;
  despesaOrcamentaria: number | null;
  receitaOrcamentaria: number | null;
  sphere: "municipio" | "estado";
}

const siconfiTyped = siconfi as {
  generatedAt: string | null;
  source: string | null;
  referenceYear: number | null;
  referenceBimester: number | null;
  records: RealSiconfiRecord[];
  stats: { municipiosEncontrados: number; estadosEncontrados: number };
};

/** Orçamento/despesa orçamentária REAL por ente (SICONFI/Tesouro Nacional),
 * indexado por id_ente (código IBGE do município, ou código de 2 dígitos
 * da UF para estados) para lookup O(1) em generate.ts. */
export const REAL_SICONFI = {
  ...siconfiTyped,
  byIdEnte: new Map(siconfiTyped.records.map((r) => [String(r.idEnte), r])),
};

export interface RealCompanyRecord {
  razaoSocial: string | null;
  nomeFantasia: string | null;
  dataInicioAtividade: string | null;
  situacaoCadastral: string | null;
  cnaeDescricao: string | null;
  municipio: string | null;
  uf: string | null;
  socios: { nome: string | null; qualificacao: string | null }[];
}

export const REAL_COMPANIES = companiesReal as {
  generatedAt: string | null;
  source: string | null;
  byCnpj: Record<string, RealCompanyRecord>;
};

/** Formata um CNPJ (só dígitos ou já formatado) no padrão XX.XXX.XXX/XXXX-XX. */
export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return value;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

const SITUACAO_MAP: Record<string, "Ativa" | "Inapta" | "Suspensa" | "Baixada"> = {
  ATIVA: "Ativa",
  INAPTA: "Inapta",
  SUSPENSA: "Suspensa",
  BAIXADA: "Baixada",
};

export function mapSituacaoCadastral(situacao: string | null): "Ativa" | "Inapta" | "Suspensa" | "Baixada" | null {
  if (!situacao) return null;
  return SITUACAO_MAP[situacao.toUpperCase()] ?? null;
}

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
