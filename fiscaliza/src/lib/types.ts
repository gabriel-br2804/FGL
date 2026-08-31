/**
 * Domain model do Fiscaliza.
 *
 * Estas interfaces espelham as entidades descritas na arquitetura de dados
 * (ver prisma/schema.prisma para o modelo relacional completo, preparado
 * para PostgreSQL em produção). No MVP, os dados são servidos por
 * `src/lib/data/*` (fixtures simuladas) através da mesma interface que,
 * futuramente, uma camada de repositório sobre o banco real implementará.
 */

export type RiskLevel =
  | "baixa_atencao"
  | "normal"
  | "atencao"
  | "alta_atencao"
  | "atencao_critica";

export function riskLevelFromScore(score: number): RiskLevel {
  if (score <= 20) return "baixa_atencao";
  if (score <= 40) return "normal";
  if (score <= 60) return "atencao";
  if (score <= 80) return "alta_atencao";
  return "atencao_critica";
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  baixa_atencao: "Baixa atenção",
  normal: "Normal",
  atencao: "Atenção",
  alta_atencao: "Alta atenção",
  atencao_critica: "Atenção crítica",
};

export type SourceType =
  | "portal_transparencia_federal"
  | "dados_gov_br"
  | "compras_gov_br"
  | "tce"
  | "portal_estadual"
  | "portal_municipal"
  | "simulado";

export interface DataSource {
  id: string;
  name: string;
  connector: string;
  type: SourceType;
  url?: string;
  lastSync: string; // ISO date
  simulated: boolean;
}

export interface State {
  id: string; // UF, ex: "SP"
  name: string;
  region: string;
  population: number;
}

export interface Municipality {
  id: string; // slug, ex: "jandira-sp"
  ibgeCode: string;
  name: string;
  stateId: string;
  population: number;
  annualBudget: number; // orçamento anual (R$)
  totalSpent: number; // gasto total analisado (R$)
  totalContracts: number;
  totalSuppliers: number;
  attentionPoints: number;
  fiscalizaScore: number;
  spendingByArea: { area: SpendingArea; value: number }[];
  spendingHistory: { year: number; value: number }[];
  lat: number;
  lon: number;
  /** "ibge" quando a população vem da ingestão real do IBGE; ausente/"estimado" quando é uma aproximação do MVP. */
  populationSource?: "ibge" | "estimado";
}

export type SpendingArea =
  | "Saúde"
  | "Educação"
  | "Infraestrutura"
  | "Segurança"
  | "Administração"
  | "Transporte"
  | "Outros";

export interface Company {
  id: string; // cnpj (somente dígitos)
  cnpj: string; // formatado
  name: string;
  status: "Ativa" | "Inapta" | "Suspensa" | "Baixada";
  openedAt: string; // ISO date
  municipalityId: string;
  economicActivity: string;
  totalContracted: number;
  contractsCount: number;
  contractingAgenciesCount: number;
  municipalitiesCount: number;
  fiscalizaScore: number;
  partners: { name: string; role: string; personId: string }[];
  yearlyContracted: { year: number; value: number }[];
  /** "pncp" quando a empresa foi identificada a partir de contratos reais do PNCP; ausente = fictícia (dado simulado do MVP). */
  source?: "pncp";
  /** false quando a data de abertura é um valor de preenchimento (real, mas sem essa informação disponível na fonte). */
  openedAtKnown?: boolean;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  companies: string[]; // company ids
}

export interface GovernmentEntity {
  id: string;
  name: string;
  sphere: "Federal" | "Estadual" | "Municipal";
}

export interface Agency {
  id: string;
  name: string; // órgão / secretaria
  entityId: string;
  municipalityId?: string;
  stateId?: string;
}

export type BidModality =
  | "Pregão Eletrônico"
  | "Concorrência"
  | "Tomada de Preços"
  | "Dispensa de Licitação"
  | "Inexigibilidade"
  | "Convite";

export interface Bid {
  id: string;
  number: string;
  agencyId: string;
  modality: BidModality;
  estimatedValue: number;
  contractedValue: number;
  participants: number;
  proposals: number;
  winnerCompanyId: string;
  openedAt: string;
  object: string;
}

export interface Amendment {
  id: string;
  contractId: string;
  number: number;
  date: string;
  previousValue: number;
  newValue: number;
  reason: string;
}

export interface Payment {
  id: string;
  contractId: string;
  date: string;
  value: number;
  description: string;
}

export interface Contract {
  id: string;
  number: string;
  bidId?: string;
  agencyId: string;
  municipalityId: string;
  companyId: string;
  object: string;
  category: SpendingArea;
  originalValue: number;
  currentValue: number;
  signedAt: string;
  deadline: string;
  status: "Vigente" | "Encerrado" | "Rescindido";
  amendments: Amendment[];
  payments: Payment[];
  medianComparable: number; // mediana de contratos semelhantes
  /** "pncp" quando o contrato veio da ingestão real; ausente = gerado sinteticamente para o MVP. */
  source?: "pncp";
}

export interface Project {
  // "Obra"
  id: string;
  name: string;
  municipalityId: string;
  agencyId: string;
  companyId: string;
  contractId: string;
  lat: number;
  lon: number;
  originalValue: number;
  currentValue: number;
  startedAt: string;
  deadline: string;
  status: "Planejada" | "Em execução" | "Atrasada" | "Concluída" | "Paralisada";
  executedPercent: number | null;
  payments: { date: string; value: number }[];
}

export type SignalType =
  | "preco_fora_padrao"
  | "empresa_recente"
  | "concentracao_fornecedores"
  | "aditivos_elevados"
  | "baixa_concorrencia"
  | "contratos_recorrentes"
  | "crescimento_anormal";

export interface RiskSignal {
  id: string;
  type: SignalType;
  targetType: "company" | "municipality" | "contract" | "project";
  targetId: string;
  points: number; // contribuição para o Fiscaliza Score
  title: string; // ex: "Ponto de atenção"
  data: string; // afirmação factual (DADO)
  analysis: string; // comparação estatística (ANÁLISE)
  interpretation: string; // leitura cautelosa (INTERPRETAÇÃO)
  severity: "info" | "atencao" | "alta" | "critica";
}

export interface FiscalizaScoreBreakdown {
  targetType: "company" | "municipality";
  targetId: string;
  total: number;
  factors: { key: SignalType; label: string; points: number; maxPoints: number }[];
  computedAt: string;
}

export interface Sanction {
  id: string;
  companyId: string;
  type: string;
  agency: string;
  date: string;
  description: string;
}
