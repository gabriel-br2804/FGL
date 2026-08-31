/**
 * Data "atual" fictícia usada consistentemente em toda a base simulada do
 * MVP (score, sinais de risco, geração de empresas/contratos, respostas da
 * IA). Centralizada aqui para nunca divergir do relógio real da máquina
 * que roda o app — foi exatamente essa divergência que causava empresas
 * com contratos datados antes da própria abertura.
 */
export const APP_NOW = new Date("2026-08-31T00:00:00.000Z");
export const APP_NOW_MS = APP_NOW.getTime();
