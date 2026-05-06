interface BridgeIndicatorProps {
  source: string
}

export function BridgeIndicator({ source }: BridgeIndicatorProps) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <span style={{ color: "var(--color-gold)", fontSize: "var(--font-size-tiny)" }}>↗</span>
      <span
        style={{ color: "var(--color-muted)", fontSize: "var(--font-size-tiny)", fontStyle: "italic" }}
      >
        {source}
      </span>
    </div>
  )
}
