import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import StatStrip from "../../../../components/common/stat_strip/StatStrip";

vi.mock("../../../../components/common/tooltip/Tooltip", () => ({
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

  it("renders interactive link and button items, forwarded refs, separators, and layout classes", () => {
    const onClick = vi.fn();
    const valueRef = { current: null };

    render(
      <MemoryRouter>
        <StatStrip
          compact
          bare
          nowrap
          items={[
            { key: "nav", label: "Open", value: 3, to: "/projects", ariaLabel: "Open projects", tone: "accent", valueClassName: "accent-value" },
            { key: "cta", label: "Refresh", value: "!", onClick, tooltip: "Refresh data", tooltipPosition: "bottom" },
            { key: "ref", label: "Live", value: 7, valueRef },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Open projects" })).toHaveAttribute("href", "/projects");
    expect(screen.getByRole("button", { name: "Refresh data" })).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(valueRef.current).toBeTruthy();
    expect(screen.getAllByText("Refresh data")).toHaveLength(1);
    expect(document.querySelectorAll("[aria-hidden='true']")).toHaveLength(2);

    screen.getByRole("button", { name: "Refresh data" }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses fallback keys, default meta classes, and default props cleanly", () => {
    const { rerender } = render(
      <MemoryRouter>
        <StatStrip items={[{ label: "Fallback key", value: 1, meta: "secondary meta" }]} />
      </MemoryRouter>,
    );

    expect(screen.getByText("secondary meta")).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <StatStrip />
      </MemoryRouter>,
    );

    expect(document.body).toBeInTheDocument();
  });
});
