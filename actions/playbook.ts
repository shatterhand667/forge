"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getPlaybook() {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.playbook.findUnique({
    where: { userId: session.user.id },
    include: {
      setups: { orderBy: { order: "asc" } },
      triggers: { orderBy: { order: "asc" } },
    },
  })
}

export async function savePlaybookField(field: string, value: string | number | null) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  await prisma.playbook.upsert({
    where: { userId },
    create: { userId, [field]: value },
    update: { [field]: value },
  })
  revalidatePath("/dashboard")
}

export async function savePlaybookJson(field: string, value: string[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  await prisma.playbook.upsert({
    where: { userId },
    create: { userId, [field]: value },
    update: { [field]: value },
  })
  revalidatePath("/dashboard")
}

export async function createSetup() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const pb = await prisma.playbook.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true, setups: { select: { order: true } } },
  })

  const maxOrder = pb.setups.reduce((m, s) => Math.max(m, s.order), -1)

  const setup = await prisma.playbookSetup.create({
    data: { playbookId: pb.id, order: maxOrder + 1 },
  })
  revalidatePath("/dashboard")
  return setup
}

export async function updateSetup(
  id: string,
  data: Partial<{
    name: string
    tier: string | null
    description: string | null
    criteria: string[]
    invalidation: string | null
    bestContext: string | null
  }>
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const setup = await prisma.playbookSetup.findFirst({
    where: { id },
    include: { playbook: { select: { userId: true } } },
  })
  if (!setup || setup.playbook.userId !== session.user.id) throw new Error("Not found")

  await prisma.playbookSetup.update({ where: { id }, data })
  revalidatePath("/dashboard")
}

export async function getPlaybookSetups() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.playbookSetup.findMany({
    where: { playbook: { userId: session.user.id } },
    select: { id: true, name: true, tier: true },
    orderBy: { order: "asc" },
  })
}

export async function deleteSetup(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const setup = await prisma.playbookSetup.findFirst({
    where: { id },
    include: { playbook: { select: { userId: true } } },
  })
  if (!setup || setup.playbook.userId !== session.user.id) throw new Error("Not found")

  await prisma.playbookSetup.delete({ where: { id } })
  revalidatePath("/dashboard")
}

export async function createTrigger() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const pb = await prisma.playbook.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true, triggers: { select: { order: true } } },
  })

  const maxOrder = pb.triggers.reduce((m, t) => Math.max(m, t.order), -1)

  const trigger = await prisma.playbookTrigger.create({
    data: { playbookId: pb.id, order: maxOrder + 1 },
  })
  revalidatePath("/dashboard")
  return trigger
}

export async function updateTrigger(
  id: string,
  data: Partial<{ name: string; description: string | null }>
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const trigger = await prisma.playbookTrigger.findFirst({
    where: { id },
    include: { playbook: { select: { userId: true } } },
  })
  if (!trigger || trigger.playbook.userId !== session.user.id) throw new Error("Not found")

  await prisma.playbookTrigger.update({ where: { id }, data })
  revalidatePath("/dashboard")
}

export async function deleteTrigger(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const trigger = await prisma.playbookTrigger.findFirst({
    where: { id },
    include: { playbook: { select: { userId: true } } },
  })
  if (!trigger || trigger.playbook.userId !== session.user.id) throw new Error("Not found")

  await prisma.playbookTrigger.delete({ where: { id } })
  revalidatePath("/dashboard")
}

export async function getPlaybookTriggers() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.playbookTrigger.findMany({
    where: { playbook: { userId: session.user.id } },
    select: { id: true, name: true },
    orderBy: { order: "asc" },
  })
}
