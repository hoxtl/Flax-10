import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => {
      const Tag = typeof tag === "string" ? tag : "div";
      const { initial, animate, exit, transition, variants, custom, ...rest } = props;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
}));

vi.mock("../../../components/analytics/AIInsightsTab", () => ({
  default: ({ period }) => <div data-testid="ai-insights-tab">{period}</div>,
}));

vi.mock("../../../components/analytics/SummaryCards", () => ({
  default: ({ data }) => <div data-testid="summary-cards">{Boolean(data).toString()}</div>,
}));

vi.mock("../../../components/analytics/ProductivityCards", () => ({
  default: () => <div data-testid="productivity-cards" />,
}));

vi.mock("../../../components/analytics/InsightCards", () => ({
  ConsistencyScore: () => <div data-testid="consistency-score" />,
  PeakHoursCard: () => <div data-testid="peak-hours-card" />,
}));

vi.mock("../../../components/analytics/StudyHoursChart", () => ({
  default: () => <div data-testid="study-hours-chart" />,
}));

vi.mock("../../../components/analytics/DailyBreakdownChart", () => ({
  default: () => <div data-testid="daily-breakdown-chart" />,
}));

vi.mock("../../../components/analytics/PlannedVsActualChart", () => ({
  default: () => <div data-testid="planned-vs-actual-chart" />,
}));

vi.mock("../../../components/analytics/StudyHeatmap", () => ({
  default: () => <div data-testid="study-heatmap" />,
}));

vi.mock("../../../components/analytics/ThemeUsageChart", () => ({
  default: () => <div data-testid="theme-usage-chart" />,
}));

vi.mock("../../../components/analytics/AttendanceChart", () => ({
  default: () => <div data-testid="attendance-chart" />,
}));

import getAnalyticsTabs from "../../../pages/analytics/components/AnalyticsPageTabs";
import AnalyticsOverview from "../../../pages/analytics/components/AnalyticsOverview";

const analyticsData = {
  summary: { total_study_hours: 5 },
  daily_breakdown: [{ day: "Mon", value: 2 }],
  heatmap: { data: [[1]], hours: ["09"] },
};

describe("Analytics components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds overview and insights tabs only when loading permits them", () => {
    const loadedTabs = getAnalyticsTabs({
      data: analyticsData,
      loading: false,
      period: 30,
      progressData: { daily_progress: [1, 2] },
      themeStats: { light: 3 },
      isTeacher: false,
    });

    expect(loadedTabs[0].content).not.toBeNull();
    expect(loadedTabs[1].content).not.toBeNull();

    const loadingTabs = getAnalyticsTabs({
      data: analyticsData,
      loading: true,
      period: 7,
      progressData: null,
      themeStats: null,
      isTeacher: false,
    });

    expect(loadingTabs[0].content).toBeNull();
    expect(loadingTabs[1].content).toBeNull();
  });

  it("renders all overview cards for students when progress and theme stats exist", () => {
    render(
      <MemoryRouter>
        <AnalyticsOverview
          data={analyticsData}
          progressData={{ daily_progress: [1, 2] }}
          themeStats={{ light: 3 }}
          isTeacher={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("summary-cards")).toBeInTheDocument();
    expect(screen.getByTestId("productivity-cards")).toBeInTheDocument();
    expect(screen.getByTestId("consistency-score")).toBeInTheDocument();
    expect(screen.getByTestId("peak-hours-card")).toBeInTheDocument();
    expect(screen.getByTestId("study-hours-chart")).toBeInTheDocument();
    expect(screen.getByTestId("daily-breakdown-chart")).toBeInTheDocument();
    expect(screen.getByTestId("planned-vs-actual-chart")).toBeInTheDocument();
    expect(screen.getByTestId("study-heatmap")).toBeInTheDocument();
    expect(screen.getByTestId("theme-usage-chart")).toBeInTheDocument();
    expect(screen.getByTestId("attendance-chart")).toBeInTheDocument();
  });

  it("omits optional charts for teachers when progress or theme data is absent", () => {
    render(
      <MemoryRouter>
        <AnalyticsOverview
          data={analyticsData}
          progressData={null}
          themeStats={null}
          isTeacher
        />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId("planned-vs-actual-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("theme-usage-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("attendance-chart")).not.toBeInTheDocument();
  });

  it("shows the onboarding empty state when no study data exists yet", () => {
    render(
      <MemoryRouter>
        <AnalyticsOverview
          data={{ summary: { total_study_hours: 0, total_sessions: 0 }, daily_breakdown: [], heatmap: { data: [[0]], hours: ["09"] } }}
          progressData={null}
          themeStats={null}
          isTeacher={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("No analytics yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Timer" })).toHaveAttribute("href", "/timer");
    expect(screen.queryByTestId("summary-cards")).not.toBeInTheDocument();
  });
});
