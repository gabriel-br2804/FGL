export function fmtBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function fmtBRLCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `R$ ${(value / 1_000_000_000_000).toFixed(1).replace(".", ",")} tri`;
  if (abs >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1).replace(".", ",")} bi`;
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (abs >= 1_000) return `R$ ${(value / 1_000).toFixed(1).replace(".", ",")} mil`;
  return fmtBRL(value);
}

export function fmtNumber(value: number): string {
  return value.toLocaleString("pt-BR");
}

export function fmtCompactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(".", ",")} bi`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(".", ",")} mil`;
  return fmtNumber(value);
}

export function fmtShare(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits).replace(".", ",")}%`;
}

export function fmtPercent(value: number, digits = 0): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(digits).replace(".", ",")}%`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function fmtMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
}
