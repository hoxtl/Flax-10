import { render, screen, fireEvent } from "@testing-library/react";
import TaskHeader from "../../../components/Tasks/TaskHeader";

describe("TaskHeader", () => {
  it("toggles menu open (executes updater)", () => {
    const setMenuOpen = vi.fn();
    render(
      <TaskHeader
        menuOpen={false}
        setMenuOpen={setMenuOpen}
        menuRef={{ current: null }}
        anyCompleted={false}
        onClearCompleted={() => {}}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /task menu/i }));
    const updater = setMenuOpen.mock.calls[0][0];
    expect(typeof updater).toBe("function");
    expect(updater(false)).toBe(true);
  });

  it("shows clear button when open and enables it when anyCompleted=true", () => {
    const onClearCompleted = vi.fn();
    render(
      <TaskHeader
        menuOpen={true}
        setMenuOpen={() => {}}
        menuRef={{ current: null }}
        anyCompleted={true}
        onClearCompleted={onClearCompleted}
      />
    );
    const btn = screen.getByRole("button", { name: /clear completed tasks/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onClearCompleted).toHaveBeenCalledTimes(1);
  });

  it("disables clear button when anyCompleted=false", () => {
    render(
      <TaskHeader
        menuOpen={true}
        setMenuOpen={() => {}}
        menuRef={{ current: null }}
        anyCompleted={false}
        onClearCompleted={() => {}}
      />
    );
    const btn = screen.getByRole("button", { name: /clear completed tasks/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("title", "No completed tasks");
  });
});
