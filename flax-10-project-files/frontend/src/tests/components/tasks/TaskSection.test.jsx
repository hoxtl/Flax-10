import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  UrgentSection,
  OthersSection,
  DoneSection,
} from "../../../components/Tasks/TaskSection";

vi.mock("framer-motion", () => ({
  Reorder: {
    Group: ({ children }) => <div data-testid="reorder-group">{children}</div>,
    Item: ({ children, className, value }) => (
      <div data-testid={`reorder-item-${value?.id ?? "x"}`} className={className}>
        {children}
      </div>
    ),
  },
}));

vi.mock("../../../components/Tasks/TaskMenu", () => ({
  default: ({ item }) => <div data-testid={`task-menu-${item.id}`} />,
}));

vi.mock("../../../components/Tasks/TaskRow", () => ({
  default: (props) => {
    props.setEditText?.("x");
    props.onSaveEdit?.();
    props.onCancelEdit?.();
    props.onStartEdit?.();
    return <div data-testid={`task-row-${props.item.id}`} />;
  },
}));

describe("TaskSection", () => {
  const baseProps = {
    editingId: null,
    editText: "",
    setEditText: vi.fn(),
    taskMenuId: null,
    onToggleDone: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onStartEdit: vi.fn(),
    onDotsClick: vi.fn(),
    onToggleUrgent: vi.fn(),
    onDelete: vi.fn(),
    taskMenuRef: { current: null },
    taskMenuPos: { top: 0, left: 0 },
  };

  const doneSectionProps = (overrides = {}) => ({
    items: [],
    taskMenuId: null,
    onToggleDone: baseProps.onToggleDone,
    onDotsClick: baseProps.onDotsClick,
    onToggleUrgent: baseProps.onToggleUrgent,
    onDelete: baseProps.onDelete,
    taskMenuRef: baseProps.taskMenuRef,
    taskMenuPos: baseProps.taskMenuPos,
    ...overrides,
  });

  beforeEach(() => { vi.clearAllMocks(); });

  it("UrgentSection returns null when empty", () => {
    const { container } = render(<UrgentSection {...baseProps} items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("OthersSection returns null when empty", () => {
    const { container } = render(<OthersSection {...baseProps} items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("DoneSection returns null when empty", () => {
    const { container } = render(<DoneSection {...doneSectionProps()} />);
    expect(container.firstChild).toBeNull();
  });

  it("UrgentSection renders title with bang", () => {
    render(
      <UrgentSection {...baseProps}
        items={[{ id: 1, title: "A", done: false, urgent: true }]} />
    );
    expect(screen.getByText("URGENT")).toBeInTheDocument();
    expect(screen.getByText("!")).toBeInTheDocument();
  });

  it("OthersSection renders title", () => {
    render(
      <OthersSection {...baseProps}
        items={[{ id: 2, title: "B", done: false, urgent: false }]} />
    );
    expect(screen.getByText("OTHERS")).toBeInTheDocument();
  });

  it("DoneSection renders title", () => {
    render(
      <DoneSection {...doneSectionProps({
        items: [{ id: 3, title: "C", done: true, urgent: false }],
      })} />
    );
    expect(screen.getByText("DONE")).toBeInTheDocument();
  });

  it("UrgentSection: rowActive branch true when taskMenuId matches", () => {
    render(
      <UrgentSection {...baseProps} taskMenuId={10}
        items={[{ id: 10, title: "U", done: false, urgent: true }]} />
    );
    expect(screen.getByTestId("reorder-item-10").className).toMatch(/rowActive/);
  });

  it("UrgentSection: rowActive branch false when taskMenuId does not match", () => {
    render(
      <UrgentSection {...baseProps} taskMenuId={999}
        items={[{ id: 10, title: "U", done: false, urgent: true }]} />
    );
    expect(screen.getByTestId("reorder-item-10").className).not.toMatch(/rowActive/);
  });

  it("OthersSection: rowActive branch true when taskMenuId matches", () => {
    render(
      <OthersSection {...baseProps} taskMenuId={20}
        items={[{ id: 20, title: "O", done: false, urgent: false }]} />
    );
    expect(screen.getByTestId("reorder-item-20").className).toMatch(/rowActive/);
  });

  it("OthersSection: rowActive branch false when taskMenuId does not match", () => {
    render(
      <OthersSection {...baseProps} taskMenuId={999}
        items={[{ id: 20, title: "O", done: false, urgent: false }]} />
    );
    expect(screen.getByTestId("reorder-item-20").className).not.toMatch(/rowActive/);
  });

  it("DoneSection: rowActive branch true when taskMenuId matches", () => {
    render(
      <DoneSection {...doneSectionProps({
        items: [{ id: 30, title: "D", done: true, urgent: false }],
        taskMenuId: 30,
      })} />
    );
    const wrapper = screen.getByTestId("task-menu-30").parentElement;
    expect(wrapper.className).toMatch(/rowActive/);
  });

  it("DoneSection: rowActive branch false when taskMenuId does not match", () => {
    render(
      <DoneSection {...doneSectionProps({
        items: [{ id: 30, title: "D", done: true, urgent: false }],
        taskMenuId: 999,
      })} />
    );
    const wrapper = screen.getByTestId("task-menu-30").parentElement;
    expect(wrapper.className).not.toMatch(/rowActive/);
  });
});