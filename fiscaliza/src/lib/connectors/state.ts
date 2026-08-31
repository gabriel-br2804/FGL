/**
 * StateConnector
 *
 * Fonte real (produção): portais estaduais de transparência. O formato
 * varia por estado — alguns publicam datasets CSV/JSON abertos, outros
 * exigem scraping de portal (usar como último recurso). O MVP implementa
 * o Estado de São Paulo como referência (Portal da Transparência SP —
 * https://www.transparencia.sp.gov.br), com a fábrica `createStateConnector`
 * pronta para instanciar novos estados conforme forem integrados.
 */
import { getDB } from "../data/generate";
import type { ConnectorParams, ConnectorSyncResult, DataConnector } from "./types";

export function createStateConnector(uf: string, portalUrl: string): DataConnector {
  return {
    id: `StateConnector(${uf})`,
    description: `Portal da Transparência do Governo do Estado — ${uf}.`,
    source: {
      id: `src-estado-${uf.toLowerCase()}`,
      name: `Portal da Transparência — Governo de ${uf}`,
      connector: `StateConnector(${uf})`,
      type: "portal_estadual",
      url: portalUrl,
      lastSync: "2026-08-29T22:00:00-03:00",
      simulated: true,
    },
    async sync(params: ConnectorParams): Promise<ConnectorSyncResult> {
      const db = getDB();
      const agencies = db.agencies.filter((a) => a.stateId === uf);
      const agencyIds = new Set(agencies.map((a) => a.id));
      const contracts = db.contracts.filter((c) => agencyIds.has(c.agencyId));
      return {
        source: this.source,
        contracts,
        bids: db.bids.filter((b) => agencyIds.has(b.agencyId)),
        companies: db.companies.filter((co) => contracts.some((c) => c.companyId === co.id)),
        payments: contracts.flatMap((c) => c.payments),
        fetchedAt: new Date().toISOString(),
        simulated: true,
        notes: "MVP: dados simulados no nível estadual.",
      };
    },
  };
}

export const StateConnectorSP = createStateConnector("SP", "https://www.transparencia.sp.gov.br");
