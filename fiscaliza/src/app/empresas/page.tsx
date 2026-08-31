import { listCompanies, getMunicipality, suppliersForMunicipality } from "@/lib/data";
import { CompanyListClient } from "./ListClient";

export const metadata = { title: "Empresas — Fiscaliza" };

export default function EmpresasPage({ searchParams }: { searchParams: { municipio?: string } }) {
  const muni = searchParams.municipio ? getMunicipality(searchParams.municipio) : undefined;
  const companies = muni ? suppliersForMunicipality(muni.id, 999).map((s) => s.company) : listCompanies();

  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Empresas</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
        Empresas com contratos públicos
      </h1>
      <p className="mt-3 max-w-2xl text-ink-700">
        {muni
          ? `Fornecedores com contratos junto a ${muni.name} — ${muni.stateId}.`
          : "Volume contratado, número de contratos, órgãos e municípios atendidos."}
      </p>

      <div className="mt-8">
        <CompanyListClient companies={companies} />
      </div>
    </div>
  );
}
