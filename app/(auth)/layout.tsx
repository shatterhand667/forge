export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="w-full rounded-lg border p-8"
        style={{
          maxWidth: 360,
          background: "var(--color-white)",
          borderColor: "var(--color-border)",
        }}
      >
        <p
          className="text-center font-bold uppercase tracking-widest mb-6"
          style={{ color: "var(--color-gold)", fontSize: "var(--font-size-tiny)" }}
        >
          THE FORGE
        </p>
        {children}
      </div>
    </div>
  )
}
