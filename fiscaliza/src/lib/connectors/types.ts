/**
 * Contrato comum de todo conector de dados do Fiscaliza.
 *
 * Cada fonte pública (Portal da Transparência, Compras.gov.br, TCEs,
 * portais estaduais/municipais...) tem particularidades de formato,
 * paginação e autenticação. Um conector isola essas particularidades e
 * expõe os dados já normalizados no formato interno do Fiscaliza
 * (`src/lib/types.ts`), para que o motor de análise e as páginas nunca
 * precisem conhecer a fonte original.
 *
 * Prioridade de integração (nesta ordem, quando disponível):
 *   1. API oficial estruturada (ex.: Portal da Transparência, Compras.gov.br)
 *   2. Dataset aberto oficial (ex.: dados.gov.br, CKAN)
 *   3. Scraping — apenas como último recurso, documentado e com cache.
 */

import type { Contract, Bid, Company, Municipality, Payment, DataSource } from "../types";

export interface ConnectorSyncResult {
  source: DataSource;
  contracts: Contract[];
  bids: Bid[];
  companies: Company[];
  payments: Payment[];
  fetchedAt: string;
  simulated: boolean;
  notes?: string;
}

export interface ConnectorParams {
  municipalityId?: string;
  stateId?: string;
  from?: string; // ISO date
  to?: string; // ISO date
}

export interface DataConnector {
  /** Identificador único do conector, ex: "FederalTransparencyConnector" */
  readonly id: string;
  /** Descrição legível da fonte de dados coberta por este conector. */
  readonly description: string;
  /** Metadados da fonte (URL, tipo, se está simulado no ambiente atual). */
  readonly source: DataSource;
  /**
   * Executa a coleta/normalização de dados para os parâmetros informados.
   * Implementações reais devem paginar a API de origem, tratar rate limit
   * e mapear os campos originais para as entidades do Fiscaliza.
   */
  sync(params: ConnectorParams): Promise<ConnectorSyncResult>;
}
