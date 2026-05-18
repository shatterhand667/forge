"use client"

import { useEffect, useRef } from "react"

export interface Column {
  id: string
  label: string
  width?: string
  type?: "text" | "number" | "select" | "textarea"
  options?: string[]
  tooltip?: string
}

interface TableInputProps {
  columns: Column[]
  rows: Record<string, unknown>[]
  onAddRow: () => void
  onUpdateRow: (index: number, field: string, value: string | number) => void
  addLabel?: string
  emptyRows?: number
}

export function AutoTextarea({
  value,
  onChange,
  style,
}: {
  value: string
  onChange: (v: string) => void
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = el.scrollHeight + "px"
  }, []) // mount only — handles pre-filled data; typing is handled in onChange

  return (
    <textarea
      ref={ref}
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
        ...style,
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
    <div className="w-full">
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
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.tooltip && (
                    <span className="relative group inline-flex items-center">
                      <span
                        className="cursor-help leading-none"
                        style={{ fontSize: 10, opacity: 0.75 }}
                      >
                        ⓘ
                      </span>
                      <span
                        className="absolute z-50 hidden group-hover:block rounded shadow-lg"
                        style={{
                          bottom: "calc(100% + 6px)",
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: "var(--color-text)",
                          color: "var(--color-white)",
                          fontSize: "var(--font-size-tiny)",
                          padding: "6px 8px",
                          width: 200,
                          lineHeight: 1.5,
                          fontWeight: "normal",
                          whiteSpace: "normal",
                        }}
                      >
                        {col.tooltip}
                      </span>
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `0.5px solid var(--color-border)` }}>
              {columns.map((col) => (
                <td key={col.id} className="px-1 py-0.5" style={{ verticalAlign: "top", borderRight: `0.5px solid var(--color-border)` }}>
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
                      onChange={(e) => {
                        const raw = e.target.value
                        if (col.type === "number") {
                          if (raw === "") return
                          const num = parseFloat(raw)
                          if (!isNaN(num)) onUpdateRow(i, col.id, num)
                        } else {
                          onUpdateRow(i, col.id, raw)
                        }
                      }}
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
                <td key={col.id} className="px-1 py-0.5" style={{ borderRight: `0.5px solid var(--color-border)` }}>
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
        className="mt-2"
        style={{
          fontSize: "var(--font-size-tiny)",
          color: "var(--color-mid)",
          border: `1px solid var(--color-border)`,
          borderRadius: 4,
          padding: "4px 12px",
          background: "var(--color-white)",
          cursor: "pointer",
        }}
      >
        {addLabel}
      </button>
    </div>
  )
}
