import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import StatStrip from "../../../components/common/StatStrip/StatStrip";

vi.mock("../../../components/common/Tooltip/Tooltip", () => ({
  default: ({ children, content }) => (
    <div>
      <span>{content}</span>
      {children}
    </div>
  ),
}));

describe("StatStrip", () => {
  it("renders nothing with no items", () => {
    const { container } = render(<StatStrip items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders values, prefixes, suffixes, meta, separators, tones, and tooltips", () => {
    const valueRef = { current: null };
    render(
      <StatStrip
        items={[
          {
            key: "1",
            label: "Focus",
            value: 25,
            prefix: "~",
            suffix: "m",
            meta: "today",
            tone: "success",
            valueClassName: "custom-value",
            metaClassName: "custom-meta",
            valueRef,
          },
          {
            key: "2",
            label: "Deadlines",
            value: "--",
            tooltip: "Upcoming project deadline",
            tooltipPosition: "bottom",
          },
        ]}
        compact
        bare
        className="extra-strip"
      />
    );

    expect(screen.getByText("Focus")).toBeInTheDocument();
    expect(screen.getByText("today")).toHaveClass("custom-meta");
    expect(screen.getByText("Upcoming project deadline")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(document.querySelector(".extra-strip")).toBeTruthy();
  });
});
