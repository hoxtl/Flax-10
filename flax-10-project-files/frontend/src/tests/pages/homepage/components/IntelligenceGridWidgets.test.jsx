import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  AddWidgetSlot,
  GridWidgetList,
  HeroWidget,
} from "../../../../pages/homepage/components/IntelligenceGridWidgets";

vi.mock("../../../../components/ui/components/BentoGrid", () => ({
  BentoCard: ({ children }) => <div data-testid="bento-card">{children}</div>,
}));

vi.mock("../../../../pages/homepage/components/IntelligenceGridControls", () => ({
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

  it("returns null when the hero widget is not present", () => {
    const { container } = render(<HeroWidget catalogue={catalogue} edit layout={["timeline"]} widgetRenderer={vi.fn()} widgetSizes={{}} setWidgetSize={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

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

  it("renders hero without edit controls when not editing", () => {
    const widgetRenderer = vi.fn(() => <div>hero body</div>);
    render(<HeroWidget catalogue={catalogue} layout={["hero"]} widgetRenderer={widgetRenderer} widgetSizes={{}} setWidgetSize={vi.fn()} />);
    expect(screen.getByText("hero body")).toBeInTheDocument();
    expect(screen.queryByText("Resize hero")).not.toBeInTheDocument();
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

  it("calls drag handlers", () => {
    const onDragStart = vi.fn(), onDragOver = vi.fn(), onDragEnd = vi.fn(), onDrop = vi.fn();
    render(<GridWidgetList catalogue={catalogue} edit layout={["timeline"]} setLayout={vi.fn()} widgetRenderer={id => <div>{id}</div>} widgetSizes={{}} setWidgetSize={vi.fn()} onDragEnd={onDragEnd} onDragOver={onDragOver} onDragStart={onDragStart} onDrop={onDrop} dragOver={null} dragging={null} />);
    const widget = screen.getByText("timeline").closest("[data-widget-id='timeline']");
    fireEvent.dragStart(widget, { dataTransfer: { setData: vi.fn() } });
    fireEvent.dragOver(widget, { dataTransfer: { setData: vi.fn() } });
    fireEvent.drop(widget, { dataTransfer: { getData: vi.fn(() => "timeline") } });
    fireEvent.dragEnd(widget);
    expect(onDragStart).toHaveBeenCalled();
    expect(onDragOver).toHaveBeenCalled();
    expect(onDrop).toHaveBeenCalled();
    expect(onDragEnd).toHaveBeenCalled();
  });

  it("applies drag state classes", () => {
    render(<GridWidgetList catalogue={catalogue} edit layout={["timeline"]} setLayout={vi.fn()} widgetRenderer={id => <div>{id}</div>} widgetSizes={{}} setWidgetSize={vi.fn()} onDragEnd={vi.fn()} onDragOver={vi.fn()} onDragStart={vi.fn()} onDrop={vi.fn()} dragOver="timeline" dragging="timeline" />);
    const widget = screen.getByText("timeline").closest("[data-widget-id='timeline']");
    expect(widget.className).toContain("dragging");
    expect(widget.className).toContain("dragOver");
  });

  it("renders the add widget slot only in edit mode", () => {
    const onClick = vi.fn();
    const { rerender } = render(<AddWidgetSlot edit={false} onClick={onClick} />);
    expect(screen.queryByText("Add Widget")).not.toBeInTheDocument();

    rerender(<AddWidgetSlot edit onClick={onClick} />);
    fireEvent.click(screen.getByText("Add Widget"));
    expect(onClick).toHaveBeenCalled();
  });
});
