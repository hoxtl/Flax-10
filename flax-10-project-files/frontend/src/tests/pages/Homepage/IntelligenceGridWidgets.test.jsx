import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  AddWidgetSlot,
  GridWidgetList,
  HeroWidget,
} from "../../../pages/Homepage/components/IntelligenceGridWidgets";

vi.mock("../../../components/ui/bento-grid", () => ({
  BentoCard: ({ children }) => <div data-testid="bento-card">{children}</div>,
}));

vi.mock("../../../pages/Homepage/components/IntelligenceGridControls", () => ({
  DeleteButton: ({ onClick }) => <button type="button" onClick={onClick}>Delete widget</button>,
  GridGrip: () => <div>Grip</div>,
  ResizeControls: ({ id, col, row, onResize }) => (
    <button type="button" onClick={() => onResize?.(id, { col, row })}>
      Resize {id}
    </button>
  ),
}));

describe("IntelligenceGridWidgets", () => {
  const catalogue = [
    { id: "hero", label: "Hero", col: 2, row: 2, minRow: 1, maxRow: 4 },
    { id: "timeline", label: "Timeline", col: 1, row: 1 },
    { id: "photo", label: "Photo", col: 1, row: 2 },
  ];

  it("renders hero content with widget sizing", () => {
    const widgetRenderer = vi.fn((id, size) => <div>{`${id}-${size.col}x${size.row}`}</div>);
    render(<HeroWidget catalogue={catalogue} edit layout={["hero"]} widgetRenderer={widgetRenderer} widgetSizes={{ hero: { row: 3 } }} setWidgetSize={vi.fn()} />);
    expect(widgetRenderer).toHaveBeenCalledWith("hero", { col: 2, row: 3 });
    expect(screen.getByText("hero-2x3")).toBeInTheDocument();
  });

  it("handles hero widget resizing", () => {
    const setWidgetSize = vi.fn();
    render(<HeroWidget catalogue={catalogue} edit layout={["hero"]} setWidgetSize={setWidgetSize} widgetRenderer={vi.fn()} widgetSizes={{ hero: { row: 3 } }} />);
    fireEvent.click(screen.getByText("Resize hero"));
    expect(setWidgetSize).toHaveBeenCalledWith("hero", { col: 2, row: 3 });
  });

  it("renders grid widgets and skips null content", () => {
    const widgetRenderer = vi.fn((id) => (id === "photo" ? null : <div>{id}</div>));
    render(<GridWidgetList catalogue={catalogue} edit layout={["timeline", "photo"]} setLayout={vi.fn()} widgetRenderer={widgetRenderer} widgetSizes={{}} setWidgetSize={vi.fn()} onDragEnd={vi.fn()} onDragOver={vi.fn()} onDragStart={vi.fn()} onDrop={vi.fn()} dragOver={null} dragging={null} />);
    expect(screen.getByText("timeline")).toBeInTheDocument();
    expect(screen.queryByText("photo")).not.toBeInTheDocument();
  });

  it("supports widget deletion and sizing from grid list", () => {
    const setLayout = vi.fn();
    const setWidgetSize = vi.fn();
    render(<GridWidgetList catalogue={catalogue} edit layout={["timeline"]} setLayout={setLayout} setWidgetSize={setWidgetSize} widgetRenderer={vi.fn()} widgetSizes={{}} onDragEnd={vi.fn()} onDragOver={vi.fn()} onDragStart={vi.fn()} onDrop={vi.fn()} dragOver={null} dragging={null} />);
    fireEvent.click(screen.getByText("Delete widget"));
    expect(setLayout).toHaveBeenCalled();
    fireEvent.click(screen.getByText(/Resize/));
    expect(setWidgetSize).toHaveBeenCalled();
  });
});
