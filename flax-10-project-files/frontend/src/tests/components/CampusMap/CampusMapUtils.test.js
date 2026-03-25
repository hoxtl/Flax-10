import { describe, it, expect } from "vitest";
import {
  travelTime,
  travelDistance,
  getPriorityColor,
  getLegIcon,
  getLegLabel,
} from "../../../components/CampusMap/mapUtils";

describe("mapUtils – travelTime", () => {
  it("returns singular minute for exactly 60 seconds", () => {
    expect(travelTime(60)).toBe("1 min");
  });
  it("returns plural mins for less than 1 hour", () => {
    expect(travelTime(300)).toBe("5 mins");
  });
  it("formats hours and leftover minutes for >= 60 minutes", () => {
    expect(travelTime(3960)).toBe("1h 6m");
  });
  it("returns 0 mins for 0 seconds", () => {
    expect(travelTime(0)).toBe("0 mins");
  });
});

describe("mapUtils – travelDistance", () => {
  it("returns metres when under 1000", () => {
    expect(travelDistance(450)).toBe("450 m");
  });
  it("returns km when 1000 or over", () => {
    expect(travelDistance(2500)).toBe("2.5 km");
  });
});

describe("mapUtils – getPriorityColor", () => {
  it("returns known priority colour", () => {
    expect(getPriorityColor("urgent")).toBe("var(--map-priority-urgent)");
  });
  it("falls back to medium for unknown priority", () => {
    expect(getPriorityColor("unknown")).toBe("var(--map-priority-medium)");
  });
});

describe("mapUtils – getLegIcon", () => {
  it("returns correct icon for known modes", () => {
    expect(getLegIcon("bus")).toBe("🚌");
    expect(getLegIcon("walking")).toBe("🚶");
  });
  it("falls back to 🚇 for unknown mode", () => {
    expect(getLegIcon("spaceship")).toBe("🚇");
  });
});

describe("mapUtils – getLegLabel", () => {
  it("returns 'Walk' for walking mode", () => {
    expect(getLegLabel({ mode: "walking", routeOptions: [] })).toBe("Walk");
  });
  it("returns bus with route name for bus mode", () => {
    expect(getLegLabel({ mode: "bus", routeOptions: [{ name: "42" }] })).toBe("Bus 42");
  });
  it("falls back to route option name/mode", () => {
    expect(getLegLabel({ mode: "tube", routeOptions: [{ name: "Jubilee" }] })).toBe("Jubilee");
    expect(getLegLabel({ mode: "dlr", routeOptions: [] })).toBe("dlr");
  });
});
