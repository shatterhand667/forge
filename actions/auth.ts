"use server"

import { prisma } from "@/lib/db"
import { signIn } from "@/auth"
import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"

export async function registerUser(formData: FormData) {
  const email = formData.get("email")
  const password = formData.get("password")

  if (typeof email !== "string" || typeof password !== "string" || !email || password.length < 8) {
    return { error: "Email i hasło (min. 8 znaków) są wymagane." }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "Konto z tym emailem już istnieje." }
  }

  const hash = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { email, password: hash } })

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Błąd logowania po rejestracji." }
    }
    throw error
  }
}

export async function loginUser(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Nieprawidłowy email lub hasło." }
    }
    throw error
  }
}
