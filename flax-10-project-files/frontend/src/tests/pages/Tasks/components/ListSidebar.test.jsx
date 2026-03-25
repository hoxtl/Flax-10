/*
 * Tests for ListSidebar.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "../../../../utils/test-utils";
import ListSidebar from "../../../../pages/Tasks/components/ListSidebar";

describe("ListSidebar", () => {
  const props = {
    lists: [{ id: 1, name: "Work" }],
    tasks: [],
    activeListId: null,
    activeFilter: "all",
    onSelectList: vi.fn(),
    onSelectFilter: vi.fn(),
    onNewList: vi.fn(),
    onDeleteList: vi.fn(),
    onRenameList: vi.fn(),
    onUnarchiveList: vi.fn(),
    onPermanentlyDeleteList: vi.fn(),
    archivedLists: [],
  };

  it("renders VIEWS and LISTS", () => {
    render(<ListSidebar {...props} />);
    expect(screen.getByText("VIEWS")).toBeInTheDocument();
  });

  it("renders list and Add list button", () => {
    render(<ListSidebar {...props} />);
    expect(screen.getByTitle("Work")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Add list/i));
    expect(props.onNewList).toHaveBeenCalled();
  });
});
