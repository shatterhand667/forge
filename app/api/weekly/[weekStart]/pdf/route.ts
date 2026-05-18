import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { computeWeeklyStats } from "@/lib/weekly-stats"
import puppeteer from "puppeteer"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ weekStart: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const { weekStart: weekStartStr } = await params
  const userId = session.user.id
  const weekStart = new Date(weekStartStr)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 4)

  const [review, weekLessons] = await Promise.all([
    prisma.weeklyReview.findUnique({ where: { userId_weekStart: { userId, weekStart } } }),
    prisma.dailyCard.findMany({
      where: { userId, date: { gte: weekStart, lte: weekEnd }, yesterdayLesson: { not: null } },
      select: { date: true, yesterdayLesson: true },
      orderBy: { date: "asc" },
    }),
  ])
  if (!review) return new NextResponse("Not found", { status: 404 })

  const stats = await computeWeeklyStats(userId, weekStart, weekEnd)
  const html = buildWeeklyHtml(review, stats, weekStartStr, weekLessons)

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle0" })
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
  })
  await browser.close()

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="forge-weekly-${weekStartStr}.pdf"`,
    },
  })
}

function pct(n: number) { return (n * 100).toFixed(0) + "%" }
function r2(n: number) { return n.toFixed(2) }
function sign(n: number) { return (n > 0 ? "+" : "") + r2(n) }
function field(label: string, value: string | null | undefined) {
  return `<div class="field-row"><span class="field-label">${label}</span><span class="field-value">${value ?? ""}</span></div>`
}

const DAY_NAMES_PDF: Record<number, string> = { 1: "Poniedziałek", 2: "Wtorek", 3: "Środa", 4: "Czwartek", 5: "Piątek" }

function circleRow(label: string, avg: number | null, max: number): string {
  const filled = avg !== null ? Math.round(avg) : 0
  const circles = Array.from({ length: max }, (_, i) => {
    const on = avg !== null && i + 1 <= filled
    return `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;border:1.5px solid #c9963d;background:${on ? "#c9963d" : "transparent"};margin-right:2px;"></span>`
  }).join("")
  const val = avg !== null ? avg.toFixed(1) : "—"
  return `<div style="display:flex;align-items:center;gap:8px;padding:3px 0;border-bottom:0.5px solid #d1d5db;">
    <span style="min-width:160px;font-size:10px;color:#6b7280;">${label}</span>
    <span>${circles}</span>
    <span style="font-size:10px;color:#6b7280;">${val}</span>
  </div>`
}

