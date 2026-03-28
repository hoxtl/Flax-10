import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock("../../../../components/common/empty_state/EmptyState", () => ({
  default: ({ title, description }) => (
    <div data-testid="empty-state">
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}));

import { PeakHoursCard } from "../../../../components/analytics/components/PeakHoursCard";

describe("PeakHoursCard", () => {
  it("returns null when heatmap data is missing or malformed", () => {
    const { container, rerender } = render(<PeakHoursCard data={null} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<PeakHoursCard data={{ heatmap: { data: null, hours: [] } }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an empty state when no hours have activity", () => {
    render(<PeakHoursCard data={{ heatmap: { data: [[0, 0, 0]], hours: ["06", "07", "08"] } }} />);
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No peak-hour data yet");
  });

  it("renders the top three hours in descending order with formatted labels", () => {
    render(
      <PeakHoursCard
        data={{
          heatmap: {
            data: [
              [10, 60, 15, 0, 45],
              [5, 30, 10, 0, 5],
            ],
            hours: ["06", "13", "17", "22", "09"],
          },
        }}
      />,
    );

    expect(screen.getByText("Peak Hours")).toBeTruthy();
    expect(screen.getByText("#1")).toBeTruthy();
    expect(screen.getByText("1pm")).toBeTruthy();
    expect(screen.getByText("9am")).toBeTruthy();
    expect(screen.getByText("5pm")).toBeTruthy();
    expect(screen.getByText("Peak Hours").closest("div")).toHaveAttribute(
      "data-tooltip",
      "Hours when you study most. Schedule demanding tasks here.",
    );
  });

  it("formats noon-style peak hours with the 12 fallback", () => {
    render(
      <PeakHoursCard
        data={{
          heatmap: {
            data: [[0, 40]],
            hours: ["00", "12"],
          },
        }}
      />,
    );

    expect(screen.getByText("12pm")).toBeTruthy();
  });
});
