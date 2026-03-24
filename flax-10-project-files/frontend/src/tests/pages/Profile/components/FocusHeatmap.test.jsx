import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const studyHeatmapMock = vi.fn();

vi.mock("../../../../components/common/Card/Card", () => ({
  default: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
}));

vi.mock("../../../../components/Analytics/StudyHeatmap", () => ({
  default: (props) => {
    studyHeatmapMock(props);
    return <div data-testid="study-heatmap" />;
  },
}));

import {
  ContributionHeatmap,
  FocusHeatmapWidget,
} from "../../../../pages/Profile/components/widgets/FocusHeatmap";

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

    fireEvent.click(screen.getByRole("button", { name: /View full analytics/i }));
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
});
