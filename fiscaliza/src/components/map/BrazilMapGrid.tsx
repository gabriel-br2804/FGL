"use client";

import { STATE_GRID } from "@/lib/data/seed-geo";
import { riskLevelFromScore } from "@/lib/types";

const LEVEL_COLOR: Record<string, string> = {
  baixa_atencao: "#0F9D6D",
  normal: "#B8BFC7",
  atencao: "#E8940C",
  alta_atencao: "#C96A00",
  atencao_critica: "#D0332F",
};

export interface MapCell {
  id: string;
  label: string;
  score: number;
}

export function BrazilMapGrid({
  cells,
  selectedId,
  onSelect,
}: {
  cells: MapCell[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const cols = 11;
  const rows = 10;
  return (
    <div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridTemplateRows: `repeat(${rows}, 2.6rem)` }}
      >
        {cells.map((cell) => {
          const pos = STATE_GRID[cell.id];
          if (!pos) return null;
          const level = riskLevelFromScore(cell.score);
          const color = LEVEL_COLOR[level];
          const selected = selectedId === cell.id;
          return (
            <button
              key={cell.id}
              onClick={() => onSelect(cell.id)}
              style={{
                gridColumn: pos.col + 1,
                gridRow: pos.row + 1,
                backgroundColor: `${color}1A`,
                borderColor: selected ? color : `${color}55`,
                color,
              }}
              className={`flex flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition hover:scale-[1.06] ${
                selected ? "ring-2 ring-navy-900 ring-offset-1" : ""
              }`}
              title={`${cell.label} — score médio ${cell.score}`}
            >
              {cell.id}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-500">
        {Object.entries(LEVEL_COLOR).map(([level, color]) => (
          <span key={level} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {
              {
                baixa_atencao: "Baixa atenção",
                normal: "Normal",
                atencao: "Atenção",
                alta_atencao: "Alta atenção",
                atencao_critica: "Atenção crítica",
              }[level]
            }
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-ink-400">
        Visualização estilizada (cartograma em grade), não uma projeção cartográfica exata.
      </p>
    </div>
  );
}
