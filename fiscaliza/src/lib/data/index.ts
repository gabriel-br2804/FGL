import { getDB } from "./generate";
import { scoreCompany, scoreMunicipality } from "../engine/score";
import { buildSignalsForCompany, buildSignalsForMunicipality } from "../engine/signals";
import { REAL_CONTRACTS, REAL_FEDERAL, REAL_MANIFEST, REAL_GEO } from "./real-data";
import type {
  Municipality,
  Company,
  Contract,
  Project,
  State,
  Bid,
  Agency,
  RiskSignal,
  FiscalizaScoreBreakdown,
  DataSource,
} from "../types";

interface Enriched {
  companyScores: Map<string, FiscalizaScoreBreakdown>;
  municipalityScores: Map<string, FiscalizaScoreBreakdown>;
  companySignals: Map<string, RiskSignal[]>;
  municipalitySignals: Map<string, RiskSignal[]>;
  allSignals: RiskSignal[];
}

function computeEnriched(): Enriched {
  const db = getDB();
  const companyAgeById = new Map<string, number>();
  const now = new Date("2026-08-31");
  for (const c of db.companies) {
    companyAgeById.set(c.id, (now.getTime() - new Date(c.openedAt).getTime()) / (30.44 * 24 * 3600 * 1000));
  }

  const companyScores = new Map<string, FiscalizaScoreBreakdown>();
  const companySignals = new Map<string, RiskSignal[]>();
  const allSignals: RiskSignal[] = [];
  const municipalityName = (id: string) => db.municipalityById.get(id)?.name ?? id;
  const companyName = (id: string) => db.companyById.get(id)?.name ?? id;

  for (const company of db.companies) {
    const contracts = db.contracts.filter((c) => c.companyId === company.id);
    const bids = db.bids.filter((b) => b.winnerCompanyId === company.id);
    const breakdown = scoreCompany(company, contracts, bids);
    companyScores.set(company.id, breakdown);
    company.fiscalizaScore = breakdown.total;
    const signals = buildSignalsForCompany(company, contracts, bids, municipalityName);
    companySignals.set(company.id, signals);
    allSignals.push(...signals);
  }

  const municipalityScores = new Map<string, FiscalizaScoreBreakdown>();
  const municipalitySignals = new Map<string, RiskSignal[]>();
  for (const muni of db.municipalities) {
    const contracts = db.contracts.filter((c) => c.municipalityId === muni.id);
    const bids = db.bids.filter((b) => contracts.some((c) => c.bidId === b.id));
    const breakdown = scoreMunicipality(muni, contracts, bids, companyAgeById);
    municipalityScores.set(muni.id, breakdown);
    muni.fiscalizaScore = breakdown.total;
    const signals = buildSignalsForMunicipality(muni, contracts, companyName);
    municipalitySignals.set(muni.id, signals);
    allSignals.push(...signals);

    const companyIds = new Set(contracts.map((c) => c.companyId));
    let attentionPoints = signals.length;
    for (const cid of companyIds) {
      attentionPoints += (companySignals.get(cid) ?? []).filter((s) =>
        contracts.some((c) => c.companyId === cid)
      ).length;
    }
    muni.attentionPoints = attentionPoints;
  }

  return { companyScores, municipalityScores, companySignals, municipalitySignals, allSignals };
}

// Calculado uma única vez na primeira avaliação deste módulo (por processo/
// bundle). Isso evita o bug de scores "zerados" quando uma rota (ex.: uma
// API route) só chama funções que nunca disparavam o cálculo preguiçoso —
// cada bundle de rota do Next tem sua própria instância deste módulo, então
// o enriquecimento precisa acontecer no carregamento, não sob demanda.
const _enriched: Enriched = computeEnriched();

function getEnriched(): Enriched {
  return _enriched;
}

// ---- Public read API -------------------------------------------------

export function listStates(): State[] {
  return getDB().states;
}
export function getState(id: string): State | undefined {
  return getDB().stateById.get(id.toUpperCase());
}
export function listMunicipalitiesByState(stateId: string): Municipality[] {
  return getDB().municipalities.filter((m) => m.stateId === stateId.toUpperCase());
}

