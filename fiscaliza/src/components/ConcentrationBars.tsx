import Link from "next/link";
import { fmtBRLCompact, fmtShare } from "@/lib/engine/format";

export function ConcentrationBars({
  items,
}: {
  items: { name: string; href?: string; value: number; share: number }[];
}) {
  const top = items.slice(0, 4);
  const othersShare = 1 - top.reduce((s, i) => s + i.share, 0);
  const rows = [
    ...top.map((i) => ({ name: i.name, href: i.href, share: i.share, value: i.value })),
    ...(items.length > 4 ? [{ name: "Outros", share: Math.max(othersShare, 0), value: 0, href: undefined }] : []),
  ];

  return (
    <div className="space-y-3">
      {rows.map((r, idx) => (
        <div key={idx}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            {r.href ? (
              <Link href={r.href} className="font-medium text-ink-900 hover:text-signal-blue">
                {r.name}
              </Link>
            ) : (
              <span className="font-medium text-ink-700">{r.name}</span>
            )}
            <span className="tabular-nums text-ink-500">
              {fmtShare(r.share, 0)}
              {r.value > 0 && <span className="ml-2 text-xs">({fmtBRLCompact(r.value)})</span>}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-900/5">
            <div
              className={idx === 0 ? "h-full rounded-full bg-navy-900" : "h-full rounded-full bg-signal-blue/60"}
              style={{ width: `${Math.max(2, r.share * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
