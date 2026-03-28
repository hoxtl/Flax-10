import { beforeEach, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  resetGroupWorkStatsMocks,
  mockUseCountUp,
  getLastStatStripSnapshot,
} from "./__mocks__/groupWorkStatsMocks.jsx";
import "./__mocks__/motionAndTooltipMocks.jsx";
import ProjectProgress from "@/pages/group_work/components/ProjectProgress";

beforeEach(() => {
  resetGroupWorkStatsMocks();
  mockUseCountUp.mockImplementation((value) => ({ current: value }));
});

it("builds project stats with derived remaining count", () => {
  render(<ProjectProgress taskStats={{ percent: 55, completed: 6, total: 10 }} />);
  const stats = getLastStatStripSnapshot();
  expect(stats.map((item) => item.key)).toEqual(["overall", "complete", "remaining"]);
  expect(stats[2]).toMatchObject({ value: 4, tone: "danger" });
});

it("handles segment hover interactions for stacked progress bar", () => {
  const segments = [
    { id: "alpha", name: "Alpha", percentage: 60, color: "red" },
    { id: "beta", name: "Beta", percentage: 40 },
  ];
  render(<ProjectProgress taskStats={{ segments }} />);
  const segs = screen.getAllByLabelText(/segment/);
  fireEvent.mouseEnter(segs[0]);
  expect(segs[1]).toHaveStyle({ opacity: "0.65" });
  fireEvent.mouseLeave(segs[0]);
  expect(segs[1]).toHaveStyle({ opacity: "1" });
});
