import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TinyGapRow } from "@/pages/homepage/components/mini_timeline/TinyGapRow";

vi.mock("@/pages/homepage/components/mini_timeline/helpers/gapRowUtils", () => ({
  getTinyGapMinHeight: vi.fn(() => 30),
  getTinyGapTimeLabel: vi.fn(() => "09:15"),
}));
vi.mock("@/pages/homepage/components/mini_timeline/parts/TimelineRowLayout", () => ({
  TimelineRowLayout: ({ children }) => <div data-testid="row-layout">{children}</div>,
  TimelineGutter: ({ timeLabel }) => <div data-testid="gutter">{timeLabel}</div>,
  TimelineSpineCell: () => <div data-testid="spine" />,
}));

const styles = { planTimelineRowGap: "gap", planTimelineGapShortWindow: "sw",
  planTimelineGapShortWindowNoActions: "na", planTimelineGapRail: "rail",
  planTimelineGapMain: "main", planTimelineGapLeadDot: "dot",
  planTimelineGapShortDur: "dur", planTimelineGapSeparator: "sep",
  planTimelineGapNoTasks: "notask" };

describe("TinyGapRow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders with row.minutes", () => {
    render(<TinyGapRow row={{ id: "g1", startMins: 60, minutes: 20 }} styles={styles} />);
    expect(screen.getByText("20m free")).toBeTruthy();
    expect(screen.getByTestId("gutter").textContent).toBe("09:15");
  });

  it("calculates minutes from endMins - startMins when minutes not set", () => {
    render(<TinyGapRow row={{ id: "g2", startMins: 60, endMins: 90 }} styles={styles} />);
    expect(screen.getByText("30m free")).toBeTruthy();
  });
});
