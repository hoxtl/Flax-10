import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { AddSheet } from "../../../../pages/homepage/components/IntelligenceGridSheets";

describe("IntelligenceGridSheets", () => {
  const catalogue = [
    { id: "hero", label: "Hero", section: "Essentials", col: 2, row: 2, icon: <span>H</span> },
    { id: "timeline", label: "Timeline", section: "Planning", col: 2, row: 1, icon: <span>T</span> },
    { id: "progress", label: "Progress", section: "Progress", col: 1, row: 1, icon: <span>P</span> },
    { id: "custom", label: "Custom", section: "Zeta", col: 1, row: 2, icon: <span>C</span> },
  ];

  it("returns null when hidden and shows empty state when all widgets are active", () => {
    const { rerender, container } = render(
      <AddSheet active={[]} catalogue={catalogue} onAdd={vi.fn()} onClose={vi.fn()} visible={false} />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(
      <AddSheet active={catalogue.map((widget) => widget.id)} catalogue={catalogue} onAdd={vi.fn()} onClose={vi.fn()} visible />,
    );
    expect(screen.getByText("All widgets are already on your dashboard!")).toBeInTheDocument();
  });

  it("orders sections, filters active widgets, and adds a widget from the sheet", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <AddSheet active={["hero"]} catalogue={catalogue} onAdd={onAdd} onClose={onClose} visible />,
    );

    const text = container.textContent || "";
    expect(text.indexOf("Planning")).toBeLessThan(text.indexOf("Zeta"));
    expect(text).toContain("Progress");
    expect(screen.queryByText("Hero")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Timeline"));
    expect(onAdd).toHaveBeenCalledWith("timeline");
    expect(onClose).toHaveBeenCalled();
  });
});
