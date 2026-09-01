import { listProjects, getMunicipality } from "@/lib/data";
import { ObraListClient } from "./ListClient";

export const metadata = { title: "Obras — Fiscaliza" };

export default function ObrasPage({ searchParams }: { searchParams: { municipio?: string } }) {
  const all = listProjects();
  const muni = searchParams.municipio ? getMunicipality(searchParams.municipio) : undefined;
  const projects = muni ? all.filter((p) => p.municipalityId === muni.id) : all;

  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Obras</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">Obras públicas</h1>
      <p className="mt-3 max-w-2xl text-ink-700">
        {muni ? `Obras públicas em ${muni.name} — ${muni.stateId}.` : "Valor, empresa, prazo, situação e execução das obras monitoradas."}
      </p>

      <div className="mt-8">
        <ObraListClient projects={projects} />
      </div>
    </div>
  );
}