export function listMunicipalities(): Municipality[] {
  return getDB().municipalities;
}
export function getMunicipality(id: string): Municipality | undefined {
  return getDB().municipalityById.get(id);
}

export function listCompanies(): Company[] {
  return getDB().companies;
}
export function getCompany(id: string): Company | undefined {
  return getDB().companyById.get(id);
}

export function listContracts(): Contract[] {
  return getDB().contracts;
}
export function getContract(id: string): Contract | undefined {
  return getDB().contractById.get(id);
}
export function contractsForMunicipality(id: string): Contract[] {
  return getDB().contracts.filter((c) => c.municipalityId === id);
}
export function contractsForCompany(id: string): Contract[] {
  return getDB().contracts.filter((c) => c.companyId === id);
}

export function listProjects(): Project[] {
  return getDB().projects;
}
export function getProject(id: string): Project | undefined {
  return getDB().projectById.get(id);
}
export function projectsForMunicipality(id: string): Project[] {
  return getDB().projects.filter((p) => p.municipalityId === id);
}

export function getAgency(id: string): Agency | undefined {
  return getDB().agencyById.get(id);
}
export function getBid(id?: string): Bid | undefined {
  if (!id) return undefined;
  return getDB().bidById.get(id);
}

export function listDataSources(): DataSource[] {
  // Sobrepõe o status estático (definido em generate.ts) com o resultado
  // real da última `npm run ingest`, quando existir — assim /fontes e o
  // dashboard refletem o que de fato foi coletado, não uma promessa fixa.
  return getDB().dataSources.map((s) => {
    if (s.connector.startsWith("FederalTransparencyConnector") || s.id === "src-portal-transparencia") {
      const pt = REAL_MANIFEST.portalTransparencia;
      return pt.ok
        ? { ...s, simulated: false, lastSync: REAL_FEDERAL.generatedAt ?? s.lastSync }
        : s;
    }
    if (s.connector.startsWith("ComprasGovConnector") || s.id === "src-compras-gov") {
      const pncp = REAL_MANIFEST.pncp;
      return pncp.ok ? { ...s, simulated: false, lastSync: REAL_CONTRACTS.generatedAt ?? s.lastSync } : s;
    }
    if (s.id === "src-sp-transparencia" || s.id === "src-jandira" || s.connector.startsWith("StateConnector") || s.connector.startsWith("MunicipalConnector")) {
      const pncp = REAL_MANIFEST.pncp;
      return pncp.ok ? { ...s, simulated: false, lastSync: REAL_CONTRACTS.generatedAt ?? s.lastSync } : s;
    }
    return s;
  });
}

export interface RealDataStatus {
  ibge: { ok: boolean; statesFetched: number; municipalitiesFetched: number };
  pncp: { ok: boolean; recordsFetched: number; entitiesQueried: number };
  portalTransparencia: { ok: boolean; contractsFetched: number; skipped: boolean; reason?: string };
  generatedAt: string | null;
}

export function getRealDataStatus(): RealDataStatus {
  return {
    ibge: {
      ok: REAL_MANIFEST.ibge.ok,
      statesFetched: REAL_MANIFEST.ibge.statesFetched ?? 0,
      municipalitiesFetched: REAL_MANIFEST.ibge.municipalitiesFetched ?? 0,
    },
    pncp: {
      ok: REAL_MANIFEST.pncp.ok,
      recordsFetched: REAL_MANIFEST.pncp.recordsFetched ?? 0,
      entitiesQueried: REAL_MANIFEST.pncp.entitiesQueried ?? 0,
    },
    portalTransparencia: {
      ok: REAL_MANIFEST.portalTransparencia.ok,
      contractsFetched: REAL_MANIFEST.portalTransparencia.contractsFetched ?? 0,
      skipped: REAL_MANIFEST.portalTransparencia.skipped ?? true,
      reason: REAL_MANIFEST.portalTransparencia.reason,
    },
    generatedAt: REAL_MANIFEST.generatedAt,
  };
}