function buildWeeklyHtml(review: any, stats: any, weekStartStr: string, weekLessons: { date: Date; yesterdayLesson: string | null }[]): string {
  const weekEnd = new Date(weekStartStr)
  weekEnd.setDate(weekEnd.getDate() + 4)
  const weekEndStr = weekEnd.toISOString().slice(0, 10)

  const days = [
    { label: "Pn", obs: review.monObservation },
    { label: "Wt", obs: review.tueObservation },
    { label: "Śr", obs: review.wedObservation },
    { label: "Cz", obs: review.thuObservation },
    { label: "Pt", obs: review.friObservation },
  ]
  const dayStatsArr = [stats.byDay.mon, stats.byDay.tue, stats.byDay.wed, stats.byDay.thu, stats.byDay.fri]

  const dayRows = days.map((d, i) => {
    const ds = dayStatsArr[i]
    const pl = ds?.pl != null ? `<span style="color:${ds.pl >= 0 ? "#2D8C4E" : "#D96060"}">${sign(ds.pl)}</span>` : "—"
    const ps = ds?.processScore ?? "—"
    const men = ds?.mentalAfter ?? "—"
    return `<tr><td><b>${d.label}</b></td><td>${ps}</td><td>${men}</td><td>${pl}</td><td style="text-align:left">${d.obs ?? ""}</td></tr>`
  }).join("")

  const tierRows = (["A", "B", "C"] as const).map(t => {
    const ts = stats.byTier[t]
    const conclusion = review[`tier${t}Conclusion`] ?? ""
    return `<tr><td><b>${t}</b></td><td>${ts.trades}</td><td>${ts.trades ? pct(ts.winRate) : "—"}</td><td>${ts.trades ? r2(ts.avgR) : "—"}</td><td style="text-align:left">${conclusion}</td></tr>`
  }).join("")

  const errors = Array.isArray(review.repeatingErrors) ? review.repeatingErrors : []
  const errorRows = errors.filter((e: any) => e.error || e.count || e.triggerContext || e.costR || e.eliminationPlan).map((e: any) =>
    `<tr>
      <td style="text-align:left">${e.error ?? ""}</td>
      <td>${e.count ?? ""}</td>
      <td style="text-align:left">${e.triggerContext ?? ""}</td>
      <td>${e.costR ?? ""}</td>
      <td style="text-align:left">${e.eliminationPlan ?? ""}</td>
    </tr>`
  ).join("") || `<tr><td colspan="5" style="color:#9ca3af;text-align:center">brak</td></tr>`

  const practicePlan = Array.isArray(review.practicePlan) ? review.practicePlan : []
  const practiceRows = practicePlan.map((p: any) => {
    const priority = p.priority || "—"
    const priorityStyle = p.priority === "MUST"
      ? `background:#c9963d;color:#fff;padding:1px 4px;border-radius:2px;`
      : p.priority === "SHOULD" ? `background:#1e3a5f;color:#fff;padding:1px 4px;border-radius:2px;` : ""
    return `<tr>
      <td style="text-align:center"><span style="${priorityStyle}">${priority}</span></td>
      <td style="text-align:left">${p.task ?? ""}</td>
      <td style="text-align:left">${p.when ?? ""}</td>
      <td style="text-align:left">${p.howMeasure ?? ""}</td>
    </tr>`
  }).join("") || `<tr><td colspan="4" style="color:#9ca3af;text-align:center">brak</td></tr>`

  const bridgeItems = Array.isArray(review.bridgePreMortemItems) ? review.bridgePreMortemItems : []

  const lessonApplications: { date: string; applied: boolean | null }[] =
    Array.isArray(review.lessonApplications) ? review.lessonApplications : []

  const lessonRows = weekLessons
    .filter(l => l.yesterdayLesson)
    .map(l => {
      const dateStr = new Date(l.date).toISOString().split("T")[0]
      const dow = new Date(l.date).getUTCDay()
      const dayLabel = DAY_NAMES_PDF[dow] ?? dateStr
      const app = lessonApplications.find(a => a.date === dateStr)
      const applied = app?.applied
      const badge = applied === true
        ? `<span style="background:#2D6A4F;color:#fff;padding:1px 6px;border-radius:3px;font-size:8px;">Tak</span>`
        : applied === false
        ? `<span style="background:#D96060;color:#fff;padding:1px 6px;border-radius:3px;font-size:8px;">Nie</span>`
        : `<span style="color:#9ca3af;font-size:8px;">—</span>`
      return `<tr>
        <td style="text-align:left;font-weight:600;white-space:nowrap">${dayLabel}</td>
        <td style="text-align:left">${l.yesterdayLesson ?? ""}</td>
        <td style="text-align:center">${badge}</td>
      </tr>`
    }).join("")

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, Arial, sans-serif; font-size: 11px; color: #1a2332; background: #fff; }
  .section-header { background: #1e3a5f; color: #fff; padding: 5px 12px 5px 16px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; margin: 10px 0 5px; position: relative; border-radius: 2px; }
  .section-header::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #c9963d; }
  .field-row { display: flex; align-items: baseline; gap: 8px; padding: 2px 0; border-bottom: 0.5px solid #d1d5db; min-height: 18px; }
  .field-label { color: #6b7280; min-width: 160px; white-space: nowrap; font-size: 10px; }
  .field-value { flex: 1; font-size: 10px; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 4px 0 8px; }
  .stat-box { background: #f5f6f7; border: 0.5px solid #d1d5db; border-radius: 3px; padding: 6px 8px; text-align: center; }
  .stat-val { font-size: 14px; font-weight: 700; color: #1e3a5f; }
  .stat-lbl { font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 9px; margin: 4px 0 6px; }
  th { background: #1e3a5f; color: #fff; padding: 3px 5px; font-weight: 600; text-align: center; }
  td { border-bottom: 0.5px solid #d1d5db; padding: 3px 5px; vertical-align: top; text-align: center; }
  .title-bar { background: #f5f6f7; border-left: 3px solid #c9963d; padding: 6px 12px; margin-bottom: 8px; }
  h1 { font-size: 13px; font-weight: 700; color: #1e3a5f; }
  .gold-box { padding: 6px 10px; background: #fffbf0; border-left: 3px solid #c9963d; font-size: 10px; margin: 4px 0; }
  .mid-box { padding: 6px 10px; background: #f0f4f8; border-left: 3px solid #1e3a5f; font-size: 10px; margin: 4px 0; }
</style>
</head>
<body>

<div class="title-bar">
  <h1>THE FORGE · PRZEGLĄD TYGODNIOWY</h1>
  <div style="font-size:10px;color:#6b7280;margin-top:2px">${weekStartStr} — ${weekEndStr}</div>
  ${review.oneSentenceSummary ? `<div style="font-size:10px;font-style:italic;color:#1e3a5f;margin-top:4px">„${review.oneSentenceSummary}"</div>` : ""}
</div>

${review.lastWeekGoalRecap ? `<div class="gold-box"><b>Cel z poprzedniego tygodnia:</b> ${review.lastWeekGoalRecap}</div>` : ""}

<div class="section-header">1. STATYSTYKI TYGODNIA</div>
<div class="stat-grid">
  <div class="stat-box"><div class="stat-val">${stats.trades}</div><div class="stat-lbl">Transakcji</div></div>
  <div class="stat-box"><div class="stat-val" style="color:${stats.winRate >= 0.5 ? "#2D8C4E" : "#D96060"}">${pct(stats.winRate)}</div><div class="stat-lbl">Win rate</div></div>
  <div class="stat-box"><div class="stat-val">${r2(stats.avgR)}</div><div class="stat-lbl">Avg R</div></div>
  <div class="stat-box"><div class="stat-val" style="color:${stats.totalPnL >= 0 ? "#2D8C4E" : "#D96060"}">${sign(stats.totalPnL)}</div><div class="stat-lbl">Net P&L ($)</div></div>
</div>
<div style="display:flex;gap:12px;font-size:9px;color:#6b7280;margin-bottom:6px">
  <span>Best R: <b>${r2(stats.bestR)}</b></span>
  <span>Worst R: <b>${r2(stats.worstR)}</b></span>
  <span>Profit factor: <b>${stats.profitFactor > 0 ? r2(stats.profitFactor) : "—"}</b></span>
  ${review.maxDrawdown ? `<span>Max DD: <b>${review.maxDrawdown}</b></span>` : ""}
</div>

<table style="margin-bottom:4px">
  <thead><tr><th style="text-align:left"></th><th>Sen (1–10)</th><th>Energia (1–10)</th><th>Fokus (1–10)</th><th>Przygotowanie (1–10)</th></tr></thead>
  <tbody><tr>
    <td style="text-align:left;font-size:9px;color:#6b7280">${stats.sessionCount} sesji</td>
    <td>${stats.sleepAvg > 0 ? stats.sleepAvg.toFixed(1) : "—"}</td>
    <td>${stats.energyAvg !== null ? stats.energyAvg.toFixed(1) : "—"}</td>
    <td>${stats.focusAvg !== null ? stats.focusAvg.toFixed(1) : "—"}</td>
    <td>${stats.prepQualityAvg !== null ? stats.prepQualityAvg.toFixed(1) : "—"}</td>
  </tr></tbody>
</table>

${circleRow("Proces (1–10):", stats.processAvg, 10)}
${circleRow("Ogólna ocena (1–10):", stats.overallAvg, 10)}

${lessonRows ? `
<div style="font-size:9px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:0.3px;margin:8px 0 3px">Lekcje dnia — czy zastosowałeś?</div>
<table>
  <thead><tr><th style="text-align:left;width:15%">Dzień</th><th style="text-align:left;width:75%">Lekcja</th><th style="width:10%">Zastosowanie</th></tr></thead>
  <tbody>${lessonRows}</tbody>
</table>` : ""}

<div class="section-header">2. TIERY</div>
<table>
  <thead><tr><th>Tier</th><th>Tr.</th><th>Win%</th><th>Avg R</th><th style="text-align:left">Wnioski</th></tr></thead>
  <tbody>${tierRows}</tbody>
</table>

<div class="section-header">3. DNI TYGODNIA</div>
<table>
  <thead><tr><th>Dzień</th><th>Process</th><th>Mental</th><th>P&L</th><th style="text-align:left">Obserwacje</th></tr></thead>
  <tbody>${dayRows}</tbody>
</table>

<div class="section-header">4. NAJLEPSZE / NAJGORSZE ZAGRANIE</div>
${field("Najlepsze — dlaczego?", review.bestTradeWhy)}
${field("Najgorsze — co poszło nie tak?", review.worstTradeWhatWentWrong)}

<div class="section-header">5. LEKCJE I WDZIĘCZNOŚĆ</div>
${review.lesson1 ? `<div class="field-row"><span class="field-label">Lekcja 1:</span><span class="field-value">${review.lesson1}</span></div>` : ""}
${review.lesson2 ? `<div class="field-row"><span class="field-label">Lekcja 2:</span><span class="field-value">${review.lesson2}</span></div>` : ""}
${review.lesson3 ? `<div class="field-row"><span class="field-label">Lekcja 3:</span><span class="field-value">${review.lesson3}</span></div>` : ""}
${field("Wdzięczność:", review.gratitude)}

<div class="section-header">6. WZORCE I BŁĘDY</div>
${field("Kiedy byłem najmocniejszy:", review.patternWhenStrongest)}
<table style="margin-top:4px">
  <thead><tr><th style="text-align:left;width:22%">Błąd</th><th style="width:8%">Ile razy</th><th style="text-align:left;width:28%">Trigger / kontekst</th><th style="width:10%">Koszt (R)</th><th style="text-align:left;width:32%">Plan eliminacji</th></tr></thead>
  <tbody>${errorRows}</tbody>
</table>

<div class="section-header">7. KAPITAŁ MENTALNY</div>
${field("Co mnie odnowiło:", review.renewedMe)}
${field("Co mnie wysączyło:", review.drainedMe)}

<div class="section-header">8. TOŻSAMOŚĆ</div>
${field("Byłem tym traderem — kiedy:", review.identityWasThatTrader)}
${field("Nie byłem sobą — kiedy:", review.identityWasNot)}
${field("Mapa zagrożeń:", review.threatsMap)}

<div class="section-header">9. MOST DO DAILY (Bridge 2)</div>
${review.bridgeStrategicTopic ? `<div class="gold-box"><b>Temat strategiczny:</b> ${review.bridgeStrategicTopic}</div>` : ""}
${bridgeItems.length > 0 ? `<div style="font-size:9px;color:#6b7280;margin:4px 0 2px">Pre-mortem items:</div>${bridgeItems.map((item: string, i: number) => `<div style="font-size:10px;padding:2px 0">${i + 1}. ${item}</div>`).join("")}` : ""}

<div class="section-header">10. DELIBERATE PRACTICE — ROZLICZENIE + PLAN</div>
${review.lastWeekPracticeCount != null
  ? `<div class="field-row"><span class="field-label">Plan poprz. tygodnia — wykonano:</span><span class="field-value">${review.lastWeekPracticeCount} z 3 zadań</span></div>`
  : ""}
${field("Co poszło nie tak:", review.lastWeekPracticeWhatWentWrong)}
<table style="margin-top:6px">
  <thead><tr><th style="width:10%">Priorytet</th><th style="text-align:left;width:40%">Zadanie</th><th style="text-align:left;width:20%">Kiedy?</th><th style="text-align:left;width:30%">Jak zmierzę?</th></tr></thead>
  <tbody>${practiceRows}</tbody>
</table>
${review.practiceMeta ? `<div style="font-size:9px;color:#6b7280;margin-top:5px"><b>META:</b> ${review.practiceMeta}</div>` : ""}

<div class="section-header">11. CEL I PODSUMOWANIE</div>
${review.mentorTopic ? `<div class="field-row"><span class="field-label">Temat do mentora:</span><span class="field-value">${review.mentorTopic}</span></div>` : ""}
${field("Stop-loss tygodniowy:", review.stopLossThreshold)}
${field("System check:", review.systemCheck)}
${review.processGoalNextWeek ? `<div class="gold-box"><b>Cel procesowy na przyszły tydzień:</b> ${review.processGoalNextWeek}${review.processGoalProbability ? ` <span style="color:#6b7280">(${review.processGoalProbability}%)</span>` : ""}</div>` : ""}

</body>
</html>`
}
