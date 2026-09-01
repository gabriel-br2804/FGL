/**
 * Referências geográficas e demográficas usadas para gerar o universo
 * simulado do MVP. População e coordenadas são valores de referência
 * aproximados (ordem de grandeza pública/IBGE) usados apenas para dar
 * plausibilidade aos dados fictícios — não são obtidos de uma API ao vivo
 * nesta versão. Ver /fontes e /metodologia para o aviso completo.
 */

export interface StateSeed {
  id: string;
  name: string;
  region: "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul";
  population: number;
}

export const STATES: StateSeed[] = [
  { id: "AC", name: "Acre", region: "Norte", population: 830000 },
  { id: "AP", name: "Amapá", region: "Norte", population: 730000 },
  { id: "AM", name: "Amazonas", region: "Norte", population: 3900000 },
  { id: "PA", name: "Pará", region: "Norte", population: 8100000 },
  { id: "RO", name: "Rondônia", region: "Norte", population: 1580000 },
  { id: "RR", name: "Roraima", region: "Norte", population: 630000 },
  { id: "TO", name: "Tocantins", region: "Norte", population: 1500000 },
  { id: "AL", name: "Alagoas", region: "Nordeste", population: 3100000 },
  { id: "BA", name: "Bahia", region: "Nordeste", population: 14100000 },
  { id: "CE", name: "Ceará", region: "Nordeste", population: 8800000 },
  { id: "MA", name: "Maranhão", region: "Nordeste", population: 6700000 },
  { id: "PB", name: "Paraíba", region: "Nordeste", population: 3900000 },
  { id: "PE", name: "Pernambuco", region: "Nordeste", population: 9000000 },
  { id: "PI", name: "Piauí", region: "Nordeste", population: 3270000 },
  { id: "RN", name: "Rio Grande do Norte", region: "Nordeste", population: 3300000 },
  { id: "SE", name: "Sergipe", region: "Nordeste", population: 2200000 },
  { id: "DF", name: "Distrito Federal", region: "Centro-Oeste", population: 2800000 },
  { id: "GO", name: "Goiás", region: "Centro-Oeste", population: 7000000 },
  { id: "MT", name: "Mato Grosso", region: "Centro-Oeste", population: 3500000 },
  { id: "MS", name: "Mato Grosso do Sul", region: "Centro-Oeste", population: 2800000 },
  { id: "ES", name: "Espírito Santo", region: "Sudeste", population: 3800000 },
  { id: "MG", name: "Minas Gerais", region: "Sudeste", population: 20500000 },
  { id: "RJ", name: "Rio de Janeiro", region: "Sudeste", population: 16000000 },
  { id: "SP", name: "São Paulo", region: "Sudeste", population: 44400000 },
  { id: "PR", name: "Paraná", region: "Sul", population: 11400000 },
  { id: "RS", name: "Rio Grande do Sul", region: "Sul", population: 10800000 },
  { id: "SC", name: "Santa Catarina", region: "Sul", population: 7600000 },
];

export interface MunicipalitySeed {
  slug: string;
  name: string;
  stateId: string;
  population: number;
  lat: number;
  lon: number;
  capital: boolean;
}

