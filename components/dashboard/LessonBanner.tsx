interface LessonBannerProps {
  lesson: string
}

export function LessonBanner({ lesson }: LessonBannerProps) {
  return (
    <div
      className="rounded px-4 py-3 flex gap-3 items-start"
      style={{
        background: "var(--color-light)",
        borderLeft: "4px solid var(--color-gold)",
      }}
    >
      <div>
        <p
          className="font-medium mb-1"
          style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}
        >
          Pamiętaj o lekcji z wczoraj:
        </p>
        <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)" }}>
          {lesson}
        </p>
      </div>
    </div>
  )
}
