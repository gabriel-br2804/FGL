/**
 * Fiscaliza Intelligence Engine — camada de estatística e classificação de
 * risco. Este módulo NUNCA produz afirmações de irregularidade: ele apenas
 * calcula desvios estatísticos (ANÁLISE) a partir de fatos (DADO) e anexa
 * uma leitura cautelosa (INTERPRETAÇÃO). A decisão sobre o que fazer com um
 * "ponto de atenção" é sempre humana.
 */
import type { Contract, Bid, Company, Municipality, FiscalizaScoreBreakdown, SignalType } from "../types";
import { APP_NOW } from "../now";

export const FACTOR_DEFINITIONS: { key: SignalType; label: string; maxPoints: number; description: string }[] = [
  {
    key: "preco_fora_padrao",
    label: "Preço fora do padrão",
    maxPoints: 25,
    description: "Contratos com valores significativamente acima da mediana de contratos semelhantes.",
  },
  {
    key: "baixa_concorrencia",
    label: "Baixa concorrência",
    maxPoints: 15,
    description: "Licitações com número reduzido de participantes ou propostas.",
  },
  {
    key: "aditivos_elevados",
    label: "Aditivos elevados",
    maxPoints: 20,
    description: "Aumento expressivo do valor contratado por meio de termos aditivos.",
  },
  {
    key: "concentracao_fornecedores",
    label: "Fornecedor concentrado",
    maxPoints: 10,
    description: "Concentração relevante de contratos de um órgão em poucos fornecedores.",
  },
  {
    key: "crescimento_anormal",
    label: "Crescimento anormal",
    maxPoints: 12,
    description: "Crescimento acelerado do valor total contratado ano a ano.",
  },
  {
    key: "empresa_recente",
    label: "Empresa recém-criada com contratos elevados",
    maxPoints: 18,
    description: "Empresas com pouco tempo de existência e valores contratados elevados.",
  },
];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function ageInMonths(iso: string, now: Date): number {
  const opened = new Date(iso);
  return (now.getTime() - opened.getTime()) / (30.44 * 24 * 3600 * 1000);
}

interface ScoreInputs {
  contracts: Contract[];
  bids: Bid[];
  agencyShareLookup: (agencyId: string, focusValue: number) => number; // max share of a single supplier at that agency
  companyAges?: { ageMonths: number; shareOfValue: number }[]; // for empresa_recente at aggregate level
}

export function computeFactorPoints(input: ScoreInputs, now = APP_NOW) {
  const { contracts, bids } = input;

  // 1. Preço fora do padrão
  const priced = contracts.filter((c) => c.medianComparable > 0);
  const flaggedPrice = priced.filter((c) => (c.currentValue - c.medianComparable) / c.medianComparable > 0.2);
  let pricePoints = 0;
  if (flaggedPrice.length > 0) {
    const avgPct =
      flaggedPrice.reduce((s, c) => s + (c.currentValue - c.medianComparable) / c.medianComparable, 0) /
      flaggedPrice.length;
    const coverage = flaggedPrice.length / priced.length;
    pricePoints = clamp(Math.round(avgPct * 28 * clamp(coverage * 2, 0.4, 1)), 0, 25);
  }

  // 2. Baixa concorrência
  let competitionPoints = 0;
  if (bids.length > 0) {
    const lowComp = bids.filter((b) => b.participants <= 1 || b.proposals <= 1);
    competitionPoints = clamp(Math.round((lowComp.length / bids.length) * 15), 0, 15);
  }

  // 3. Aditivos elevados
  const withAmendments = contracts.filter((c) => c.amendments.length > 0);
  let amendmentPoints = 0;
  if (withAmendments.length > 0) {
    const growths = withAmendments.map((c) => (c.currentValue - c.originalValue) / c.originalValue);
    const flagged = growths.filter((g) => g > 0.3);
    if (flagged.length > 0) {
      const avgGrowth = flagged.reduce((s, g) => s + g, 0) / flagged.length;
      const coverage = withAmendments.length / Math.max(1, contracts.length);
      amendmentPoints = clamp(Math.round(avgGrowth * 26 * clamp(coverage * 2.2, 0.5, 1)), 0, 20);
    }
  }

  // 4. Concentração de fornecedores
  const agencyIds = Array.from(new Set(contracts.map((c) => c.agencyId)));
  let maxShare = 0;
  for (const agId of agencyIds) {
    const agContracts = contracts.filter((c) => c.agencyId === agId);
    const total = agContracts.reduce((s, c) => s + c.currentValue, 0);
    const byCompany = new Map<string, number>();
    for (const c of agContracts) byCompany.set(c.companyId, (byCompany.get(c.companyId) ?? 0) + c.currentValue);
    for (const v of byCompany.values()) {
      if (total > 0) maxShare = Math.max(maxShare, v / total);
    }
  }
  const concentrationPoints = clamp(Math.round((maxShare - 0.3) * 20), 0, 10);

  // 5. Crescimento anormal
  const byYear = new Map<number, number>();
  for (const c of contracts) {
    const y = new Date(c.signedAt).getFullYear();
    byYear.set(y, (byYear.get(y) ?? 0) + c.currentValue);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => a - b);
  let growthPoints = 0;
  if (years.length >= 2) {
    const first = byYear.get(years[0])!;
    const last = byYear.get(years[years.length - 1])!;
    if (first > 0) {
      const growth = (last - first) / first;
      growthPoints = clamp(Math.round(growth * 6), 0, 12);
    }
  }

  // 6. Empresa recente com contratos elevados
  let recentPoints = 0;
  if (input.companyAges && input.companyAges.length > 0) {
    for (const ca of input.companyAges) {
      if (ca.ageMonths < 24) {
        const recencyFactor = (24 - ca.ageMonths) / 24;
        recentPoints += recencyFactor * ca.shareOfValue * 18;
      }
    }
    recentPoints = clamp(Math.round(recentPoints), 0, 18);
  }

  return {
    preco_fora_padrao: pricePoints,
    baixa_concorrencia: competitionPoints,
    aditivos_elevados: amendmentPoints,
    concentracao_fornecedores: concentrationPoints,
    crescimento_anormal: growthPoints,
    empresa_recente: recentPoints,
  } as Record<SignalType, number>;
}

