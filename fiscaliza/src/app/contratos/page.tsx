import { listContracts, getMunicipality } from "@/lib/data";
import { ContractListClient } from "./ListClient";

export const metadata = { title: "Contratos — Fiscaliza" };

export default function ContratosPage({ searchParams }: { searchParams: { municipio?: string } }) {
  const all = listContracts();
  const muni = searchParams.municipio ? getMunicipality(searchParams.municipio) : undefined;
  const contracts = muni ? all.filter((c) => c.municipalityId === muni.id) : all;

  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Contratos</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">Contratos públicos</h1>
      <p className="mt-3 max-w-2xl text-ink-700">
        {muni ? `Contratos firmados por ${muni.name} — ${muni.stateId}.` : "Busque por número, objeto ou fornecedor."}
      </p>

      <div className="mt-8">
        <ContractListClient contracts={contracts} />
      </div>
    </div>
  );
}
