import React from "react";
<<<<<<< HEAD
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
=======
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

>>>>>>> main
import {
  DeleteButton,
  GridActions,
  GridGrip,
  ResizeControls,
<<<<<<< HEAD
} from "@/pages/homepage/components/IntelligenceGridControls";

vi.mock("framer-motion", () => ({
  motion: { button: ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button> },
}));
vi.mock("lucide-react", () => ({
  Check: () => <span>Check</span>,
  Minus: () => <span>Minus</span>,
  Pencil: () => <span>Pencil</span>,
  Plus: () => <span>Plus</span>,
  RotateCcw: () => <span>RotateCcw</span>,
  Shuffle: () => <span>Shuffle</span>,
}));

describe("DeleteButton", () => {
  it("calls onClick and stops propagation", () => {
    const onClick = vi.fn();
    render(<DeleteButton onClick={onClick} />);
    const btn = screen.getByText("−");
    const stopPropagation = vi.fn();
    fireEvent.click(btn, { stopPropagation });
    expect(onClick).toHaveBeenCalled();
  });
});

describe("GridGrip", () => {
  it("renders 6 grip dots", () => {
    const { container } = render(<GridGrip />);
    const root = container.firstElementChild;
    expect(root?.children.length).toBe(6);
  });
});

describe("GridActions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders edit button and calls onToggleEdit", () => {
    const onToggleEdit = vi.fn();
    render(<GridActions edit={false} onToggleEdit={onToggleEdit} />);
    expect(screen.getByText("Pencil")).toBeTruthy();
    expect(screen.getByText("Edit your widgets")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /edit dashboard layout/i }));
    expect(onToggleEdit).toHaveBeenCalled();
  });

  it("shows done state with shuffle and reset when edit=true", () => {
    const onRandomize = vi.fn();
    const onReset = vi.fn();
    render(<GridActions edit={true} onToggleEdit={vi.fn()} onRandomize={onRandomize} onReset={onReset} />);
    expect(screen.getByText("Check")).toBeTruthy();
    expect(screen.queryByText("Edit your widgets")).toBeNull();
    fireEvent.click(screen.getByTitle("Shuffle Layout"));
    expect(onRandomize).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle("Reset Layout"));
    expect(onReset).toHaveBeenCalled();
  });
});

