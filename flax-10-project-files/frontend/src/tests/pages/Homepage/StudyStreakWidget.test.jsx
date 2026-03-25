<<<<<<< HEAD
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
=======
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import StudyStreakWidget from "../../../pages/Homepage/components/StudyStreakWidget";
>>>>>>> 750dbf1a3 (Write studystreakwidget tests)

const fetchApiMock = vi.fn();

vi.mock("../../../api/client", () => ({
  fetchApi: (...args) => fetchApiMock(...args),
}));

<<<<<<< HEAD
=======
vi.mock("lucide-react", () => ({
  Flame: () => <svg aria-hidden="true" />,
}));

>>>>>>> 750dbf1a3 (Write studystreakwidget tests)
vi.mock("../../../components/Common/WidgetHeader/WidgetHeader", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

<<<<<<< HEAD
import StudyStreakWidget from "../../../pages/Homepage/components/StudyStreakWidget";

=======
>>>>>>> 750dbf1a3 (Write studystreakwidget tests)
describe("StudyStreakWidget", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));
<<<<<<< HEAD
    fetchApiMock.mockReset();
=======
    vi.clearAllMocks();
>>>>>>> 750dbf1a3 (Write studystreakwidget tests)
  });

  afterEach(() => {
    vi.useRealTimers();
  });

<<<<<<< HEAD
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
=======
  it("renders streak count and day bars after loading", async () => {
    const today = "2026-03-24";
    const yesterday = "2026-03-23";
    fetchApiMock.mockResolvedValue([
      { completed: true, updated_at: `${today}T10:00:00.000Z` },
      { completed: true, updated_at: `${yesterday}T09:00:00.000Z` },
      { completed: false, updated_at: `${today}T08:00:00.000Z` },
>>>>>>> 750dbf1a3 (Write studystreakwidget tests)
    ]);

    render(<StudyStreakWidget />);

<<<<<<< HEAD
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
=======
    // Initially shows loading placeholder
    expect(screen.getByText("–")).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText("–")).not.toBeInTheDocument());

    // Streak of 2 (today + yesterday consecutive)
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/days/)).toBeInTheDocument();

    // 7 bar columns
    const barLabels = screen.getAllByText(/[MTWFS]/);
    expect(barLabels.length).toBeGreaterThan(0);
  });

  it("shows 'Complete a task today' hint when streak is 0", async () => {
    fetchApiMock.mockResolvedValue([]);

    render(<StudyStreakWidget />);
    await waitFor(() => expect(screen.queryByText("–")).not.toBeInTheDocument());

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText(/Complete a task today/)).toBeInTheDocument();
  });

  it("handles fetch error gracefully", async () => {
    fetchApiMock.mockRejectedValue(new Error("network error"));

    render(<StudyStreakWidget />);
    await waitFor(() => expect(screen.queryByText("–")).not.toBeInTheDocument());

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("handles paginated results format", async () => {
    const today = "2026-03-24";
    fetchApiMock.mockResolvedValue({
      results: [{ completed: true, updated_at: `${today}T10:00:00.000Z` }],
    });

    render(<StudyStreakWidget />);
    await waitFor(() => expect(screen.queryByText("–")).not.toBeInTheDocument());

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("day 🔥")).toBeInTheDocument();
>>>>>>> 750dbf1a3 (Write studystreakwidget tests)
  });
});
