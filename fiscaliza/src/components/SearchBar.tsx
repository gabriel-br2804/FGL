"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar({
  compact = false,
  placeholder = "Pesquise uma prefeitura, empresa, obra, contrato ou pessoa…",
}: {
  compact?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    router.push(`/busca?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form onSubmit={submit} className="relative w-full">
      <svg
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={
          compact
            ? "w-full rounded-full border border-base-border bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-navy-700 focus:ring-1 focus:ring-navy-700"
            : "w-full rounded-2xl border border-base-border bg-white py-4 pl-12 pr-32 text-base shadow-card outline-none focus:border-navy-700 focus:ring-1 focus:ring-navy-700"
        }
      />
      {!compact && (
        <button type="submit" className="btn-primary absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5">
          Pesquisar
        </button>
      )}
    </form>
  );
}
