import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockFramerMotion } from "./testSetup";

mockFramerMotion();

vi.mock("../../../components/Tasks/TaskSection", () => ({
  UrgentSection: ({ items }) => (items?.length ? <div>URGENT_SECTION</div> : null),
  OthersSection: ({ items }) => (items?.length ? <div>OTHERS_SECTION</div> : null),
  DoneSection: ({ items }) => (items?.length ? <div>DONE_SECTION</div> : null),
}));

import TaskList from "../../../components/Tasks/TaskList";

describe("TaskList", () => {
  const baseProps = {
    activePinned: [],
    urgentActive: [],
    otherActive: [],
    doneItems: [],
    onReorder: vi.fn(),
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

  it("shows empty state when isEmpty", () => {
    render(<TaskList {...baseProps} isEmpty={true} />);
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it("renders sections when provided items", () => {
    render(
      <TaskList
        {...baseProps}
        isEmpty={false}
        activePinned={[{ id: "1" }]}
        urgentActive={[{ id: "1" }]}
        otherActive={[{ id: "2" }]}
        doneItems={[{ id: "3" }]}
      />
    );

    expect(screen.getByTestId("reorder-group")).toBeInTheDocument();
    expect(screen.getByText("URGENT_SECTION")).toBeInTheDocument();
    expect(screen.getByText("OTHERS_SECTION")).toBeInTheDocument();
    expect(screen.getByText("DONE_SECTION")).toBeInTheDocument();
  });
});
