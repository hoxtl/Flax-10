import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const studyHeatmapMock = vi.fn();

vi.mock("../../../../components/common/card/Card", () => ({
  default: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/pages/profile/components/FocusHeatmap.test.jsx
vi.mock("../../../../components/analytics/components/StudyHeatmap", () => ({
=======
vi.mock("../../../../components/analytics/StudyHeatmap", () => ({
>>>>>>> main:flax-10-project-files/frontend/src/tests/pages/Profile/components/FocusHeatmap.test.jsx
  default: (props) => {
    studyHeatmapMock(props);
    return <div data-testid="study-heatmap" />;
  },
}));

import {
  ContributionHeatmap,
  FocusHeatmapWidget,
} from "../../../../pages/profile/components/widgets/FocusHeatmap";

describe("FocusHeatmap widgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when the focus heatmap has no usable data", () => {
    const { container } = render(<FocusHeatmapWidget heatmap={{ data: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("normalizes heatmap days and hours and supports interactive navigation", () => {
    const onNavigate = vi.fn();
    render(
      <FocusHeatmapWidget
        heatmap={{ data: [[10, 20], [0, 5]], days: ["Mon", "Tue"], hours: [] }}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByTestId("study-heatmap")).toBeInTheDocument();
    expect(studyHeatmapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        heatmapData: expect.objectContaining({
          days: ["Mon", "Tue"],
          hours: expect.arrayContaining([0, 1, 2]),
        }),
      }),
    );

    fireEvent.click(screen.getAllByRole("button", { name: /View full analytics/i })[1]);
    expect(onNavigate).toHaveBeenCalledWith("analytics");

    fireEvent.keyDown(screen.getByTestId("card"), { key: "Enter", preventDefault: vi.fn() });
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });

  it("renders contribution heatmap cells and keeps the card action clickable", () => {
    const onNavigate = vi.fn();
    render(
      <ContributionHeatmap
        heatmap={{
          data: [
            [0, 30, 60],
            [null, 90, 120],
            [10, 0, 0],
          ],
        }}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText("FOCUS ACTIVITY")).toBeInTheDocument();
    expect(screen.getAllByTitle(/h$/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByTestId("card"));
    expect(onNavigate).toHaveBeenCalledWith("analytics");
  });

  it("renders non-interactive focus headers and contribution fallback colours", () => {
    const { container, rerender } = render(
      <FocusHeatmapWidget
        heatmap={{ data: [[10], [20]], days: ["Only one"], hours: [] }}
      />,
    );

    expect(screen.getByText("View full analytics")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /View full analytics/i })).not.toBeInTheDocument();

    rerender(
      <ContributionHeatmap
        heatmap={{ data: [[null], [0], [30], [60], [120]] }}
      />,
    );

    const cells = container.querySelectorAll('[title]');
    expect(Array.from(cells).some((cell) => cell.getAttribute('title') === '')).toBe(true);
    expect(Array.from(cells).some((cell) => cell.getAttribute('title') === '0h')).toBe(true);
  });

  it("keeps provided heatmap hours and treats malformed contribution rows as zero totals", () => {
    const { rerender } = render(
      <FocusHeatmapWidget
        heatmap={{ data: [[10], [20]], days: ["Mon", "Tue"], hours: [8, 9] }}
      />,
    );

    expect(studyHeatmapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        heatmapData: expect.objectContaining({
          hours: [8, 9],
        }),
      }),
    );

    rerender(
      <ContributionHeatmap
        heatmap={{ data: [[30], null, [15]] }}
      />,
    );
    expect(screen.getByTitle("0h")).toBeInTheDocument();
  });

  it("returns null for empty contribution heatmaps", () => {
    const { container } = render(<ContributionHeatmap heatmap={{ data: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
