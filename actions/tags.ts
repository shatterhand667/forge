"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

const DEFAULT_TAGS = ["Cierpliwy", "FOMO", "Skupiony", "Strach", "W strefie"]

export async function getUserTags() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const tags = await prisma.dayTag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { cards: true } } },
  })

  if (tags.length === 0) {
    await prisma.dayTag.createMany({
      data: DEFAULT_TAGS.map((name) => ({ userId, name })),
    })
    return prisma.dayTag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: { _count: { select: { cards: true } } },
    })
  }

  return tags
}

export async function createTag(name: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Tag name cannot be empty")

  await prisma.dayTag.create({ data: { userId, name: trimmed } })
  revalidatePath("/dashboard")
}

export async function deleteTag(tagId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id
  await prisma.dayTag.deleteMany({ where: { id: tagId, userId } })
  revalidatePath("/dashboard")
}

export async function setCardTags(cardId: string, tagIds: string[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id
  if (tagIds.length > 3) throw new Error("Max 3 tags per day")

  const card = await prisma.dailyCard.findFirst({ where: { id: cardId, userId } })
  if (!card) throw new Error("Card not found")

  if (tagIds.length > 0) {
    const ownedTags = await prisma.dayTag.findMany({
      where: { id: { in: tagIds }, userId },
      select: { id: true },
    })
    if (ownedTags.length !== tagIds.length) throw new Error("Invalid tag(s)")
  }

  await prisma.$transaction([
    prisma.dailyCardDayTag.deleteMany({ where: { dailyCardId: cardId } }),
    ...(tagIds.length > 0
      ? [prisma.dailyCardDayTag.createMany({
          data: tagIds.map((dayTagId) => ({ dailyCardId: cardId, dayTagId })),
        })]
      : []),
  ])
  revalidatePath("/dashboard")
}

export async function getTagWithCards(tagId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  return prisma.dayTag.findFirst({
    where: { id: tagId, userId },
    include: {
      cards: {
        include: {
          dailyCard: {
            select: {
              date: true,
              processScore: true,
              trades: { select: { profitRaw: true } },
            },
          },
        },
      },
    },
  })
}
