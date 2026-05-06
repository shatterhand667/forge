import { vi } from "vitest"

const NextAuth = vi.fn(() => ({
  handlers: {},
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

export default NextAuth
