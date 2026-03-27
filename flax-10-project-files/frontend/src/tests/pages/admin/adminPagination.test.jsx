import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../components/pagination/Pagination", () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }) => (
    <div data-testid="pagination-proxy" data-current={currentPage} data-total={totalPages} onClick={() => onPageChange(3)}>
      pagination
    </div>
  ),
}));

import AdminPagination from "../../../pages/admin/components/AdminPagination";

describe("AdminPagination", () => {
  it("passes pagination props through to the shared Pagination component", () => {
    const onPageChange = vi.fn();
    render(<AdminPagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);

    const proxy = screen.getByTestId("pagination-proxy");
    expect(proxy).toHaveAttribute("data-current", "2");
    expect(proxy).toHaveAttribute("data-total", "5");
    proxy.click();
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
