import React from "react";
<<<<<<< HEAD
import { describe, it, expect, vi, beforeEach } from "vitest";
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
const widgetRenderer = (id, size) => <span data-testid={`w-${id}`}>{id}</span>;
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

  it("forwards drag end and drag over to the shell while editing", () => {
    const onDragEnd = vi.fn();
    const onDragOver = vi.fn();
    render(
      <GridWidgetList
        layout={["w1"]}
        catalogue={catalogue}
        dragOver={null}
        dragging={null}
        edit
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragStart={noop}
        onDrop={noop}
        setLayout={noop}
        setWidgetSize={noop}
        styles={styles}
        widgetRenderer={widgetRenderer}
        widgetSizes={{}}
      />,
    );
    const shell = screen.getByTestId("w-w1").closest("[data-widget-id]");
    fireEvent.dragOver(shell);
    fireEvent.dragEnd(shell);
    expect(onDragOver).toHaveBeenCalled();
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
=======
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
>>>>>>> main
  });
});
