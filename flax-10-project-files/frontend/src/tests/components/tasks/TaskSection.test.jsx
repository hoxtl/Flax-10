import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockFramerMotion, mockInlinePortal } from "./testSetup";

mockFramerMotion();
mockInlinePortal();

import { UrgentSection, OthersSection, DoneSection } from "../../../components/Tasks/TaskSection";

describe("TaskSection", () => {
  const baseHandlers = {
    onToggleDone: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onStartEdit: vi.fn(),
    onDotsClick: vi.fn(),
    onToggleUrgent: vi.fn(),
    onDelete: vi.fn(),
  };

  it("UrgentSection returns null when empty", () => {
    const { container } = render(<UrgentSection items={[]} {...baseHandlers} />);
    expect(container.firstChild).toBeNull();
  });

  it("OthersSection returns null when empty", () => {
    const { container } = render(<OthersSection items={[]} {...baseHandlers} />);
    expect(container.firstChild).toBeNull();
  });

  it("DoneSection returns null when empty", () => {
    const { container } = render(<DoneSection items={[]} {...baseHandlers} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders section titles when items exist", () => {
    render(
      <UrgentSection
        items={[{ id: "1", title: "A", done: false, urgent: true }]}
        editingId={null}
        editText=""
        setEditText={vi.fn()}
        taskMenuId={null}
        taskMenuRef={{ current: null }}
        taskMenuPos={{ top: 0, left: 0 }}
        {...baseHandlers}
      />
    );

    expect(screen.getByText("URGENT")).toBeInTheDocument();
  });

  it("renders DONE section when done items exist", () => {
    render(
      <DoneSection
        items={[{ id: "2", title: "B", done: true, urgent: false }]}
        taskMenuId={null}
        taskMenuRef={{ current: null }}
        taskMenuPos={{ top: 0, left: 0 }}
        {...baseHandlers}
      />
    );

    expect(screen.getByText("DONE")).toBeInTheDocument();
  });
});
