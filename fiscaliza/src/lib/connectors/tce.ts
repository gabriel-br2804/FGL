/**
 * TCEConnector
 *
 * Fonte real (produção): Tribunais de Contas dos Estados (TCEs) e Tribunal
 * de Contas da União (TCU). Cada Tribunal expõe seus próprios portais e,
 * em alguns casos, APIs de dados abertos (ex.: TCE-SP possui portal de
 * dados abertos em https://www.tce.sp.gov.br/dados-abertos). Este
 * conector é parametrizado por UF para permitir múltiplas instâncias
 * (TCEConnector("SP"), TCEConnector("MG")...).
 *
 * Cobre principalmente: sanções, inabilitações, julgamento de contas e
 * pareceres sobre licitações — usados no módulo de sanções (Sanction).
 */
import type { ConnectorParams, ConnectorSyncResult, DataConnector } from "./types";

export function createTCEConnector(uf: string): DataConnector {
  return {
    id: `TCEConnector(${uf})`,
    description: `Tribunal de Contas do Estado de ${uf} — sanções, julgamentos e pareceres de contas.`,
    source: {
      id: `src-tce-${uf.toLowerCase()}`,
      name: `Tribunal de Contas do Estado — ${uf}`,
      connector: `TCEConnector(${uf})`,
      type: "tce",
      lastSync: "2026-08-29T22:00:00-03:00",
      simulated: true,
    },
    async sync(_params: ConnectorParams): Promise<ConnectorSyncResult> {
      return {
        source: this.source,
        contracts: [],
        bids: [],
        companies: [],
        payments: [],
        fetchedAt: new Date().toISOString(),
        simulated: true,
        notes:
          "MVP: sem integração ativa neste conector. Estrutura pronta para receber dados de sanções e julgamentos por UF.",
      };
    },
  };
}

export const TCEConnectorSP = createTCEConnector("SP");
