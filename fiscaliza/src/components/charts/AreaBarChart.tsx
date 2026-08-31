"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtBRLCompact } from "@/lib/engine/format";

const COLORS: Record<string, string> = {
  Saúde: "#0F9D6D",
  Educação: "#1D5FD6",
  Infraestrutura: "#0B1E3F",
  Segurança: "#D0332F",
  Administração: "#5B6470",
  Transporte: "#E8940C",
  Outros: "#B8BFC7",
};

export function AreaBarChart({ data }: { data: { area: string; value: number }[] }) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid horizontal={false} stroke="#EEEFEA" />
        <XAxis type="number" tickFormatter={(v) => fmtBRLCompact(v)} tick={{ fontSize: 12, fill: "#5B6470" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="area" width={110} tick={{ fontSize: 13, fill: "#0B0F14" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v: number) => fmtBRLCompact(v)}
          contentStyle={{ borderRadius: 12, border: "1px solid #E6E7E4", fontSize: 13 }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {sorted.map((d, i) => (
            <Cell key={i} fill={COLORS[d.area] ?? "#0B1E3F"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