export const MUNICIPALITIES: MunicipalitySeed[] = [
  { slug: "rio-branco-ac", name: "Rio Branco", stateId: "AC", population: 413000, lat: -9.97, lon: -67.81, capital: true },
  { slug: "macapa-ap", name: "Macapá", stateId: "AP", population: 512000, lat: 0.03, lon: -51.07, capital: true },
  { slug: "manaus-am", name: "Manaus", stateId: "AM", population: 2280000, lat: -3.1, lon: -60.02, capital: true },
  { slug: "belem-pa", name: "Belém", stateId: "PA", population: 1300000, lat: -1.46, lon: -48.5, capital: true },
  { slug: "porto-velho-ro", name: "Porto Velho", stateId: "RO", population: 540000, lat: -8.76, lon: -63.9, capital: true },
  { slug: "boa-vista-rr", name: "Boa Vista", stateId: "RR", population: 420000, lat: 2.82, lon: -60.67, capital: true },
  { slug: "palmas-to", name: "Palmas", stateId: "TO", population: 310000, lat: -10.24, lon: -48.36, capital: true },
  { slug: "maceio-al", name: "Maceió", stateId: "AL", population: 1030000, lat: -9.65, lon: -35.7, capital: true },
  { slug: "salvador-ba", name: "Salvador", stateId: "BA", population: 2900000, lat: -12.97, lon: -38.51, capital: true },
  { slug: "feira-de-santana-ba", name: "Feira de Santana", stateId: "BA", population: 620000, lat: -12.27, lon: -38.97, capital: false },
  { slug: "fortaleza-ce", name: "Fortaleza", stateId: "CE", population: 2700000, lat: -3.72, lon: -38.54, capital: true },
  { slug: "sao-luis-ma", name: "São Luís", stateId: "MA", population: 1110000, lat: -2.53, lon: -44.3, capital: true },
  { slug: "joao-pessoa-pb", name: "João Pessoa", stateId: "PB", population: 830000, lat: -7.12, lon: -34.86, capital: true },
  { slug: "recife-pe", name: "Recife", stateId: "PE", population: 1650000, lat: -8.05, lon: -34.9, capital: true },
  { slug: "petrolina-pe", name: "Petrolina", stateId: "PE", population: 350000, lat: -9.39, lon: -40.5, capital: false },
  { slug: "teresina-pi", name: "Teresina", stateId: "PI", population: 870000, lat: -5.09, lon: -42.8, capital: true },
  { slug: "natal-rn", name: "Natal", stateId: "RN", population: 900000, lat: -5.79, lon: -35.21, capital: true },
  { slug: "aracaju-se", name: "Aracaju", stateId: "SE", population: 660000, lat: -10.91, lon: -37.07, capital: true },
  { slug: "brasilia-df", name: "Brasília", stateId: "DF", population: 3100000, lat: -15.79, lon: -47.88, capital: true },
  { slug: "goiania-go", name: "Goiânia", stateId: "GO", population: 1560000, lat: -16.68, lon: -49.25, capital: true },
  { slug: "anapolis-go", name: "Anápolis", stateId: "GO", population: 400000, lat: -16.33, lon: -48.95, capital: false },
  { slug: "cuiaba-mt", name: "Cuiabá", stateId: "MT", population: 620000, lat: -15.6, lon: -56.1, capital: true },
  { slug: "campo-grande-ms", name: "Campo Grande", stateId: "MS", population: 920000, lat: -20.44, lon: -54.65, capital: true },
  { slug: "vitoria-es", name: "Vitória", stateId: "ES", population: 365000, lat: -20.32, lon: -40.34, capital: true },
  { slug: "belo-horizonte-mg", name: "Belo Horizonte", stateId: "MG", population: 2530000, lat: -19.92, lon: -43.94, capital: true },
  { slug: "uberlandia-mg", name: "Uberlândia", stateId: "MG", population: 700000, lat: -18.91, lon: -48.28, capital: false },
  { slug: "rio-de-janeiro-rj", name: "Rio de Janeiro", stateId: "RJ", population: 6210000, lat: -22.91, lon: -43.17, capital: true },
  { slug: "niteroi-rj", name: "Niterói", stateId: "RJ", population: 500000, lat: -22.88, lon: -43.1, capital: false },
  { slug: "sao-paulo-sp", name: "São Paulo", stateId: "SP", population: 11450000, lat: -23.55, lon: -46.63, capital: true },
  { slug: "campinas-sp", name: "Campinas", stateId: "SP", population: 1220000, lat: -22.91, lon: -47.06, capital: false },
  { slug: "guarulhos-sp", name: "Guarulhos", stateId: "SP", population: 1400000, lat: -23.46, lon: -46.53, capital: false },
  { slug: "jandira-sp", name: "Jandira", stateId: "SP", population: 122000, lat: -23.53, lon: -46.9, capital: false },
  { slug: "curitiba-pr", name: "Curitiba", stateId: "PR", population: 1770000, lat: -25.43, lon: -49.27, capital: true },
  { slug: "londrina-pr", name: "Londrina", stateId: "PR", population: 580000, lat: -23.31, lon: -51.16, capital: false },
  { slug: "porto-alegre-rs", name: "Porto Alegre", stateId: "RS", population: 1330000, lat: -30.03, lon: -51.23, capital: true },
  { slug: "caxias-do-sul-rs", name: "Caxias do Sul", stateId: "RS", population: 520000, lat: -29.17, lon: -51.18, capital: false },
  { slug: "florianopolis-sc", name: "Florianópolis", stateId: "SC", population: 520000, lat: -27.6, lon: -48.55, capital: true },
];

/** Layout aproximado de um cartograma (hex/grid) do Brasil por UF — usado
 * apenas para posicionar os botões de estado no Mapa de forma que lembre a
 * geografia do país. Não é uma projeção cartográfica real. */
export const STATE_GRID: Record<string, { col: number; row: number }> = {
  RR: { col: 3, row: 0 },
  AP: { col: 5, row: 0 },
  AM: { col: 2, row: 1 },
  PA: { col: 5, row: 1 },
  MA: { col: 7, row: 1 },
  CE: { col: 9, row: 1 },
  RN: { col: 10, row: 2 },
  AC: { col: 0, row: 2 },
  RO: { col: 2, row: 2 },
  TO: { col: 5, row: 2 },
  PI: { col: 7, row: 2 },
  PB: { col: 10, row: 3 },
  PE: { col: 9, row: 3 },
  AL: { col: 10, row: 4 },
  MT: { col: 3, row: 3 },
  BA: { col: 7, row: 3 },
  SE: { col: 10, row: 5 },
  DF: { col: 5, row: 4 },
  GO: { col: 4, row: 4 },
  MS: { col: 3, row: 5 },
  MG: { col: 6, row: 5 },
  ES: { col: 8, row: 5 },
  SP: { col: 5, row: 6 },
  RJ: { col: 7, row: 6 },
  PR: { col: 4, row: 7 },
  SC: { col: 5, row: 8 },
  RS: { col: 4, row: 9 },
};
