import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import MemberFilter from "@/pages/group_work/components/MemberFilter";
import { useClickOutside } from "@/components/common/hooks/useClickOutside";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/components/common/filter_button/FilterButton", () => ({
  default: ({ activeCount, onClick }) => (
    <button data-testid="filter-btn" onClick={onClick}>
      Filter ({activeCount})
    </button>
  ),
}));

vi.mock("@/components/common/hooks/useClickOutside", () => ({
  useClickOutside: vi.fn(),
}));

vi.mock("@/pages/group_work/components/SelectableMemberRow", () => ({
  default: ({ member, checked, onToggle }) => (
    <div data-testid={`member-${member.id}`}>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={() => onToggle(member.user)} 
      />
      {member.name}
    </div>
  ),
}));

describe("MemberFilter", () => {
  const onToggle = vi.fn();
  const members = [{ id: 1, user: 1, name: "Alice" }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens and closes on mouse interaction", () => {
    render(<MemberFilter members={members} selectedUsers={[]} onToggle={onToggle} />);
    const wrapper = screen.getByTestId("filter-btn").parentElement;
    
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText("Alice")).toBeTruthy();
    
    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByText("Alice")).toBeNull();
  });

  it("toggles open state on button click", () => {
    render(<MemberFilter members={members} onToggle={onToggle} />);
    const btn = screen.getByTestId("filter-btn");
    
    fireEvent.click(btn);
    expect(screen.getByText("Alice")).toBeTruthy();
    
    fireEvent.click(btn);
    expect(screen.queryByText("Alice")).toBeNull();
  });

  it("renders empty state", () => {
    render(<MemberFilter members={[]} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId("filter-btn"));
    expect(screen.getByText("No members")).toBeTruthy();
  });

  it("handles member selection", () => {
    render(<MemberFilter members={members} selectedUsers={["1"]} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId("filter-btn"));
    
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox.checked).toBe(true);
    
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith(1);
    
    // Stop propagation check (indirectly by ensuring click on dropdown doesn't close)
    fireEvent.click(screen.getByText("Alice"));
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("closes on click outside", () => {
    let clickOutsideHandler;
    useClickOutside.mockImplementation((ref, handler) => {
      clickOutsideHandler = handler;
    });

    render(<MemberFilter members={members} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId("filter-btn"));
    expect(screen.getByText("Alice")).toBeTruthy();

    act(() => {
      clickOutsideHandler();
    });
    expect(screen.queryByText("Alice")).toBeNull();
  });

  it("hits all DropdownContent branches with different member lists", () => {
    // Hits lines 36-40
    const { rerender } = render(<MemberFilter members={[]} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId("filter-btn"));
    expect(screen.getByText("No members")).toBeTruthy();

    rerender(<MemberFilter members={members} onToggle={onToggle} />);
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("handles mouse events for opening/closing", () => {
    // Hits line 48: onMouseEnter/onMouseLeave
    render(<MemberFilter members={members} onToggle={onToggle} />);
    const wrapper = screen.getByTestId("filter-btn").parentElement;

    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText("Alice")).toBeTruthy();

    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByText("Alice")).toBeNull();
  });
});
