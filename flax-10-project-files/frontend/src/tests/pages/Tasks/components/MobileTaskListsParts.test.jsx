import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  EmptyListsState,
  ListRow,
  MobileListSection,
} from "../../../../pages/Tasks/components/MobileTaskListsParts";

vi.mock("../../../../components/common/EmptyState/EmptyState", () => ({
  default: ({ icon, title, description }) => (
    <div data-testid="empty-state">
      <span>{icon}</span>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}));

vi.mock("../../../../pages/Tasks/utils/listColorUtils", () => ({
  getListColor: vi.fn((_list, index) => (index === 0 ? "#f00" : "#0f0")),
}));

describe("MobileTaskListsParts", () => {
  it("renders a list row with count, active state, and click handler", () => {
    const onClick = vi.fn();
    const { container } = render(
      <ListRow
        list={{ id: 1, name: "Groceries" }}
        index={0}
        count={4}
        active
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Groceries/i }));

    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(container.firstChild.className).toMatch(/listRowActive/);
    expect(container.querySelector("[style*='background: rgb(255, 0, 0)'], [style*='background:#f00']"))
      .toBeTruthy();
  });

  it("omits the count badge when the count is zero", () => {
    render(
      <ListRow
        list={{ id: 1, name: "Inbox" }}
        index={1}
        count={0}
        active={false}
        onClick={vi.fn()}
      />,
    );

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("renders an empty section when there are no lists", () => {
    render(
      <MobileListSection
        title="READING LISTS"
        lists={[]}
        listCounts={{}}
        activeListId={null}
        onSelectList={vi.fn()}
        emptyMessage="No reading lists"
      />,
    );

    expect(screen.getByText("READING LISTS")).toBeInTheDocument();
    expect(screen.getByText("No reading lists")).toBeInTheDocument();
  });

  it("activates list rows using string id matching", () => {
    const lists = [{ id: 1, name: "G" }, { id: 2, name: "E" }];
    render(<MobileListSection lists={lists} listCounts={{ 1: 2 }} activeListId="1" onSelectList={vi.fn()} />);
    expect(screen.getByRole("button", { name: /G/i }).className).toMatch(/listRowActive/);
    expect(screen.getByRole("button", { name: /E/i }).className).not.toMatch(/listRowActive/);
  });

  it("triggers selection handler on list click", () => {
    const onSelect = vi.fn();
    render(<MobileListSection lists={[{ id: 2, name: "E" }]} listCounts={{}} onSelectList={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /E/i }));
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("renders the empty lists state copy", () => {
    render(<EmptyListsState />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No lists yet")).toBeInTheDocument();
    expect(screen.getByText("Create a list to organize your tasks.")).toBeInTheDocument();
  });
});
