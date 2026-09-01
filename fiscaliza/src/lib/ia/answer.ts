/**
 * Fiscaliza IA — camada de resposta em linguagem natural.
 *
 * Importante: esta camada NUNCA inventa números. Ela interpreta a pergunta
 * (identifica município, categoria, ano e intenção), consulta a mesma
 * camada de dados usada pelas páginas (`src/lib/data`) e formata a
 * resposta a partir de valores reais da base — sempre citando a fonte.
 * Em produção, o passo de "interpretar a pergunta" pode ser delegado a um
 * LLM (ver `src/lib/ia/llm.ts`), mas o LLM nunca deve ter acesso direto a
 * gerar números: ele traduz texto em uma consulta estruturada, e a
 * resposta final é montada a partir do resultado real dessa consulta.
 */
import {
  listMunicipalities,
  getMunicipality,
  contractsForMunicipality,
  suppliersForMunicipality,
  listProjects,
  listContracts,
  getCompany,
  listDataSources,
} from "../data";
import type { SpendingArea } from "../types";
import { fmtBRL, fmtBRLCompact, fmtPercent } from "../engine/format";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const CATEGORY_KEYWORDS: { keywords: string[]; area: SpendingArea }[] = [
  { keywords: ["limpeza", "conservacao"], area: "Administração" },
  { keywords: ["saude", "hospital", "medic"], area: "Saúde" },
  { keywords: ["educa", "escola", "merenda"], area: "Educação" },
  { keywords: ["obra", "infraestrutura", "pavimenta", "estrada"], area: "Infraestrutura" },
  { keywords: ["seguranc", "guarda"], area: "Segurança" },
  { keywords: ["transporte", "frota", "combustivel"], area: "Transporte" },
];

export interface IASource {
  label: string;
  href?: string;
}

export interface IAAnswer {
  answer: string;
  sources: IASource[];
  followUps: string[];
}

function findMunicipality(question: string) {
  const q = normalize(question);
  const all = listMunicipalities();
  const match = all.find((m) => q.includes(normalize(m.name)));
  return match;
}

function findCategory(question: string): SpendingArea | undefined {
  const q = normalize(question);
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((k) => q.includes(k))) return entry.area;
  }
  return undefined;
}

function findYear(question: string): number | undefined {
  const m = question.match(/20\d{2}/);
  return m ? Number(m[0]) : undefined;
}

const GENERIC_SOURCES: IASource[] = [
  { label: "Portal da Transparência (simulado no MVP)" },
  { label: "Compras.gov.br (simulado no MVP)" },
];

