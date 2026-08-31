import { FederalTransparencyConnector } from "./federalTransparency";
import { ComprasGovConnector } from "./comprasGov";
import { TCEConnectorSP } from "./tce";
import { StateConnectorSP } from "./state";
import { MunicipalConnectorJandira } from "./municipal";
import type { DataConnector } from "./types";

/**
 * Registro central de conectores ativos no ambiente atual. A camada de
 * ingestão (pipeline/workers, fora do escopo do MVP web) percorre este
 * registro para sincronizar cada fonte de forma independente e resiliente
 * — a falha de um conector não deve impactar os demais.
 */
export const CONNECTOR_REGISTRY: DataConnector[] = [
  FederalTransparencyConnector,
  ComprasGovConnector,
  TCEConnectorSP,
  StateConnectorSP,
  MunicipalConnectorJandira,
];

export * from "./types";
export { FederalTransparencyConnector, ComprasGovConnector, TCEConnectorSP, StateConnectorSP, MunicipalConnectorJandira };
export { createStateConnector } from "./state";
export { createMunicipalConnector } from "./municipal";
export { createTCEConnector } from "./tce";
