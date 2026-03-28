import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import CreateListModal from "../../../../pages/tasks/components/CreateListModal";

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, pill, variant, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../../components/common/standard_modal/StandardModal", () => ({
  default: ({ title, children }) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

describe("CreateListModal coverage", () => {
  it("does not save blank names when enter is pressed", () => {
    const onSave = vi.fn();

    render(<CreateListModal onSave={onSave} onClose={vi.fn()} />);

    fireEvent.keyDown(screen.getByPlaceholderText(/List name/i), { key: "Enter" });

    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves the selected colour and closes after creation", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<CreateListModal onSave={onSave} onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText(/List name/i), {
      target: { value: " Projects " },
    });
    fireEvent.click(screen.getByTitle("Colour 2"));
    fireEvent.click(screen.getByRole("button", { name: /Create list/i }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Projects", color: expect.any(String) }),
      ),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("changes category, disables save while blank, and closes from cancel", async () => {
    const onClose = vi.fn();
    render(<CreateListModal onSave={vi.fn()} onClose={onClose} />);

    expect(screen.getByRole("button", { name: /Create list/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "University" }));
    fireEvent.change(screen.getByPlaceholderText(/List name/i), {
      target: { value: "Coursework" },
    });

    expect(screen.getByText("Coursework")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
