import { listMunicipalities } from "@/lib/data";
import { MunicipalityListClient } from "./ListClient";

export const metadata = { title: "Municípios — Fiscaliza" };

export default function MunicipiosPage() {
  const municipalities = listMunicipalities();

  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Municípios</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
        Municípios monitorados
      </h1>
      <p className="mt-3 max-w-2xl text-ink-700">
        Orçamento, gastos, contratos, fornecedores e pontos de atenção por município.
      </p>

      <div className="mt-8">
        <MunicipalityListClient municipalities={municipalities} />
      </div>
    </div>
  );
}
