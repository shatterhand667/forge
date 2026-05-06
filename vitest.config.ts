import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["__tests__/setup.ts"],
  },
  resolve: {
    alias: [
      // Specific mocks must come before generic aliases
      { find: /^next-auth\/providers\/credentials$/, replacement: path.resolve(__dirname, "__tests__/__mocks__/next-auth-credentials.ts") },
      { find: /^next-auth$/, replacement: path.resolve(__dirname, "__tests__/__mocks__/next-auth.ts") },
      { find: /^next\/navigation$/, replacement: path.resolve(__dirname, "__tests__/__mocks__/next-navigation.ts") },
      { find: /^next\/cache$/, replacement: path.resolve(__dirname, "__tests__/__mocks__/next-cache.ts") },
      { find: "@/auth", replacement: path.resolve(__dirname, "__tests__/__mocks__/auth.ts") },
      { find: "@/actions/cards", replacement: path.resolve(__dirname, "__tests__/__mocks__/actions-cards.ts") },
      // Generic @ alias last
      { find: "@", replacement: path.resolve(__dirname, ".") },
    ],
  },
})
