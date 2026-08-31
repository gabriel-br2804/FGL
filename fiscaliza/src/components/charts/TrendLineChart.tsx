"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtBRLCompact } from "@/lib/engine/format";

export function TrendLineChart({
  data,
  color = "#0B1E3F",
}: {
  data: { year: number; value: number }[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: 8, right: 16, top: 12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#EEEFEA" />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#5B6470" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => fmtBRLCompact(v)} tick={{ fontSize: 12, fill: "#5B6470" }} axisLine={false} tickLine={false} width={70} />
        <Tooltip formatter={(v: number) => fmtBRLCompact(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E6E7E4", fontSize: 13 }} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
