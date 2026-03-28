import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import AddMemberForm from "@/pages/group_work/components/AddMemberForm";
import * as api from "@/pages/group_work/api/groupWorkApi";

vi.mock("@/components/social/components/UserSearch", () => ({
  default: ({ onUserSelect, filterUsers, renderEmptyState }) => (
    <div data-testid="user-search-mock">
      <button onClick={() => onUserSelect({ id: 1 })}>Select User 1</button>
      <button onClick={() => onUserSelect(null)}>Select Null</button>
      <div data-testid="filtered-count">{filterUsers([{ id: "m1" }, { id: "m2" }]).length}</div>
      <div data-testid="filtered-invalid">{filterUsers(null).length}</div>
      {renderEmptyState({ query: "abc", clear: vi.fn() })}
    </div>
  ),
}));

vi.mock("@/pages/group_work/api/groupWorkApi", () => ({
  addProjectMember: vi.fn(),
}));

vi.mock("@/pages/group_work/components/GroupWorkUserSearchEmptyState", () => ({
  default: ({ query }) => <div data-testid="empty-state">{query}</div>,
}));

describe("AddMemberForm", () => {
  const onAdded = vi.fn();
  const projectId = 1;
  const members = [{ user: "m1" }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders and handles valid user selection", async () => {
    api.addProjectMember.mockResolvedValue({ id: "new-mem" });
    render(<AddMemberForm projectId={projectId} members={members} onAdded={onAdded} />);
    
    await act(async () => {
      screen.getByText("Select User 1").click();
    });

    expect(api.addProjectMember).toHaveBeenCalledWith(projectId, 1);
    expect(onAdded).toHaveBeenCalledWith({ id: "new-mem" });
  });

  it("ignores invalid user selection", async () => {
    render(<AddMemberForm projectId={projectId} members={members} onAdded={onAdded} />);
    
    await act(async () => {
      screen.getByText("Select Null").click();
    });

    expect(api.addProjectMember).not.toHaveBeenCalled();
  });

  it("filters out existing members", () => {
    render(<AddMemberForm projectId={projectId} members={members} onAdded={onAdded} />);
    expect(screen.getByTestId("filtered-count").textContent).toBe("1");
  });

  it("handles null results in filter", () => {
    render(<AddMemberForm projectId={projectId} members={members} onAdded={onAdded} />);
    expect(screen.getByTestId("filtered-invalid").textContent).toBe("0");
  });

  it("renders empty state correctly", () => {
    render(<AddMemberForm projectId={projectId} members={members} onAdded={onAdded} />);
    expect(screen.getByTestId("empty-state").textContent).toBe("abc");
  });

  it("uses default empty array for members when not provided", () => {
    // This hits the members = [] default parameter on line 10 of AddMemberForm.jsx
    render(<AddMemberForm projectId={projectId} onAdded={onAdded} />);
    expect(screen.getByTestId("filtered-count").textContent).toBe("2");
  });

  it("handles falsy member response from API", async () => {
    // Hits the else branch of if (member) on line 44 of AddMemberForm.jsx
    api.addProjectMember.mockResolvedValue(null);
    render(<AddMemberForm projectId={projectId} members={members} onAdded={onAdded} />);
    
    await act(async () => {
      screen.getByText("Select User 1").click();
    });

    expect(api.addProjectMember).toHaveBeenCalled();
    expect(onAdded).not.toHaveBeenCalled();
  });

  it("handles members with id but no user field", () => {
    // Hits the member.id branch of member.user ?? member.id on line 49 of AddMemberForm.jsx
    const idMembers = [{ id: "m1" }];
    render(<AddMemberForm projectId={projectId} members={idMembers} onAdded={onAdded} />);
    expect(screen.getByTestId("filtered-count").textContent).toBe("1");
  });
});