export interface RealScopeStats {
  count: number;
  totalValue: number;
}

/** Contratos reais do PNCP com escopo estadual (sem município associado) —
 * agregados por UF, sem tentar modelá-los como Contract completos. */
export function getRealStateStats(uf: string): RealScopeStats {
  const records = REAL_CONTRACTS.records.filter((r) => r.scope === `estado ${uf}`);
  return {
    count: records.length,
    totalValue: records.reduce((s, r) => s + (r.value ?? 0), 0),
  };
}

/** Contratos reais da União: soma o que o PNCP trouxe com escopo federal e,
 * quando disponível, os contratos do Portal da Transparência. */
export function getRealFederalStats(): RealScopeStats & { pncpCount: number; portalTransparenciaCount: number } {
  const pncpRecords = REAL_CONTRACTS.records.filter((r) => r.scope === "União (federal)");
  const pncpTotal = pncpRecords.reduce((s, r) => s + (r.value ?? 0), 0);
  const ptTotal = REAL_FEDERAL.contracts.reduce((s, c) => s + (c.value ?? 0), 0);
  return {
    count: pncpRecords.length + REAL_FEDERAL.contracts.length,
    totalValue: pncpTotal + ptTotal,
    pncpCount: pncpRecords.length,
    portalTransparenciaCount: REAL_FEDERAL.contracts.length,
  };
}

export function getCompanyScore(id: string): FiscalizaScoreBreakdown | undefined {
  return getEnriched().companyScores.get(id);
}
export function getMunicipalityScore(id: string): FiscalizaScoreBreakdown | undefined {
  return getEnriched().municipalityScores.get(id);
}
export function getCompanySignals(id: string): RiskSignal[] {
  return getEnriched().companySignals.get(id) ?? [];
}
export function getMunicipalitySignals(id: string): RiskSignal[] {
  return getEnriched().municipalitySignals.get(id) ?? [];
}
export function listAllSignals(): RiskSignal[] {
  return getEnriched().allSignals;
}

export interface DashboardStats {
  totalAnalyzed: number;
  totalContracts: number;
  totalSuppliers: number;
  totalAttentionPoints: number;
  totalAgencies: number;
  lastUpdate: string;
}

export function getDashboardStats(): DashboardStats {
  const db = getDB();
  getEnriched();
  const totalAnalyzed = db.municipalities.reduce((s, m) => s + m.totalSpent, 0);
  const totalSuppliers = new Set(db.companies.map((c) => c.id)).size;
  const totalAttentionPoints = getEnriched().allSignals.length;
  return {
    totalAnalyzed,
    totalContracts: db.contracts.length,
    totalSuppliers,
    totalAttentionPoints,
    totalAgencies: db.agencies.length,
    lastUpdate: (REAL_CONTRACTS.generatedAt ?? REAL_GEO.generatedAt ?? "2026-08-30T00:00:00Z").slice(0, 10),
  };
}

export interface StateAggregate {
  state: State;
  totalSpent: number;
  totalContracts: number;
  totalSuppliers: number;
  attentionPoints: number;
  avgScore: number;
  municipalities: Municipality[];
  /** Contratos reais do PNCP com escopo estadual (não amarrados a um município específico). */
  realStateContracts: RealScopeStats;
}

export function getStateAggregate(stateId: string): StateAggregate | undefined {
  getEnriched();
  const state = getState(stateId);
  if (!state) return undefined;
  const municipalities = listMunicipalitiesByState(stateId);
  const totalSpent = municipalities.reduce((s, m) => s + m.totalSpent, 0);
  const totalContracts = municipalities.reduce((s, m) => s + m.totalContracts, 0);
  const totalSuppliers = new Set(
    getDB()
      .contracts.filter((c) => municipalities.some((m) => m.id === c.municipalityId))
      .map((c) => c.companyId)
  ).size;
  const attentionPoints = municipalities.reduce((s, m) => s + m.attentionPoints, 0);
  const avgScore = municipalities.length
    ? Math.round(municipalities.reduce((s, m) => s + m.fiscalizaScore, 0) / municipalities.length)
    : 0;
  const realStateContracts = getRealStateStats(stateId.toUpperCase());
  return { state, totalSpent, totalContracts, totalSuppliers, attentionPoints, avgScore, municipalities, realStateContracts };
}

