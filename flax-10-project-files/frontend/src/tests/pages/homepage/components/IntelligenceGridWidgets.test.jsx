/*
 * Tests for homepage intelligence grid widgets.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeroWidget, GridWidgetList, AddWidgetSlot } from "@/pages/homepage/components/IntelligenceGridWidgets";
import { catalogueWithCustomWidget } from "./testSupport/intelligenceGridFixtures";

const styles = createStyles();

vi.mock("@/components/ui/components/BentoGrid", () => ({
  BentoCard: ({ children }) => <div data-testid="bento-card">{children}</div>,
}));
vi.mock("@/pages/homepage/components/IntelligenceGridControls", () => ({
  DeleteButton: ({ onClick }) => <button onClick={onClick} data-testid="delete-btn">Del</button>,
  GridGrip: () => <div data-testid="grip" />,
  ResizeControls: () => <div data-testid="resize-controls" />,
}));
vi.mock("@/pages/homepage/components/IntelligenceGrid.module.css", () => ({ default: createStyles() }));

function createStyles() {
  return {
    widgetWrapper: "w",
    widgetClip: "clip",
    widgetContent: "content",
    editMode: "edit",
    dragging: "dragging",
    dragOver: "dragover",
    addWidgetSlot: "slot",
    addIcon: "icon",
    addLabel: "label",
    "widget-hero": "widget-hero",
    "widget-w1": "widget-w1",
  };
}

const catalogue = [
  { id: "hero", col: 2, row: 2, minRow: 1, maxRow: 4 },
  { id: "w1", col: 1, row: 1, minRow: 1, maxRow: 3, minCol: 1, maxCol: 2 },
];
const widgetRenderer = (id) => <span data-testid={`w-${id}`}>{id}</span>;
const noop = vi.fn();

describe("AddWidgetSlot", () => {
  it("renders null when edit=false", () => {
    const { container } = render(<AddWidgetSlot edit={false} onClick={noop} styles={styles} />);
    expect(container.firstChild).toBeNull();
  });

  it("calls onClick when clicked and edit=true", () => {
    const onClick = vi.fn();
    render(<AddWidgetSlot edit onClick={onClick} styles={styles} />);
    fireEvent.click(screen.getByText("＋"));
    expect(onClick).toHaveBeenCalled();
  });
});

describe("HeroWidget", () => {
  it("renders null when hero not in layout", () => {
    const { container } = render(<HeroWidget layout={["w1"]} catalogue={catalogue} widgetRenderer={widgetRenderer} edit={false} widgetSizes={{}} setWidgetSize={noop} styles={styles} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders hero widget in view mode", () => {
    render(<HeroWidget layout={["hero"]} catalogue={catalogue} widgetRenderer={widgetRenderer} edit={false} widgetSizes={{}} setWidgetSize={noop} styles={styles} />);
    expect(screen.getByTestId("w-hero")).toBeTruthy();
  });

  it("renders resize controls in edit mode", () => {
    render(<HeroWidget layout={["hero"]} catalogue={catalogue} widgetRenderer={widgetRenderer} edit widgetSizes={{}} setWidgetSize={noop} styles={styles} />);
    expect(screen.getByTestId("resize-controls")).toBeTruthy();
  });

  it("prefers widgetSizes hero row over catalogue metadata", () => {
    const { container } = render(
      <HeroWidget layout={["hero"]} catalogue={catalogue} widgetRenderer={widgetRenderer} edit={false} widgetSizes={{ hero: { row: 4 } }} setWidgetSize={noop} styles={styles} />,
    );
    expect(container.firstElementChild.style.gridRow).toBe("span 4");
  });

  it("uses catalogue hero row when widgetSizes has no hero entry", () => {
    const cat = [{ ...catalogue[0], row: 5 }, catalogue[1]];
    const { container } = render(
      <HeroWidget layout={["hero"]} catalogue={cat} widgetRenderer={widgetRenderer} edit={false} widgetSizes={{}} setWidgetSize={noop} styles={styles} />,
    );
    expect(container.firstElementChild.style.gridRow).toBe("span 5");
  });

  it("defaults hero span to two when row is missing everywhere", () => {
    const cat = [{ id: "hero", col: 2 }, catalogue[1]];
    const { container } = render(
      <HeroWidget layout={["hero"]} catalogue={cat} widgetRenderer={widgetRenderer} edit={false} widgetSizes={{}} setWidgetSize={noop} styles={styles} />,
    );
    expect(container.firstElementChild.style.gridRow).toBe("span 2");
  });
});

describe("GridWidgetList", () => {
  const dragProps = { dragging: null, dragOver: null, onDragStart: noop, onDragEnd: noop, onDragOver: noop, onDrop: noop };

  it("skips hero, renders w1", () => {
    render(<GridWidgetList layout={["hero", "w1"]} catalogue={catalogue} widgetRenderer={widgetRenderer} edit={false} widgetSizes={{}} setLayout={noop} setWidgetSize={noop} styles={styles} {...dragProps} />);
    expect(screen.getByTestId("w-w1")).toBeTruthy();
    expect(screen.queryByTestId("w-hero")).toBeNull();
  });

  it("skips widgets not in catalogue (returns null)", () => {
    const { container } = render(<GridWidgetList layout={["unknown"]} catalogue={catalogue} widgetRenderer={() => null} edit={false} widgetSizes={{}} setLayout={noop} setWidgetSize={noop} styles={styles} {...dragProps} />);
    expect(container.children).toHaveLength(0);
  });

  it("renders delete button and grip in edit mode", () => {
    render(<GridWidgetList layout={["w1"]} catalogue={catalogue} widgetRenderer={widgetRenderer} edit widgetSizes={{}} setLayout={noop} setWidgetSize={noop} styles={styles} {...dragProps} />);
    expect(screen.getByTestId("delete-btn")).toBeTruthy();
    expect(screen.getByTestId("grip")).toBeTruthy();
  });

  it("calls setLayout when delete is clicked", () => {
    const setLayout = vi.fn();
    render(<GridWidgetList layout={["w1"]} catalogue={catalogue} widgetRenderer={widgetRenderer} edit widgetSizes={{}} setLayout={setLayout} setWidgetSize={noop} styles={styles} {...dragProps} />);
    fireEvent.click(screen.getByTestId("delete-btn"));
    const updater = setLayout.mock.calls[0][0];
    expect(updater(["w1", "w2"])).toEqual(["w2"]); // filters out "w1"
  });

  it("omits the widget shell when the renderer returns null", () => {
    const { container } = render(
      <GridWidgetList
        layout={["w1"]}
        catalogue={catalogue}
        dragOver="w1"
        dragging="w1"
        edit={false}
        setLayout={noop}
        setWidgetSize={noop}
        styles={styles}
        widgetRenderer={() => null}
        widgetSizes={{}}
        {...dragProps}
      />,
    );
    expect(container.querySelector("[data-widget-id]")).toBeNull();
  });

  it("attaches drag handlers while editing layout", () => {
    const onDragStart = vi.fn();
    render(
      <GridWidgetList
        layout={["w1"]}
        catalogue={catalogue}
        edit
        setLayout={noop}
        setWidgetSize={noop}
        styles={styles}
        widgetRenderer={widgetRenderer}
        widgetSizes={{}}
        {...dragProps}
        onDragStart={onDragStart}
      />,
    );
    const target = screen.getByTestId("w-w1").closest("[data-widget-id]");
    fireEvent.dragStart(target, { dataTransfer: { effectAllowed: "move" } });
    expect(onDragStart).toHaveBeenCalled();
  });

  function renderEditableGrid(overrides = {}) {
    return render(<GridWidgetList layout={["w1"]} catalogue={catalogue} dragOver={null} dragging={null} edit onDragEnd={noop} onDragOver={noop} onDragStart={noop} onDrop={noop} setLayout={noop} setWidgetSize={noop} styles={styles} widgetRenderer={widgetRenderer} widgetSizes={{}} {...overrides} />);
  }

  it("forwards drag over to the shell while editing", () => {
    const onDragOver = vi.fn();
    renderEditableGrid({ onDragOver });
    const shell = screen.getByTestId("w-w1").closest("[data-widget-id]");
    fireEvent.dragOver(shell);
    expect(onDragOver).toHaveBeenCalled();
  });

  it("forwards drag end to the shell while editing", () => {
    const onDragEnd = vi.fn();
    renderEditableGrid({ onDragEnd });
    const shell = screen.getByTestId("w-w1").closest("[data-widget-id]");
    fireEvent.dragEnd(shell);
    expect(onDragEnd).toHaveBeenCalled();
  });

  it("forwards drop events while editing", () => {
    const onDrop = vi.fn();
    render(
      <GridWidgetList
        layout={["w1"]}
        catalogue={catalogue}
        dragOver={null}
        dragging={null}
        edit
        onDragEnd={noop}
        onDragOver={noop}
        onDragStart={noop}
        onDrop={onDrop}
        setLayout={noop}
        setWidgetSize={noop}
        styles={styles}
        widgetRenderer={widgetRenderer}
        widgetSizes={{}}
      />,
    );
    const shell = screen.getByTestId("w-w1").closest("[data-widget-id]");
    fireEvent.drop(shell);
    expect(onDrop).toHaveBeenCalled();
  });

  it("renders widgets whose stylesheet omits a dedicated widget-* token", () => {
    render(
      <GridWidgetList
        catalogue={catalogueWithCustomWidget}
        dragOver={null}
        dragging={null}
        edit={false}
        layout={["custom-tool"]}
        onDragEnd={noop}
        onDragOver={noop}
        onDragStart={noop}
        onDrop={noop}
        setLayout={noop}
        setWidgetSize={noop}
        styles={styles}
        widgetRenderer={widgetRenderer}
        widgetSizes={{}}
      />,
    );
    const shell = screen.getByTestId("w-custom-tool").closest("[data-widget-id]");
    expect(shell.getAttribute("data-widget-id")).toBe("custom-tool");
  });

  it("applies widget-specific classes when the stylesheet defines them", () => {
    const customStyles = { ...styles, "widget-w1": "widget-w1" };
    render(
      <GridWidgetList
        layout={["w1"]}
        catalogue={catalogue}
        edit={false}
        setLayout={noop}
        setWidgetSize={noop}
        styles={customStyles}
        widgetRenderer={widgetRenderer}
        widgetSizes={{}}
        {...dragProps}
      />,
    );
    const shell = screen.getByTestId("w-w1").closest("[data-widget-id]");
    expect(shell?.className).toContain("widget-w1");
  });

  it("adds the dragging class when the widget matches the drag origin", () => {
    render(
      <GridWidgetList
        {...dragProps}
        layout={["w1"]}
        catalogue={catalogue}
        dragging="w1"
        edit
        setLayout={noop}
        setWidgetSize={noop}
        styles={styles}
        widgetRenderer={widgetRenderer}
        widgetSizes={{}}
      />,
    );
    const shell = screen.getByTestId("w-w1").closest("[data-widget-id]");
    expect(shell?.className).toContain("dragging");
  });

  it("adds the drag-over class when the widget matches the drop target", () => {
    render(
      <GridWidgetList
        {...dragProps}
        layout={["w1"]}
        catalogue={catalogue}
        dragOver="w1"
        edit
        setLayout={noop}
        setWidgetSize={noop}
        styles={styles}
        widgetRenderer={widgetRenderer}
        widgetSizes={{}}
      />,
    );
    const shell = screen.getByTestId("w-w1").closest("[data-widget-id]");
    expect(shell?.className).toContain("dragover");
  });
});
