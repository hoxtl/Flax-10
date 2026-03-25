import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  DeleteButton,
  GridActions,
  GridGrip,
  ResizeControls,
} from "../../../pages/Homepage/components/IntelligenceGridControls";

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
  });
});
