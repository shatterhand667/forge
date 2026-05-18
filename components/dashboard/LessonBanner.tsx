"use client"

import { useState } from "react"

interface LessonBannerProps {
  lesson: string
}

export function LessonBanner({ lesson }: LessonBannerProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className="rounded px-4 py-3"
      style={{ background: "var(--color-light)", borderLeft: "4px solid var(--color-gold)" }}
    >
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-between w-full"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
      >
        <p className="font-medium" style={{ fontSize: 9, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
          Lekcja z wczoraj
        </p>
        <span style={{ fontSize: 9, color: "var(--color-muted)" }}>{collapsed ? "▸" : "▾"}</span>
      </button>
      {!collapsed && (
        <p style={{ fontSize: 12, color: "var(--color-text)", marginTop: 4 }}>
          {lesson}
        </p>
      )}
    </div>
  )
}
