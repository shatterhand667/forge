export interface MT5Trade {
  time: string
  instrument: string
  direction: "long" | "short"
  volume: number
  price: number
  profitRaw: number
  comment: string
}

// MT5 "History" tab export — tab-separated or semicolon-separated CSV
// Columns (Detailed Report): Time, Deal, Symbol, Type, Direction, Volume, Price, Order, Commission, Swap, Profit, Balance, Comment
// Direction values: "in" (open), "out" (close), "in/out" (reverse)
// Type values: "buy", "sell", "balance", "credit" — skip non-trade rows

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim()
}

function parseMT5HTML(content: string): MT5Trade[] {
  // MT5 HTML: all sections (Pozycje / Zlecenia / Transakcje) are in ONE <table>.
  // Section headers are <th> rows with bold text like "Pozycje".
  // Pozycje data rows: [0]=open time, [1]=position ID, [2]=instrument, [3]=type,
  //   [4]=hidden empty td (colspan=8 visual columns), [5]=volume, [6]=open price,
  //   [7]=S/L, [8]=T/P, [9]=close time, [10]=close price, [11]=commission, [12]=swap,
  //   [last]=Zysk (colspan=2 visually but single <td>)

  const rows = [...content.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
  const allRows = rows.map(r =>
    [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(c => stripTags(c[1]).trim())
  )

  // Find the row with "Pozycje" section title
  const pozycjeIdx = allRows.findIndex(cells =>
    cells.some(c => /pozycj|^positions?$/i.test(c))
  )
  if (pozycjeIdx === -1) return []

  // Find the row with "Zlecenia"/"Orders" to know where Pozycje section ends
  const zleceniaIdx = allRows.findIndex((cells, i) =>
    i > pozycjeIdx && cells.some(c => /zleceni|^orders?$/i.test(c))
  )
  const sectionEnd = zleceniaIdx !== -1 ? zleceniaIdx : allRows.length

  // Skip the column header row (+1) and start parsing data rows (+2)
  const results: MT5Trade[] = []

  for (let i = pozycjeIdx + 2; i < sectionEnd; i++) {
    const cols = allRows[i]
    // Data rows have at least 5 cells; skip separator/empty rows
    if (cols.length < 5) continue

    const timeRaw    = cols[0]
    const instrument = cols[2]
    const type       = cols[3]?.toLowerCase()
    // cols[4] is hidden empty colspan=8 td; cols[5] is volume
    const volumeRaw  = cols[5] ?? ""
    const volume     = parseFloat(volumeRaw.replace(/\s/g, "").replace(",", ".")) || 0
    // Profit is always the last cell in the row
    const profitStr  = cols[cols.length - 1] ?? ""
    const profit     = Math.round((parseFloat(profitStr.replace(/\s/g, "").replace(",", ".")) || 0) * 100) / 100

    if (!type) continue
    const typeDir = type === "buy" ? "long" : type === "sell" ? "short" : null
    if (!typeDir) continue
    if (profit === 0) continue

    const timeMatch = timeRaw.match(/(\d{2}:\d{2})/)
    const time = timeMatch ? timeMatch[1] : timeRaw

    results.push({ time, instrument, direction: typeDir, volume, price: 0, profitRaw: profit, comment: "" })
  }

  return results
}

export function parseMT5CSV(content: string): MT5Trade[] {
  // Delegate to HTML parser if content looks like HTML
  if (content.trimStart().startsWith("<")) return parseMT5HTML(content)

  const lines = content
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  // Detect delimiter
  const delim = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ","

  const headers = lines[0].split(delim).map(h => h.trim().toLowerCase().replace(/['"]/g, ""))

  const idx = (names: string[]) => {
    for (const name of names) {
      const i = headers.findIndex(h => h.includes(name))
      if (i !== -1) return i
    }
    return -1
  }

  const iTime      = idx(["time", "czas"])
  const iSymbol    = idx(["symbol", "instrument", "walor"])
  const iType      = idx(["type", "typ"])
  const iDirection = idx(["direction", "kierunek"])
  const iVolume    = idx(["volume", "wolumen", "lot"])
  const iPrice     = idx(["price", "cena"])
  const iProfit    = idx(["profit", "zysk"])
  const iComment   = idx(["comment", "komentarz"])

  const results: MT5Trade[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delim).map(c => c.trim().replace(/^["']|["']$/g, ""))
    if (cols.length < 3) continue

    const type = iType !== -1 ? cols[iType]?.toLowerCase() : ""
    // Skip balance, credit, deposit rows
    if (!type || ["balance", "credit", "deposit", "withdrawal"].some(t => type.includes(t))) continue

    const direction = iDirection !== -1 ? cols[iDirection]?.toLowerCase() : ""
    // Skip "out" rows (closing entries) — we want "in" (opening entries) or "in/out"
    if (direction === "out") continue

    const typeDir = type.includes("buy") ? "long" : type.includes("sell") ? "short" : null
    if (!typeDir) continue

    const timeRaw  = iTime !== -1 ? cols[iTime] : ""
    const symbol   = iSymbol !== -1 ? cols[iSymbol] : ""
    const volume   = iVolume !== -1 ? parseFloat(cols[iVolume]?.replace(",", ".")) || 0 : 0
    const price    = iPrice !== -1 ? parseFloat(cols[iPrice]?.replace(",", ".")) || 0 : 0
    const profit   = iProfit !== -1 ? Math.round((parseFloat(cols[iProfit]?.replace(",", ".")) || 0) * 100) / 100 : 0
    const comment  = iComment !== -1 ? cols[iComment] : ""

    // Format time: "2026.05.14 10:32:15" → "10:32"
    const timeMatch = timeRaw.match(/(\d{2}:\d{2})/)
    const time = timeMatch ? timeMatch[1] : timeRaw

    if (profit === 0) continue
    results.push({ time, instrument: symbol, direction: typeDir, volume, price, profitRaw: profit, comment })
  }

  return results
}
