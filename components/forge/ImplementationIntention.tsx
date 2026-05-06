interface ImplementationIntentionProps {
  whenValue: string
  thenValue: string
  extraValue: string
  onChangeWhen: (v: string) => void
  onChangeThen: (v: string) => void
  onChangeExtra: (v: string) => void
}

export function ImplementationIntention({
  whenValue,
  thenValue,
  extraValue,
  onChangeWhen,
  onChangeThen,
  onChangeExtra,
}: ImplementationIntentionProps) {
  const inputStyle: React.CSSProperties = {
    flex: 1,
    borderBottom: "0.5px solid var(--color-border)",
    background: "transparent",
    outline: "none",
    fontSize: "var(--font-size-label)",
    fontFamily: "var(--font-family)",
    padding: "2px 4px",
  }

  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="flex items-baseline gap-2">
        <span
          style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)", whiteSpace: "nowrap" }}
        >
          Kiedy
        </span>
        <input type="text" value={whenValue} onChange={(e) => onChangeWhen(e.target.value)} style={inputStyle} />
        <span
          style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)", whiteSpace: "nowrap" }}
        >
          wtedy
        </span>
        <input type="text" value={thenValue} onChange={(e) => onChangeThen(e.target.value)} style={inputStyle} />
      </div>
      <textarea
        value={extraValue}
        onChange={(e) => onChangeExtra(e.target.value)}
        rows={3}
        placeholder="Dodatkowe notatki..."
        className="resize-none bg-transparent outline-none border-none w-full"
        style={{ fontSize: "var(--font-size-label)", fontFamily: "var(--font-family)" }}
      />
    </div>
  )
}
