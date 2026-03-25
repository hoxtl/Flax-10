import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const gridWidgetListPropsSpy = vi.fn();

vi.mock("../../../pages/Homepage/components/IntelligenceGridControls", () => ({
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
    </div>
  ),
}));

vi.mock("../../../pages/Homepage/components/IntelligenceGridSheets", () => ({
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
  ),
}));

vi.mock("../../../pages/Homepage/components/IntelligenceGridWidgets", () => ({
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

import IntelligenceGrid from "../../../pages/Homepage/components/IntelligenceGrid";

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
}

describe("IntelligenceGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggles edit mode, opens the add sheet, and adds widgets without duplicating existing ones", () => {
    const props = createProps();
    const { rerender } = render(<IntelligenceGrid {...props} />);

    fireEvent.click(screen.getAllByText("toggle-edit")[0]);
    expect(props.setEdit).toHaveBeenCalledWith(true);
    expect(props.setShowAdd).not.toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByText("open-add-sheet"));
    expect(props.setShowAdd).toHaveBeenCalledWith(true);

    const editingProps = createProps({ edit: true, showAdd: true });
    rerender(<IntelligenceGrid {...editingProps} />);

    fireEvent.click(screen.getAllByText("toggle-edit")[0]);
    expect(editingProps.setEdit).toHaveBeenCalledWith(false);
    expect(editingProps.setShowAdd).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByText("add-new"));
    const addNewUpdater = editingProps.setLayout.mock.calls[0][0];
    expect(addNewUpdater(["hero", "todayTasks"])).toEqual(["hero", "todayTasks", "newWidget"]);

    fireEvent.click(screen.getByText("add-duplicate"));
    const duplicateUpdater = editingProps.setLayout.mock.calls[1][0];
    expect(duplicateUpdater(["hero", "todayTasks"])).toEqual(["hero", "todayTasks"]);

    fireEvent.click(screen.getByText("close-sheet"));
    expect(editingProps.setShowAdd).toHaveBeenCalledWith(false);
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
  });
});
