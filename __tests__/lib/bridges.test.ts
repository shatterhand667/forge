import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  prisma: {
    dailyCard: { findFirst: vi.fn() },
    weeklyReview: { findFirst: vi.fn() },
  },
}))

import { prisma } from "@/lib/db"
import { getYesterdayLesson, getLastWeekLesson, getBridge2Items, getYesterdayMentorComment, getLastWeeklyReview } from "@/lib/bridges"

describe("getYesterdayLesson", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns tomorrowRemember from most recent previous card", async () => {
    vi.mocked(prisma.dailyCard.findFirst).mockResolvedValue({
      tomorrowRemember: "Nie wchodź w C-setup po 14:00",
    } as any)

    const result = await getYesterdayLesson("user-1", new Date("2026-05-06"))

    expect(prisma.dailyCard.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        date: { lt: new Date("2026-05-06") },
        tomorrowRemember: { not: null },
      },
      orderBy: { date: "desc" },
      select: { tomorrowRemember: true },
    })
    expect(result).toBe("Nie wchodź w C-setup po 14:00")
  })

  it("returns null when no previous card exists", async () => {
    vi.mocked(prisma.dailyCard.findFirst).mockResolvedValue(null)
    expect(await getYesterdayLesson("user-1", new Date("2026-05-06"))).toBeNull()
  })
})

describe("getLastWeekLesson", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns bridgeStrategicTopic from most recent weekly review", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue({
      bridgeStrategicTopic: "Focusuj się tylko na A-setupach",
    } as any)

    const result = await getLastWeekLesson("user-1", new Date("2026-05-06"))
    expect(result).toBe("Focusuj się tylko na A-setupach")
  })

  it("returns null when no weekly review exists", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue(null)
    expect(await getLastWeekLesson("user-1", new Date("2026-05-06"))).toBeNull()
  })
})

describe("getBridge2Items", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns bridgePreMortemItems array from most recent weekly review", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue({
      bridgePreMortemItems: ["Nie revenge trade", "Stop przed newsami", "Max 3 trades/dzień"],
    } as any)

    const result = await getBridge2Items("user-1", new Date("2026-05-06"))
    expect(result).toEqual(["Nie revenge trade", "Stop przed newsami", "Max 3 trades/dzień"])
  })

  it("returns empty array when no weekly review exists", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue(null)
    expect(await getBridge2Items("user-1", new Date("2026-05-06"))).toEqual([])
  })
})

describe("getYesterdayMentorComment", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns mentorComment from the most recent card with a comment", async () => {
    vi.mocked(prisma.dailyCard.findFirst).mockResolvedValue({
      mentorComment: "Dobra robota z setupem A.",
    } as any)

    const result = await getYesterdayMentorComment("user-1", new Date("2026-05-06"))
    expect(result).toBe("Dobra robota z setupem A.")
  })

  it("returns null when no card has a mentor comment", async () => {
    vi.mocked(prisma.dailyCard.findFirst).mockResolvedValue(null)

    const result = await getYesterdayMentorComment("user-1", new Date("2026-05-06"))
    expect(result).toBeNull()
  })

  it("queries only cards before the given date with correct ordering", async () => {
    vi.mocked(prisma.dailyCard.findFirst).mockResolvedValue(null)

    await getYesterdayMentorComment("user-1", new Date("2026-05-06"))

    expect(prisma.dailyCard.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-1", date: { lt: new Date("2026-05-06") }, mentorComment: { not: null } },
      orderBy: { date: "desc" },
      select: { mentorComment: true },
    })
  })
})

describe("getLastWeeklyReview", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns processGoalNextWeek from most recent weekly before date", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue({
      processGoalNextWeek: "Focusuj na A-setupach, max 3 trades/dzień",
    } as any)

    const result = await getLastWeeklyReview("u1", new Date("2026-05-11"))
    expect(result?.processGoalNextWeek).toBe("Focusuj na A-setupach, max 3 trades/dzień")
  })

  it("returns null when no previous weekly exists", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue(null)

    const result = await getLastWeeklyReview("u1", new Date("2026-05-11"))
    expect(result).toBeNull()
  })

  it("queries with weekStart < beforeDate ordered descending", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue(null)

    await getLastWeeklyReview("u1", new Date("2026-05-11"))

    expect(prisma.weeklyReview.findFirst).toHaveBeenCalledWith({
      where: { userId: "u1", weekStart: { lt: new Date("2026-05-11") } },
      orderBy: { weekStart: "desc" },
      select: { processGoalNextWeek: true },
    })
  })
})
