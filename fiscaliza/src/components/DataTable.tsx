export interface Column<T> {
  header: string;
  align?: "left" | "right" | "center";
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({ columns, rows, keyFor }: { columns: Column<T>[]; rows: T[]; keyFor: (row: T) => string }) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl2 border border-base-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-base-border bg-ink-900/[0.02] text-left">
            {columns.map((c, i) => (
              <th
                key={i}
                className={`data-label px-4 py-3 ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyFor(row)} className="border-b border-base-border last:border-0 hover:bg-ink-900/[0.015]">
              {columns.map((c, i) => (
                <td
                  key={i}
                  className={`px-4 py-3 align-middle ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"} ${c.className ?? ""}`}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-ink-500">
                Nenhum resultado encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
