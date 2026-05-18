interface GoldCirclesProps {
  label: string
  value: number | null
  onChange: (value: number) => void
  options?: number[]
}

export function GoldCircles({ label, value, onChange, options = [1, 2, 3, 4, 5] }: GoldCirclesProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)" }}>
        {label}
      </span>
      <div className="flex gap-2" role="radiogroup" aria-label={label}>
        {options.map((n) => (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name={`gold-${label}`}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              aria-label={String(n)}
              className="sr-only"
            />
            <span
              className="block rounded-full transition-all"
              style={{
                width: 22,
                height: 22,
                border: `1.5px solid var(--color-gold)`,
                background: value !== null && n <= value ? "var(--color-gold)" : "transparent",
                transition: "var(--transition-fast)",
              }}
            />
          </label>
        ))}
      </div>
    </div>
  )
}
