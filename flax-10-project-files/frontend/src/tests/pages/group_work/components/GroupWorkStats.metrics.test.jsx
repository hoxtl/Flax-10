import { beforeEach, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  resetGroupWorkStatsMocks,
  mockGetProgressStats,
  mockGetNextDeadline,
  mockUseCountUp,
  getLastStatStripSnapshot,
} from "./__mocks__/groupWorkStatsMocks.jsx";
import GroupWorkStats from "@/pages/group_work/components/GroupWorkStats";

beforeEach(() => {
  resetGroupWorkStatsMocks();
});

it("renders fallback stats when no projects have deadlines", () => {
  mockGetProgressStats.mockReturnValue({ percent: 0 });
  mockGetNextDeadline.mockReturnValue({ project: null, days: 0 });
  render(<GroupWorkStats projects={null} />);
  expect(screen.getByTestId("stat-strip")).toHaveTextContent("Upcoming deadlines:--");
  expect(mockUseCountUp).toHaveBeenCalledWith(0, 1200);
});

it("annotates deadline and progress details when available", () => {
  mockGetProgressStats.mockReturnValue({ percent: 64 });
  mockGetNextDeadline.mockReturnValue({ project: { name: "Capstone" }, days: 5 });
  render(<GroupWorkStats projects={[{ id: 1 }]} />);
  const items = getLastStatStripSnapshot();
  expect(items[1]).toMatchObject({ tone: "danger", tooltip: "Capstone", value: 5 });
  expect(items[2]).toMatchObject({ tone: "success", suffix: "%", value: 64 });
});
