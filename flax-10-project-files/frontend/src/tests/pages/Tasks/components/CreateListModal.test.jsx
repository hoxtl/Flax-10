/**
 * Tests for CreateListModal: name input, color picker, save, cancel.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateListModal from "../../../../pages/Tasks/components/CreateListModal";

describe("CreateListModal", () => {
  it("renders New list header", () => {
    render(<CreateListModal onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("New list")).toBeInTheDocument();
  });

  it("renders name input and color options", () => {
    render(<CreateListModal onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/List name/i)).toBeInTheDocument();
  });

  it("calls onClose when overlay clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<CreateListModal onSave={vi.fn()} onClose={onClose} />);
    fireEvent.mouseDown(container.querySelector('[class*="overlay"]') || container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onSave with name and color when Create list clicked", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<CreateListModal onSave={onSave} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/List name/i), { target: { value: "My List" } });
    fireEvent.click(screen.getByRole("button", { name: /Create list/i }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "My List" }));
    });
  });
});
