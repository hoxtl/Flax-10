/**
 * Tests for TaskInfoModal.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskInfoModal } from "../../../../pages/Tasks/components/TaskInfoModal";

describe("TaskInfoModal", () => {
  const task = { id: 1, title: "Read ch 3", priority: "high", due_date: "2026-03-15", estimated_blocks: 2 };

  it("renders task title", () => {
    render(<TaskInfoModal task={task} onClose={vi.fn()} />);
    expect(screen.getByText("Read ch 3")).toBeInTheDocument();
  });

  it("calls onClose when Close clicked", () => {
    const onClose = vi.fn();
    render(<TaskInfoModal task={task} onClose={onClose} />);
    const closeBtns = screen.getAllByRole("button", { name: /Close/i });
    fireEvent.click(closeBtns[closeBtns.length - 1]);
    expect(onClose).toHaveBeenCalled();
  });
});
