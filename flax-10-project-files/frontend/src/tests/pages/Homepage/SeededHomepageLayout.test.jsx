import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authState } = vi.hoisted(() => ({
  authState: {
    authenticated: true,
    loading: false,
    profile: {
      id: 7,
      role: "student",
      settings: {
        homepage_widgets: ["hero", "deadlines", "todayTasks", "bigTimeline"],
        homepage_widget_sizes: {},
      },
      summary: {
        weekly: { percentage: 72 },
        streaks: { current: 3 },
      },
    },
    profileLoading: false,
    refreshProfile: vi.fn(),
    user: { role: "student" },
  },
}));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("../../../api/tflApi", () => ({
  tflService: { getTfLDelays: vi.fn().mockResolvedValue([]) },
}));

vi.mock("../../../api/adminApi", () => ({
  getMyCourseChangeRequest: vi.fn().mockResolvedValue(null),
}));

vi.mock("../../../pages/analytics/hooks/useAnalyticsOverview", () => ({
  default: vi.fn(() => null),
}));

vi.mock("../../../components/common", () => ({
  ConfirmModal: () => null,
}));

vi.mock("../../../pages/homepage/components/IntelligenceGrid", () => ({
  default: ({ layout }) => <div data-testid="homepage-layout">{layout.join("|")}</div>,
}));

vi.mock("../../../pages/homepage/components/intelligenceWidgetRenderer", () => ({
  renderIntelligenceWidget: () => null,
}));

import IntelligenceRow from "../../../pages/homepage/components/IntelligenceRow";

function renderRow() {
  return render(<IntelligenceRow />);
}

describe("SeededHomepageLayout", () => {
  beforeEach(() => {
    localStorage.clear();
    authState.profile = {
      id: 7,
      role: "student",
      settings: {
        homepage_widgets: ["hero", "deadlines", "todayTasks", "bigTimeline"],
        homepage_widget_sizes: {},
      },
      summary: {
        weekly: { percentage: 72 },
        streaks: { current: 3 },
      },
    };
  });

  it("uses the seeded hero-first layout", () => {
    renderRow();
    expect(screen.getByTestId("homepage-layout")).toHaveTextContent("hero|deadlines|todayTasks|bigTimeline");
  });

  it("replaces stale stored widgets when the server layout changes after reseed", async () => {
    localStorage.setItem("homepage_widget_layout_7", JSON.stringify(["deadlines", "todayTasks", "bigTimeline", "rightNow"]));
    localStorage.setItem("homepage_widget_source_7", JSON.stringify({
      layout: ["deadlines", "todayTasks", "bigTimeline", "rightNow"],
      sizes: {},
    }));

    renderRow();

    expect(screen.getByTestId("homepage-layout")).toHaveTextContent("hero|deadlines|todayTasks|bigTimeline");
    await waitFor(() =>
      expect(localStorage.getItem("homepage_widget_source_7")).toBe(JSON.stringify({
        layout: ["hero", "deadlines", "todayTasks", "bigTimeline"],
        sizes: {},
      })),
    );
  });
});
