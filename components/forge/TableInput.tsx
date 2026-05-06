export interface Column {
  id: string
  label: string
  width?: string
  type?: "text" | "number" | "select"
  options?: string[]
}

interface TableInputProps {
  columns: Column[]
  rows: Record<string, unknown>[]
  onAddRow: () => void
  onUpdateRow: (index: number, field: string, value: string | number) => void
  addLabel?: string
  emptyRows?: number
}

export function TableInput({
  columns,
  rows,
  onAddRow,
  onUpdateRow,
  addLabel = "+ Dodaj",
  emptyRows = 3,
}: TableInputProps) {
  const displayRows = rows.length > 0 ? rows : Array(emptyRows).fill({})

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr style={{ background: "var(--color-mid)" }}>
            {columns.map((col) => (
              <th
                key={col.id}
                className="px-2 py-1 font-medium"
                style={{
                  color: "var(--color-white)",
                  fontSize: "var(--font-size-tiny)",
                  width: col.width,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `0.5px solid var(--color-border)` }}>
              {columns.map((col) => (
                <td key={col.id} className="px-1 py-0.5">
                  {col.type === "select" && col.options ? (
                    <select
                      value={String(row[col.id] ?? "")}
                      onChange={(e) => onUpdateRow(i, col.id, e.target.value)}
                      className="w-full bg-transparent border-none outline-none"
                      style={{ fontSize: "var(--font-size-tiny)" }}
                    >
                      <option value="" />
                      {col.options.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={col.type ?? "text"}
                      value={String(row[col.id] ?? "")}
                      onChange={(e) => onUpdateRow(i, col.id, e.target.value)}
                      className="w-full bg-transparent border-none outline-none"
                      style={{ fontSize: "var(--font-size-tiny)" }}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 0 && (
        <button
          type="button"
          onClick={onAddRow}
          className="mt-2 text-sm"
          style={{ color: "var(--color-muted)" }}
        >
          {addLabel}
        </button>
      )}
    </div>
  )
}
