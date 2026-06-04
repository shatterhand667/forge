import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const date = formData.get("date") as string | null

  if (!file || !date) return NextResponse.json({ error: "Missing file or date" }, { status: 400 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png"
  if (!["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
  }

  const card = await prisma.dailyCard.findUnique({
    where: { userId_date: { userId, date: new Date(date) } },
    select: { id: true },
  })
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 })

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "screenshots")
  await mkdir(uploadsDir, { recursive: true })

  const filename = `${date}-${userId}-${Date.now()}.${ext}`
  const filepath = path.join(uploadsDir, filename)
  const bytes = await file.arrayBuffer()
  await writeFile(filepath, Buffer.from(bytes))

  const screenshotPath = `/uploads/screenshots/${filename}`
  const screenshot = await prisma.dailyCardScreenshot.create({
    data: { dailyCardId: card.id, path: screenshotPath },
  })

  return NextResponse.json({ id: screenshot.id, path: screenshotPath })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { id } = await req.json()
  const screenshot = await prisma.dailyCardScreenshot.findFirst({
    where: { id },
    include: { dailyCard: { select: { userId: true } } },
  })
  if (!screenshot || screenshot.dailyCard.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.dailyCardScreenshot.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
