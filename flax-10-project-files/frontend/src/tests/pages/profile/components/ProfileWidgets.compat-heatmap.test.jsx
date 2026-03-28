import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const mockUseCountUp = vi.fn();
const studyHeatmapMock = vi.fn();

vi.mock("../../../../hooks/useCountUp", () => ({
  useCountUp: (...args) => mockUseCountUp(...args),
}));

vi.mock("../../../../components/common/card/Card", () => ({
  default: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
}));

vi.mock("../../../../components/analytics/components/StudyHeatmap", () => ({
  default: (props) => {
    studyHeatmapMock(props);
    return <div data-testid="study-heatmap" />;
  },
}));

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      ...actual.motion,
      circle: (props) => <circle {...props} />,
    },
  };
});

import { CompatibilityScore } from "../../../../pages/profile/components/widgets/CompatibilityScore";
import {
  ContributionHeatmap,
  FocusHeatmapWidget,
  normalizeHeatmapData,
} from "../../../../pages/profile/components/widgets/FocusHeatmap";
import {
  buildSparkPointKey,
  computeCompatibility,
  computeTimeCompat,
} from "../../../../pages/profile/components/widgets/CompatibilityScore";

describe("Profile compatibility and heatmap coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCountUp.mockReturnValue({ current: null });
  });

  it("covers compatibility null, match, mismatch, neutral, all-day, and CTA states", () => {
    expect(computeTimeCompat("morning", "night")).toBe(20);
    expect(computeTimeCompat("neutral", "night")).toBe(60);
    expect(buildSparkPointKey({ date: "" }, 3)).toBe("day-3");
    expect(computeCompatibility({ persona: { id: "unknown" } }, { persona: { id: "unknown-2" } }, 0, 0)).toEqual({
      total: 38,
      viewedTime: "neutral",
      currentTime: "neutral",
    });

    const { container, rerender } = render(<CompatibilityScore viewedSummary={null} currentUserSummary={null} />);
    expect(container).toBeEmptyDOMElement();

    const onSuggestStudySession = vi.fn();
    rerender(
      <CompatibilityScore
        viewedSummary={{ persona: { id: "night_owl" } }}
        currentUserSummary={{ persona: { id: "night_owl" } }}
        sharedModuleCount={2}
        totalModuleCount={2}
        activitySparkline={[
          { date: "", level: 0 },
          { date: "2", level: 1 },
          { date: "3", level: 2 },
          { date: "4", level: 3 },
          { date: "5", level: 9 },
          { date: "6", level: 2 },
          { date: "7", level: 1 },
        ]}
        suggestionState="idle"
        onSuggestStudySession={onSuggestStudySession}
      />,
    );

    expect(screen.getByText(/Your focus windows line up really well/)).toBeInTheDocument();
    expect(screen.getByText(/2 modules in common/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Suggest a Study Session" }));
    expect(onSuggestStudySession).toHaveBeenCalled();
    expect(screen.getByText("Study momentum")).toBeInTheDocument();

    rerender(
      <CompatibilityScore
        viewedSummary={{ persona: { id: "night_owl" } }}
        currentUserSummary={{ persona: { id: "night_owl" } }}
        sharedModuleCount={0}
        totalModuleCount={0}
      />,
    );
    expect(screen.getByText("You tend to study around similar hours")).toBeInTheDocument();

    rerender(
      <CompatibilityScore
        viewedSummary={{ persona: { id: "consistent" } }}
        currentUserSummary={{ persona: { id: "consistent" } }}
        sharedModuleCount={2}
        totalModuleCount={2}
        suggestionState="sending"
        onSuggestStudySession={onSuggestStudySession}
      />,
    );
    expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
    expect(screen.getByText(/Your focus windows line up really well/)).toBeInTheDocument();

    rerender(
      <CompatibilityScore
        viewedSummary={{ persona: { id: "consistent" } }}
        currentUserSummary={{ persona: { id: "night_owl" } }}
        sharedModuleCount={2}
        totalModuleCount={2}
      />,
    );
    expect(screen.getByText(/You still have some overlap in your routine/)).toBeInTheDocument();

    rerender(
      <CompatibilityScore
        viewedSummary={{ persona: { id: "night_owl" } }}
        currentUserSummary={{ persona: { id: "night_owl" } }}
        sharedModuleCount={2}
        totalModuleCount={2}
        suggestionState="sent"
        onSuggestStudySession={onSuggestStudySession}
      />,
    );
    expect(screen.getByRole("button", { name: "Suggestion Sent" })).toBeDisabled();

    rerender(
      <CompatibilityScore
        viewedSummary={{ persona: { id: "morning_unknown" } }}
        currentUserSummary={{ persona: { id: "night_owl" } }}
        sharedModuleCount={1}
        totalModuleCount={2}
      />,
    );
    expect(screen.getByText(/Different study rhythms, but a few shared windows/)).toBeInTheDocument();

    rerender(
      <CompatibilityScore
        viewedSummary={{ persona: { id: "afternoon_peak" } }}
        currentUserSummary={{ persona: { id: "night_owl" } }}
        sharedModuleCount={0}
        totalModuleCount={2}
        activitySparkline={[{ date: "1", level: 9 }]}
      />,
    );
    expect(screen.getByText(/Very different study rhythms/i)).toBeInTheDocument();
    expect(screen.queryByText("Study momentum")).not.toBeInTheDocument();

    rerender(
      <CompatibilityScore
        viewedSummary={{ persona: { id: "consistent" } }}
        currentUserSummary={{ persona: { id: "consistent" } }}
        sharedModuleCount={0}
        totalModuleCount={10}
      />,
    );
    expect(screen.getByText("There are a few overlapping study windows")).toBeInTheDocument();
  });

  it("covers focus heatmap normalization and interactive and static navigation branches", () => {
    expect(normalizeHeatmapData({ data: null })).toBeNull();
    expect(normalizeHeatmapData({ data: [[5]], days: undefined, hours: undefined })).toEqual(
      expect.objectContaining({
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        hours: expect.arrayContaining([0, 1, 2]),
      }),
    );

    const onNavigate = vi.fn();
    const { container, rerender } = render(
      <FocusHeatmapWidget
        heatmap={{ data: [[10, 20], null], days: ["Mon", "Tue"], hours: [] }}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByTestId("study-heatmap")).toBeInTheDocument();
    expect(studyHeatmapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        heatmapData: expect.objectContaining({
          days: ["Mon", "Tue"],
          hours: expect.arrayContaining([0, 1, 2]),
          data: expect.any(Array),
        }),
      }),
    );

    fireEvent.click(screen.getAllByRole("button", { name: /view full analytics/i })[1]);
    expect(onNavigate).toHaveBeenCalledWith("analytics");
    fireEvent.keyDown(screen.getByTestId("card"), { key: " ", preventDefault: vi.fn() });
    expect(onNavigate).toHaveBeenCalledTimes(2);

    rerender(<FocusHeatmapWidget heatmap={{ data: [[5]], days: ["Solo"], hours: [8] }} />);
    expect(screen.queryByRole("button", { name: /view full analytics/i })).not.toBeInTheDocument();

    rerender(
      <ContributionHeatmap
        heatmap={{ data: [[null], [0], [15], [45], [90]] }}
        onNavigate={onNavigate}
      />,
    );
    fireEvent.click(screen.getByTestId("card"));
    expect(onNavigate).toHaveBeenLastCalledWith("analytics");
    expect(container.querySelectorAll("[title]").length).toBeGreaterThan(0);
    expect(screen.getAllByTitle("0h").length).toBeGreaterThan(0);
  });
});
