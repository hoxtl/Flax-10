import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HistoryRailSection } from "../../../../components/Timer/history_panel/HistoryRailSection";
import {
  filterVisibleBlocks,
  getModuleLabel,
  getSevenDayFocusSeries,
  groupBlocksByHorizon,
} from "../../../../components/Timer/history_panel/historyPanelUtils";

describe("history panel extras", () => {
  it("covers history utils edge cases", () => {
    const now = new Date(2024, 5, 12, 15, 0, 0);
    expect(getSevenDayFocusSeries([{ startTime: new Date(2024, 5, 12, 10).toISOString(), totalDuration: 120 }], now)[6].seconds).toBe(120);
    expect(getModuleLabel({ sessions: [{}, { module: "Physics" }] })).toBe("Physics");
    expect(filterVisibleBlocks([{ totalDuration: 299, sessions: [{ status: "Complete" }, { status: "Incomplete" }] }])).toHaveLength(1);
  });

  it("renders history rail with partial session fallback", () => {
    render(
      <HistoryRailSection
        group={{
          label: "Earlier",
          entries: [{
            id: "x", task: "", totalDuration: 0, totalBreak: 0,
            startTime: null, endTime: null, sessions: [],
          }],
        }}
      />,
    );
    expect(screen.getByText("Focus Session")).toBeInTheDocument();
    expect(screen.getByText("Partial")).toBeInTheDocument();
    expect(screen.getByText("0/1 sessions")).toBeInTheDocument();
  });

  it("renders history rail with completed session state", () => {
    render(
      <HistoryRailSection
        group={{
          label: "Recent",
          entries: [{
            id: "y", task: "Complete block", totalDuration: 60, totalBreak: 0,
            startTime: null, endTime: null, sessions: [{ status: "Complete" }],
          }],
        }}
      />,
    );
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
  });

  it("shows break duration badges when a block includes break time", () => {
    render(
      <HistoryRailSection
        group={{
          label: "Today",
          entries: [
            {
              id: "break-block",
              task: "Pomodoro",
              totalDuration: 900,
              totalBreak: 300,
              startTime: null,
              endTime: null,
              sessions: [{ status: "Complete" }],
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/☕/)).toBeInTheDocument();
  });

  it("handles blocks where sessions is not an array (non-array sessions branch)", () => {
    render(
      <HistoryRailSection
        group={{
          label: "Today",
          entries: [
            {
              // no id - uses index fallback
              task: "No sessions block",
              totalDuration: 500,
              totalBreak: 0,
              startTime: null,
              endTime: null,
              sessions: "not-an-array",
            },
          ],
        }}
      />,
    );
    // When sessions is not an array: completedCount = 0, totalSessions = 0, shows Partial
    expect(screen.getByText("Partial")).toBeInTheDocument();
    // totalSessions is 0, Math.max(0, 1) = 1
    expect(screen.getByText("0/1 sessions")).toBeInTheDocument();
  });

  it("accumulates seconds when block has no totalDuration (undefined totalDuration)", () => {
    const now = new Date(2024, 5, 12, 15, 0, 0);
    const block = { startTime: new Date(2024, 5, 12, 10).toISOString() }; // no totalDuration
    const series = getSevenDayFocusSeries([block], now);
    // totalDuration is undefined -> Number(undefined || 0) = 0
    expect(series[6].seconds).toBe(0);
  });

  it("uses default now arg in getSevenDayFocusSeries (no now provided)", () => {
    const result = getSevenDayFocusSeries([]);
    expect(result).toHaveLength(7);
  });

  it("groups filter removes empty horizon groups", () => {
    // When a block is from today, Yesterday/ThisWeek/Earlier groups have no entries and are filtered out
    const todayAt10 = new Date();
    todayAt10.setHours(10, 0, 0, 0);
    const groups = groupBlocksByHorizon([{ startTime: todayAt10.toISOString() }]);
    // Only Today group should appear
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Today");
  });
});
