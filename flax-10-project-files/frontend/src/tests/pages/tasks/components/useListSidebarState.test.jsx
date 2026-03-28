/*
 * Tests for list sidebar state and derived counts.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const computeListSidebarCountsMock = vi.fn();

vi.mock("../../../../pages/tasks/utils/listSidebarUtils", () => ({
  computeListSidebarCounts: (...args) => computeListSidebarCountsMock(...args),
}));

import { useListSidebarState } from "../../../../pages/tasks/components/useListSidebarState";

function renderSidebarState() {
  const tasks = [{ id: 1, task_list: 1 }];
  const lists = [{ id: 1, name: "Inbox" }];
  return renderHook(() => useListSidebarState(tasks, lists));
}

describe("useListSidebarState", () => {
  it("returns computed counts and default sidebar state", () => {
    computeListSidebarCountsMock.mockReturnValue({
      listCounts: { 1: 3 },
      smartFilters: { today: 2, overdue: 1 },
    });
    const { result } = renderSidebarState();
    expect(computeListSidebarCountsMock).toHaveBeenCalledWith([{ id: 1, task_list: 1 }], [{ id: 1, name: "Inbox" }]);
    expect(result.current.listCounts).toEqual({ 1: 3 });
    expect(result.current.smartFilters).toEqual({ today: 2, overdue: 1 });
    expect(result.current.ctxMenu).toBeNull();
    expect(result.current.renamingId).toBeNull();
    expect(result.current.showArchived).toBe(false);
    expect(result.current.deleteListId).toBeNull();
    expect(result.current.permDeleteId).toBeNull();
  });

  it("updates sidebar controls and context-menu coordinates", () => {
    computeListSidebarCountsMock.mockReturnValue({ listCounts: {}, smartFilters: {} });
    const { result } = renderSidebarState();
    act(() => {
      result.current.setShowArchived(true);
      result.current.setRenamingId(8);
      result.current.setDeleteListId(9);
      result.current.setPermDeleteId(10);
      result.current.handleCtxMenu(
        { preventDefault: vi.fn(), clientX: 25, clientY: 40 },
        7,
      );
    });

    expect(result.current.showArchived).toBe(true);
    expect(result.current.renamingId).toBe(8);
    expect(result.current.deleteListId).toBe(9);
    expect(result.current.permDeleteId).toBe(10);
    expect(result.current.ctxMenu).toEqual({ x: 25, y: 40, listId: 7 });
  });
});
