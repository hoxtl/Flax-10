import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import IntelligenceGrid from "../../../../pages/homepage/components/IntelligenceGrid";

// Mocks for sub-components to isolate IntelligenceGrid logic
vi.mock("../../../../pages/homepage/components/IntelligenceGridControls", () => ({
  GridActions: ({ onToggleEdit, edit }) => (
    <div data-testid="grid-actions">
      <button onClick={onToggleEdit}>Toggle Edit</button>
      {edit && <span>Editing</span>}
    </div>
  ),
}));

vi.mock("../../../../pages/homepage/components/IntelligenceGridSheets", () => ({
  AddSheet: ({ visible, onAdd, onClose }) => (
    visible ? (
      <div data-testid="add-sheet">
        <button onClick={() => onAdd("new-widget")}>Add Widget</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock("../../../../pages/homepage/components/IntelligenceGridWidgets", () => ({
  HeroWidget: () => <div data-testid="hero-widget" />,
  GridWidgetList: ({ onDragStart, onDragEnd, onDragOver, onDrop, layout }) => (
    <div data-testid="widget-list">
      {(layout || []).map((id) => (
        <div
          key={id}
          data-testid={`draggable-${id}`}
          draggable
          onDragStart={(e) => onDragStart(e, id)}
          onDragEnd={onDragEnd}
          onDragOver={(e) => onDragOver(e, id)}
          onDrop={(e) => onDrop(e, id)}
        >
          Widget {id}
        </div>
      ))}
    </div>
  ),
  AddWidgetSlot: ({ edit, onClick }) => (
    edit ? <button data-testid="add-slot" onClick={onClick}>Add Slot</button> : null
  ),
}));

function TestHarness() {
  const [edit, setEdit] = React.useState(true);
  const [layout, setLayout] = React.useState(["1", "2"]);
  const [showAdd, setShowAdd] = React.useState(false);
  const props = {
    edit,
    setEdit,
    layout,
    setLayout,
    showAdd,
    setShowAdd,
    catalogue: [{ id: "1" }, { id: "2" }, { id: "new-widget" }],
    widgetRenderer: (id) => <div data-testid={`widget-${id}`}>{id}</div>,
    styles: { bentoGrid: "bento-grid", gridContainer: "grid-container" },
    onRandomize: vi.fn(),
    onReset: vi.fn(),
  };
  return <IntelligenceGrid {...props} />;
}

describe("IntelligenceGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles complex drag and drop reordering via harness", async () => {
    render(<TestHarness />);

    const dragSource = screen.getByTestId("draggable-1");
    fireEvent.dragStart(dragSource, { dataTransfer: { effectAllowed: "" } });

    const dragTarget = screen.getByTestId("draggable-2");
    fireEvent.dragOver(dragTarget);

    fireEvent.drop(dragTarget);

    await waitFor(() => {
      expect(screen.getAllByTestId(/draggable-/).map(el => el.textContent.trim())).toEqual(["Widget 2", "Widget 1"]);
    });

    fireEvent.dragEnd(dragSource);
  });

  it("handles edit mode toggling and sheet visibility via harness", () => {
    render(<TestHarness />);
    expect(screen.getAllByText("Editing")[0]).toBeTruthy();
    fireEvent.click(screen.getAllByText("Toggle Edit")[0]);
    expect(screen.queryByText("Editing")).toBeNull();
    fireEvent.click(screen.getAllByText("Toggle Edit")[0]);
    expect(screen.getAllByText("Editing")[0]).toBeTruthy();
    fireEvent.click(screen.getByTestId("add-slot"));
    expect(screen.getByTestId("add-sheet")).toBeTruthy();
  });

  it("handles adding widgets via harness", () => {
    render(<TestHarness />);
    fireEvent.click(screen.getByTestId("add-slot"));
    fireEvent.click(screen.getByText("Add Widget"));
    expect(screen.getByTestId("draggable-new-widget")).toBeTruthy();
  });

  it("handles MobileActionsBar toggle (second GridActions instance)", () => {
    render(<TestHarness />);
    const toggleButtons = screen.getAllByText("Toggle Edit");
    // Second button belongs to MobileActionsBar (line 18)
    fireEvent.click(toggleButtons[1]);
    expect(screen.queryByText("Editing")).toBeNull();
  });

  it("guards dragOver on same element and drop with no drag start", () => {
    render(<TestHarness />);
    const draggable1 = screen.getByTestId("draggable-1");

    fireEvent.dragOver(draggable1);

    const setLayout = vi.fn();
    fireEvent.drop(draggable1);
    expect(screen.getAllByTestId(/draggable-/).map(el => el.textContent.trim())).toEqual(["Widget 1", "Widget 2"]);
  });

  it("guards dragOver on same dragging element (id === dragging)", async () => {
    render(<TestHarness />);
    const draggable1 = screen.getByTestId("draggable-1");
    fireEvent.dragStart(draggable1, { dataTransfer: { effectAllowed: "" } });
    fireEvent.dragOver(draggable1);
    fireEvent.drop(draggable1);
    await waitFor(() => {
      expect(screen.getAllByTestId(/draggable-/).map(el => el.textContent.trim().replace("Delete", ""))).toEqual(["Widget 1", "Widget 2"]);
    });
  });

  it("prevents adding duplicate widgets via addWidget", () => {
    render(<TestHarness />);
    fireEvent.click(screen.getByTestId("add-slot"));
    fireEvent.click(screen.getByText("Add Widget"));
    expect(screen.getByTestId("draggable-new-widget")).toBeTruthy();
    fireEvent.click(screen.getByTestId("add-slot"));
    fireEvent.click(screen.getByText("Add Widget"));
    expect(screen.getAllByTestId("draggable-new-widget")).toHaveLength(1);
  });

  it("closes the add sheet whenever edit mode is turned off", () => {
    const setShowAdd = vi.fn();
    function Harness() {
      const [edit, setEdit] = React.useState(true);
      return (
        <IntelligenceGrid
          catalogue={[{ id: "1" }, { id: "2" }]}
          edit={edit}
          layout={["1"]}
          onRandomize={vi.fn()}
          onReset={vi.fn()}
          setEdit={setEdit}
          setLayout={vi.fn()}
          setShowAdd={setShowAdd}
          showAdd
          widgetRenderer={(id) => <div data-testid={`w-${id}`}>{id}</div>}
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getAllByText("Toggle Edit")[0]);
    expect(setShowAdd).toHaveBeenCalledWith(false);
  });

  it("closes the add sheet when its dismiss control fires onClose", () => {
    const spy = vi.fn();
    function Harness() {
      const [open, setOpen] = React.useState(true);
      const close = (v) => {
        spy(v);
        setOpen(v);
      };
      return (
        <IntelligenceGrid
          catalogue={[{ id: "1" }]}
          edit
          layout={["1"]}
          onRandomize={vi.fn()}
          onReset={vi.fn()}
          setEdit={vi.fn()}
          setLayout={vi.fn()}
          setShowAdd={close}
          showAdd={open}
          widgetRenderer={(id) => <div data-testid={`w-${id}`}>{id}</div>}
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByText("Close"));
    expect(spy).toHaveBeenCalledWith(false);
  });
});
