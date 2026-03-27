import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const gridWidgetListPropsSpy = vi.fn();

vi.mock("../../../pages/homepage/components/IntelligenceGridControls", () => ({
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

vi.mock("../../../pages/homepage/components/IntelligenceGridSheets", () => ({
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

vi.mock("../../../pages/homepage/components/IntelligenceGridWidgets", () => ({
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

import IntelligenceGrid from "../../../pages/homepage/components/IntelligenceGrid";

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
  });
});
