import { render, screen, fireEvent } from "@testing-library/react";
import TaskMenu from "../../../components/Tasks/TaskMenu";

describe("TaskMenu", () => {
  it("returns null when taskMenuId does not match item.id", () => {
    const { container } = render(
      <TaskMenu
        item={{ id: 1, urgent: false, done: false }}
        taskMenuId={2}
        taskMenuRef={{ current: null }}
        taskMenuPos={{ top: 10, left: 20 }}
        onToggleUrgent={() => {}}
        onDelete={() => {}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows urgent + delete when active and not done", () => {
    const onToggleUrgent = vi.fn();
    const onDelete = vi.fn();
    render(
      <TaskMenu
        item={{ id: 1, urgent: false, done: false }}
        taskMenuId={1}
        taskMenuRef={{ current: null }}
        taskMenuPos={{ top: 10, left: 20 }}
        onToggleUrgent={onToggleUrgent}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /mark as urgent/i }));
    expect(onToggleUrgent).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole("menuitem", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("changes urgent label when item.urgent=true", () => {
    render(
      <TaskMenu
        item={{ id: 1, urgent: true, done: false }}
        taskMenuId={1}
        taskMenuRef={{ current: null }}
        taskMenuPos={{ top: 10, left: 20 }}
        onToggleUrgent={() => {}}
        onDelete={() => {}}
      />
    );
    expect(screen.getByRole("menuitem", { name: /remove urgent/i })).toBeInTheDocument();
  });

  it("hides urgent option when done=true", () => {
    render(
      <TaskMenu
        item={{ id: 1, urgent: true, done: true }}
        taskMenuId={1}
        taskMenuRef={{ current: null }}
        taskMenuPos={{ top: 10, left: 20 }}
        onToggleUrgent={() => {}}
        onDelete={() => {}}
      />
    );
    expect(screen.queryByRole("menuitem", { name: /urgent/i })).toBeNull();
    expect(screen.getByRole("menuitem", { name: /delete/i })).toBeInTheDocument();
  });
});
