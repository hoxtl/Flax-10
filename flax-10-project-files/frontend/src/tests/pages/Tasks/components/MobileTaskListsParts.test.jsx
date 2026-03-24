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

  it("renders list rows and selects the clicked list using string id matching", () => {
    const onSelectList = vi.fn();

    render(
      <MobileListSection
        title="LIFE LISTS"
        lists={[
          { id: 1, name: "Groceries" },
          { id: 2, name: "Errands" },
        ]}
        listCounts={{ 1: 2, 2: 0 }}
        activeListId="1"
        onSelectList={onSelectList}
        emptyMessage="No life lists"
      />,
    );

    const groceries = screen.getByRole("button", { name: /Groceries/i });
    const errands = screen.getByRole("button", { name: /Errands/i });

    expect(groceries.className).toMatch(/listRowActive/);
    expect(errands.className).not.toMatch(/listRowActive/);

    fireEvent.click(errands);
    expect(onSelectList).toHaveBeenCalledWith(2);
  });

  it("renders the empty lists state copy", () => {
    render(<EmptyListsState />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No lists yet")).toBeInTheDocument();
    expect(screen.getByText("Create a list to organize your tasks.")).toBeInTheDocument();
  });
});
