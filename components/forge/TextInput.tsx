interface TextInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  placeholder?: string
}

export function TextInput({ label, value, onChange, readOnly, placeholder }: TextInputProps) {
  return (
    <label className="flex items-baseline gap-2 py-1">
      <span
        className="whitespace-nowrap"
        style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)", minWidth: "120px" }}
      >
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className="flex-1 border-0 border-b bg-transparent outline-none px-1 py-0.5"
        style={{
          borderBottom: "0.5px solid var(--color-border)",
          fontFamily: "var(--font-family)",
          fontSize: "var(--font-size-label)",
          color: "var(--color-text)",
        }}
      />
    </label>
  )
}
