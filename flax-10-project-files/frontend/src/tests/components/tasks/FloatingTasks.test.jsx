import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { mockInlinePortal } from "./testSetup";

mockInlinePortal();

vi.mock("../../../components/Tasks/ToDoPanel", () => ({
  default: ({ open, onClose, fabRef }) => (
    <div>
      <div data-testid="panel-open">{String(open)}</div>
      <div data-testid="has-fabref">{String(!!fabRef?.current)}</div>
      <button onClick={onClose}>ClosePanel</button>
    </div>
  ),
}));

import FloatingTasks from "../../../components/Tasks/FloatingTasks";

describe("FloatingTasks", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("loads open state from localStorage", () => {
    localStorage.setItem("flax_todo_open_v1", JSON.stringify(true));
    render(<FloatingTasks />);
    expect(screen.getByTestId("panel-open").textContent).toBe("true");
    expect(screen.getByLabelText("Close to-do")).toBeInTheDocument();
  });

  it("toggles open state and persists", () => {
    render(<FloatingTasks />);
    expect(screen.getByTestId("panel-open").textContent).toBe("false");

    fireEvent.click(screen.getByLabelText("Open to-do"));
    expect(screen.getByTestId("panel-open").textContent).toBe("true");
    expect(JSON.parse(localStorage.getItem("flax_todo_open_v1"))).toBe(true);

    fireEvent.click(screen.getByLabelText("Close to-do"));
    expect(screen.getByTestId("panel-open").textContent).toBe("false");
    expect(JSON.parse(localStorage.getItem("flax_todo_open_v1"))).toBe(false);
  });

  it("passes fabRef and allows panel to close", () => {
    render(<FloatingTasks />);
    expect(screen.getByTestId("has-fabref").textContent).toBe("true");

    fireEvent.click(screen.getByLabelText("Open to-do"));
    expect(screen.getByTestId("panel-open").textContent).toBe("true");

    fireEvent.click(screen.getByText("ClosePanel"));
    expect(screen.getByTestId("panel-open").textContent).toBe("false");
  });
});
