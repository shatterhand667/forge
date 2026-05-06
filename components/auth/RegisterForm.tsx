"use client"

import { useState } from "react"
import Link from "next/link"
import { registerUser } from "@/actions/auth"

const inputStyle = {
  width: "100%",
  border: `1px solid var(--color-border)`,
  borderRadius: 4,
  padding: "8px 10px",
  fontSize: "var(--font-size-body)",
  fontFamily: "var(--font-family)",
  outline: "none",
} as const

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await registerUser(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-center font-bold" style={{ fontSize: 16, color: "var(--color-dark)" }}>
        Utwórz konto
      </h1>

      {error && (
        <p className="text-center text-sm" style={{ color: "#dc2626" }}>{error}</p>
      )}

      <div className="flex flex-col gap-1">
        <label style={{ fontSize: "var(--font-size-label)", color: "var(--color-muted)" }}>Email</label>
        <input type="email" name="email" required autoComplete="email" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1">
        <label style={{ fontSize: "var(--font-size-label)", color: "var(--color-muted)" }}>Hasło (min. 8 znaków)</label>
        <input type="password" name="password" required minLength={8} autoComplete="new-password" style={inputStyle} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="py-2 rounded font-medium"
        style={{
          background: "var(--color-mid)",
          color: "var(--color-white)",
          fontSize: "var(--font-size-body)",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Tworzę konto..." : "Zarejestruj"}
      </button>

      <p className="text-center" style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
        Masz już konto?{" "}
        <Link href="/login" style={{ color: "var(--color-mid)" }}>Zaloguj się</Link>
      </p>
    </form>
  )
}
