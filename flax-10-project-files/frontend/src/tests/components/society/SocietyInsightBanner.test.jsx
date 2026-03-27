import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSummary, getModules, getEnrollments } = vi.hoisted(() => ({
  getSummary: vi.fn(),
  getModules: vi.fn(),
  getEnrollments: vi.fn(),
}));

vi.mock("../../../api/analyticsApi", () => ({
  default: {
    getSummary,
  },
}));

vi.mock("../../../api/moduleApi", () => ({
  getModules,
  getEnrollments,
}));

import SocietyInsightBanner from "../../../components/society/society_detail/SocietyInsightBanner";

const baseSociety = {
  id: 9,
  name: "Chess Society",
  events: [
    {
      id: 17,
      title: "Committee Meeting",
      start_time: "2026-04-06T18:30:00Z",
      end_time: "2026-04-06T19:30:00Z",
    },
  ],
};

function renderBanner(society = baseSociety) {
  return render(
    <MemoryRouter>
      <SocietyInsightBanner society={society} />
    </MemoryRouter>,
  );
}

describe("SocietyInsightBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSummary.mockResolvedValue({
      summary: { total_sessions: 4, total_study_hours: 6.5 },
      heatmap: { data: Array.from({ length: 7 }, () => Array(24).fill(0)) },
    });
    getModules.mockResolvedValue([]);
    getEnrollments.mockResolvedValue([]);
  });

  it("shows a timetable clash when a society event overlaps an enrolled lecture", async () => {
    getModules.mockResolvedValue([
      {
        id: 4,
        module_code: "OSC22502S",
        start_time: "2026-03-30T18:00:00Z",
        end_time: "2026-03-30T19:00:00Z",
      },
    ]);
    getEnrollments.mockResolvedValue([{ module: 4, module_code: "OSC22502S" }]);

    renderBanner();

    await waitFor(() => expect(screen.getByText("Timetable clash detected")).toBeInTheDocument());
    expect(screen.getByText(/overlaps with your OSC22502S lecture/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open OSC22502S" })).toHaveAttribute("href", "/modules?moduleId=4");
  });

  it("shows a timer onboarding message when there is no analytics data yet", async () => {
    getSummary.mockResolvedValue({
      summary: { total_sessions: 0, total_study_hours: 0 },
      heatmap: { data: Array.from({ length: 7 }, () => Array(24).fill(0)) },
    });

    renderBanner();

    await waitFor(() => expect(screen.getByText("We can personalise this once you use Timer")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Open Timer" })).toHaveAttribute("href", "/timer");
  });

  it("shows a combined timetable and focus-window warning when both conflicts apply", async () => {
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    heatmap[0][18] = 55;
    heatmap[0][19] = 55;

    getSummary.mockResolvedValue({
      summary: { total_sessions: 8, total_study_hours: 12 },
      heatmap: { data: heatmap },
    });
    getModules.mockResolvedValue([
      {
        id: 4,
        module_code: "OSC22502S",
        start_time: "2026-03-30T18:00:00Z",
        end_time: "2026-03-30T19:00:00Z",
      },
    ]);
    getEnrollments.mockResolvedValue([{ module: 4, module_code: "OSC22502S" }]);

    renderBanner();

    await waitFor(() => expect(screen.getByText("This society could squeeze your best study window")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "View Analytics" })).toHaveAttribute("href", "/analytics");
  });

  it("shows a peak-study warning when an event overlaps a strong study hour", async () => {
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    heatmap[0][18] = 45;
    heatmap[0][19] = 45;

    getSummary.mockResolvedValue({
      summary: { total_sessions: 6, total_study_hours: 9 },
      heatmap: { data: heatmap },
    });
    getModules.mockResolvedValue([]);
    getEnrollments.mockResolvedValue([]);

    renderBanner({
      ...baseSociety,
      events: [{ id: 18, title: "Late Study Circle", start_time: "2026-04-06T18:30:00Z" }],
    });

    await waitFor(() => expect(screen.getByText("This lands in one of your strongest study slots")).toBeInTheDocument());
  });

  it("links to analytics from the peak-study slot warning", async () => {
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    heatmap[0][18] = 45;
    heatmap[0][19] = 45;

    getSummary.mockResolvedValue({
      summary: { total_sessions: 6, total_study_hours: 9 },
      heatmap: { data: heatmap },
    });

    renderBanner({
      ...baseSociety,
      events: [{ id: 18, title: "Late Study Circle", start_time: "2026-04-06T18:30:00Z" }],
    });

    await waitFor(() => expect(screen.getByRole("link", { name: "View Analytics" })).toHaveAttribute("href", "/analytics"));
  });

  it("shows a positive fit when sessions avoid conflicts and enrolled modules are available", async () => {
    getSummary.mockResolvedValue({
      summary: { total_sessions: 5, total_study_hours: 8 },
      heatmap: { data: Array.from({ length: 7 }, () => Array(24).fill(0)) },
    });
    getModules.mockResolvedValue([
      {
        id: 11,
        module_code: "HIS100",
        start_time: "2026-04-07T09:00:00Z",
        end_time: "2026-04-07T10:00:00Z",
      },
    ]);
    getEnrollments.mockResolvedValue([{ module: 11, module_code: "HIS100" }]);

    renderBanner();

    await waitFor(() => expect(screen.getByText("This looks like a good fit for your week")).toBeInTheDocument());
    expect(
      screen.getByText(/did not spot a clash with your enrolled modules/i),
    ).toBeInTheDocument();
  });

  it("shows the lighter positive message when module context is unavailable", async () => {
    getSummary.mockResolvedValue({
      summary: { total_sessions: 5, total_study_hours: 8 },
      heatmap: { data: Array.from({ length: 7 }, () => Array(24).fill(0)) },
    });
    getModules.mockRejectedValue(new Error("modules offline"));
    getEnrollments.mockRejectedValue(new Error("enrolments offline"));

    renderBanner();

    await waitFor(() => expect(screen.getByText("This looks like a good fit for your week")).toBeInTheDocument());
    expect(
      screen.getByText(/should fit more comfortably around your usual routine/i),
    ).toBeInTheDocument();
  });

  it("sorts multiple upcoming events efficiently", async () => {
    getSummary.mockResolvedValue({
      summary: { total_sessions: 5, total_study_hours: 8 },
      heatmap: { data: Array.from({ length: 7 }, () => Array(24).fill(0)) },
    });
    renderBanner({
      ...baseSociety,
      events: [
        { id: 20, title: "Later social", start_time: "2026-04-06T20:30:00Z" },
        { id: 19, title: "Earlier social", start_time: "2026-04-06T18:30:00Z" },
      ],
    });
    await waitFor(() => expect(screen.getByText("This looks like a good fit for your week")).toBeInTheDocument());
  });

  it("stays positive when the heatmap peak is elsewhere", async () => {
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    heatmap[0][7] = 60;
    getSummary.mockResolvedValue({
      summary: { total_sessions: 5, total_study_hours: 8 },
      heatmap: { data: heatmap },
    });
    renderBanner();
    await waitFor(() => expect(screen.getByText("This looks like a good fit for your week")).toBeInTheDocument());
  });

  it("treats invalid event dates as no upcoming sessions", async () => {
    renderBanner({
      ...baseSociety,
      events: [{ id: 99, title: "Broken event", start_time: "not-a-date" }],
    });

    await waitFor(() => expect(screen.getByText("No society sessions scheduled yet")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Open Calendar" })).toHaveAttribute("href", "/calendar");
  });

  it("falls back to the timer onboarding message when loading throws synchronously", async () => {
    getSummary.mockImplementation(() => {
      throw new Error("boom");
    });

    renderBanner();

    await waitFor(() => expect(screen.getByText("We can personalise this once you use Timer")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "View Modules" })).toHaveAttribute("href", "/modules");
  });
});
