import { describe, it, expect } from "vitest"

function getBodyZone(score: number): { zone: 1 | 2 | 3; color: string; text: string } {
  if (score <= 7)  return { zone: 1, color: "#CC3333", text: "Dziś nie tradujesz" }
  if (score <= 14) return { zone: 2, color: "#E07B2A", text: "Dziś ryzyko max. 50%" }
  return           { zone: 3, color: "#3D9B47", text: "Jesteś gotowy" }
}

describe("getBodyZone", () => {
  it("strefa 1 dla wyniku 1", () => {
    expect(getBodyZone(1)).toMatchObject({ zone: 1, text: "Dziś nie tradujesz" })
  })
  it("strefa 1 dla wyniku 7 (granica)", () => {
    expect(getBodyZone(7)).toMatchObject({ zone: 1, color: "#CC3333" })
  })
  it("strefa 2 dla wyniku 8 (granica)", () => {
    expect(getBodyZone(8)).toMatchObject({ zone: 2, color: "#E07B2A" })
  })
  it("strefa 2 dla wyniku 14 (granica)", () => {
    expect(getBodyZone(14)).toMatchObject({ zone: 2, text: "Dziś ryzyko max. 50%" })
  })
  it("strefa 3 dla wyniku 15 (granica)", () => {
    expect(getBodyZone(15)).toMatchObject({ zone: 3, color: "#3D9B47" })
  })
  it("strefa 3 dla wyniku 20 (maksimum)", () => {
    expect(getBodyZone(20)).toMatchObject({ zone: 3, text: "Jesteś gotowy" })
  })
})
