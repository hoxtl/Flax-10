import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import GroupWorkStats from "@/pages/group_work/components/GroupWorkStats";
import * as statsUtils from "@/pages/group_work/utils/projectStatsUtils";

vi.mock("@/components/common/stat_strip/StatStrip", () => ({
  default: ({ items }) => (
    <div data-testid="stat-strip">
      {items.map((item) => (
        <div key={item.key} data-testid={`stat-${item.key}`}>
          {item.label}: {item.value}{item.suffix || ""}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/hooks/useCountUp", () => ({
  useCountUp: vi.fn(() => ({ current: 0 })),
}));

vi.mock("@/pages/group_work/utils/projectStatsUtils", () => ({
  getProgressStats: vi.fn(),
  getNextDeadline: vi.fn(),
}));

describe("GroupWorkStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders statistics when projects exist", () => {
    statsUtils.getProgressStats.mockReturnValue({ percent: 45 });
    statsUtils.getNextDeadline.mockReturnValue({ project: { name: "P1" }, days: 5 });
    
    render(<GroupWorkStats projects={[{ id: 1 }]} />);
    
    expect(screen.getByTestId("stat-active-projects")).toHaveTextContent("Active projects: 1");
    expect(screen.getByTestId("stat-next-deadline")).toHaveTextContent("Upcoming deadlines: 5");
    expect(screen.getByTestId("stat-overall-progress")).toHaveTextContent("Overall progress: 45%");
  });

  it("renders with no upcoming deadlines", () => {
    statsUtils.getProgressStats.mockReturnValue({ percent: 0 });
    statsUtils.getNextDeadline.mockReturnValue({ project: null, days: 0 });
    
    render(<GroupWorkStats projects={[]} />);
    
    expect(screen.getByTestId("stat-active-projects")).toHaveTextContent("Active projects: 0");
    expect(screen.getByTestId("stat-next-deadline")).toHaveTextContent("Upcoming deadlines: --");
  });
});
