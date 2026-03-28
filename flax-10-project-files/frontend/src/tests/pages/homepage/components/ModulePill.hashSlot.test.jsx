/**
 * Palette fallback when a hashed slot is empty (defensive JSON shape).
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/pages/homepage/components/modulePillColors.json", () => ({
  default: {
    MODULE_COLOURS: { default: { accent: "#acc", bg: "#FALLBACK", text: "#111" } },
    HASH_PALETTE: [null],
    TYPE_COLOURS: { default: { bg: "#fff", border: "none", text: "#000" } },
  },
}));

import { getModulePillColors } from "@/pages/homepage/components/ModulePill";

describe("getModulePillColors palette edge", () => {
  it("falls back to default module colours when the palette slot is empty", () => {
    expect(getModulePillColors("EDGE-unknown").bg).toBe("#FALLBACK");
  });
});
