import { MUNICIPALITIES, STATES, StateSeed, MunicipalitySeed } from "./seed-geo";
import {
  COMPANY_CORE,
  COMPANY_FANTASY,
  COMPANY_SUFFIX,
  ACTIVITY_BY_CATEGORY,
  PARTNER_FIRST_NAMES,
  PARTNER_LAST_NAMES,
  CONTRACT_OBJECTS,
  AMENDMENT_REASONS,
} from "./companies-seed";
import { rngFor, pick, randInt, randFloat, weighted } from "./rng";
import type {
  Municipality,
  State,
  Company,
  Person,
  GovernmentEntity,
  Agency,
  Bid,
  Contract,
  Amendment,
  Payment,
  Project,
  SpendingArea,
  DataSource,
  BidModality,
} from "../types";

const CATEGORIES: SpendingArea[] = [
  "Saúde",
  "Educação",
  "Infraestrutura",
  "Segurança",
  "Administração",
  "Transporte",
  "Outros",
];

const CATEGORY_WEIGHT: Record<SpendingArea, number> = {
  Saúde: 28,
  Educação: 22,
  Infraestrutura: 18,
  Administração: 12,
  Segurança: 7,
  Transporte: 7,
  Outros: 6,
};

const AGENCY_BY_CATEGORY: Record<SpendingArea, string> = {
  Saúde: "Secretaria Municipal de Saúde",
  Educação: "Secretaria Municipal de Educação",
  Infraestrutura: "Secretaria Municipal de Obras e Infraestrutura",
  Segurança: "Secretaria Municipal de Segurança Pública",
  Administração: "Secretaria Municipal de Administração",
  Transporte: "Secretaria Municipal de Transportes",
  Outros: "Secretaria Municipal de Assistência Social",
};

function cnpjFormat(rand: () => number): string {
  const n = () => randInt(rand, 0, 9);
  const block = (len: number) => Array.from({ length: len }, n).join("");
  return `${block(2)}.${block(3)}.${block(3)}/0001-${block(2)}`;
}

function slugCompany(name: string, idx: number) {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + `-${idx}`
  );
}

export interface Database {
  states: State[];
  stateById: Map<string, State>;
  municipalities: Municipality[];
  municipalityById: Map<string, Municipality>;
  entities: GovernmentEntity[];
  agencies: Agency[];
  agencyById: Map<string, Agency>;
  companies: Company[];
  companyById: Map<string, Company>;
  people: Person[];
  bids: Bid[];
  bidById: Map<string, Bid>;
  contracts: Contract[];
  contractById: Map<string, Contract>;
  projects: Project[];
  projectById: Map<string, Project>;
  dataSources: DataSource[];
}

