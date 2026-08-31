"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMunicipality, getCompany, getProject, getContract } from "@/lib/data";
import { ScoreBadge } from "@/components/ScoreBadge";

const STORAGE_KEY = "fiscaliza:monitored";

interface MonitoredItem {
  key: string;
  type: string;
  id: string;
  title: string;
  href: string;
  score?: number;
}

function resolve(key: string): MonitoredItem | null {
  const [type, id] = key.split(":");
  if (type === "municipality") {
    const m = getMunicipality(id);
    if (!m) return null;
    return { key, type: "Município", id, title: `${m.name} — ${m.stateId}`, href: `/municipios/${id}`, score: m.fiscalizaScore };
  }
  if (type === "company") {
    const c = getCompany(id);
    if (!c) return null;
    return { key, type: "Empresa", id, title: c.name, href: `/empresas/${id}`, score: c.fiscalizaScore };
  }
  if (type === "project") {
    const p = getProject(id);
    if (!p) return null;
    return { key, type: "Obra", id, title: p.name, href: `/obras/${id}` };
  }
  if (type === "contract") {
    const c = getContract(id);
    if (!c) return null;
    return { key, type: "Contrato", id, title: `Contrato ${c.number}`, href: `/contratos/${id}` };
  }
  return null;
}

export function AlertsClient() {
  const [items, setItems] = useState<MonitoredItem[] | null>(null);

  function load() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, boolean>;
      const resolved = Object.keys(raw)
        .filter((k) => raw[k])
        .map(resolve)
        .filter((x): x is MonitoredItem => !!x);
      setItems(resolved);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function stopMonitoring(key: string) {
    try {
      const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
      raw[key] = false;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    } catch {
      // ignore
    }
    load();
  }

  if (items === null) {
    return <div className="card p-6 text-sm text-ink-500">Carregando itens monitorados…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-ink-500">
        Você ainda não está monitorando nada. Visite a página de um município, empresa ou obra e clique em{" "}
        <strong>Monitorar</strong>.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl2 border border-base-border bg-white px-4 py-3">
          <div className="min-w-0">
            <span className="data-label">{item.type}</span>
            <Link href={item.href} className="block truncate font-semibold text-ink-900 hover:text-signal-blue">
              {item.title}
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {item.score !== undefined && <ScoreBadge score={item.score} size="sm" />}
            <button onClick={() => stopMonitoring(item.key)} className="text-xs font-semibold text-ink-500 hover:text-signal-red">
              Parar de monitorar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
