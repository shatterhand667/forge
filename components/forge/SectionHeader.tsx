interface SectionHeaderProps {
  number: string
  title: string
}

export function SectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <div
      className="relative flex items-center rounded-sm"
      style={{
        background: "var(--color-mid)",
        height: "var(--section-header-height)",
        padding: "0 12px 0 16px",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: "var(--section-accent-stripe)",
          background: "var(--color-gold)",
        }}
      />
      <h2
        className="uppercase tracking-wide font-bold"
        style={{
          color: "var(--color-white)",
          fontSize: "var(--font-size-header)",
          letterSpacing: "0.3px",
          margin: 0,
        }}
      >
        {number}. {title}
      </h2>
    </div>
  )
}
