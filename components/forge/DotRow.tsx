interface DotRowProps {
  label: string
  value: number | null
  onChange: (value: number) => void
  options?: number[]
  labelWidth?: string
}

export function DotRow({ label, value, onChange, options = [1, 2, 3, 4, 5], labelWidth }: DotRowProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span
        className="whitespace-nowrap overflow-hidden text-ellipsis"
        style={{
          color: "var(--color-muted)",
          fontSize: "var(--font-size-label)",
          minWidth: labelWidth ?? "90px",
          maxWidth: labelWidth ?? "90px",
        }}
      >
        {label}
      </span>
      <div className="flex" style={{ gap: options.length > 5 ? 4 : 6 }} role="radiogroup" aria-label={label}>
        {options.map((n) => (
          <label
            key={n}
            className="relative flex items-center justify-center cursor-pointer"
            style={{ width: 18, height: 18 }}
          >
            <input
              type="radio"
              name={label}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              aria-label={String(n)}
              className="absolute opacity-0 w-full h-full cursor-pointer"
            />
            <span
              className="flex items-center justify-center rounded-full transition-colors"
              style={{
                width: 14,
                height: 14,
                border: `0.8px solid var(--color-accent)`,
                background: value === n ? "var(--color-accent)" : "var(--color-white)",
                fontSize: 8,
                color: value === n ? "var(--color-white)" : "var(--color-muted)",
                fontWeight: value === n ? "var(--font-weight-bold)" : "normal",
                transition: "var(--transition-fast)",
              }}
            >
              {n}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
