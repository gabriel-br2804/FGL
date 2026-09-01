import Link from "next/link";
import { searchAll } from "@/lib/data";
import { SearchBar } from "@/components/SearchBar";
import { ScoreBadge } from "@/components/ScoreBadge";

export const metadata = { title: "Buscar — Fiscaliza" };

const TYPE_LABEL: Record<string, string> = {
  municipality: "Município",
  company: "Empresa",
  contract: "Contrato",
  project: "Obra",
};

export default function BuscaPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q ?? "";
  const results = q ? searchAll(q, 30) : [];

  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Busca</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">Resultados</h1>
      <div className="mt-6 max-w-2xl">
        <SearchBar />
      </div>

      {q && (
        <p className="mt-6 text-sm text-ink-500">
          {results.length} resultado(s) para <strong className="text-ink-900">“{q}”</strong>
        </p>
      )}

      <div className="mt-6 space-y-2">
        {results.map((r) => (
          <Link
            key={`${r.type}-${r.id}`}
            href={`/${r.type === "municipality" ? "municipios" : r.type === "company" ? "empresas" : r.type === "contract" ? "contratos" : "obras"}/${r.id}`}
            className="flex items-center justify-between gap-3 rounded-xl2 border border-base-border bg-white px-4 py-3.5 hover:border-navy-700"
          >
            <div className="min-w-0">
              <span className="data-label">{TYPE_LABEL[r.type]}</span>
              <div className="truncate font-semibold text-ink-900">{r.title}</div>
              <div className="truncate text-xs text-ink-500">{r.subtitle}</div>
            </div>
            {typeof r.score === "number" && <ScoreBadge score={r.score} size="sm" />}
          </Link>
        ))}
        {q && results.length === 0 && (
          <div className="card p-8 text-center text-sm text-ink-500">
            Nenhum resultado encontrado para “{q}”. Tente o nome de um município, empresa, contrato ou obra.
          </div>
        )}
      </div>
    </div>
  );
}
