"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "var(--color-dark)", color: "var(--color-white)" }}
    >
      <p style={{ color: "var(--color-muted)", fontSize: 13 }}>Coś poszło nie tak.</p>
      <button
        onClick={reset}
        style={{
          background: "var(--color-gold)",
          color: "var(--color-white)",
          border: "none",
          padding: "8px 20px",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        Spróbuj ponownie
      </button>
    </div>
  )
}
