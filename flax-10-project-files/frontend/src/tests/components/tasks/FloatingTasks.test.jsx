import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import FloatingTasks from "../../../components/Tasks/FloatingTasks";

vi.mock("../../../components/Tasks/ToDoPanel", () => ({
  default: ({ open, onClose }) => (
    <div>
      <div data-testid="panel" data-open={String(open)} />
      <button onClick={onClose}>close-from-panel</button>
    </div>
  ),
}));

describe("FloatingTasks", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("loads open state from localStorage and toggles", () => {
    localStorage.setItem("flax_todo_open_v1", "true");
    render(<FloatingTasks />);
    expect(screen.getByTestId("panel")).toHaveAttribute("data-open", "true");

    fireEvent.click(screen.getByRole("button", { name: /close to-do|open to-do/i }));
    expect(screen.getByTestId("panel")).toHaveAttribute("data-open", "false");
  });

  it("covers onClose prop (setOpen(false))", () => {
    localStorage.setItem("flax_todo_open_v1", "true");
    render(<FloatingTasks />);

    fireEvent.click(screen.getByText("close-from-panel"));
    expect(screen.getByTestId("panel")).toHaveAttribute("data-open", "false");
  });

  it("falls back to false when localStorage JSON is invalid", () => {
    localStorage.setItem("flax_todo_open_v1", "{bad json");
    render(<FloatingTasks />);
    expect(screen.getByTestId("panel")).toHaveAttribute("data-open", "false");
  });

  it("handles localStorage.setItem throwing", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("fail");
    });
    render(<FloatingTasks />);
    fireEvent.click(screen.getByRole("button", { name: /open to-do|close to-do/i }));
    expect(spy).toHaveBeenCalled();
  });
});