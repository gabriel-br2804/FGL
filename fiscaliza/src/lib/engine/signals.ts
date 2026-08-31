import type { Contract, Bid, Company, Municipality, RiskSignal } from "../types";
import { fmtBRL, fmtPercent, fmtDate } from "./format";

let seq = 0;
function nextId() {
  seq += 1;
  return `signal-${seq}`;
}

/**
 * Gera os sinais de risco (pontos de atenção) narrativos usados nas
 * páginas de empresa/município e no contador do dashboard. Cada sinal
 * separa DADO, ANÁLISE e INTERPRETAÇÃO — nunca conclui responsabilidade.
 */
export function buildSignalsForCompany(
  company: Company,
  contracts: Contract[],
  bids: Bid[],
  municipalityName: (id: string) => string
): RiskSignal[] {
  const signals: RiskSignal[] = [];
  const now = new Date("2026-08-31");

  // Preço fora do padrão
  for (const c of contracts) {
    if (c.medianComparable <= 0) continue;
    const pct = (c.currentValue - c.medianComparable) / c.medianComparable;
    if (pct > 0.2) {
      signals.push({
        id: nextId(),
        type: "preco_fora_padrao",
        targetType: "company",
        targetId: company.id,
        points: Math.round(clamp(pct * 28, 0, 25)),
        title: "Ponto de atenção",
        data: `Contrato nº ${c.number} (${municipalityName(c.municipalityId)}) firmado em ${fmtBRL(c.currentValue)} para "${c.object}".`,
        analysis: `A mediana encontrada para contratos semelhantes na categoria ${c.category} é de ${fmtBRL(
          c.medianComparable
        )} — ${fmtPercent(pct)} de diferença.`,
        interpretation:
          "Esse padrão merece análise adicional. Diferenças de preço podem ter explicações legítimas (urgência, especificações técnicas, localidade) e não indicam, isoladamente, irregularidade.",
        severity: pct > 0.6 ? "alta" : "atencao",
      });
    }
  }

  // Empresa recente
  const ageMonths = (now.getTime() - new Date(company.openedAt).getTime()) / (30.44 * 24 * 3600 * 1000);
  if (ageMonths < 24 && company.totalContracted > 1_000_000) {
    signals.push({
      id: nextId(),
      type: "empresa_recente",
      targetType: "company",
      targetId: company.id,
      points: Math.round(clamp(((24 - ageMonths) / 24) * 18, 0, 18)),
      title: "Ponto de atenção",
      data: `Empresa criada há ${Math.round(ageMonths)} meses, com ${fmtBRL(company.totalContracted)} contratados com órgãos públicos.`,
      analysis:
        "O tempo de existência da empresa é significativamente menor do que a média observada entre fornecedores com volume de contratos semelhante.",
      interpretation:
        "Esse é um indício que merece investigação complementar sobre capacidade técnica e operacional, mas não configura, por si só, prova de irregularidade.",
      severity: "atencao",
    });
  }

  // Baixa concorrência
  const lowComp = bids.filter((b) => b.winnerCompanyId === company.id && (b.participants <= 1 || b.proposals <= 1));
  for (const b of lowComp) {
    signals.push({
      id: nextId(),
      type: "baixa_concorrencia",
      targetType: "company",
      targetId: company.id,
      points: 4,
      title: "Ponto de atenção",
      data: `Licitação ${b.number} (${b.modality}) teve ${b.participants} participante(s) e ${b.proposals} proposta(s).`,
      analysis: "O número de participantes está abaixo do observado na maioria das licitações da mesma modalidade.",
      interpretation:
        "Baixa concorrência é um padrão incomum que merece verificação do edital e da divulgação do processo, sem implicar direcionamento.",
      severity: "atencao",
    });
  }

  // Aditivos elevados
  for (const c of contracts) {
    if (c.amendments.length === 0) continue;
    const growth = (c.currentValue - c.originalValue) / c.originalValue;
    if (growth > 0.3) {
      signals.push({
        id: nextId(),
        type: "aditivos_elevados",
        targetType: "company",
        targetId: company.id,
        points: Math.round(clamp(growth * 26, 0, 20)),
        title: "Ponto de atenção",
        data: `Contrato nº ${c.number}: valor inicial de ${fmtBRL(c.originalValue)}, valor após aditivos de ${fmtBRL(
          c.currentValue
        )} (${fmtPercent(growth)}).`,
        analysis: `Aumento acumulado de ${fmtPercent(growth)} por meio de ${c.amendments.length} termo(s) aditivo(s), acima do padrão típico de reajuste.`,
        interpretation:
          "Aditivos elevados podem refletir necessidades reais de obra ou serviço, mas merecem verificação das justificativas técnicas apresentadas.",
        severity: growth > 0.5 ? "alta" : "atencao",
      });
    }
  }

  return signals;
}

export function buildSignalsForMunicipality(
  muni: Municipality,
  contracts: Contract[],
  companyName: (id: string) => string
): RiskSignal[] {
  const signals: RiskSignal[] = [];
  const byAgency = new Map<string, Contract[]>();
  for (const c of contracts) {
    const arr = byAgency.get(c.agencyId) ?? [];
    arr.push(c);
    byAgency.set(c.agencyId, arr);
  }
  for (const [agencyId, agContracts] of byAgency) {
    const total = agContracts.reduce((s, c) => s + c.currentValue, 0);
    const byCompany = new Map<string, number>();
    for (const c of agContracts) byCompany.set(c.companyId, (byCompany.get(c.companyId) ?? 0) + c.currentValue);
    const sorted = Array.from(byCompany.entries()).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0 || total <= 0) continue;
    const [topCompanyId, topValue] = sorted[0];
    const share = topValue / total;
    if (share > 0.4 && sorted.length >= 2) {
      signals.push({
        id: nextId(),
        type: "concentracao_fornecedores",
        targetType: "municipality",
        targetId: muni.id,
        points: Math.round(clamp((share - 0.3) * 20, 0, 10)),
        title: "Ponto de atenção",
        data: `${companyName(topCompanyId)} concentra ${fmtPercent(share)} do valor contratado pelo órgão analisado.`,
        analysis: `Entre ${sorted.length} fornecedores identificados, um único fornecedor responde pela maior parte do valor contratado no período analisado.`,
        interpretation:
          "Concentração de fornecedores é um padrão que merece acompanhamento, especialmente combinado a outros fatores, mas pode refletir mercados com poucos prestadores qualificados.",
        severity: share > 0.6 ? "alta" : "atencao",
      });
    }
  }
  return signals;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
