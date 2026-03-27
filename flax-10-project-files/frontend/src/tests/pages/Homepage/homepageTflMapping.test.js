import { describe, expect, it } from "vitest";

import {
  getRelevantDelays,
  getTflLineColor,
  getTflLinePillStyle,
  getTflLinesForLocation,
  isSevereDisruption,
} from "../../../pages/Homepage/utils/kclTflMapping";

describe("homepageTflMapping", () => {
  it("determines TfL line arrays reliably from standard KCL buildings", () => {
    expect(getTflLinesForLocation("Guy’s Campus")).toContain("Northern");
    expect(getTflLinesForLocation("Strand Campus")).toContain("Central");
    expect(getTflLinesForLocation("")).toEqual([]);
  });

  it("extracts relevant commute delays based on campus and next events", () => {
    const delays = [{ lineName: "Northern", severityDescription: "Minor delays" }, { lineName: "District", severityDescription: "Good service" }];
    expect(getRelevantDelays(null, delays)).toEqual([]);
    expect(getRelevantDelays({ location: "Unknown" }, delays)).toEqual([]);
    expect(getRelevantDelays({ location: "Guy's Campus" }, delays)).toEqual([{ lineName: "Northern", severityDescription: "Minor delays" }]);
  });

  it("uses event title context when missing exact campus locations", () => {
    const delays = [{ lineName: "Northern", severityDescription: "Minor delays" }, { lineName: "District", severityDescription: "Good service" }];
    expect(getRelevantDelays({ title: "Lecture at Strand Campus" }, delays)).toEqual([
      { lineName: "Northern", severityDescription: "Minor delays" },
      { lineName: "District", severityDescription: "Good service" },
    ]);
  });

  it("safely generates line pill styling properties despite unrecognised names", () => {
    expect(getTflLineColor("Waterloo & City")).toBeTruthy();
    expect(getTflLineColor("Made Up Line")).toBeTruthy();
    expect(getTflLineColor(null)).toBeTruthy();
    expect(getTflLinePillStyle("London Overground")).toEqual(expect.objectContaining({ bg: expect.any(String) }));
    expect(getTflLinePillStyle("Unknown Line")).toEqual(expect.objectContaining({ bg: expect.any(String) }));
    expect(getTflLinePillStyle(null)).toEqual(expect.objectContaining({ bg: expect.any(String) }));
  });

  it("identifies critical threshold disruptions causing delays", () => {
    expect(isSevereDisruption("Part closure")).toBe(true);
    expect(isSevereDisruption("Good Service")).toBe(false);
    expect(isSevereDisruption("")).toBe(false);
  });
});
