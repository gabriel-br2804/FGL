/**
 * FederalTransparencyConnector
 *
 * Fonte real (produção): Portal da Transparência do Governo Federal.
 * API pública documentada em https://api.portaldatransparencia.gov.br
 * (requer chave de API gratuita via cadastro). Endpoints relevantes:
 *   - /api-de-dados/contratos
 *   - /api-de-dados/despesas
 *   - /api-de-dados/convenios
 *   - /api-de-dados/licitacoes
 *
 * MVP: este conector retorna um recorte dos dados simulados marcados como
 * de origem federal, mantendo a mesma assinatura que a implementação real
 * terá (paginação por órgão/ano, normalização de valores em centavos etc).
 */
import { getDB } from "../data/generate";
import type { ConnectorParams, ConnectorSyncResult, DataConnector } from "./types";

export const FederalTransparencyConnector: DataConnector = {
  id: "FederalTransparencyConnector",
  description: "Portal da Transparência — contratos, despesas e convênios do Governo Federal.",
  source: {
    id: "src-portal-transparencia",
    name: "Portal da Transparência (Governo Federal)",
    connector: "FederalTransparencyConnector",
    type: "portal_transparencia_federal",
    url: "https://api.portaldatransparencia.gov.br",
    lastSync: "2026-08-30T03:00:00-03:00",
    simulated: true,
  },
  async sync(_params: ConnectorParams): Promise<ConnectorSyncResult> {
    const db = getDB();
    const federalAgencies = new Set(db.agencies.filter((a) => a.id.startsWith("ag-fed-")).map((a) => a.id));
    const contracts = db.contracts.filter((c) => federalAgencies.has(c.agencyId));
    return {
      source: this.source,
      contracts,
      bids: db.bids.filter((b) => federalAgencies.has(b.agencyId)),
      companies: db.companies.filter((co) => contracts.some((c) => c.companyId === co.id)),
      payments: contracts.flatMap((c) => c.payments),
      fetchedAt: new Date().toISOString(),
      simulated: true,
      notes: "MVP: dados simulados. Substituir por chamadas paginadas à API do Portal da Transparência.",
    };
  },
};
