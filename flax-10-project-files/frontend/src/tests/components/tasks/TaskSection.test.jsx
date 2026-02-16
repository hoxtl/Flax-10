import { render, screen } from "@testing-library/react";
import { UrgentSection, OthersSection, DoneSection } from "../../../components/Tasks/TaskSection";

vi.mock("framer-motion", () => ({
  Reorder: {
    Item: ({ children }) => <div data-testid="reorder-item">{children}</div>,
  },
}));

vi.mock("../../../components/Tasks/TaskMenu", () => ({
  default: () => <div data-testid="task-menu" />,
}));

describe("TaskSection", () => {
  const baseProps = {
    editingId: null,
    editText: "",
    setEditText: () => {},
    taskMenuId: null,
    onToggleDone: () => {},
    onSaveEdit: () => {},
    onCancelEdit: () => {},
    onStartEdit: () => {},
    onDotsClick: () => {},
    onToggleUrgent: () => {},
    onDelete: () => {},
    taskMenuRef: { current: null },
    taskMenuPos: { top: 0, left: 0 },
  };

  it("UrgentSection returns null when empty", () => {
    const { container } = render(<UrgentSection {...baseProps} items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("OthersSection returns null when empty", () => {
    const { container } = render(<OthersSection {...baseProps} items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("DoneSection returns null when empty", () => {
    const { container } = render(
      <DoneSection
        items={[]}
        taskMenuId={null}
        onToggleDone={() => {}}
        onDotsClick={() => {}}
        onToggleUrgent={() => {}}
        onDelete={() => {}}
        taskMenuRef={{ current: null }}
        taskMenuPos={{ top: 0, left: 0 }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders section titles (bang + no bang)", () => {
    const items = [{ id: 1, title: "A", done: false, urgent: true }];
    render(<UrgentSection {...baseProps} items={items} />);
    expect(screen.getByText("URGENT")).toBeInTheDocument();
    expect(screen.getByText("!")).toBeInTheDocument();

    render(<OthersSection {...baseProps} items={items} />);
    expect(screen.getByText("OTHERS")).toBeInTheDocument();
  });

  it("DoneSection renders DONE title", () => {
    const items = [{ id: 2, title: "D", done: true, urgent: false }];
    render(
      <DoneSection
        items={items}
        taskMenuId={null}
        onToggleDone={() => {}}
        onDotsClick={() => {}}
        onToggleUrgent={() => {}}
        onDelete={() => {}}
        taskMenuRef={{ current: null }}
        taskMenuPos={{ top: 0, left: 0 }}
      />
    );
    expect(screen.getByText("DONE")).toBeInTheDocument();
  });
});
