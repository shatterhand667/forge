interface TextAreaProps {
  label?: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}

export function TextArea({ label, value, onChange, rows = 5, placeholder }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1 py-1">
      {label && (
        <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)" }}>
          {label}
        </span>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="resize-y border-none outline-none bg-transparent p-0 w-full"
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 19px, var(--color-border) 19px, var(--color-border) 20px)`,
          backgroundSize: "100% 20px",
          lineHeight: "20px",
          fontFamily: "var(--font-family)",
          fontSize: "var(--font-size-label)",
          color: "var(--color-text)",
          minHeight: `${rows * 20}px`,
        }}
      />
    </div>
  )
}
