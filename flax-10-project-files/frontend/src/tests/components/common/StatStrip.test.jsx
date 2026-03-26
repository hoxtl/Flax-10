import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}));

import StatStrip, { buildItemSlotClass, buildMetaClass, buildValueClass } from "../../../components/common/StatStrip/StatStrip";

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

  it("renders interactive items as links and buttons with tones", () => {
    const onClick = vi.fn();
    render(
      <StatStrip
        items={[
          { key: "1", label: "Focus", value: "12", tone: "success", ariaLabel: "Focus stat", to: "/focus" },
          { key: "2", label: "Break", value: "3", tone: "warning", onClick, valueRef: vi.fn() },
        ]}
        compact
        bare
        nowrap
      />
    );

    expect(screen.getByRole("link", { name: "Focus stat" })).toHaveTextContent("Focus");
    expect(screen.getByRole("button", { name: "Break" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Break" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("covers the class helpers directly", () => {
    expect(buildValueClass({ tone: "accent", valueClassName: "custom-value" })).toContain("custom-value");
    expect(buildMetaClass({ metaClassName: "custom-meta" })).toContain("custom-meta");
    expect(buildItemSlotClass({ to: "/focus" })).toContain("itemSlotInteractive");
    expect(buildItemSlotClass({ onClick: vi.fn() })).toContain("itemSlotInteractive");
  });
});
