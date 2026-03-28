import { describe, it, expect, vi } from "vitest";
import { getEventAccentColor } from "@/pages/homepage/components/mini_timeline/helpers/eventAccent";

vi.mock("@/pages/homepage/components/mini_timeline/helpers/eventAccentColors.json", () => ({
  default: {
    lecture: "#4f7",
    routine: "#aab",
    wellness: "#0bd",
    society: "#f0a",
    social: "#fa0",
    study: "#0af",
    meeting: "#aaf",
    admin: "#ccc",
    default: "#888",
  },
}));

describe("getEventAccentColor", () => {
  it("handles missing titles while still matching tag metadata", () => {
    expect(getEventAccentColor(undefined, "lecture")).toBe("#4f7");
  });

  it("returns lecture accent for tagged lecture events", () => {
    expect(getEventAccentColor("Maths", "lecture")).toBe("#4f7");
  });
  it("returns lecture accent for 'Lecture: X' title", () => {
    expect(getEventAccentColor("Lecture: Analysis")).toBe("#4f7");
  });
  it("returns routine accent for breakfast/lunch/dinner", () => {
    expect(getEventAccentColor("Lunch")).toBe("#aab");
  });
  it("returns wellness accent for gym", () => {
    expect(getEventAccentColor("Gym session")).toBe("#0bd");
  });
  it("returns society accent for tagged society events", () => {
    expect(getEventAccentColor("Meeting", "society")).toBe("#f0a");
  });
  it("returns social accent for coffee in title", () => {
    expect(getEventAccentColor("Coffee with friends")).toBe("#fa0");
  });
  it("returns study accent for library", () => {
    expect(getEventAccentColor("Library study session")).toBe("#0af");
  });
  it("returns meeting accent for seminar", () => {
    expect(getEventAccentColor("Seminar")).toBe("#aaf");
  });
  it("returns admin accent for laundry", () => {
    expect(getEventAccentColor("Laundry")).toBe("#ccc");
  });
  it("returns default for unrecognised events", () => {
    expect(getEventAccentColor("Random thing")).toBe("#888");
  });
});