function buildDatabase(): Database {
  const states: State[] = STATES.map((s) => ({
    id: s.id,
    name: s.name,
    region: s.region,
    population: s.population,
  }));
  const stateById = new Map(states.map((s) => [s.id, s]));

  const entities: GovernmentEntity[] = [
    { id: "gov-federal", name: "União", sphere: "Federal" },
  ];
  for (const s of STATES) {
    entities.push({ id: `gov-estado-${s.id}`, name: `Governo do Estado de ${s.name}`, sphere: "Estadual" });
  }

  const agencies: Agency[] = [];
  const agencyById = new Map<string, Agency>();
  function addAgency(a: Agency) {
    agencies.push(a);
    agencyById.set(a.id, a);
  }

  addAgency({ id: "ag-fed-saude", name: "Ministério da Saúde", entityId: "gov-federal" });
  addAgency({ id: "ag-fed-educacao", name: "Ministério da Educação", entityId: "gov-federal" });
  addAgency({ id: "ag-fed-infra", name: "Ministério da Infraestrutura", entityId: "gov-federal" });
  addAgency({ id: "ag-fed-compras", name: "Ministério da Gestão — Compras.gov.br", entityId: "gov-federal" });

  for (const s of STATES) {
    entities.push();
    addAgency({
      id: `ag-est-saude-${s.id}`,
      name: `Secretaria Estadual de Saúde — ${s.id}`,
      entityId: `gov-estado-${s.id}`,
      stateId: s.id,
    });
    addAgency({
      id: `ag-est-educacao-${s.id}`,
      name: `Secretaria Estadual de Educação — ${s.id}`,
      entityId: `gov-estado-${s.id}`,
      stateId: s.id,
    });
  }

  // Companies pool
  const companies: Company[] = [];
  const companyById = new Map<string, Company>();
  const people: Person[] = [];
  const N_COMPANIES = 56;

  for (let i = 0; i < N_COMPANIES; i++) {
    const rand = rngFor(`company-${i}`);
    const name = `${pick(rand, COMPANY_CORE)} ${pick(rand, COMPANY_FANTASY)} ${pick(rand, COMPANY_SUFFIX)}`;
    const id = slugCompany(name, i);
    const hq = pick(rand, MUNICIPALITIES);
    const isRecent = rand() < 0.16;
    const openedAt = isRecent
      ? new Date(Date.now() - randInt(rand, 60, 640) * 24 * 3600 * 1000).toISOString()
      : new Date(
          randInt(rand, 1992, 2020),
          randInt(rand, 0, 11),
          randInt(rand, 1, 28)
        ).toISOString();
    const category = pick(rand, CATEGORIES);
    const activity = pick(rand, ACTIVITY_BY_CATEGORY[category] ?? ["Consultoria e assessoria administrativa"]);
    const partnersCount = randInt(rand, 1, 3);
    const partners = Array.from({ length: partnersCount }, (_, pIdx) => {
      const pname = `${pick(rand, PARTNER_FIRST_NAMES)} ${pick(rand, PARTNER_LAST_NAMES)} ${pick(rand, PARTNER_LAST_NAMES)}`;
      const personId = `person-${id}-${pIdx}`;
      people.push({ id: personId, name: pname, role: pIdx === 0 ? "Sócio-administrador" : "Sócio", companies: [id] });
      return { name: pname, role: pIdx === 0 ? "Sócio-administrador" : "Sócio", personId };
    });

    const company: Company = {
      id,
      cnpj: cnpjFormat(rand),
      name,
      status: rand() < 0.94 ? "Ativa" : "Inapta",
      openedAt,
      municipalityId: hq.slug,
      economicActivity: activity,
      totalContracted: 0,
      contractsCount: 0,
      contractingAgenciesCount: 0,
      municipalitiesCount: 0,
      fiscalizaScore: 0,
      partners,
      yearlyContracted: [],
    };
    companies.push(company);
    companyById.set(id, company);
  }

  // Flagship company matching the spec's "Empresa XYZ" example
  const flagshipId = "construtora-nova-aurora-engenharia-ltda-flagship";
  const flagship: Company = {
    id: flagshipId,
    cnpj: "12.345.678/0001-90",
    name: "Construtora Nova Aurora Engenharia LTDA",
    status: "Ativa",
    openedAt: new Date(2014, 3, 12).toISOString(),
    municipalityId: "jandira-sp",
    economicActivity: "Construção de edifícios e obras de infraestrutura",
    totalContracted: 0,
    contractsCount: 0,
    contractingAgenciesCount: 0,
    municipalitiesCount: 0,
    fiscalizaScore: 0,
    partners: [
      { name: "Ricardo Menezes Andrade", role: "Sócio-administrador", personId: "person-flagship-0" },
      { name: "Cláudia Fontoura Reis", role: "Sócia", personId: "person-flagship-1" },
    ],
    yearlyContracted: [],
  };
  people.push(
    { id: "person-flagship-0", name: "Ricardo Menezes Andrade", role: "Sócio-administrador", companies: [flagshipId] },
    { id: "person-flagship-1", name: "Cláudia Fontoura Reis", role: "Sócia", companies: [flagshipId] }
  );
  companies.push(flagship);
  companyById.set(flagshipId, flagship);

  // Municipalities with financials
  const municipalities: Municipality[] = [];
  const municipalityById = new Map<string, Municipality>();

  for (const seed of MUNICIPALITIES) {
    const rand = rngFor(`muni-${seed.slug}`);
    const perCapita = randFloat(rand, 2200, 4600);
    const annualBudget = Math.round(seed.population * perCapita);
    const totalSpent = Math.round(annualBudget * randFloat(rand, 0.58, 0.88));

    const weights = CATEGORIES.map((c) => ({
      item: c,
      weight: CATEGORY_WEIGHT[c] * randFloat(rand, 0.75, 1.3),
    }));
    const weightSum = weights.reduce((s, w) => s + w.weight, 0);
    const spendingByArea = weights.map((w) => ({
      area: w.item,
      value: Math.round((w.weight / weightSum) * totalSpent),
    }));

    const years = [2021, 2022, 2023, 2024, 2025, 2026];
    let base = totalSpent * randFloat(rand, 0.72, 0.86);
    const spendingHistory = years.map((year, idx) => {
      if (idx === years.length - 1) return { year, value: totalSpent };
      base = base * randFloat(rand, 1.02, 1.11);
      return { year, value: Math.round(base) };
    });

    // Escala logarítmica (não sqrt) para manter o volume de contratos por
    // município num intervalo realista de demonstração — antes disso,
    // municípios grandes (ex.: São Paulo) geravam milhares de contratos e
    // tornavam a build inviável.
    const totalContracts = Math.max(18, Math.round((6 + Math.log10(seed.population) * 8) * randFloat(rand, 0.85, 1.15)));
    const totalSuppliers = Math.max(6, Math.round(totalContracts * randFloat(rand, 0.5, 0.75)));

    const muni: Municipality = {
      id: seed.slug,
      ibgeCode: String(1000000 + Math.floor(rand() * 8999999)),
      name: seed.name,
      stateId: seed.stateId,
      population: seed.population,
      annualBudget,
      totalSpent,
      totalContracts,
      totalSuppliers,
      attentionPoints: 0,
      fiscalizaScore: 0,
      spendingByArea,
      spendingHistory,
      lat: seed.lat,
      lon: seed.lon,
    };
    municipalities.push(muni);
    municipalityById.set(muni.id, muni);

    entities.push({ id: `gov-muni-${muni.id}`, name: `Prefeitura Municipal de ${muni.name}`, sphere: "Municipal" });
    for (const cat of CATEGORIES) {
      addAgency({
        id: `ag-${muni.id}-${cat}`,
        name: AGENCY_BY_CATEGORY[cat],
        entityId: `gov-muni-${muni.id}`,
        municipalityId: muni.id,
      });
    }
  }

  // Contracts, bids, amendments, payments per municipality
  const bids: Bid[] = [];
  const bidById = new Map<string, Bid>();
  const contracts: Contract[] = [];
  const contractById = new Map<string, Contract>();

  const modalityPool: { item: BidModality; weight: number }[] = [
    { item: "Pregão Eletrônico", weight: 55 },
    { item: "Dispensa de Licitação", weight: 18 },
    { item: "Concorrência", weight: 12 },
    { item: "Tomada de Preços", weight: 8 },
    { item: "Inexigibilidade", weight: 4 },
    { item: "Convite", weight: 3 },
  ];

  // Recent-contract-value cache per category, for median comparison
  const categoryValueSamples: Record<SpendingArea, number[]> = {
    Saúde: [],
    Educação: [],
    Infraestrutura: [],
    Segurança: [],
    Administração: [],
    Transporte: [],
    Outros: [],
  };

  function median(arr: number[]) {
    if (arr.length === 0) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  function baseValueFor(category: SpendingArea, muniPopulation: number, rand: () => number) {
    const scale = Math.max(1, Math.log10(muniPopulation) - 3);
    const catBase: Record<SpendingArea, number> = {
      Saúde: 180000,
      Educação: 150000,
      Infraestrutura: 420000,
      Segurança: 90000,
      Administração: 70000,
      Transporte: 110000,
      Outros: 50000,
    };
    return catBase[category] * scale * randFloat(rand, 0.5, 1.8);
  }

  let contractSeq = 0;
  let bidSeq = 0;

  function makeContractsForMunicipality(muni: Municipality, count: number, companyPool: Company[]) {
    const rand = rngFor(`contracts-${muni.id}`);
    for (let i = 0; i < count; i++) {
      const category = weighted(
        rand,
        CATEGORIES.map((c) => ({ item: c, weight: CATEGORY_WEIGHT[c] }))
      );
      const agencyId = `ag-${muni.id}-${category}`;
      const company = pick(rand, companyPool);
      const modality = weighted(rand, modalityPool);
      const estimatedValue = Math.round(baseValueFor(category, muni.population, rand));

      let contractedMultiplier = randFloat(rand, 0.85, 1.15);
      const isOutlier = rand() < 0.14;
      if (isOutlier) contractedMultiplier *= randFloat(rand, 1.35, 2.1);
      const originalValue = Math.round(estimatedValue * contractedMultiplier);

      const participants = isOutlier && rand() < 0.55 ? randInt(rand, 1, 1) : randInt(rand, 1, 9);
      const proposals = Math.max(1, participants - randInt(rand, 0, 1));

      bidSeq++;
      const bidId = `bid-${bidSeq}`;
      const openedAt = new Date(
        randInt(rand, 2022, 2026),
        randInt(rand, 0, 11),
        randInt(rand, 1, 28)
      ).toISOString();
      const object = pick(rand, CONTRACT_OBJECTS[category]);

      const bid: Bid = {
        id: bidId,
        number: `${randInt(rand, 1, 400)}/${new Date(openedAt).getFullYear()}`,
        agencyId,
        modality,
        estimatedValue,
        contractedValue: originalValue,
        participants,
        proposals,
        winnerCompanyId: company.id,
        openedAt,
        object,
      };
      bids.push(bid);
      bidById.set(bidId, bid);

      // amendments
      const amendments: Amendment[] = [];
      const hasAmendments = rand() < 0.4;
      let currentValue = originalValue;
      if (hasAmendments) {
        const nAmend = randInt(rand, 1, 3);
        let prev = originalValue;
        for (let a = 0; a < nAmend; a++) {
          const bump = randFloat(rand, 0.08, a === nAmend - 1 && rand() < 0.3 ? 0.45 : 0.22);
          const next = Math.round(prev * (1 + bump));
          const date = new Date(
            new Date(openedAt).getFullYear() + a,
            randInt(rand, 0, 11),
            randInt(rand, 1, 28)
          ).toISOString();
          amendments.push({
            id: `amend-${bidId}-${a}`,
            contractId: "",
            number: a + 1,
            date,
            previousValue: prev,
            newValue: next,
            reason: pick(rand, AMENDMENT_REASONS),
          });
          prev = next;
        }
        currentValue = prev;
      }

      contractSeq++;
      const contractId = `contract-${contractSeq}`;
      amendments.forEach((a) => (a.contractId = contractId));

      const deadline = new Date(
        new Date(openedAt).getFullYear() + randInt(rand, 1, 3),
        randInt(rand, 0, 11),
        randInt(rand, 1, 28)
      ).toISOString();

      const nPayments = randInt(rand, 3, 10);
      const payments: Payment[] = Array.from({ length: nPayments }, (_, pIdx) => {
        const date = new Date(
          new Date(openedAt).getTime() + (pIdx + 1) * 26 * 24 * 3600 * 1000
        ).toISOString();
        return {
          id: `pay-${contractId}-${pIdx}`,
          contractId,
          date,
          value: Math.round(currentValue / nPayments),
          description: `Medição/parcela ${pIdx + 1} — ${object}`,
        };
      });

      categoryValueSamples[category].push(currentValue);

      const contract: Contract = {
        id: contractId,
        number: `${randInt(rand, 1, 999)}/${new Date(openedAt).getFullYear()}`,
        bidId,
        agencyId,
        municipalityId: muni.id,
        companyId: company.id,
        object,
        category,
        originalValue,
        currentValue,
        signedAt: openedAt,
        deadline,
        status: new Date(deadline) < new Date("2026-08-31") ? (rand() < 0.85 ? "Encerrado" : "Rescindido") : "Vigente",
        amendments,
        payments,
        medianComparable: 0, // filled after all contracts are generated
      };
      contracts.push(contract);
      contractById.set(contractId, contract);
    }
  }

  // A empresa "vitrine" (Construtora Nova Aurora) só concorre num conjunto
  // fixo de municípios — do contrário, entrar no pool de todos os 37
  // municípios a levaria a centenas de contratos e dezenas de órgãos,
  // muito acima do exemplo ilustrativo descrito na especificação (~38
  // contratos, 7 órgãos, 12 municípios).
  const FLAGSHIP_MUNICIPALITIES = new Set([
    "jandira-sp",
    "sao-paulo-sp",
    "campinas-sp",
    "rio-de-janeiro-rj",
    "belo-horizonte-mg",
    "curitiba-pr",
    "porto-alegre-rs",
    "salvador-ba",
    "recife-pe",
    "fortaleza-ce",
    "brasilia-df",
    "goiania-go",
  ]);
  const nonFlagshipCompanies = companies.filter((c) => c.id !== flagshipId);

  for (const muni of municipalities) {
    const rand = rngFor(`pool-${muni.id}`);
    const localCount = Math.max(3, Math.round(muni.totalContracts * 0.7));
    const localPool = Array.from({ length: 10 }, () => pick(rand, nonFlagshipCompanies));
    const pool = FLAGSHIP_MUNICIPALITIES.has(muni.id) ? [...localPool, flagship] : localPool;
    makeContractsForMunicipality(muni, localCount, pool);
  }

  // Fill median comparable now that category samples are complete
  for (const c of contracts) {
    contractById.get(c.id)!.medianComparable = median(categoryValueSamples[c.category]);
  }

  // Ensure flagship spans ~12 municipalities / 7 agencies / 38 contracts / ~R$47.8M
  const flagshipContracts = contracts.filter((c) => c.companyId === flagshipId);
  // top up / trim lightly is unnecessary for MVP realism — derive aggregates from actuals below.

  // Derive company aggregates
  for (const company of companies) {
    const own = contracts.filter((c) => c.companyId === company.id);
    company.totalContracted = own.reduce((s, c) => s + c.currentValue, 0);
    company.contractsCount = own.length;
    company.contractingAgenciesCount = new Set(own.map((c) => c.agencyId)).size;
    company.municipalitiesCount = new Set(own.map((c) => c.municipalityId)).size;
    const byYear = new Map<number, number>();
    for (const c of own) {
      const y = new Date(c.signedAt).getFullYear();
      byYear.set(y, (byYear.get(y) ?? 0) + c.currentValue);
    }
    company.yearlyContracted = Array.from(byYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, value]) => ({ year, value }));
  }

  // Projects ("obras") — derived from Infraestrutura + some Saúde/Educação contracts with higher value
  const projects: Project[] = [];
  const projectById = new Map<string, Project>();
  const projectCandidates = contracts
    .filter((c) => c.category === "Infraestrutura" && c.currentValue > 150000)
    .sort((a, b) => b.currentValue - a.currentValue);

  let projSeq = 0;
  for (const c of projectCandidates) {
    if (projSeq >= 90) break;
    const rand = rngFor(`project-${c.id}`);
    if (rand() > 0.55) continue;
    const muni = municipalityById.get(c.municipalityId)!;
    projSeq++;
    const id = `obra-${projSeq}`;
    const startedAt = c.signedAt;
    const executed = rand();
    let status: Project["status"] = "Em execução";
    let executedPercent: number | null = Math.round(executed * 100);
    if (new Date(c.deadline) < new Date("2025-06-01")) {
      status = rand() < 0.82 ? "Concluída" : "Paralisada";
      executedPercent = status === "Concluída" ? 100 : Math.round(randFloat(rand, 20, 70));
    } else if (new Date(c.deadline) < new Date("2026-08-31")) {
      status = rand() < 0.4 ? "Atrasada" : "Em execução";
    } else {
      status = rand() < 0.15 ? "Planejada" : "Em execução";
      if (status === "Planejada") executedPercent = 0;
    }

    const project: Project = {
      id,
      name: `${c.object} — ${muni.name}`,
      municipalityId: muni.id,
      agencyId: c.agencyId,
      companyId: c.companyId,
      contractId: c.id,
      lat: muni.lat + randFloat(rand, -0.05, 0.05),
      lon: muni.lon + randFloat(rand, -0.05, 0.05),
      originalValue: c.originalValue,
      currentValue: c.currentValue,
      startedAt,
      deadline: c.deadline,
      status,
      executedPercent,
      payments: c.payments.map((p) => ({ date: p.date, value: p.value })),
    };
    projects.push(project);
    projectById.set(id, project);
  }

  const dataSources: DataSource[] = [
    {
      id: "src-portal-transparencia",
      name: "Portal da Transparência (Governo Federal)",
      connector: "FederalTransparencyConnector",
      type: "portal_transparencia_federal",
      url: "https://portaldatransparencia.gov.br",
      lastSync: "2026-08-30T03:00:00-03:00",
      simulated: true,
    },
    {
      id: "src-dados-gov",
      name: "dados.gov.br",
      connector: "DadosGovConnector",
      type: "dados_gov_br",
      url: "https://dados.gov.br",
      lastSync: "2026-08-30T03:00:00-03:00",
      simulated: true,
    },
    {
      id: "src-compras-gov",
      name: "Compras.gov.br",
      connector: "ComprasGovConnector",
      type: "compras_gov_br",
      url: "https://www.gov.br/compras",
      lastSync: "2026-08-30T03:00:00-03:00",
      simulated: true,
    },
    {
      id: "src-tce-sp",
      name: "Tribunal de Contas do Estado de São Paulo",
      connector: "TCEConnector (SP)",
      type: "tce",
      url: "https://www.tce.sp.gov.br",
      lastSync: "2026-08-29T22:00:00-03:00",
      simulated: true,
    },
    {
      id: "src-sp-transparencia",
      name: "Portal da Transparência — Governo de São Paulo",
      connector: "StateConnector (SP)",
      type: "portal_estadual",
      url: "https://www.transparencia.sp.gov.br",
      lastSync: "2026-08-29T22:00:00-03:00",
      simulated: true,
    },
    {
      id: "src-jandira",
      name: "Portal da Transparência — Prefeitura de Jandira",
      connector: "MunicipalConnector (Jandira/SP)",
      type: "portal_municipal",
      url: "https://www.jandira.sp.gov.br",
      lastSync: "2026-08-29T22:00:00-03:00",
      simulated: true,
    },
  ];

  return {
    states,
    stateById,
    municipalities,
    municipalityById,
    entities,
    agencies,
    agencyById,
    companies,
    companyById,
    people,
    bids,
    bidById,
    contracts,
    contractById,
    projects,
    projectById,
    dataSources,
  };
}

let _db: Database | null = null;
export function getDB(): Database {
  if (!_db) _db = buildDatabase();
  return _db;
}
