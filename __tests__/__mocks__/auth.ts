import { vi } from "vitest"

export const auth = vi.fn().mockResolvedValue({ user: { id: "user-1" } })
export const signIn = vi.fn()
export const signOut = vi.fn()
export const handlers = {}
