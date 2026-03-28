<<<<<<< HEAD
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
=======
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const gridWidgetListPropsSpy = vi.fn();

vi.mock("../../../../pages/homepage/components/IntelligenceGridControls", () => ({
  GridActions: ({ edit, onRandomize, onReset, onToggleEdit }) => (
    <div>
      <button type="button" onClick={onToggleEdit}>
        toggle-edit
      </button>
      {edit ? (
        <>
          <button type="button" onClick={onRandomize}>
            randomize
          </button>
          <button type="button" onClick={onReset}>
            reset
          </button>
        </>
      ) : null}
>>>>>>> main
    </div>
  ),
}));

vi.mock("../../../../pages/homepage/components/IntelligenceGridSheets", () => ({
<<<<<<< HEAD
  AddSheet: ({ visible, onAdd, onClose }) => (
    visible ? (
      <div data-testid="add-sheet">
        <button onClick={() => onAdd("new-widget")}>Add Widget</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
=======
  AddSheet: ({ visible, active, onAdd, onClose }) => (
    <div>
      <div>{visible ? `sheet:${active.join(",")}` : "sheet-hidden"}</div>
      <button type="button" onClick={() => onAdd("newWidget")}>
        add-new
      </button>
      <button type="button" onClick={() => onAdd("hero")}>
        add-duplicate
      </button>
      <button type="button" onClick={onClose}>
        close-sheet
      </button>
    </div>
>>>>>>> main
  ),
}));

vi.mock("../../../../pages/homepage/components/IntelligenceGridWidgets", () => ({
<<<<<<< HEAD
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
=======
  AddWidgetSlot: ({ edit, onClick }) => (
    <button type="button" onClick={onClick}>
      {edit ? "open-add-sheet-edit" : "open-add-sheet"}
    </button>
  ),
  GridWidgetList: (props) => {
    gridWidgetListPropsSpy(props);
    return (
      <div>
        <button
          type="button"
          onClick={() =>
            props.onDragStart({ dataTransfer: { effectAllowed: "", setData: vi.fn() } }, "todayTasks")
          }
        >
          drag-start
        </button>
        <button type="button" onClick={() => props.onDragOver({ preventDefault: vi.fn() }, "hero")}>
          drag-over
        </button>
        <button type="button" onClick={() => props.onDrop({ preventDefault: vi.fn() }, "hero")}>
          drop-reorder
        </button>
        <button
          type="button"
          onClick={() =>
            props.onDragStart({ dataTransfer: { effectAllowed: "", setData: vi.fn() } }, "todayTasks")
          }
        >
          drag-start-same
        </button>
        <button type="button" onClick={() => props.onDrop({ preventDefault: vi.fn() }, "todayTasks")}>
          drop-same
        </button>
        <button type="button" onClick={() => props.onDragEnd()}>
          drag-end
        </button>
      </div>
    );
  },
  HeroWidget: () => <div>hero-widget</div>,
}));

import IntelligenceGrid from "../../../../pages/homepage/components/IntelligenceGrid";

function createProps(overrides = {}) {
  return {
    catalogue: ["hero", "todayTasks", "deadlines"],
    edit: false,
    layout: ["hero", "todayTasks"],
    onRandomize: vi.fn(),
    onReset: vi.fn(),
    setEdit: vi.fn(),
    setLayout: vi.fn(),
    setShowAdd: vi.fn(),
    showAdd: false,
    ...overrides,
  };
>>>>>>> main
}

describe("IntelligenceGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

<<<<<<< HEAD
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
=======
  it("toggles edit mode and handles add sheet visibility", () => {
    const props = createProps();
    render(<IntelligenceGrid {...props} />);
    fireEvent.click(screen.getAllByText("toggle-edit")[0]);
    expect(props.setEdit).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByText("open-add-sheet"));
    expect(props.setShowAdd).toHaveBeenCalledWith(true);
  });

  it("handles adding new and duplicate widgets without re-adding existing ones", () => {
    const props = createProps({ edit: true, showAdd: true });
    render(<IntelligenceGrid {...props} />);
    fireEvent.click(screen.getByText("add-new"));
    const addNewUpdater = props.setLayout.mock.calls[0][0];
    expect(addNewUpdater(["hero"])).toEqual(["hero", "newWidget"]);
    fireEvent.click(screen.getByText("add-duplicate"));
    const duplicateUpdater = props.setLayout.mock.calls[1][0];
    expect(duplicateUpdater(["hero"])).toEqual(["hero"]);
  });

  it("closes the add sheet through its close handler", () => {
    const props = createProps({ edit: true, showAdd: true });
    render(<IntelligenceGrid {...props} />);
    fireEvent.click(screen.getByText("close-sheet"));
    expect(props.setShowAdd).toHaveBeenCalledWith(false);
  });

  it("reorders widgets through the drag-and-drop callbacks and ignores same-target drops", () => {
    const props = createProps({ edit: true });
    render(<IntelligenceGrid {...props} />);

    fireEvent.click(screen.getByText("drag-start"));
    fireEvent.click(screen.getByText("drag-over"));
    fireEvent.click(screen.getByText("drop-reorder"));

    const reorderUpdater = props.setLayout.mock.calls[0][0];
    expect(reorderUpdater(["hero", "todayTasks"])).toEqual(["todayTasks", "hero"]);

    fireEvent.click(screen.getByText("drag-start-same"));
    fireEvent.click(screen.getByText("drop-same"));
    expect(props.setLayout).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("drag-end"));
    expect(gridWidgetListPropsSpy).toHaveBeenCalled();
>>>>>>> main
  });
});
