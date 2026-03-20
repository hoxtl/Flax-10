/**
 * Tests for TaskInfoModal.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskInfoModal } from "../../../../pages/Tasks/components/TaskInfoModal";

vi.mock("../../../../api/readingApi", () => ({
  getReadingSpeed: vi.fn().mockResolvedValue({ avg_min_per_page: 1.7, is_personalised: true }),
}));

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

  it("shows chapter, pages, and speed fields for tasks inside a reading list", async () => {
    render(
      <TaskInfoModal
        task={{ ...task, title: "LW4202 essay" }}
        listName="LW4202 - Constitutional Law"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Chapter")).toBeInTheDocument();
    expect(screen.getByText("Pages")).toBeInTheDocument();
    expect(screen.getByText("Speed")).toBeInTheDocument();
    expect(await screen.findByText("1.7 min/page")).toBeInTheDocument();
  });
});
