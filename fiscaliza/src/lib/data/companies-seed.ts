/**
 * Nomes de empresas 100% fictícios, gerados por combinação de palavras
 * genéricas. Qualquer semelhança com empresas reais é coincidência —
 * o objetivo é demonstrar a plataforma sem citar CNPJs ou razões sociais
 * reais nesta fase de MVP.
 */

export const COMPANY_CORE = [
  "Construtora",
  "Engenharia",
  "Serviços",
  "Comércio e Serviços",
  "Tecnologia",
  "Alimentos",
  "Transportes",
  "Assessoria",
  "Soluções",
  "Consultoria",
];

export const COMPANY_FANTASY = [
  "Aurora",
  "Horizonte",
  "Vértice",
  "Prisma",
  "Atlas",
  "Zênite",
  "Nexus",
  "Matriz",
  "Bússola",
  "Meridiano",
  "Planalto",
  "Cerrado",
  "Litoral",
  "Fronteira",
  "Cidadela",
  "Pórtico",
  "Vetor",
  "Cardinal",
  "Solstício",
  "Ipê",
  "Cardeal",
  "Elo",
  "Órbita",
  "Alfa Sul",
  "Nova Era",
];

export const COMPANY_SUFFIX = ["LTDA", "EIRELI", "S.A.", "ME"];

export const ECONOMIC_ACTIVITIES = [
  "Construção de edifícios e obras de infraestrutura",
  "Engenharia e projetos técnicos",
  "Serviços de limpeza e conservação predial",
  "Fornecimento de insumos e equipamentos hospitalares",
  "Serviços médicos e de saúde especializados",
  "Alimentação e nutrição escolar",
  "Transporte e logística",
  "Desenvolvimento e manutenção de sistemas de tecnologia da informação",
  "Consultoria e assessoria administrativa",
  "Locação de veículos e máquinas",
  "Segurança eletrônica e monitoramento",
  "Comércio atacadista de materiais de construção",
];

export const ACTIVITY_BY_CATEGORY: Record<string, string[]> = {
  Saúde: [
    "Fornecimento de insumos e equipamentos hospitalares",
    "Serviços médicos e de saúde especializados",
  ],
  Educação: [
    "Alimentação e nutrição escolar",
    "Comércio atacadista de materiais escolares",
  ],
  Infraestrutura: [
    "Construção de edifícios e obras de infraestrutura",
    "Engenharia e projetos técnicos",
    "Comércio atacadista de materiais de construção",
  ],
  Segurança: ["Segurança eletrônica e monitoramento"],
  Administração: [
    "Serviços de limpeza e conservação predial",
    "Desenvolvimento e manutenção de sistemas de tecnologia da informação",
    "Consultoria e assessoria administrativa",
  ],
  Transporte: ["Transporte e logística", "Locação de veículos e máquinas"],
  Outros: ["Consultoria e assessoria administrativa"],
};

export const PARTNER_FIRST_NAMES = [
  "Marcos",
  "Ana",
  "Carlos",
  "Fernanda",
  "Roberto",
  "Juliana",
  "Paulo",
  "Camila",
  "Ricardo",
  "Patrícia",
  "Eduardo",
  "Larissa",
  "Sérgio",
  "Vanessa",
  "André",
  "Renata",
];

export const PARTNER_LAST_NAMES = [
  "Silva",
  "Souza",
  "Oliveira",
  "Costa",
  "Almeida",
  "Pereira",
  "Ferreira",
  "Ribeiro",
  "Carvalho",
  "Gomes",
  "Martins",
  "Barbosa",
  "Rocha",
  "Dias",
  "Nunes",
];

export const CONTRACT_OBJECTS: Record<string, string[]> = {
  Saúde: [
    "Aquisição de insumos e materiais hospitalares",
    "Contratação de serviços médicos especializados",
    "Fornecimento contínuo de medicamentos",
    "Manutenção de equipamentos hospitalares",
    "Serviços de apoio ao atendimento ambulatorial",
  ],
  Educação: [
    "Fornecimento de merenda escolar",
    "Reforma e manutenção de unidades escolares",
    "Aquisição de material didático",
    "Serviços de transporte escolar",
    "Locação de estrutura para eventos educacionais",
  ],
  Infraestrutura: [
    "Pavimentação e recapeamento de vias públicas",
    "Construção de praça pública",
    "Reforma de ponte municipal",
    "Serviços de drenagem urbana",
    "Construção de unidade de saúde",
    "Ampliação de rede de iluminação pública",
  ],
  Segurança: [
    "Aquisição de viaturas para a guarda municipal",
    "Serviços de monitoramento por câmeras",
    "Manutenção de sistema de videomonitoramento",
  ],
  Administração: [
    "Serviços de limpeza e conservação predial",
    "Locação de veículos administrativos",
    "Serviços de tecnologia da informação",
    "Consultoria administrativa e organizacional",
    "Serviços de apoio administrativo",
  ],
  Transporte: [
    "Manutenção da frota municipal",
    "Serviços de transporte de passageiros",
    "Aquisição de combustível para frota pública",
  ],
  Outros: [
    "Serviços gerais de apoio",
    "Organização de eventos institucionais",
    "Serviços de assistência social",
  ],
};

export const AMENDMENT_REASONS = [
  "Reajuste de preços por variação de insumos",
  "Acréscimo de escopo solicitado pela secretaria",
  "Prorrogação de prazo de execução",
  "Alteração de quantitativos contratados",
  "Complementação de serviços não previstos no projeto original",
];
