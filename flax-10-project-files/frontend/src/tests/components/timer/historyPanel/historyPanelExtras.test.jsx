import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HistoryRailSection } from "../../../../components/Timer/historyPanel/HistoryRailSection";
import {
  filterVisibleBlocks,
  getModuleLabel,
  getSevenDayFocusSeries,
} from "../../../../components/Timer/historyPanel/historyPanelUtils";

describe("history panel extras", () => {
  it("covers history utils edge cases", () => {
    const now = new Date(2024, 5, 12, 15, 0, 0);
    expect(getSevenDayFocusSeries([{ startTime: new Date(2024, 5, 12, 10).toISOString(), totalDuration: 120 }], now)[6].seconds).toBe(120);
    expect(getModuleLabel({ sessions: [{}, { module: "Physics" }] })).toBe("Physics");
    expect(filterVisibleBlocks([{ totalDuration: 299, sessions: [{ status: "Complete" }, { status: "Incomplete" }] }])).toHaveLength(1);
  });

  it("covers history rail fallbacks for partial and completed states", () => {
    render(
      <HistoryRailSection
        group={{
          label: "Earlier",
          entries: [
            {
              id: "x",
              task: "",
              totalDuration: 0,
              totalBreak: 0,
              startTime: null,
              endTime: null,
              sessions: [],
            },
            {
              id: "y",
              task: "Complete block",
              totalDuration: 60,
              totalBreak: 0,
              startTime: null,
              endTime: null,
              sessions: [{ status: "Complete" }],
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Focus Session")).toBeInTheDocument();
    expect(screen.getByText("Partial")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("0/1 sessions")).toBeInTheDocument();
    expect(screen.getAllByText("General")).toHaveLength(2);
  });
});
