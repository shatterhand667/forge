import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function LandingPage() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: "var(--color-dark)" }}
    >
      <p
        className="font-bold uppercase tracking-widest mb-4"
        style={{ color: "var(--color-gold)", fontSize: "var(--font-size-tiny)", letterSpacing: "4px" }}
      >
        THE FORGE
      </p>
      <h1
        className="font-bold mb-4"
        style={{ color: "var(--color-white)", fontSize: 28, lineHeight: 1.3 }}
      >
        Prawdziwi traderzy<br />są wykuwani w ogniu.
      </h1>
      <p
        className="mb-8 max-w-sm"
        style={{ color: "var(--color-muted)", fontSize: "var(--font-size-body)", lineHeight: 1.6 }}
      >
        System transformacji tradera. 5 warstw refleksji — od dziennej do rocznej.
      </p>
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 240 }}>
        <Link
          href="/register"
          className="block py-3 rounded font-medium"
          style={{ background: "var(--color-gold)", color: "var(--color-white)", fontSize: 14 }}
        >
          Zacznij swoją praktykę
        </Link>
        <Link
          href="/login"
          className="block py-3 rounded"
          style={{ border: `1px solid var(--color-muted)`, color: "var(--color-muted)", fontSize: 14 }}
        >
          Zaloguj się
        </Link>
      </div>
    </div>
  )
}
