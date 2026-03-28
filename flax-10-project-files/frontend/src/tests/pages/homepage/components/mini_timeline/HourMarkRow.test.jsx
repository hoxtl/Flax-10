import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HourMarkRow } from "@/pages/homepage/components/mini_timeline/HourMarkRow";

vi.mock("@/pages/homepage/utils/dateFormatUtils", () => ({
  formatHour12h: (h, m) => `${h}:${String(m).padStart(2, "0")} AM`,
}));

const styles = {
  planTimelineHourMark: "hourMark",
  planTimelineHourMarkLabel: "label",
  planTimelineHourMarkDot: "dot",
  planTimelineHourMarkLine: "line",
};

describe("HourMarkRow", () => {
  it("renders the formatted hour label", () => {
    render(<HourMarkRow row={{ id: "h9", hour: 9 }} styles={styles} />);
    expect(screen.getByText("9:00 AM")).toBeTruthy();
  });

  it("renders the dot and line aria-hidden spans", () => {
    const { container } = render(<HourMarkRow row={{ id: "h10", hour: 10 }} styles={styles} />);
    const hidden = container.querySelectorAll("[aria-hidden]");
    expect(hidden.length).toBe(2);
  });
});
