import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import DeadlineCountdown from "../../../../components/common/deadline_countdown/DeadlineCountdown";
import {
  getDaysLabel,
  getDueStatusClass,
  getTierPriority,
  getUrgencyTier,
  isUrgentTier,
} from "../../../../components/common/deadline_countdown/deadlineCountdownUtils";

describe("DeadlineCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns expected urgency tiers and day labels across boundary dates", () => {
    expect(getUrgencyTier("2026-03-23T12:00:00Z")).toBe("overdue");
    expect(getUrgencyTier("2026-03-24T18:00:00Z")).toBe("critical");
    expect(getUrgencyTier("2026-03-28T12:00:00Z")).toBe("urgent");
    expect(getUrgencyTier("2026-04-02T12:00:00Z")).toBe("upcoming");
    expect(getUrgencyTier("2026-05-10T12:00:00Z")).toBe("distant");

    expect(getDaysLabel("2026-03-23T12:00:00Z")).toBe("1d overdue");
    expect(getDaysLabel("2026-03-22T12:00:00Z")).toBe("2d overdue");
    expect(getDaysLabel("2026-03-24T18:00:00Z")).toBe("Today");
    expect(getDaysLabel("2026-03-25T12:00:00Z")).toBe("Tomorrow");
    expect(getDaysLabel("2026-03-29T12:00:00Z")).toBe("5d");
  });

  it("covers status helpers", () => {
    expect(getDueStatusClass("overdue")).toBe("dueOverdue");
    expect(getDueStatusClass("critical")).toBe("dueToday");
    expect(getDueStatusClass("urgent")).toBe("dueTomorrow");
    expect(getDueStatusClass("distant")).toBe("dueFuture");
    expect(isUrgentTier("urgent")).toBe(true);
    expect(isUrgentTier("upcoming")).toBe(false);
    expect(getTierPriority("overdue")).toBe("urgent");
    expect(getTierPriority("critical")).toBe("urgent");
    expect(getTierPriority("urgent")).toBe("high");
    expect(getTierPriority("upcoming")).toBe("medium");
  });

  it("renders overdue and forced-clock states, and returns null with no data", () => {
    const { rerender, container } = render(<DeadlineCountdown dueDate="2026-03-23T12:00:00Z" className="extra" />);
    expect(screen.getByText("!! Overdue")).toBeInTheDocument();
    expect(screen.getByText("1d overdue")).toBeInTheDocument();
    expect(container.firstChild.className).toContain("extra");

    rerender(<DeadlineCountdown label="Custom label" showPriority={false} forceClock tier="distant" align="start" />);
    expect(screen.queryByText("!! Overdue")).not.toBeInTheDocument();
    expect(screen.getByText("Custom label")).toBeInTheDocument();

    rerender(<DeadlineCountdown />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a label-only distant state without the priority pill or clock icon", () => {
    const { container } = render(<DeadlineCountdown label="Anytime" showPriority={false} />);
    expect(screen.getByText("Anytime")).toBeInTheDocument();
    expect(screen.queryByText(/Overdue|Urgent/)).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("omits the priority pill for non-pill tiers", () => {
    render(<DeadlineCountdown dueDate="2026-04-02T12:00:00Z" />);
    expect(screen.getByText("9d")).toBeInTheDocument();
    expect(screen.queryByText("!! Overdue")).not.toBeInTheDocument();
    expect(screen.queryByText("!!! Urgent")).not.toBeInTheDocument();
  });
});
