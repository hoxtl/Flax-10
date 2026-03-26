/**
 * Covers list sidebar sections, menus, and archive flows.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createFnMap } from "../../../utils/testBuilderUtils";

const sidebarStateMock = vi.hoisted(() => vi.fn());
const authMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../pages/Tasks/components/useListSidebarState", () => ({
  useListSidebarState: sidebarStateMock,
}));

vi.mock("../../../../context/AuthContext", () => ({
  useAuth: authMock,
}));

vi.mock("../../../../components/common/EmptyState/EmptyState", () => ({
  default: ({ title, description }) => (
    <div>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}));

vi.mock("../../../../components/common/HoldConfirmModal/HoldConfirmModal", () => ({
  default: ({ title, onConfirm, onCancel }) => (
    <div>
      <span>{title}</span>
      <button type="button" onClick={onConfirm}>
        Confirm
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../../../../pages/Tasks/components/listSidebarParts", () => ({
  RenameInput: ({ value, onSave, onCancel }) => (
    <div>
      <span>{value}</span>
      <button type="button" onClick={() => onSave("Renamed list")}>
        Save rename
      </button>
      <button type="button" onClick={onCancel}>
        Cancel rename
      </button>
    </div>
  ),
  ListContextMenu: ({ onRename, onDelete, onClose }) => (
    <div>
      <button
        type="button"
        onClick={() => {
          onRename();
          onClose();
        }}
      >
        Rename menu
      </button>
      <button
        type="button"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        Delete menu
      </button>
    </div>
  ),
}));

import ListSidebar from "../../../../pages/Tasks/components/ListSidebar";

function buildState(overrides = {}) {
  return {
    smartFilters: [{ id: "all", label: "All tasks", emoji: "✅", count: 3 }],
    listCounts: { 1: 2, 2: 1, 3: 0, 4: 1 },
    renamingId: null,
    setRenamingId: vi.fn(),
    showArchived: false,
    setShowArchived: vi.fn(),
    deleteListId: null,
    setDeleteListId: vi.fn(),
    permDeleteId: null,
    setPermDeleteId: vi.fn(),
    ctxMenu: null,
    setCtxMenu: vi.fn(),
    handleCtxMenu: vi.fn(),
    ...overrides,
  };
}

const listSidebarActionNames = [
  "onSelectList",
  "onSelectFilter",
  "onNewList",
  "onDeleteList",
  "onRenameList",
  "onUnarchiveList",
  "onPermanentlyDeleteList",
];

const baseSidebarProps = {
  lists: [
    { id: 1, name: "Teaching - Seminar Prep" },
    { id: 2, name: "Reading List - History" },
    { id: 3, name: "Inbox" },
    { id: 4, name: "Teaching - Lectures" },
  ],
  tasks: [],
  activeListId: 2,
  activeFilter: "all",
  archivedLists: [{ id: 9, name: "Archived list" }],
};

function buildProps(overrides = {}) {
  return {
    ...baseSidebarProps,
    ...createFnMap(listSidebarActionNames),
    ...overrides,
  };
}

describe("ListSidebar coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockReturnValue({ profile: { role: "student" } });
    sidebarStateMock.mockReturnValue(buildState());
  });

  it("covers teacher sections and rename handlers", () => {
    const state = buildState({ renamingId: 1, ctxMenu: { x: 12, y: 24, listId: 3 } });
    const props = buildProps();
    authMock.mockReturnValue({ profile: { role: "teacher" } }); sidebarStateMock.mockReturnValue(state);
    render(<ListSidebar {...props} />);

    expect(screen.getByText("Lectures")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save rename" }));
    expect(props.onRenameList).toHaveBeenCalledWith(1, "Renamed list");
    fireEvent.click(screen.getByRole("button", { name: "Cancel rename" }));
    expect(state.setRenamingId).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByRole("button", { name: "Rename menu" }));
    expect(state.setRenamingId).toHaveBeenCalledWith(3);
    expect(state.setCtxMenu).toHaveBeenCalledWith(null);
  });

  it("covers archive toggles and delete dialogs", () => {
    const state = buildState({ showArchived: true, deleteListId: 3, permDeleteId: 9, ctxMenu: { x: 12, y: 24, listId: 3 } });
    const props = buildProps();
    authMock.mockReturnValue({ profile: { role: "teacher" } }); sidebarStateMock.mockReturnValue(state);
    render(<ListSidebar {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete menu" }));
    expect(state.setDeleteListId).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByRole("button", { name: /archived/i }));
    expect(state.setShowArchived).toHaveBeenCalledWith(expect.any(Function));

    const confirms = screen.getAllByRole("button", { name: "Confirm" });
    fireEvent.click(confirms[0]); fireEvent.click(confirms[1]);
    expect(props.onDeleteList).toHaveBeenCalledWith(3);
    expect(props.onPermanentlyDeleteList).toHaveBeenCalledWith(9);

    const cancels = screen.getAllByRole("button", { name: "Cancel" });
    fireEvent.click(cancels[0]); fireEvent.click(cancels[1]);
    expect(state.setDeleteListId).toHaveBeenCalledWith(null);
    expect(state.setPermDeleteId).toHaveBeenCalledWith(null);
  });

  it("covers reading-list label fallbacks and delete-name fallbacks for students", () => {
    sidebarStateMock.mockReturnValue(
      buildState({
        deleteListId: 77,
        permDeleteId: 88,
      }),
    );

    render(
      <ListSidebar
        {...buildProps({
          lists: [{ id: 2, name: "Reading List - History" }],
          archivedLists: [],
        })}
      />,
    );

    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText('Delete "this list"')).toBeInTheDocument();
    expect(screen.getByText('Permanently Delete "this list"')).toBeInTheDocument();
  });
});
