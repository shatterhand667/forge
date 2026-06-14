import { auth } from "@/auth"
import { getTagWithCards } from "@/actions/tags"
import { notFound } from "next/navigation"

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ tagId: string }>
}) {
  const { tagId } = await params
  await auth()

  const tag = await getTagWithCards(tagId)
  if (!tag) notFound()

  const rows = (tag as any).cards
    .map((entry: any) => {
      const tradesWithPnl = entry.dailyCard.trades.filter((t: any) => t.profitRaw != null)
      const pnl =
        tradesWithPnl.length > 0
          ? Math.round(tradesWithPnl.reduce((sum: number, t: any) => sum + t.profitRaw, 0))
          : null
      const d = new Date(entry.dailyCard.date)
      const dateLabel = `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`
      const dateStr = d.toISOString().split("T")[0]
      return { dateStr, dateLabel, pnl, processScore: entry.dailyCard.processScore }
    })
    .sort((a: any, b: any) => b.dateStr.localeCompare(a.dateStr))

  const count = (tag as any).cards.length

  return (
    <div
      className="mx-auto px-4 py-8"
      style={{ maxWidth: 480, fontFamily: "var(--font-family)" }}
    >
      <h1
        style={{
          fontWeight: 700,
          fontSize: "var(--font-size-body)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 4,
          color: "var(--color-text)",
        }}
      >
        {(tag as any).name}
      </h1>
      <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", marginBottom: 20 }}>
        {count} {count === 1 ? "dzień" : "dni"}
      </p>

      {rows.length === 0 ? (
        <p style={{ color: "var(--color-muted)", fontSize: "var(--font-size-tiny)" }}>
          Brak dni z tym tagiem.
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Data", "P&L", "Proces"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    fontSize: "var(--font-size-tiny)",
                    color: "var(--color-muted)",
                    paddingBottom: 6,
                    fontWeight: 700,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ dateStr, dateLabel, pnl, processScore }: any) => (
              <tr key={dateStr} style={{ borderTop: "1px solid var(--color-border)" }}>
                <td style={{ padding: "7px 0", fontSize: "var(--font-size-tiny)" }}>
                  <a
                    href={`/cards/${dateStr}/complete`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#4A9EE2" }}
                  >
                    {dateLabel}
                  </a>
                </td>
                <td
                  style={{
                    padding: "7px 0",
                    fontSize: "var(--font-size-tiny)",
                    color:
                      pnl == null
                        ? "var(--color-muted)"
                        : pnl >= 0
                        ? "#16a34a"
                        : "#dc2626",
                  }}
                >
                  {pnl == null ? "—" : `${pnl >= 0 ? "+" : ""}€${pnl}`}
                </td>
                <td
                  style={{
                    padding: "7px 0",
                    fontSize: "var(--font-size-tiny)",
                    color: "var(--color-text)",
                  }}
                >
                  {processScore != null ? `${processScore}/10` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
