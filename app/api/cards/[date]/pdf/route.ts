import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import puppeteer from "puppeteer"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { date: dateStr } = await params
  const date = new Date(dateStr)
  const card = await prisma.dailyCard.findUnique({
    where: { userId_date: { userId: session.user.id, date } },
    include: {
      trades: { orderBy: { createdAt: "asc" } },
      emotionEntries: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!card) return new NextResponse("Not found", { status: 404 })

  const html = buildCardHtml(card, dateStr)

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
      "Content-Disposition": `attachment; filename="forge-${dateStr}.pdf"`,
    },
  })
}

function buildCardHtml(card: any, dateStr: string): string {
  const tradeRows = card.trades
    .map(
      (t: any) => `
      <tr>
        <td>${t.time ?? ""}</td><td>${t.trigger ?? ""}</td><td>${t.setup ?? ""}</td>
        <td>${t.direction ?? ""}</td><td>${t.tier ?? ""}</td>
        <td>${t.rExpected ?? ""}</td><td>${t.rActual ?? ""}</td>
        <td>${t.emotion ?? ""}</td><td>${t.lessons ?? ""}</td>
      </tr>`
    )
    .join("")

  const emotionRows = card.emotionEntries
    .map(
      (e: any) => `
      <tr>
        <td>${e.time ?? ""}</td><td>${e.emotion ?? ""}</td>
        <td>${e.triggerContext ?? ""}</td><td>${e.meaningSignal ?? ""}</td>
        <td>${e.reaction ?? ""}</td>
      </tr>`
    )
    .join("")

  const dotHtml = (value: number | null, max = 5) =>
    Array.from({ length: max }, (_, i) =>
      `<span class="dot ${i + 1 <= (value ?? 0) ? "dot-filled" : ""}">${i + 1}</span>`
    ).join("")

  const goldCircleHtml = (value: number | null) =>
    Array.from({ length: 5 }, (_, i) =>
      `<span class="gold-circle ${i + 1 <= (value ?? 0) ? "gold-circle-filled" : ""}"></span>`
    ).join("")

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, Arial, sans-serif; font-size: 11px; color: #1a2332; background: #fff; }
  .section-header { background: #1e3a5f; color: #fff; padding: 5px 12px 5px 16px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; margin: 12px 0 6px; position: relative; border-radius: 2px; }
  .section-header::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #c9963d; }
  .field-row { display: flex; align-items: baseline; gap: 8px; padding: 2px 0; border-bottom: 0.5px solid #d1d5db; min-height: 18px; }
  .field-label { color: #6b7280; min-width: 130px; white-space: nowrap; font-size: 10px; }
  .field-value { flex: 1; font-size: 10px; }
  .dot { display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; border: 0.8px solid #1e3a5f; border-radius: 50%; font-size: 7px; color: #6b7280; margin-right: 4px; }
  .dot-filled { background: #1e3a5f; color: #fff; }
  .gold-circle { display: inline-block; width: 16px; height: 16px; border: 1.5px solid #c9963d; border-radius: 50%; margin-right: 5px; }
  .gold-circle-filled { background: #c9963d; }
  table { width: 100%; border-collapse: collapse; font-size: 9px; margin-top: 4px; }
  th { background: #1e3a5f; color: #fff; padding: 3px 4px; font-weight: 600; text-align: left; }
  td { border-bottom: 0.5px solid #d1d5db; padding: 3px 4px; vertical-align: top; min-height: 16px; }
  .lesson-box { background: #f5f6f7; border-left: 3px solid #c9963d; padding: 6px 10px; font-size: 10px; margin-bottom: 6px; }
  .scale-anchor { font-style: italic; color: #6b7280; font-size: 8px; margin-top: 3px; }
  .title-bar { background: #f5f6f7; border-left: 3px solid #c9963d; padding: 6px 12px; margin-bottom: 8px; }
  h1 { font-size: 13px; font-weight: 700; color: #1e3a5f; }
  .when-then { display: flex; gap: 8px; align-items: baseline; border-bottom: 0.5px solid #d1d5db; padding: 3px 0; }
</style>
</head>
<body>
  <div class="title-bar">
    <h1>TRADING POD · DAILY CARD</h1>
    <div class="field-row"><span class="field-label">Data:</span><span class="field-value">${dateStr}</span></div>
  </div>

  ${card.yesterdayLesson ? `<div class="lesson-box">LEKCJA Z WCZORAJ: ${card.yesterdayLesson}</div>` : ""}
  ${card.lastWeekLesson ? `<div class="lesson-box" style="border-color:#1e3a5f">LEKCJA Z POPRZ. TYGODNIA: ${card.lastWeekLesson}</div>` : ""}

  <div class="section-header">1. KONTEKST OSOBISTY (RANO)</div>
  <div class="field-row"><span class="field-label">Sen:</span>${dotHtml(card.sleep)}</div>
  <div class="field-row"><span class="field-label">Energia:</span>${dotHtml(card.energy)}</div>
  <div class="field-row"><span class="field-label">Fokus:</span>${dotHtml(card.focus)}</div>
  <div class="field-row"><span class="field-label">Jakość przygotowania:</span>${dotHtml(card.prepQuality)}</div>
  <div class="field-row"><span class="field-label">Nastrój / notatki:</span><span class="field-value">${card.moodNotes ?? ""}</span></div>

  <div class="section-header">2. KONTEKST RYNKOWY</div>
  <div class="field-row"><span class="field-label">Trend / bias:</span><span class="field-value">${card.trendBias ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Kluczowe poziomy:</span><span class="field-value">${card.keyLevels ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Makro / news:</span><span class="field-value">${card.macroNews ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Korelacje:</span><span class="field-value">${card.correlations ?? ""}</span></div>

  <div class="section-header">3. PLAN DNIA</div>
  <div class="field-row"><span class="field-label">What-ifs:</span><span class="field-value">${card.whatIfs ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Warunki wejścia:</span><span class="field-value">${card.entryConditions ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Setup A (100%):</span><span class="field-value">${card.tierASetup ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Setup B (50%):</span><span class="field-value">${card.tierBSetup ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Setup C (25%):</span><span class="field-value">${card.tierCSetup ?? ""}</span></div>

  <div class="section-header">4. PRE-MORTEM</div>
  <div class="field-row"><span class="field-label">Co mogę dziś zepsuć?</span><span class="field-value">${card.preMortem ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Cel dzienny:</span><span class="field-value">${card.dailyGoal ?? ""}</span></div>

  <div class="section-header">5. LOG TRANSAKCJI</div>
  <table>
    <thead><tr><th>Czas</th><th>Trigger</th><th>Setup</th><th>Kier.</th><th>Tier</th><th>R plan.</th><th>R real.</th><th>Emocja</th><th>Lekcje</th></tr></thead>
    <tbody>${tradeRows}</tbody>
  </table>

  <div class="section-header">6. LOG EMOCJI</div>
  <table>
    <thead><tr><th>Czas</th><th>Emocja</th><th>Trigger / kontekst</th><th>Znaczenie (sygnał)</th><th>Reakcja</th></tr></thead>
    <tbody>${emotionRows}</tbody>
  </table>

  <div class="section-header">7. OCENY OBSZARÓW</div>
  <div class="field-row"><span class="field-label">Setupy:</span>${dotHtml(card.setupsScore)}</div>
  <div class="field-row"><span class="field-label">Egzekucja:</span>${dotHtml(card.executionScore)}</div>
  <div class="field-row"><span class="field-label">Zarządzanie ryzykiem:</span>${dotHtml(card.riskScore)}</div>
  <div class="field-row"><span class="field-label">Psychologia:</span>${dotHtml(card.psychologyScore)}</div>
  <div class="field-row"><span class="field-label">Dyscyplina:</span>${dotHtml(card.disciplineScore)}</div>
  <div class="scale-anchor">1 = naruszenie zasad · 3 = poprawnie ale automatycznie · 5 = świadomie i zgodnie z planem</div>

  <div class="section-header">8. SILNE STRONY W AKCJI</div>
  <div class="field-row"><span class="field-value">${card.strengthsUsed ?? ""}</span></div>

  <div class="section-header">9. JEDNA RZECZ DO POPRAWY</div>
  <div class="when-then">
    <span class="field-label">Kiedy</span>
    <span class="field-value">${card.improvementWhen ?? ""}</span>
    <span class="field-label">wtedy</span>
    <span class="field-value">${card.improvementThen ?? ""}</span>
  </div>
  <div class="field-row"><span class="field-value">${card.improvementExtra ?? ""}</span></div>

  <div class="section-header">10. STAN MENTALNY PO SESJI</div>
  <div class="field-row"><span class="field-label">Stan mentalny:</span>${dotHtml(card.mentalAfter)}</div>
  <div class="field-row"><span class="field-label">Co na niego wpłynęło?</span><span class="field-value">${card.whatShapedIt ?? ""}</span></div>

  <div class="section-header">11. DELIBERATE PRACTICE</div>
  <div class="field-row"><span class="field-value">${card.deliberatePractice ?? ""}</span></div>

  <div class="section-header">12. OCENA DZIENNA</div>
  <div class="field-row"><span class="field-label">Process score (1–10):</span><span class="field-value">${card.processScore ?? "—"}</span></div>
  <div class="field-row"><span class="field-label">P&amp;L:</span><span class="field-value">${card.pl ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Ogólna ocena:</span>${goldCircleHtml(card.overallScore)}</div>

  <div class="section-header">13. TOŻSAMOŚĆ</div>
  <div class="field-row"><span class="field-label">DUMNY:</span><span class="field-value">${card.proudOf ?? ""}</span></div>
  <div class="field-row"><span class="field-label">ZAWSTYDZONY:</span><span class="field-value">${card.ashamedOf ?? ""}</span></div>

  <div class="section-header">14. LEKCJA NA JUTRO</div>
  <div class="field-row"><span class="field-value">${card.tomorrowRemember ?? ""}</span></div>
</body>
</html>`
}
