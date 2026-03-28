import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StudyStreakWidget from "@/pages/homepage/components/StudyStreakWidget";

const fetchApiMock = vi.fn();

vi.mock("@/api/client", () => ({
  fetchApi: (...args) => fetchApiMock(...args),
}));

vi.mock("@/components/common/widget_header/WidgetHeader", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

describe("StudyStreakWidget", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));
    fetchApiMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function flushWidget() {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("renders a multi-day streak from a flat task payload", async () => {
    fetchApiMock.mockResolvedValue([
      { id: 1, completed: true, updated_at: "2026-03-24T08:00:00.000Z" },
      { id: 2, completed: true, updated_at: "2026-03-23T08:00:00.000Z" },
      { id: 3, completed: true, updated_at: "2026-03-21T08:00:00.000Z" },
      { id: 4, completed: false, updated_at: "2026-03-24T08:00:00.000Z" },
    ]);

    render(<StudyStreakWidget />);

    expect(screen.getByText("Study Streak")).toBeInTheDocument();
    expect(screen.getByText("–")).toBeInTheDocument();

    await flushWidget();

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("days 🔥")).toBeInTheDocument();
    expect(screen.queryByText(/Complete a task today/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/^[MTWFS]$/)).toHaveLength(7);
  });

  it("uses the singular day label when exactly one completed day is in the streak", async () => {
    fetchApiMock.mockResolvedValue({
      results: [{ id: 1, completed: true, updated_at: "2026-03-24T06:00:00.000Z" }],
    });

    render(<StudyStreakWidget />);

    await flushWidget();

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("day 🔥")).toBeInTheDocument();
  });

  it("falls back to an empty streak and helper text when the fetch fails", async () => {
    fetchApiMock.mockRejectedValueOnce(new Error("network"));

    render(<StudyStreakWidget />);

    await flushWidget();

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("days 🔥")).toBeInTheDocument();
    expect(screen.getByText("Complete a task today to start your streak!")).toBeInTheDocument();
  });

  it("treats null payloads as empty task lists", async () => {
    fetchApiMock.mockResolvedValue(null);
    render(<StudyStreakWidget />);
    await flushWidget();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("handles paginated task results", async () => {
    fetchApiMock.mockResolvedValue({
      results: [{ id: 1, completed: true, updated_at: "2026-03-24T06:00:00.000Z" }],
    });

    render(<StudyStreakWidget />);

    await flushWidget();

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("day 🔥")).toBeInTheDocument();
  });

  it("cancels the request when the widget unmounts before completion", async () => {
    let resolveFetch;
    fetchApiMock.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));

    const { unmount } = render(<StudyStreakWidget />);
    unmount();

    await act(async () => {
      resolveFetch([{ completed: true, updated_at: "2026-03-24T06:00:00.000Z" }]);
      await Promise.resolve();
    });

    expect(fetchApiMock).toHaveBeenCalledWith("/tasks/?completed=true&limit=200");
  });
});
