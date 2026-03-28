import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSummary, getModules, getEnrollments, navigateMock } = vi.hoisted(() => ({
  getSummary: vi.fn(),
  getModules: vi.fn(),
  getEnrollments: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../../../api/analyticsApi", () => ({
  default: {
    getSummary,
  },
}));

vi.mock("../../../../api/moduleApi", () => ({
  getModules,
  getEnrollments,
}));

import SocietyInsightBanner from "../../../../components/society/society_detail/SocietyInsightBanner";

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

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderBanner(society = baseSociety) {
  return render(<SocietyInsightBanner society={society} />);
}

describe("SocietyInsightBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
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
    expect(screen.getByRole("button", { name: "Open OSC22502S" })).toBeInTheDocument();
  });

  it("shows a timer onboarding message when there is no analytics data yet", async () => {
    getSummary.mockResolvedValue({
      summary: { total_sessions: 0, total_study_hours: 0 },
      heatmap: { data: Array.from({ length: 7 }, () => Array(24).fill(0)) },
    });

    renderBanner();

    await waitFor(() => expect(screen.getByText("We can personalise this once you use Timer")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Open Timer" })).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "View Analytics" })).toBeInTheDocument();
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

    await waitFor(() => expect(screen.getByRole("button", { name: "View Analytics" })).toBeInTheDocument());
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
    expect(screen.getByRole("button", { name: "Open Calendar" })).toBeInTheDocument();
  });

  it("handles societies without an events array", async () => {
    renderBanner({ id: 44, name: "Empty Society" });

    await waitFor(() => expect(screen.getByText("No society sessions scheduled yet")).toBeInTheDocument());
  });

  it("falls back to the timer onboarding message when loading throws synchronously", async () => {
    getSummary.mockImplementation(() => {
      throw new Error("boom");
    });

    renderBanner();

    await waitFor(() => expect(screen.getByText("We can personalise this once you use Timer")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "View Modules" })).toBeInTheDocument();
  });

  it("stays positive when modules or enrollments resolve to null", async () => {
    getModules.mockResolvedValue(null);
    getEnrollments.mockResolvedValue(null);

    renderBanner();

    await waitFor(() => expect(screen.getByText("This looks like a good fit for your week")).toBeInTheDocument());
  });

  it("uses the default heatmap when analytics returns null data", async () => {
    getSummary.mockResolvedValue({
      summary: { total_sessions: 2, total_study_hours: 3 },
      heatmap: { data: null },
    });

    renderBanner();

    await waitFor(() => expect(screen.getByText("This looks like a good fit for your week")).toBeInTheDocument());
  });

  it("falls back to an empty heatmap when analytics data is missing", async () => {
    getSummary.mockResolvedValue({
      summary: { total_sessions: 3, total_study_hours: 4 },
      heatmap: { data: [] },
    });

    renderBanner();

    await waitFor(() => expect(screen.getByText("This looks like a good fit for your week")).toBeInTheDocument());
  });

  it("ignores resolved insights after the component unmounts", async () => {
    const summaryDeferred = createDeferred();
    const modulesDeferred = createDeferred();
    const enrollmentsDeferred = createDeferred();

    getSummary.mockReturnValue(summaryDeferred.promise);
    getModules.mockReturnValue(modulesDeferred.promise);
    getEnrollments.mockReturnValue(enrollmentsDeferred.promise);

    const { unmount } = renderBanner();
    unmount();

    summaryDeferred.resolve({
      summary: { total_sessions: 1, total_study_hours: 2 },
      heatmap: { data: Array.from({ length: 7 }, () => Array(24).fill(0)) },
    });
    modulesDeferred.resolve([]);
    enrollmentsDeferred.resolve([]);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText("This looks like a good fit for your week")).not.toBeInTheDocument();
  });

  it("ignores rejected insight loads after the component unmounts", async () => {
    getSummary.mockImplementation(() => {
      throw new Error("later failure");
    });

    const { unmount } = renderBanner();
    unmount();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText("We can personalise this once you use Timer")).not.toBeInTheDocument();
  });

  it("uses the fallback weekday row when the heatmap lacks that day", async () => {
    const heatmap = [Array(24).fill(60)];
    getSummary.mockResolvedValue({
      summary: { total_sessions: 10, total_study_hours: 12 },
      heatmap: { data: heatmap },
    });

    renderBanner({
      ...baseSociety,
      events: [{
        id: 41,
        title: "Tuesday Meetup",
        start_time: "2026-04-07T18:30:00Z",
        end_time: "2026-04-07T19:00:00Z",
      }],
    });

    await waitFor(() => expect(screen.getByText("This looks like a good fit for your week")).toBeInTheDocument());
  });

  it("navigates through the primary and secondary insight actions", async () => {
    renderBanner();

    await waitFor(() => expect(screen.getByText("This looks like a good fit for your week")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "View Analytics" }));
    fireEvent.click(screen.getByRole("button", { name: "Open Calendar" }));

    expect(navigateMock).toHaveBeenNthCalledWith(1, "/analytics");
    expect(navigateMock).toHaveBeenNthCalledWith(2, "/calendar");
  });
});
