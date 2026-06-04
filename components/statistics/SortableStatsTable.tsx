"use client"

import { useState } from "react"

export type StatsRow = {
  id: string | null
  name: string
  trades: number
  winRate: number | null
  avgR: number | null
  totalPnL: number
  profitFactor: number | string
  long: number
  short: number
  tierA: number
  tierB: number
  tierC: number
}

export type SortKey =
  | "name" | "trades" | "winRate" | "avgR" | "totalPnL"
  | "profitFactor" | "long" | "short" | "tierA" | "tierB" | "tierC"

type SortDir = "asc" | "desc"

function pfNumeric(pf: number | string): number | null {
  if (pf === "∞") return Infinity
  if (pf === "—") return null
  return pf as number
}

export function sortRows(rows: StatsRow[], key: SortKey, dir: SortDir): StatsRow[] {
  return [...rows].sort((a, b) => {
    if (key === "name") {
      const cmp = a.name.localeCompare(b.name, "pl")
      return dir === "asc" ? cmp : -cmp
    }
    const aVal = key === "profitFactor" ? pfNumeric(a.profitFactor) : (a[key] as number | null)
    const bVal = key === "profitFactor" ? pfNumeric(b.profitFactor) : (b[key] as number | null)
    if (aVal === null && bVal === null) return 0
    if (aVal === null) return 1
    if (bVal === null) return -1
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return dir === "desc" ? -cmp : cmp
  })
}

function pct(n: number | null): string {
  if (n === null) return "—"
  return (n * 100).toFixed(0) + "%"
}

function pf(v: number | string): string {
  if (typeof v === "string") return v
  return v.toFixed(2)
}

const thBase: React.CSSProperties = {
  color: "#fff",
  padding: "5px 8px",
  fontSize: "var(--font-size-tiny)",
  fontWeight: 600,
  textAlign: "center",
  whiteSpace: "nowrap",
  background: "var(--color-mid)",
  cursor: "pointer",
  userSelect: "none",
}

const tdBase: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: "var(--font-size-tiny)",
  textAlign: "center",
  borderBottom: "0.5px solid var(--color-border)",
  verticalAlign: "middle",
}

const A = "rgba(0,0,0,0.06)"
const B = "rgba(80,120,220,0.05)"

const BG = {
  name:      "transparent",
  trades:    A,
  metrics:   B,
  direction: A,
  tiers:     B,
} as const

interface ThProps {
  label: string
  colKey: SortKey
  activeKey: SortKey
  activeDir: SortDir
  onClick: (k: SortKey) => void
  width?: number
  align?: "left" | "center"
}

function Th({ label, colKey, activeKey, activeDir, onClick, width, align = "center" }: ThProps) {
  const active = colKey === activeKey
  return (
    <th
      onClick={() => onClick(colKey)}
      style={{ ...thBase, width, textAlign: align }}
    >
      {label}
      {active && (
        <span style={{ marginLeft: 3, fontSize: 9, opacity: 0.85 }}>
          {activeDir === "desc" ? "▼" : "▲"}
        </span>
      )}
    </th>
  )
}

interface Props {
  rows: StatsRow[]
  firstColumnLabel: string
  /** Base URL for first-column links, e.g. "/statistics/setup/". Appended with row.id. */
  firstCellLinkBase?: string
  /** Query string suffix appended after id, e.g. "?range=4w". Include the "?". */
  firstCellLinkSuffix?: string
}

export function SortableStatsTable({
  rows,
  firstColumnLabel,
  firstCellLinkBase,
  firstCellLinkSuffix = "",
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("trades")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortKey(key)
      setSortDir(key === "name" ? "asc" : "desc")
    }
  }

  const sorted = sortRows(rows, sortKey, sortDir)

  const th = (label: string, colKey: SortKey, width?: number, align?: "left" | "center") => (
    <Th
      key={colKey}
      label={label}
      colKey={colKey}
      activeKey={sortKey}
      activeDir={sortDir}
      onClick={handleSort}
      width={width}
      align={align}
    />
  )

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
        <thead>
          <tr>
            {th(firstColumnLabel, "name",        undefined, "left")}
            {th("Trades",         "trades",       60)}
            {th("Win Rate",       "winRate",      72)}
            {th("Avg R",          "avgR",         60)}
            {th("P&L ($)",        "totalPnL",     80)}
            {th("P. Factor",      "profitFactor", 76)}
            {th("Long",           "long",         48)}
            {th("Short",          "short",        48)}
            {th("Tier A",         "tierA",        48)}
            {th("Tier B",         "tierB",        48)}
            {th("Tier C",         "tierC",        48)}
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => {
            const nameCell =
              firstCellLinkBase && s.id !== null ? (
                <a
                  href={`${firstCellLinkBase}${s.id}${firstCellLinkSuffix}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "none", display: "block" }}
                >
                  {s.name}
                </a>
              ) : (
                s.name
              )

            return (
              <tr
                key={s.id ?? "__none__"}
                style={{ background: s.id === null ? "var(--color-light)" : "var(--color-white)" }}
              >
                <td style={{ ...tdBase, background: BG.name, textAlign: "left", fontWeight: s.id === null ? 400 : 600, color: s.id === null ? "var(--color-muted)" : "var(--color-text)" }}>
                  {nameCell}
                </td>
                <td style={{ ...tdBase, background: BG.trades }}>{s.trades}</td>
                <td style={{ ...tdBase, background: BG.metrics, color: s.winRate !== null ? (s.winRate >= 0.5 ? "#2D8C4E" : "#D96060") : "var(--color-muted)" }}>
                  {pct(s.winRate)}
                </td>
                <td style={{ ...tdBase, background: BG.metrics, color: s.avgR !== null ? (s.avgR > 0 ? "#2D8C4E" : s.avgR < 0 ? "#D96060" : undefined) : "var(--color-muted)" }}>
                  {s.avgR !== null ? s.avgR.toFixed(2) : "—"}
                </td>
                <td style={{ ...tdBase, background: BG.metrics, color: s.totalPnL > 0 ? "#2D8C4E" : s.totalPnL < 0 ? "#D96060" : undefined }}>
                  {s.totalPnL > 0 ? "+" : ""}{s.totalPnL.toFixed(2)}
                </td>
                <td style={{ ...tdBase, background: BG.metrics }}>{pf(s.profitFactor)}</td>
                <td style={{ ...tdBase, background: BG.direction }}>{s.long || "—"}</td>
                <td style={{ ...tdBase, background: BG.direction }}>{s.short || "—"}</td>
                <td style={{ ...tdBase, background: BG.tiers }}>{s.tierA || "—"}</td>
                <td style={{ ...tdBase, background: BG.tiers }}>{s.tierB || "—"}</td>
                <td style={{ ...tdBase, background: BG.tiers }}>{s.tierC || "—"}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
