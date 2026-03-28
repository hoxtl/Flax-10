import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../components/common/loading_state/SkeletonBlock", () => ({
  default: ({ className }) => <div data-testid="skeleton-block" className={className} />,
}));

vi.mock("../../../components/analytics/components/AIInsightsTab", () => ({
  default: ({ period }) => <div data-testid="ai-insights-tab">{period}</div>,
}));

vi.mock("../../../pages/analytics/components/AnalyticsOverview", () => ({
  default: () => <div data-testid="analytics-overview" />,
}));

import AnalyticsSkeleton from "../../../pages/analytics/components/AnalyticsSkeleton";
import getAnalyticsTabs from "../../../pages/analytics/components/AnalyticsPageTabs";

describe("analytics coverage topups", () => {
  it("renders the analytics loading skeleton shell", () => {
    render(<AnalyticsSkeleton />);

    expect(screen.getByRole("generic", { busy: true })).toBeInTheDocument();
    expect(screen.getAllByTestId("skeleton-block")).toHaveLength(15);
  });

  it("keeps the overview tab empty when no data exists but still renders insights when loading is finished", () => {
    const tabs = getAnalyticsTabs({
      data: null,
      loading: false,
      period: 14,
      progressData: null,
      themeStats: null,
      isTeacher: false,
    });

    expect(tabs[0].content).toBeNull();
    expect(tabs[1].content).not.toBeNull();
  });
});
