import Link from "next/link";

const COLUMNS = [
  {
    title: "Plataforma",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/mapa", label: "Mapa do Brasil" },
      { href: "/ia", label: "Fiscaliza IA" },
      { href: "/alertas", label: "Alertas" },
    ],
  },
  {
    title: "Dados",
    links: [
      { href: "/municipios", label: "Municípios" },
      { href: "/empresas", label: "Empresas" },
      { href: "/contratos", label: "Contratos" },
      { href: "/obras", label: "Obras" },
    ],
  },
  {
    title: "Institucional",
    links: [
      { href: "/sobre", label: "Sobre" },
      { href: "/como-funciona", label: "Como funciona" },
      { href: "/metodologia", label: "Metodologia" },
      { href: "/fontes", label: "Fontes de dados" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-base-border bg-navy-950 text-white">
      <div className="container-page grid grid-cols-1 gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-navy-900">
              F
            </span>
            <span className="text-lg font-extrabold">Fiscaliza</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-white/60">
            Seu dinheiro. Nossa lupa. Inteligência sobre gastos públicos a partir do cruzamento de dados oficiais.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="text-xs font-semibold uppercase tracking-wider text-white/40">{col.title}</div>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/75 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-6 text-xs leading-relaxed text-white/50">
          <p>
            <strong className="text-white/70">Aviso legal:</strong> Os indicadores apresentados pelo Fiscaliza são
            análises automatizadas baseadas em dados públicos e não constituem acusação, prova de irregularidade ou
            conclusão sobre responsabilidade civil ou criminal. Situações classificadas como pontos de atenção devem
            ser verificadas nas fontes oficiais e, quando necessário, pelas autoridades competentes.
          </p>
          <p className="mt-3">
            Versão MVP — parte dos dados exibidos nesta plataforma é <strong className="text-white/70">simulada</strong>{" "}
            para fins de demonstração enquanto os conectores de dados reais são integrados. Veja{" "}
            <Link href="/fontes" className="underline decoration-white/30 underline-offset-2 hover:text-white">
              Fontes de dados
            </Link>
            .
          </p>
          <p className="mt-3">© {new Date().getFullYear()} Fiscaliza. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
