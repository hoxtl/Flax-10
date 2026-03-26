/*
 * Weekly progress and attendance profile widget tests.
 */

import { describe, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
}));

vi.mock("../../../../api/moduleApi", () => ({
  getModules: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../../pages/profile/components/widgets/attendance/useAttendanceWidgetData", () => ({
  useAttendanceWidgetData: vi.fn(),
}));

vi.mock("@mui/x-charts/PieChart", () => ({
  PieChart: (props) => <div data-testid="pie-chart" data-hide-legend={props.hideLegend ? "true" : "false"} />,
}));

vi.mock("../../../../pages/attendance/components/SegmentDetailPanel", () => ({
  default: () => <div data-testid="segment-detail-panel" />,
}));

import { beforeEach, CompactAttendanceTile, expect, fireEvent, render, screen, ThisWeek, useAttendanceWidgetData } from "./ProfileWidgets.shared";

describe("ThisWeek", () => {
  it("returns null when weekly is missing", () => {
    const { container } = render(<ThisWeek onGoalSave={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders weekly ring and streak display", () => {
    render(<ThisWeek weekly={{ percentage: 50, hours_studied: 10, goal_hours: 20 }} streaks={{ current: 3, longest: 7 }} onGoalSave={vi.fn()} />);
    expect(screen.getByText("THIS WEEK")).toBeTruthy();
    expect(screen.getByText(/10h/)).toBeTruthy();
    expect(screen.getByText(/20h/)).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
  });

  it("shows streak fallback when streaks missing", () => {
    render(<ThisWeek weekly={{ percentage: 0, hours_studied: 0, goal_hours: 10 }} onGoalSave={vi.fn()} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("opens goal editor and saves", () => {
    const onGoalSave = vi.fn();
    render(<ThisWeek weekly={{ percentage: 25, hours_studied: 5, goal_hours: 20 }} onGoalSave={onGoalSave} />);
    fireEvent.click(screen.getByRole("button", { name: /5h\/20h/ }));
    expect(screen.getByText("tap to close")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save goal" }));
    expect(onGoalSave).toHaveBeenCalledWith(20);
  });

  it("goal editor slider updates temp goal and Cancel closes editor", () => {
    render(<ThisWeek weekly={{ percentage: 25, hours_studied: 5, goal_hours: 20 }} onGoalSave={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /5h\/20h/ }));
    const slider = document.querySelector('input[type="range"]');
    expect(slider).toBeTruthy();
    fireEvent.change(slider, { target: { value: "15" } });
    expect(screen.getByText("15h / week")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("tap to close")).toBeNull();
    expect(screen.getByText("tap to edit goal")).toBeTruthy();
  });

  it("goal ring shows green when percentage >= 100", () => {
    render(<ThisWeek weekly={{ percentage: 100, hours_studied: 20, goal_hours: 20 }} onGoalSave={vi.fn()} />);
    expect(document.querySelector('circle[stroke="var(--success-text)"]')).toBeTruthy();
  });
});

describe("CompactAttendanceTile", () => {
  beforeEach(() => {
    useAttendanceWidgetData.mockReturnValue({
      loading: false,
      error: null,
      stats: { overall: { attended: 110, missed: 8 } },
      attendancePct: 93,
      overallData: [{ id: 0, label: "Attended", value: 110, color: "#2D8B5A" }, { id: 1, label: "Missed", value: 8, color: "#C0392B" }],
      byTypeData: [{ id: 0, label: "Lecture", value: 55, color: "#D4AF37" }, { id: 1, label: "Small group", value: 25, color: "#148C7D" }, { id: 2, label: "Other", value: 28, color: "#E67E22" }, { id: 3, label: "Practical/lab", value: 18, color: "#2E5BFF" }],
      segmentEvents: [],
      handleToggleStatus: vi.fn(),
    });
  });

  it("routes the header action to attendance details", () => {
    const onNavigate = vi.fn();
    render(<CompactAttendanceTile onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: /View attendance details/i }));
    expect(onNavigate).toHaveBeenCalledWith("attendance");
  });

  it("shows clean by-type labels in the right-hand legend without duplicate loose numbers", () => {
    render(<CompactAttendanceTile onNavigate={vi.fn()} />);
    expect(screen.getByText("Lecture")).toBeTruthy();
    expect(screen.getByText("Small group")).toBeTruthy();
    expect(screen.getByText("Other")).toBeTruthy();
    expect(screen.getByText("Practical/lab")).toBeTruthy();
    expect(screen.queryByText("Lecture (55)")).toBeNull();
    expect(screen.queryByText("Small group (25)")).toBeNull();
    expect(screen.queryByText("Other (28)")).toBeNull();
    expect(screen.queryByText("Practical/lab (18)")).toBeNull();
  });

  it("hides the built-in pie chart legends so only the custom right legend remains", () => {
    render(<CompactAttendanceTile onNavigate={vi.fn()} />);
    screen.getAllByTestId("pie-chart").forEach((chart) => expect(chart.getAttribute("data-hide-legend")).toBe("true"));
  });
});
