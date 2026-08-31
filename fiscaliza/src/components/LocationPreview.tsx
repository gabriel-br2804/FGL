export function LocationPreview({ lat, lon, label }: { lat: number; lon: number; label: string }) {
  // Grade decorativa (não é uma projeção geográfica real): posiciona o
  // marcador proporcionalmente à latitude/longitude dentro dos limites
  // aproximados do território brasileiro, apenas para dar contexto visual.
  const left = Math.min(96, Math.max(4, ((lon + 74) / (34)) * 100));
  const top = Math.min(96, Math.max(4, ((lat + 34) / (34 - 5)) * 100));

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl2 border border-base-border bg-[linear-gradient(#EEEFEA_1px,transparent_1px),linear-gradient(90deg,#EEEFEA_1px,transparent_1px)] bg-[length:20px_20px] bg-navy-950/[0.02]">
      <div
        className="absolute -translate-x-1/2 -translate-y-full"
        style={{ left: `${left}%`, top: `${top}%` }}
      >
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-navy-900 p-2 shadow-pop">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="12" r="6" />
            </svg>
          </div>
          <span className="mt-1 -translate-y-0 rounded-md bg-navy-900 px-2 py-0.5 text-[10px] font-semibold text-white shadow-pop">
            {label}
          </span>
        </div>
      </div>
      <div className="absolute bottom-2 right-3 font-mono text-[10px] text-ink-400">
        {lat.toFixed(4)}, {lon.toFixed(4)}
      </div>
      <div className="absolute left-3 top-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
        Localização ilustrativa
      </div>
    </div>
  );
}
