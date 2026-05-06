export interface Column {
  id: string
  label: string
  width?: string
  type?: "text" | "number" | "select" | "textarea"
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

function AutoTextarea({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <textarea
      rows={1}
      value={value}
      onChange={(e) => {
        e.target.style.height = "auto"
        e.target.style.height = e.target.scrollHeight + "px"
        onChange(e.target.value)
      }}
      className="w-full bg-transparent border-none outline-none"
      style={{
        fontSize: "var(--font-size-tiny)",
        resize: "none",
        overflow: "hidden",
        lineHeight: "1.4",
        padding: "2px 0",
      }}
    />
  )
}

export function TableInput({
  columns,
  rows,
  onAddRow,
  onUpdateRow,
  addLabel = "+ Dodaj",
  emptyRows = 3,
}: TableInputProps) {
  const placeholderCount = rows.length === 0 ? emptyRows : 0

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
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `0.5px solid var(--color-border)` }}>
              {columns.map((col) => (
                <td key={col.id} className="px-1 py-0.5" style={{ verticalAlign: "top" }}>
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
                  ) : col.type === "textarea" ? (
                    <AutoTextarea
                      value={String(row[col.id] ?? "")}
                      onChange={(v) => onUpdateRow(i, col.id, v)}
                    />
                  ) : (
                    <input
                      type={col.type ?? "text"}
                      value={String(row[col.id] ?? "")}
                      onChange={(e) => onUpdateRow(i, col.id, e.target.value)}
                      className={`w-full bg-transparent border-none outline-none${col.type === "number" ? " no-spinner" : ""}`}
                      style={{ fontSize: "var(--font-size-tiny)" }}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
          {Array.from({ length: placeholderCount }).map((_, i) => (
            <tr key={`ph-${i}`} style={{ borderBottom: `0.5px solid var(--color-border)` }}>
              {columns.map((col) => (
                <td key={col.id} className="px-1 py-0.5">
                  <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-border)" }}>—</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={onAddRow}
        className="mt-2 text-sm"
        style={{ color: "var(--color-muted)" }}
      >
        {addLabel}
      </button>
    </div>
  )
}
