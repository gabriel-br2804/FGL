/**
 * MunicipalConnector
 *
 * Fonte real (produção): portais municipais de transparência — o elo mais
 * heterogêneo da cadeia (mais de 5.500 municípios, formatos distintos).
 * Muitos municípios pequenos usam plataformas terceirizadas (ex.: mesmo
 * fornecedor de "Portal da Transparência" para várias prefeituras), o que
 * permite reaproveitar parsers entre municípios que compartilham
 * plataforma. Priorizar sempre o dataset aberto (CSV/JSON) do portal
 * antes de recorrer a scraping de HTML.
 *
 * MVP: implementado como referência para Jandira/SP, com fábrica genérica
 * para os demais municípios já presentes na base simulada.
 */
import { getDB } from "../data/generate";
import type { ConnectorParams, ConnectorSyncResult, DataConnector } from "./types";

export function createMunicipalConnector(municipalityId: string, municipalityName: string, portalUrl?: string): DataConnector {
  return {
    id: `MunicipalConnector(${municipalityId})`,
    description: `Portal da Transparência da Prefeitura de ${municipalityName}.`,
    source: {
      id: `src-municipio-${municipalityId}`,
      name: `Portal da Transparência — Prefeitura de ${municipalityName}`,
      connector: `MunicipalConnector(${municipalityId})`,
      type: "portal_municipal",
      url: portalUrl,
      lastSync: "2026-08-29T22:00:00-03:00",
      simulated: true,
    },
    async sync(params: ConnectorParams): Promise<ConnectorSyncResult> {
      const db = getDB();
      const contracts = db.contracts.filter((c) => c.municipalityId === municipalityId);
      return {
        source: this.source,
        contracts,
        bids: db.bids.filter((b) => contracts.some((c) => c.bidId === b.id)),
        companies: db.companies.filter((co) => contracts.some((c) => c.companyId === co.id)),
        payments: contracts.flatMap((c) => c.payments),
        fetchedAt: new Date().toISOString(),
        simulated: true,
        notes: "MVP: dados simulados no nível municipal.",
      };
    },
  };
}

export const MunicipalConnectorJandira = createMunicipalConnector(
  "jandira-sp",
  "Jandira",
  "https://www.jandira.sp.gov.br"
);
