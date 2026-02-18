import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskInput from "../../../components/Tasks/TaskInput";

describe("TaskInput", () => {
  it("calls setText on change", () => {
    const setText = vi.fn();
    render(<TaskInput text="" setText={setText} onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("New Task"), {
      target: { value: "Hello" },
    });

    expect(setText).toHaveBeenCalledWith("Hello");
  });

  it("submits form via onSubmit", () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(<TaskInput text="X" setText={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.submit(screen.getByPlaceholderText("New Task").closest("form"));
    expect(onSubmit).toHaveBeenCalled();
  });
});
