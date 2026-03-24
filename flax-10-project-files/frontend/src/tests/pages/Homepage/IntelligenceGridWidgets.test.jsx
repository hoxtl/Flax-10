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

  it("renders hero content with widget sizing and resize controls", () => {
    const widgetRenderer = vi.fn((id, size) => <div>{`${id}-${size.col}x${size.row}`}</div>);
    const setWidgetSize = vi.fn();
    const { rerender } = render(
      <HeroWidget
        catalogue={catalogue}
        edit
        layout={["hero", "timeline"]}
        setWidgetSize={setWidgetSize}
        widgetRenderer={widgetRenderer}
        widgetSizes={{ hero: { row: 3 } }}
      />,
    );

    expect(widgetRenderer).toHaveBeenCalledWith("hero", { col: 2, row: 3 });
    expect(screen.getByText("hero-2x3")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Resize hero"));
    expect(setWidgetSize).toHaveBeenCalledWith("hero", { col: 2, row: 3 });

    rerender(
      <HeroWidget
        catalogue={catalogue}
        edit={false}
        layout={["timeline"]}
        setWidgetSize={setWidgetSize}
        widgetRenderer={widgetRenderer}
        widgetSizes={{}}
      />,
    );
    expect(screen.queryByText("hero-2x3")).not.toBeInTheDocument();
  });

  it("renders grid widgets, skips hero and null content, and supports delete/add flows", () => {
    const setLayout = vi.fn();
    const setWidgetSize = vi.fn();
    const widgetRenderer = vi.fn((id) => (id === "photo" ? null : <div>{id}</div>));

    render(
      <>
        <GridWidgetList
          catalogue={catalogue}
          dragOver={null}
          dragging={null}
          edit
          layout={["hero", "timeline", "photo"]}
          onDragEnd={vi.fn()}
          onDragOver={vi.fn()}
          onDragStart={vi.fn()}
          onDrop={vi.fn()}
          setLayout={setLayout}
          setWidgetSize={setWidgetSize}
          widgetRenderer={widgetRenderer}
          widgetSizes={{ timeline: { col: 2, row: 2 } }}
        />
        <AddWidgetSlot edit onClick={setWidgetSize} />
      </>,
    );

    expect(screen.getByText("timeline")).toBeInTheDocument();
    expect(screen.queryByText("photo")).not.toBeInTheDocument();
    expect(widgetRenderer).toHaveBeenCalledWith("timeline", { col: 2, row: 2 });
    expect(screen.getByText("Add Widget")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Delete widget"));
    const updater = setLayout.mock.calls[0][0];
    expect(updater(["hero", "timeline", "photo"])).toEqual(["hero", "photo"]);

    fireEvent.click(screen.getByText("Resize timeline"));
    expect(setWidgetSize).toHaveBeenCalledWith("timeline", { col: 2, row: 2 });
  });
});
