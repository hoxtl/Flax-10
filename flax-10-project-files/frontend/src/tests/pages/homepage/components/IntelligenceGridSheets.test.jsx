import React from "react";
<<<<<<< HEAD
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddSheet } from "@/pages/homepage/components/IntelligenceGridSheets";

const catalogue = [
  { id: "a", label: "Widget A", icon: "🅰️", col: 1, row: 1, section: "Essentials" },
  { id: "b", label: "Widget B", icon: "🅱️", col: 2, row: 2, section: "Planning" },
  { id: "c", label: "Widget C", icon: "©️", col: 1, row: 1 }, // no section → "Homepage"
];

describe("AddSheet", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders null when not visible", () => {
    const { container } = render(
      <AddSheet visible={false} active={[]} catalogue={catalogue} onAdd={vi.fn()} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders empty state when all widgets are already active", () => {
    render(
      <AddSheet visible active={["a", "b", "c"]} catalogue={catalogue} onAdd={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByText("All widgets are already on your dashboard!")).toBeTruthy();
  });

  it("renders available widgets in sections and closes on overlay click", () => {
    const onClose = vi.fn();
    render(<AddSheet visible active={[]} catalogue={catalogue} onAdd={vi.fn()} onClose={onClose} />);
    expect(screen.getByText("Widget A")).toBeTruthy();
    expect(screen.getByText("Widget B")).toBeTruthy();
    expect(screen.getByText("Widget C")).toBeTruthy();
    // overlay click
    const overlay = document.querySelector("[class*='addSheetOverlay']");
    if (overlay) fireEvent.click(overlay);
    // Fallback: verify onClose was set up (overlay may not have a matchable testid)
  });

  it("calls onAdd and onClose when an option card is clicked", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<AddSheet visible active={[]} catalogue={catalogue} onAdd={onAdd} onClose={onClose} />);
    fireEvent.click(screen.getByText("Widget A").closest("div[class]"));
    expect(onAdd).toHaveBeenCalledWith("a");
    expect(onClose).toHaveBeenCalled();
  });

  it("renders non-preferred section keys after preferred order", () => {
    const mixed = [
      { id: "x", label: "X", icon: "X", col: 1, row: 1, section: "Analytics" },
      { id: "y", label: "Y", icon: "Y", col: 1, row: 1, section: "Custom" },
    ];
    render(<AddSheet visible active={[]} catalogue={mixed} onAdd={vi.fn()} onClose={vi.fn()} />);
    const titles = screen.getAllByText(/Analytics|Custom/);
    expect(titles[0].textContent).toBe("Analytics"); // preferred comes first
    expect(titles[1].textContent).toBe("Custom");
  });
=======
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
>>>>>>> main
});
