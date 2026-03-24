import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../components/common/Card/CardGrid.module.css", () => ({ default: { grid: "grid" } }));

vi.mock("../../components/Society/SocietyCard", () => ({
  default: ({ society, onClick, onReport, onUnreport }) => (
    <div>
      <button onClick={() => onClick?.(society.id)}>{society.name}</button>
      <button onClick={() => onReport?.(society)}>Report {society.name}</button>
      <button onClick={() => onUnreport?.(society)}>Unreport {society.name}</button>
    </div>
  ),
}));

vi.mock("../../components/common/EmptyState/EmptyState", () => ({
  default: ({ title, description }) => (
    <div>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}));

vi.mock("../../components/common/SearchEmptyState/SearchEmptyState", () => ({
  default: ({ query, itemLabel, onClear }) => (
    <div>
      <span>
        No {itemLabel} for {query}
      </span>
      <button onClick={onClear}>Clear search</button>
    </div>
  ),
}));

vi.mock("../../components/Pagination/Pagination", () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }) => (
    <div data-testid="pagination">
      <span>
        {currentPage}/{totalPages}
      </span>
      <button onClick={() => onPageChange(2)}>Go to page 2</button>
    </div>
  ),
}));

const paginationMock = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/usePagination", () => ({
  usePagination: (...args) => paginationMock(...args),
}));

import { SocietyBrowseResults } from "../../pages/Societies/SocietyBrowseResults";

describe("SocietyBrowseResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paginationMock.mockReturnValue({
      currentItems: [],
      totalPages: 1,
      currentPage: 1,
      setPage: vi.fn(),
    });
  });

  it("renders the neutral empty state when there is no search query", () => {
    render(
      <SocietyBrowseResults
        items={[]}
        search=""
        setSearch={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("No societies found")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search or filters.")).toBeInTheDocument();
  });

  it("renders the search empty state and clears the query", () => {
    const setSearch = vi.fn();

    render(
      <SocietyBrowseResults
        items={[]}
        search=" robotics "
        setSearch={setSearch}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText(/No societies for\s+robotics/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear search"));
    expect(setSearch).toHaveBeenCalledWith("");
  });

  it("renders paginated society cards and forwards select/report actions", () => {
    const onSelect = vi.fn();
    const onReport = vi.fn();
    const onUnreport = vi.fn();
    const setPage = vi.fn();
    const currentItems = [
      { id: 1, name: "Chess Club" },
      { id: 2, name: "Debate Union" },
    ];

    paginationMock.mockReturnValue({
      currentItems,
      totalPages: 3,
      currentPage: 1,
      setPage,
    });

    render(
      <SocietyBrowseResults
        items={currentItems}
        search=""
        setSearch={vi.fn()}
        onSelect={onSelect}
        onReport={onReport}
        onUnreport={onUnreport}
      />,
    );

    expect(screen.getAllByTestId("pagination")).toHaveLength(2);
    fireEvent.click(screen.getByText("Chess Club"));
    fireEvent.click(screen.getByText("Report Chess Club"));
    fireEvent.click(screen.getByText("Unreport Debate Union"));
    fireEvent.click(screen.getAllByText("Go to page 2")[0]);

    expect(onSelect).toHaveBeenCalledWith(1);
    expect(onReport).toHaveBeenCalledWith(currentItems[0]);
    expect(onUnreport).toHaveBeenCalledWith(currentItems[1]);
    expect(setPage).toHaveBeenCalledWith(2);
  });
});