export function buildBreakdown(
  targetType: FiscalizaScoreBreakdown["targetType"],
  targetId: string,
  points: Record<SignalType, number>
): FiscalizaScoreBreakdown {
  const factors = FACTOR_DEFINITIONS.map((f) => ({
    key: f.key,
    label: f.label,
    points: points[f.key] ?? 0,
    maxPoints: f.maxPoints,
  }));
  const total = clamp(
    factors.reduce((s, f) => s + f.points, 0),
    0,
    100
  );
  return { targetType, targetId, total, factors, computedAt: "2026-08-31T00:00:00-03:00" };
}

export function scoreCompany(company: Company, contracts: Contract[], bids: Bid[], now = APP_NOW) {
  const totalValue = contracts.reduce((s, c) => s + c.currentValue, 0);
  const ageMonths = ageInMonths(company.openedAt, now);
  // Empresas reais (PNCP) sem data de abertura conhecida não podem ser
  // avaliadas pelo fator "empresa recente" — não há como calculá-lo sem
  // inventar uma data, então o fator fica de fora do cálculo dela.
  const ageKnown = company.openedAtKnown !== false;
  const points = computeFactorPoints({
    contracts,
    bids,
    agencyShareLookup: () => 0,
    companyAges: ageKnown && totalValue > 0 ? [{ ageMonths, shareOfValue: 1 }] : [],
  });
  return buildBreakdown("company", company.id, points);
}

/** Score genérico a partir de um conjunto de contratos/licitações — usado
 * para município, estado (todos os contratos das cidades da UF) e União
 * (todos os contratos do país). O cálculo é o mesmo em qualquer escala. */
export function scoreAggregate(
  targetType: FiscalizaScoreBreakdown["targetType"],
  targetId: string,
  contracts: Contract[],
  bids: Bid[],
  companyAgeById: Map<string, number>
) {
  const totalValue = contracts.reduce((s, c) => s + c.currentValue, 0);
  const byCompany = new Map<string, number>();
  for (const c of contracts) byCompany.set(c.companyId, (byCompany.get(c.companyId) ?? 0) + c.currentValue);
  const companyAges = Array.from(byCompany.entries()).map(([companyId, value]) => ({
    ageMonths: companyAgeById.get(companyId) ?? 999,
    shareOfValue: totalValue > 0 ? value / totalValue : 0,
  }));
  const points = computeFactorPoints({ contracts, bids, agencyShareLookup: () => 0, companyAges });
  return buildBreakdown(targetType, targetId, points);
}

export function scoreMunicipality(
  muni: Municipality,
  contracts: Contract[],
  bids: Bid[],
  companyAgeById: Map<string, number>
) {
  return scoreAggregate("municipality", muni.id, contracts, bids, companyAgeById);
}

export function scoreState(stateId: string, contracts: Contract[], bids: Bid[], companyAgeById: Map<string, number>) {
  return scoreAggregate("state", stateId, contracts, bids, companyAgeById);
}

export function scoreUniao(contracts: Contract[], bids: Bid[], companyAgeById: Map<string, number>) {
  return scoreAggregate("uniao", "uniao", contracts, bids, companyAgeById);
}
