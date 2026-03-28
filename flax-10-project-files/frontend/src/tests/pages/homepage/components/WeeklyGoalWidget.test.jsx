import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("lucide-react", () => ({
  Target: () => <svg aria-hidden="true" />,
}));

vi.mock("../../../../components/common/widget_header/WidgetHeader", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

import WeeklyGoalWidget from "../../../../pages/homepage/components/WeeklyGoalWidget";

describe("WeeklyGoalWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
  });

  it("falls back to the default goal and zero progress when stored data is invalid", () => {
    vi.setSystemTime(new Date("2026-03-25T12:00:00.000Z"));
    localStorage.setItem("weeklyStudyGoalHours", "0");
    localStorage.setItem("pomodoroSessions", "{bad json");

    const { container } = render(<WeeklyGoalWidget />);

    expect(screen.getByText("10h")).toBeInTheDocument();
    expect(screen.getByText("0.0h done · 10.0h left")).toBeInTheDocument();
    expect(screen.getByText("0% of weekly target")).toBeInTheDocument();
    expect(container.querySelector('[style*="var(--home-urgency-warning)"]')).not.toBeNull();
  });

  it("uses startedAt and duration fallbacks and applies the primary progress color at 50%", () => {
    vi.setSystemTime(new Date("2026-03-29T12:00:00.000Z"));
    localStorage.setItem("weeklyStudyGoalHours", "2");
    localStorage.setItem("pomodoroSessions", JSON.stringify([
      { startedAt: "2026-03-29T09:00:00.000Z", duration: 60 },
    ]));

    const { container } = render(<WeeklyGoalWidget />);

    expect(screen.getByText("1.0h done · 1.0h left")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(container.querySelector('[style*="var(--color-primary)"]')).not.toBeNull();
  });

  it("caps progress at 100%, uses the success copy, and falls back to 25-minute sessions", () => {
    vi.setSystemTime(new Date("2026-03-25T12:00:00.000Z"));
    localStorage.setItem("weeklyStudyGoalHours", "1");
    localStorage.setItem("pomodoroSessions", JSON.stringify([
      { endedAt: "2026-03-25T09:00:00.000Z" },
      { endedAt: "2026-03-25T10:00:00.000Z", durationMins: 40 },
    ]));

    const { container } = render(<WeeklyGoalWidget />);

    expect(screen.getByText("1.1h done · Goal reached! 🎉")).toBeInTheDocument();
    expect(screen.getByText("Excellent work this week!")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(container.querySelector('[style*="var(--sage)"]')).not.toBeNull();
  });

  it("closes the editor without persisting when the entered goal is not positive", () => {
    vi.setSystemTime(new Date("2026-03-25T12:00:00.000Z"));
    localStorage.setItem("weeklyStudyGoalHours", "8");
    localStorage.setItem("pomodoroSessions", "[]");

    render(<WeeklyGoalWidget />);
    fireEvent.click(screen.getByTitle("Click to edit goal"));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "0" } });
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "Enter" });

    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(localStorage.getItem("weeklyStudyGoalHours")).toBe("8");
    expect(screen.getByText("8h")).toBeInTheDocument();
  });

  it("treats missing session timestamps as old data and falls back to an empty session list when storage is blank", () => {
    vi.setSystemTime(new Date("2026-03-25T12:00:00.000Z"));

    const firstRender = render(<WeeklyGoalWidget />);
    expect(screen.getByText("0.0h done · 10.0h left")).toBeInTheDocument();

    firstRender.unmount();
    localStorage.setItem("pomodoroSessions", JSON.stringify([{}]));
    render(<WeeklyGoalWidget />);

    expect(screen.getByText("0.0h done · 10.0h left")).toBeInTheDocument();
  });
});
