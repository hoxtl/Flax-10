import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const loadState = {
  lists: [{ id: 1, name: "Inbox" }],
  archivedLists: [{ id: 2, name: "Archive" }],
  loading: false,
  load: vi.fn(),
  loadArchived: vi.fn(),
  setLists: vi.fn(),
  setArchivedLists: vi.fn(),
};

vi.mock("../../../../pages/Tasks/hooks/useTaskListsLoad", () => ({
  default: vi.fn(() => loadState),
}));

vi.mock("../../../../pages/Tasks/utils/useTaskListsUtils", () => ({
  addListImpl: vi.fn(() => ({ id: 3 })),
  renameListImpl: vi.fn(),
  removeListImpl: vi.fn(),
  restoreListImpl: vi.fn(),
  permanentlyDeleteListImpl: vi.fn(),
}));

import useTaskLists from "../../../../pages/Tasks/hooks/useTaskLists";
import {
  addListImpl,
  renameListImpl,
  removeListImpl,
  restoreListImpl,
  permanentlyDeleteListImpl,
} from "../../../../pages/Tasks/utils/useTaskListsUtils";

describe("useTaskLists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates list actions to utils", async () => {
    const { result } = renderHook(() => useTaskLists());
    await result.current.addList({ name: "New" });
    await result.current.renameList(1, { name: "Renamed" });
    await result.current.removeList(1);
    await result.current.restoreList(2);
    await result.current.permanentlyDeleteList(2);
    expect(addListImpl).toHaveBeenCalled();
    expect(renameListImpl).toHaveBeenCalled();
    expect(removeListImpl).toHaveBeenCalled();
    expect(restoreListImpl).toHaveBeenCalled();
    expect(permanentlyDeleteListImpl).toHaveBeenCalled();
  });
});
