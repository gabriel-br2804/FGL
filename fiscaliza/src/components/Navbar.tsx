"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SearchBar } from "./SearchBar";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/mapa", label: "Mapa" },
  { href: "/municipios", label: "Municípios" },
  { href: "/empresas", label: "Empresas" },
  { href: "/contratos", label: "Contratos" },
  { href: "/obras", label: "Obras" },
  { href: "/ia", label: "Fiscaliza IA" },
  { href: "/alertas", label: "Alertas" },
  { href: "/metodologia", label: "Metodologia" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-base-border bg-base-bg/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-sm font-bold text-white">
            F
          </span>
          <span className="text-lg font-extrabold tracking-tight text-navy-900">Fiscaliza</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                pathname === l.href || pathname?.startsWith(l.href + "/")
                  ? "bg-navy-900 text-white"
                  : "text-ink-700 hover:bg-ink-900/5"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden w-64 shrink-0 md:block">
          <SearchBar compact placeholder="Pesquisar..." />
        </div>

        <button
          aria-label="Abrir menu"
          className="rounded-lg border border-base-border p-2 lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-base-border bg-base-bg px-4 pb-4 lg:hidden">
          <div className="py-3">
            <SearchBar compact placeholder="Pesquisar..." />
          </div>
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  pathname === l.href ? "bg-navy-900 text-white" : "text-ink-700 hover:bg-ink-900/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
