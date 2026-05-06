"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function addEmotionEntry(
  dailyCardId: string,
  data: {
    time?: string; emotion?: string; triggerContext?: string
    meaningSignal?: string; reaction?: string
  }
) {
  const userId = await requireUser()
  const card = await prisma.dailyCard.findFirst({ where: { id: dailyCardId, userId } })
  if (!card) throw new Error("Card not found")

  return prisma.emotionEntry.create({ data: { dailyCardId, ...data } })
}

export async function updateEmotionEntry(
  id: string,
  data: Partial<{
    time: string; emotion: string; triggerContext: string
    meaningSignal: string; reaction: string
  }>
) {
  const userId = await requireUser()
  const entry = await prisma.emotionEntry.findFirst({
    where: { id },
    include: { dailyCard: { select: { userId: true } } },
  })
  if (!entry || entry.dailyCard.userId !== userId) throw new Error("Not found")

  return prisma.emotionEntry.update({ where: { id }, data })
}

export async function deleteEmotionEntry(id: string) {
  const userId = await requireUser()
  const entry = await prisma.emotionEntry.findFirst({
    where: { id },
    include: { dailyCard: { select: { userId: true } } },
  })
  if (!entry || entry.dailyCard.userId !== userId) throw new Error("Not found")

  return prisma.emotionEntry.delete({ where: { id } })
}
