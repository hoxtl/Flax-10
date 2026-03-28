import { it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/hooks/useCountUp", () => ({
  useCountUp: vi.fn(() => ({ current: null })),
}));

vi.mock("@/components/common/stat_strip/StatStrip", () => ({
  default: ({ items }) => (
    <ul>
      {items.map((item) => (
        <li key={item.key} data-testid={item.key} data-tone={item.tone ?? ""}>
          {item.label}: {item.value}
          {item.suffix ?? ""}
        </li>
      ))}
    </ul>
  ),
}));

const getNextDeadlineMock = vi.fn(() => ({ project: null, days: 0 }));
const getProgressStatsMock = vi.fn(() => ({ percent: 0 }));

vi.mock("@/pages/group_work/utils/projectStatsUtils", () => ({
  getNextDeadline: (...args) => getNextDeadlineMock(...args),
  getProgressStats: (...args) => getProgressStatsMock(...args),
}));

import GroupWorkStats from "@/pages/group_work/components/GroupWorkStats";

beforeEach(() => {
  vi.clearAllMocks();
  getNextDeadlineMock.mockReturnValue({ project: null, days: 0 });
  getProgressStatsMock.mockReturnValue({ percent: 0 });
});

it("renders active projects count", () => {
  render(<GroupWorkStats projects={[{ id: 1 }, { id: 2 }]} />);
  expect(screen.getByTestId("active-projects").textContent).toContain("2");
});

it("renders deadline as -- when no upcoming deadline", () => {
  render(<GroupWorkStats projects={[]} />);
  expect(screen.getByTestId("next-deadline").textContent).toContain("--");
});

it("renders deadline days when project deadline exists", () => {
  getNextDeadlineMock.mockReturnValue({ project: { name: "Alpha" }, days: 5 });
  render(<GroupWorkStats projects={[{ id: 1 }]} />);
  expect(screen.getByTestId("next-deadline").textContent).toContain("5");
});

it("renders danger tone for deadline when project exists", () => {
  getNextDeadlineMock.mockReturnValue({ project: { name: "Alpha" }, days: 3 });
  render(<GroupWorkStats projects={[{ id: 1 }]} />);
  expect(screen.getByTestId("next-deadline").dataset.tone).toBe("danger");
});

it("renders no tone for deadline when no project", () => {
  render(<GroupWorkStats projects={[]} />);
  expect(screen.getByTestId("next-deadline").dataset.tone).toBe("");
});

it("renders progress percent with success tone when > 0", () => {
  getProgressStatsMock.mockReturnValue({ percent: 60 });
  render(<GroupWorkStats projects={[{ id: 1 }]} />);
  expect(screen.getByTestId("overall-progress").textContent).toContain("60%");
  expect(screen.getByTestId("overall-progress").dataset.tone).toBe("success");
});

it("renders progress with no tone when percent is 0", () => {
  render(<GroupWorkStats projects={[]} />);
  expect(screen.getByTestId("overall-progress").dataset.tone).toBe("");
});

it("handles null projects prop gracefully", () => {
  render(<GroupWorkStats projects={null} />);
  expect(screen.getByTestId("active-projects").textContent).toContain("0");
});