describe("ResizeControls", () => {
  const base = { id: "w1", col: 1, row: 1, maxCol: 2, maxRow: 4, minRow: 1, onResize: vi.fn() };

  it("renders null when no resize options exist", () => {
    const { container } = render(<ResizeControls {...base} id="hero" col={2} row={4} maxRow={4} minRow={4} />);
    expect(container.firstChild).toBeNull();
  });

  it("calls onResize when grow width is clicked", () => {
    const onResize = vi.fn();
    render(<ResizeControls {...base} onResize={onResize} />);
    fireEvent.click(screen.getByTitle("Grow W"));
    expect(onResize).toHaveBeenCalledWith("w1", { col: 2, row: 1 });
  });

  it("calls onResize when shrink width is clicked", () => {
    const onResize = vi.fn();
    render(<ResizeControls {...base} col={2} onResize={onResize} />);
    fireEvent.click(screen.getByTitle("Shrink W"));
    expect(onResize).toHaveBeenCalledWith("w1", { col: 1, row: 1 });
  });

  it("calls onResize for height changes", () => {
    const onResize = vi.fn();
    render(<ResizeControls {...base} row={2} onResize={onResize} />);
    fireEvent.click(screen.getByTitle("Grow H"));
    expect(onResize).toHaveBeenCalledWith("w1", { col: 1, row: 3 });
    fireEvent.click(screen.getByTitle("Shrink H"));
    expect(onResize).toHaveBeenCalledWith("w1", { col: 1, row: 1 });
  });

  it("disables vertical shrink when the row is already at minRow", () => {
    render(<ResizeControls {...base} col={2} row={1} minRow={1} maxRow={4} onResize={vi.fn()} />);
    expect(screen.getByTitle("Shrink W")).not.toBeDisabled();
    expect(screen.getByTitle("Minimum reached")).toBeDisabled();
  });

  it("disables vertical grow when the row is already at maxRow", () => {
    render(<ResizeControls {...base} col={1} row={4} maxCol={2} maxRow={4} minRow={1} onResize={vi.fn()} />);
    expect(screen.getByTitle("Grow H")).toBeDisabled();
  });

  it("defaults min and max row to one and four when omitted", () => {
    render(<ResizeControls id="hero" col={1} row={2} maxCol={2} onResize={vi.fn()} />);
    expect(screen.getByTitle("Shrink H")).not.toBeDisabled();
    expect(screen.getByTitle("Grow H")).not.toBeDisabled();
  });

  it("disables width growth once the implicit max column is reached", () => {
    render(<ResizeControls id="w1" col={2} row={1} onResize={vi.fn()} />);
    expect(screen.getByTitle("Grow W")).toBeDisabled();
  });

  it("renders controls when only the min-row fallback enables resizing", () => {
    render(<ResizeControls id="hero" col={2} row={2} maxCol={2} maxRow={2} onResize={vi.fn()} />);
    expect(screen.getByText("2H")).toBeTruthy();
  });

  it("stopPropagation on the controls container click", () => {
    const parentClick = vi.fn();
    const { container } = render(<div onClick={parentClick}><ResizeControls {...base} /></div>);
    fireEvent.click(container.firstChild.firstChild);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it("disables hero width controls and shows minimum title when width cannot shrink", () => {
    render(<ResizeControls id="hero" col={2} row={2} maxCol={2} minCol={1} maxRow={4} minRow={1} onResize={vi.fn()} />);
    const shrinkBtn = screen.getByTitle("Minimum reached");
    expect(shrinkBtn).toBeDisabled();
    expect(screen.getByTitle("Grow W")).toBeDisabled();
  });

  it("shows hero controls when only vertical growth remains", () => {
    render(<ResizeControls id="hero" col={2} row={1} maxCol={2} maxRow={3} minRow={1} onResize={vi.fn()} />);
    expect(screen.getByTitle("Grow H")).not.toBeDisabled();
    const heightGroup = screen.getByText("1H").closest("div");
    expect(heightGroup).not.toBeNull();
    const shrinkH = heightGroup.querySelector('button[title="Minimum reached"]');
    expect(shrinkH).toBeDisabled();
  });

  it("shows hero controls when only vertical shrink remains", () => {
    render(<ResizeControls id="hero" col={2} row={3} maxCol={2} maxRow={3} minRow={1} onResize={vi.fn()} />);
    expect(screen.getByTitle("Shrink H")).not.toBeDisabled();
    expect(screen.getByTitle("Grow H")).toBeDisabled();
=======
} from "../../../../pages/homepage/components/IntelligenceGridControls";

vi.mock("lucide-react", () => ({
  Check: () => <svg aria-hidden="true" />,
  Minus: () => <svg aria-hidden="true" />,
  Pencil: () => <svg aria-hidden="true" />,
  Plus: () => <svg aria-hidden="true" />,
  RotateCcw: () => <svg aria-hidden="true" />,
  Shuffle: () => <svg aria-hidden="true" />,
}));

describe("IntelligenceGridControls", () => {
  it("stops propagation for delete clicks and renders the grid grip", () => {
    const onDelete = vi.fn();
    const onParent = vi.fn();
    const { container } = render(
      <div onClick={onParent}>
        <DeleteButton onClick={onDelete} />
        <GridGrip />
      </div>,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onParent).not.toHaveBeenCalled();
    expect(container.querySelectorAll('[class*="gripDot"]').length).toBe(6);
  });

  it("renders resize controls, disables hero width changes, and emits resize updates", () => {
    const onResize = vi.fn();
    const { rerender } = render(
      <ResizeControls id="task" col={2} row={2} minCol={1} minRow={1} maxCol={3} maxRow={4} onResize={onResize} />,
    );

    expect(screen.getByText("2W")).toBeInTheDocument();
    expect(screen.getByText("2H")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Shrink W"));
    fireEvent.click(screen.getByTitle("Grow W"));
    fireEvent.click(screen.getByTitle("Shrink H"));
    fireEvent.click(screen.getByTitle("Grow H"));

    expect(onResize).toHaveBeenCalledWith("task", { col: 1, row: 2 });
    expect(onResize).toHaveBeenCalledWith("task", { col: 3, row: 2 });
    expect(onResize).toHaveBeenCalledWith("task", { col: 2, row: 1 });
    expect(onResize).toHaveBeenCalledWith("task", { col: 2, row: 3 });

    rerender(<ResizeControls id="hero" col={2} row={1} minCol={2} minRow={1} maxCol={2} maxRow={1} onResize={onResize} />);
    expect(screen.queryByText("1H")).not.toBeInTheDocument();
  });

  it("renders edit, randomize, and reset actions", () => {
    const onToggleEdit = vi.fn();
    const onRandomize = vi.fn();
    const onReset = vi.fn();
    const { rerender } = render(
      <GridActions edit={false} onRandomize={onRandomize} onReset={onReset} onToggleEdit={onToggleEdit} />,
    );

    fireEvent.click(screen.getByLabelText("Edit dashboard layout"));
    expect(onToggleEdit).toHaveBeenCalledOnce();
    expect(screen.queryByTitle("Shuffle Layout")).not.toBeInTheDocument();

    rerender(<GridActions edit onRandomize={onRandomize} onReset={onReset} onToggleEdit={onToggleEdit} />);
    fireEvent.click(screen.getByTitle("Shuffle Layout"));
    fireEvent.click(screen.getByTitle("Reset Layout"));

    expect(onRandomize).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
>>>>>>> main
  });
});
