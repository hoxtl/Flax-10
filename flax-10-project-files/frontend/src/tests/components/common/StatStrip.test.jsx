import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import StatStrip from "../../../components/common/stat_strip/StatStrip";

vi.mock("../../../components/common/tooltip/Tooltip", () => ({
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

  it("renders labels, meta text, and custom class names", () => {
    render(
      <StatStrip
        items={[{ key: "1", label: "Focus", value: 25, meta: "today", metaClassName: "custom-meta" }]}
        className="extra-strip"
      />
    );
    expect(screen.getByText("Focus")).toBeInTheDocument();
    expect(screen.getByText("today")).toHaveClass("custom-meta");
    expect(document.querySelector(".extra-strip")).toBeTruthy();
  });

  it("renders values with prefixes/suffixes and tooltips", () => {
    render(
      <StatStrip
        items={[
          { key: "1", value: 25, prefix: "~", suffix: "m" },
          { key: "2", value: "--", tooltip: "Upcoming project deadline" },
        ]}
      />
    );
    expect(screen.getByText("~")).toBeInTheDocument();
    expect(screen.getByText("m")).toBeInTheDocument();
    expect(screen.getByText("Upcoming project deadline")).toBeInTheDocument();
  });
});
