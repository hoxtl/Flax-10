import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskHeader from "../../../components/Tasks/TaskHeader";

describe("TaskHeader", () => {
  it("calls setMenuOpen on toggle", () => {
    const setMenuOpen = vi.fn();
    render(
      <TaskHeader
        menuOpen={false}
        setMenuOpen={setMenuOpen}
        menuRef={{ current: null }}
        anyCompleted={false}
        onClearCompleted={vi.fn()}
      />
    );

    const btn = screen.getByLabelText("Task menu");
    expect(btn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(btn);
    expect(setMenuOpen).toHaveBeenCalled();
  });

  it("renders top menu and disables clear when none", () => {
    render(
      <TaskHeader
        menuOpen={true}
        setMenuOpen={vi.fn()}
        menuRef={{ current: null }}
        anyCompleted={false}
        onClearCompleted={vi.fn()}
      />
    );

    const clearBtn = screen.getByRole("button", {
      name: /clear completed tasks/i,
    });
    expect(clearBtn).toBeDisabled();
    expect(clearBtn).toHaveAttribute("title", "No completed tasks");
  });

  it("enables clear and calls handler", () => {
    const onClearCompleted = vi.fn();
    render(
      <TaskHeader
        menuOpen={true}
        setMenuOpen={vi.fn()}
        menuRef={{ current: null }}
        anyCompleted={true}
        onClearCompleted={onClearCompleted}
      />
    );

    const clearBtn = screen.getByRole("button", {
      name: /clear completed tasks/i,
    });
    expect(clearBtn).not.toBeDisabled();
    fireEvent.click(clearBtn);
    expect(onClearCompleted).toHaveBeenCalled();
  });
});
