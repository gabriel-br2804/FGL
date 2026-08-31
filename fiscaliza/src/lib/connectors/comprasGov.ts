/**
 * ComprasGovConnector
 *
 * Fonte real (produção): Compras.gov.br — dados abertos de licitações,
 * atas de registro de preços e contratos da Administração Pública Federal.
 * API pública: https://compras.dados.gov.br (formato CKAN/REST, sem
 * necessidade de chave para os endpoints de leitura). PNCP
 * (https://pncp.gov.br) é a fonte complementar para o Novo Marco de
 * Licitações (Lei 14.133/2021) e deve ser priorizado à medida que a base
 * de dados de contratos migra para lá.
 *
 * MVP: retorna licitações (Bid) simuladas, servindo como base para o
 * indicador de "baixa concorrência".
 */
import { getDB } from "../data/generate";
import type { ConnectorParams, ConnectorSyncResult, DataConnector } from "./types";

export const ComprasGovConnector: DataConnector = {
  id: "ComprasGovConnector",
  description: "Compras.gov.br / PNCP — licitações, atas e contratos públicos.",
  source: {
    id: "src-compras-gov",
    name: "Compras.gov.br",
    connector: "ComprasGovConnector",
    type: "compras_gov_br",
    url: "https://compras.dados.gov.br",
    lastSync: "2026-08-30T03:00:00-03:00",
    simulated: true,
  },
  async sync(_params: ConnectorParams): Promise<ConnectorSyncResult> {
    const db = getDB();
    return {
      source: this.source,
      contracts: db.contracts,
      bids: db.bids,
      companies: db.companies,
      payments: [],
      fetchedAt: new Date().toISOString(),
      simulated: true,
      notes: "MVP: dados simulados. Substituir por integração com compras.dados.gov.br / PNCP.",
    };
  },
};