export function listStateAggregates(): StateAggregate[] {
  return listStates()
    .map((s) => getStateAggregate(s.id))
    .filter((s): s is StateAggregate => !!s);
}

export function getUniaoAggregate() {
  getEnriched();
  const db = getDB();
  const federalAgencyIds = new Set(db.agencies.filter((a) => a.id.startsWith("ag-fed-")).map((a) => a.id));
  const contracts = db.contracts.filter((c) => federalAgencyIds.has(c.agencyId));
  return {
    totalSpent: getDashboardStats().totalAnalyzed,
    totalContracts: db.contracts.length,
    federalContracts: contracts,
    totalSuppliers: getDashboardStats().totalSuppliers,
    attentionPoints: getDashboardStats().totalAttentionPoints,
    statesCount: db.states.length,
    municipalitiesCount: db.municipalities.length,
    realFederal: getRealFederalStats(),
  };
}

export function getMunicipalityRanking(limit = 20): Municipality[] {
  getEnriched();
  return [...getDB().municipalities].sort((a, b) => b.attentionPoints - a.attentionPoints).slice(0, limit);
}

export function getTopCompaniesByScore(limit = 10): Company[] {
  getEnriched();
  return [...getDB().companies].sort((a, b) => b.fiscalizaScore - a.fiscalizaScore).slice(0, limit);
}

export function suppliersForMunicipality(id: string, limit = 10) {
  const contracts = contractsForMunicipality(id);
  const byCompany = new Map<string, number>();
  for (const c of contracts) byCompany.set(c.companyId, (byCompany.get(c.companyId) ?? 0) + c.currentValue);
  return Array.from(byCompany.entries())
    .map(([companyId, value]) => ({ company: getCompany(companyId)!, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function agencySupplierBreakdown(agencyId: string) {
  const contracts = getDB().contracts.filter((c) => c.agencyId === agencyId);
  const total = contracts.reduce((s, c) => s + c.currentValue, 0);
  const byCompany = new Map<string, number>();
  for (const c of contracts) byCompany.set(c.companyId, (byCompany.get(c.companyId) ?? 0) + c.currentValue);
  const sorted = Array.from(byCompany.entries()).sort((a, b) => b[1] - a[1]);
  return sorted.map(([companyId, value]) => ({
    company: getCompany(companyId)!,
    value,
    share: total > 0 ? value / total : 0,
  }));
}

// ---- Search ------------------------------------------------------------

export interface SearchResult {
  type: "municipality" | "company" | "contract" | "project";
  id: string;
  title: string;
  subtitle: string;
  score?: number;
}

export function searchAll(query: string, limit = 12): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const db = getDB();
  const results: SearchResult[] = [];

  for (const m of db.municipalities) {
    if (m.name.toLowerCase().includes(q) || `${m.name} ${m.stateId}`.toLowerCase().includes(q)) {
      results.push({
        type: "municipality",
        id: m.id,
        title: `${m.name} — ${m.stateId}`,
        subtitle: "Município",
        score: m.fiscalizaScore,
      });
    }
  }
  for (const c of db.companies) {
    if (c.name.toLowerCase().includes(q) || c.cnpj.includes(q)) {
      results.push({ type: "company", id: c.id, title: c.name, subtitle: `Empresa · ${c.cnpj}`, score: c.fiscalizaScore });
    }
  }
  for (const c of db.contracts) {
    if (c.number.includes(q) || c.object.toLowerCase().includes(q)) {
      results.push({
        type: "contract",
        id: c.id,
        title: `Contrato ${c.number}`,
        subtitle: c.object,
      });
    }
  }
  for (const p of db.projects) {
    if (p.name.toLowerCase().includes(q)) {
      results.push({ type: "project", id: p.id, title: p.name, subtitle: "Obra pública" });
    }
  }

  return results.slice(0, limit);
}
