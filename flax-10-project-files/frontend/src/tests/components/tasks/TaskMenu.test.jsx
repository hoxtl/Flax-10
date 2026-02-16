import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { mockInlinePortal } from "./testSetup";

mockInlinePortal();

import TaskMenu from "../../../components/Tasks/TaskMenu";

describe("TaskMenu", () => {
  it("renders nothing when inactive", () => {
    const { container } = render(
      <TaskMenu
        item={{ id: "1", done: false, urgent: false }}
        taskMenuId="2"
        taskMenuRef={{ current: null }}
        taskMenuPos={{ top: 10, left: 10 }}
        onToggleUrgent={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows urgent and delete for active not-done item", () => {
    render(
      <TaskMenu
        item={{ id: "1", done: false, urgent: false }}
        taskMenuId="1"
        taskMenuRef={{ current: null }}
        taskMenuPos={{ top: 10, left: 20 }}
        onToggleUrgent={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /mark as urgent/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /delete/i })).toBeInTheDocument();
  });

  it("hides urgent when item is done", () => {
    render(
      <TaskMenu
        item={{ id: "1", done: true, urgent: true }}
        taskMenuId="1"
        taskMenuRef={{ current: null }}
        taskMenuPos={{ top: 0, left: 0 }}
        onToggleUrgent={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByRole("menuitem", { name: /urgent/i })).toBeNull();
    expect(screen.getByRole("menuitem", { name: /delete/i })).toBeInTheDocument();
  });

  it("calls handlers on click", () => {
    const onToggleUrgent = vi.fn();
    const onDelete = vi.fn();

    render(
      <TaskMenu
        item={{ id: "1", done: false, urgent: false }}
        taskMenuId="1"
        taskMenuRef={{ current: null }}
        taskMenuPos={{ top: 0, left: 0 }}
        onToggleUrgent={onToggleUrgent}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByRole("menuitem", { name: /mark as urgent/i }));
    expect(onToggleUrgent).toHaveBeenCalledWith("1");

    fireEvent.click(screen.getByRole("menuitem", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