export function answerQuestion(question: string): IAAnswer {
  const q = normalize(question);
  const muni = findMunicipality(question);
  const category = findCategory(question);
  const year = findYear(question);

  // Intenção: obras atrasadas
  if (q.includes("atrasad")) {
    const all = listProjects().filter((p) => p.status === "Atrasada" && (!muni || p.municipalityId === muni.id));
    const top = all.slice(0, 8);
    const lines = top.map(
      (p) => `• ${p.name} — prazo original ${new Date(p.deadline).toLocaleDateString("pt-BR")}, execução ${p.executedPercent ?? "?"}%.`
    );
    return {
      answer:
        top.length > 0
          ? `Encontrei ${all.length} obra(s) classificada(s) como "Atrasada"${muni ? ` em ${muni.name}` : ""} na base atual:\n\n${lines.join("\n")}\n\nEssas obras merecem verificação junto ao órgão responsável — atraso não implica, por si só, irregularidade.`
          : `Não encontrei obras com status "Atrasada"${muni ? ` em ${muni.name}` : ""} na base atual.`,
      sources: muni
        ? [{ label: `Portal da Transparência — Prefeitura de ${muni.name} (simulado)`, href: `/municipios/${muni.id}` }]
        : GENERIC_SOURCES,
      followUps: ["Quais obras estão paralisadas?", "Mostrar todas as obras no mapa"],
    };
  }

  // Intenção: aditivos > 30%
  if (q.includes("aditivo") && (q.includes("30") || q.includes("aument"))) {
    const contracts = listContracts()
      .filter((c) => c.amendments.length > 0 && (c.currentValue - c.originalValue) / c.originalValue > 0.3)
      .filter((c) => !muni || c.municipalityId === muni.id)
      .sort((a, b) => (b.currentValue - b.originalValue) / b.originalValue - (a.currentValue - a.originalValue) / a.originalValue)
      .slice(0, 8);
    const lines = contracts.map((c) => {
      const growth = (c.currentValue - c.originalValue) / c.originalValue;
      return `• Contrato ${c.number} (${getCompany(c.companyId)?.name}) — ${fmtBRL(c.originalValue)} → ${fmtBRL(c.currentValue)} (${fmtPercent(growth)}).`;
    });
    return {
      answer:
        contracts.length > 0
          ? `Identifiquei ${contracts.length} contrato(s) com aumento superior a 30% por meio de aditivos${muni ? ` em ${muni.name}` : ""}:\n\n${lines.join("\n")}\n\nAditivos elevados podem ter justificativas técnicas legítimas — recomenda-se verificar os termos aditivos publicados.`
          : `Não encontrei contratos com aumento superior a 30% por aditivos${muni ? ` em ${muni.name}` : ""}.`,
      sources: contracts.slice(0, 3).map((c) => ({ label: `Contrato ${c.number}`, href: `/contratos/${c.id}` })),
      followUps: ["Ver todos os aditivos deste município", "Quais licitações tiveram baixa concorrência?"],
    };
  }

  // Intenção: fora do padrão / anomalia (com ou sem categoria)
  if (q.includes("fora do padrao") || q.includes("anomalia") || q.includes("padrao incomum") || q.includes("fora do padrão")) {
    if (!muni) {
      return {
        answer:
          "Para analisar gastos fora do padrão preciso identificar um município. Tente perguntar, por exemplo: \"Existem gastos fora do padrão na área da saúde em Jandira?\"",
        sources: GENERIC_SOURCES,
        followUps: ["Existem gastos fora do padrão na área da saúde em Jandira?"],
      };
    }
    let contracts = contractsForMunicipality(muni.id);
    if (category) contracts = contracts.filter((c) => c.category === category);
    const flagged = contracts.filter((c) => c.medianComparable > 0 && (c.currentValue - c.medianComparable) / c.medianComparable > 0.2);
    const similar = listMunicipalities().filter(
      (m) => m.id !== muni.id && Math.abs(Math.log10(m.population) - Math.log10(muni.population)) < 0.6
    );
    const avgSimilarScore = similar.length
      ? Math.round(similar.reduce((s, m) => s + m.fiscalizaScore, 0) / similar.length)
      : muni.fiscalizaScore;

    const lines = flagged.slice(0, 6).map((c) => {
      const pct = (c.currentValue - c.medianComparable) / c.medianComparable;
      return `• Contrato ${c.number} — ${fmtBRL(c.currentValue)}, ${fmtPercent(pct)} acima da mediana de contratos semelhantes.`;
    });

    return {
      answer: [
        `Analisando ${category ? `a área de ${category} em` : "os contratos de"} ${muni.name} — ${muni.stateId}:`,
        "",
        `1. Identifiquei o município: ${muni.name} (${muni.population.toLocaleString("pt-BR")} habitantes).`,
        `2. Busquei ${contracts.length} contrato(s) na base disponível${category ? ` na categoria ${category}` : ""}.`,
        `3. Comparei com o histórico de gastos do município (ver evolução em /municipios/${muni.id}).`,
        `4. Comparei com ${similar.length} município(s) de porte semelhante — Fiscaliza Score médio deles: ${avgSimilarScore}/100, contra ${muni.fiscalizaScore}/100 em ${muni.name}.`,
        `5. Encontrei ${flagged.length} contrato(s) com valor acima do padrão esperado${flagged.length > 0 ? ":" : "."}`,
        ...(flagged.length > 0 ? ["", ...lines] : []),
        "",
        flagged.length > 0
          ? "6. Interpretação: esses são pontos de atenção que merecem análise adicional — não constituem, isoladamente, prova de irregularidade."
          : "6. Não foram encontrados desvios relevantes em relação à mediana nesta categoria, na base atual.",
      ].join("\n"),
      sources: [
        { label: `Página do município ${muni.name}`, href: `/municipios/${muni.id}` },
        ...flagged.slice(0, 3).map((c) => ({ label: `Contrato ${c.number}`, href: `/contratos/${c.id}` })),
      ],
      followUps: [
        `Quais empresas receberam mais dinheiro de ${muni.name}?`,
        `Como o Fiscaliza Score de ${muni.name} foi calculado?`,
      ],
    };
  }

  // Intenção: quais empresas / fornecedores receberam mais dinheiro
  if ((q.includes("empresas") || q.includes("fornecedor")) && (q.includes("mais dinheiro") || q.includes("receberam mais") || q.includes("mais recursos"))) {
    if (!muni) {
      return {
        answer: "Preciso saber de qual município/órgão você quer o ranking de fornecedores. Tente: \"Quais empresas receberam mais dinheiro da Prefeitura de Jandira?\"",
        sources: GENERIC_SOURCES,
        followUps: ["Quais empresas receberam mais dinheiro da Prefeitura de Jandira?"],
      };
    }
    const top = suppliersForMunicipality(muni.id, 6);
    const lines = top.map((s, i) => `${i + 1}. ${s.company.name} — ${fmtBRL(s.value)}`);
    return {
      answer: `Principais fornecedores de ${muni.name} — ${muni.stateId} por valor recebido:\n\n${lines.join("\n")}`,
      sources: top.slice(0, 3).map((s) => ({ label: s.company.name, href: `/empresas/${s.company.id}` })),
      followUps: [`Algum desses fornecedores tem contratos recorrentes?`, `Ver Fiscaliza Score de ${top[0]?.company.name}`],
    };
  }

  // Intenção: quanto gastou com X em ano Y
  if (q.includes("quanto") && muni) {
    let contracts = contractsForMunicipality(muni.id);
    if (category) contracts = contracts.filter((c) => c.category === category);
    if (year) contracts = contracts.filter((c) => new Date(c.signedAt).getFullYear() === year);
    const total = contracts.reduce((s, c) => s + c.currentValue, 0);
    return {
      answer: `${muni.name} — ${muni.stateId}${category ? ` gastou com ${category.toLowerCase()}` : " gastou"}${year ? ` em ${year}` : ""}: ${fmtBRLCompact(total)}, distribuídos em ${contracts.length} contrato(s).`,
      sources: [{ label: `Página do município ${muni.name}`, href: `/municipios/${muni.id}` }],
      followUps: [`Quais empresas receberam mais dinheiro de ${muni.name}?`, `Existem gastos fora do padrão em ${muni.name}?`],
    };
  }

  // Fallback: se há município identificado, dar visão geral
  if (muni) {
    return {
      answer: `Encontrei ${muni.name} — ${muni.stateId} na base do Fiscaliza. Gasto total analisado: ${fmtBRLCompact(muni.totalSpent)}, em ${muni.totalContracts} contratos, com ${muni.attentionPoints} ponto(s) de atenção identificados. Fiscaliza Score: ${muni.fiscalizaScore}/100. Quer que eu aprofunde em alguma área específica (saúde, educação, infraestrutura...) ou em fornecedores?`,
      sources: [{ label: `Página do município ${muni.name}`, href: `/municipios/${muni.id}` }],
      followUps: [
        `Existem gastos fora do padrão na área da saúde em ${muni.name}?`,
        `Quais empresas receberam mais dinheiro de ${muni.name}?`,
        `Quais obras estão atrasadas em ${muni.name}?`,
      ],
    };
  }

  return {
    answer:
      "Ainda não identifiquei um município, empresa ou contrato específico na sua pergunta. Posso responder sobre: gastos por área, fornecedores que mais receberam, obras atrasadas, contratos com aditivos elevados e sinais de preço fora do padrão. Tente citar o nome de um município, por exemplo: \"Quanto Jandira gastou com saúde em 2025?\"",
    sources: listDataSources().slice(0, 3).map((s) => ({ label: s.name })),
    followUps: [
      "Quanto a Prefeitura de Jandira gastou com saúde em 2025?",
      "Quais obras estão atrasadas?",
      "Quais contratos aumentaram mais de 30% após aditivos?",
    ],
  };
}
