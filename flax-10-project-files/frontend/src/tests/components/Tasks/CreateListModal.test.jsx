import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateListModal from "../../../pages/Tasks/components/CreateListModal";

describe("CreateListModal", () => {
  it("renders title and input", () => {
    render(<CreateListModal onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("New list")).toBeTruthy();
    expect(screen.getByPlaceholderText("List name…")).toBeTruthy();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<CreateListModal onSave={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay is clicked", () => {
    const onClose = vi.fn();
    render(<CreateListModal onSave={vi.fn()} onClose={onClose} />);

    const backdrop = document.body.querySelector('div[class*="_backdrop"]');
    expect(backdrop).toBeTruthy();
    fireEvent.mouseDown(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when modal content is clicked", () => {
    const onClose = vi.fn();
    render(<CreateListModal onSave={vi.fn()} onClose={onClose} />);

    const backdrop = document.body.querySelector('div[class*="_backdrop"]');
    expect(backdrop).toBeTruthy();
    const modal = backdrop.querySelector('div[class*="_modal"]');
    expect(modal).toBeTruthy();

    fireEvent.mouseDown(modal);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Cancel button is clicked", () => {
    const onClose = vi.fn();
    render(<CreateListModal onSave={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Create list button is disabled when name is empty", () => {
    render(<CreateListModal onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /create list/i })).toBeDisabled();
  });

  it("Create list button is enabled when name is provided", () => {
    render(<CreateListModal onSave={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("List name…"), {
      target: { value: "My List" },
    });
    expect(screen.getByRole("button", { name: /create list/i })).not.toBeDisabled();
  });

  it("calls onSave with trimmed name and color on save", async () => {
    const onSave = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    render(<CreateListModal onSave={onSave} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("List name…"), {
      target: { value: "  My List  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /create list/i }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: "My List" }),
      );
    });
  });

  it("calls onClose after successful save", async () => {
    const onSave = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    render(<CreateListModal onSave={onSave} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("List name…"), {
      target: { value: "My List" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create list/i }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("does not call onSave when name is blank", () => {
    const onSave = vi.fn();
    render(<CreateListModal onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /create list/i }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("updates preview text as name is typed", () => {
    render(<CreateListModal onSave={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("List name…"), {
      target: { value: "Work" },
    });
    expect(screen.getByText("Work")).toBeTruthy();
  });

  it("renders color swatches", () => {
    render(<CreateListModal onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("COLOUR")).toBeTruthy();
  });

  it("handles Enter key to save", async () => {
    const onSave = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    render(<CreateListModal onSave={onSave} onClose={onClose} />);
    const input = screen.getByPlaceholderText("List name…");
    fireEvent.change(input, { target: { value: "My List" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(onSave).toHaveBeenCalled());
  });
});

