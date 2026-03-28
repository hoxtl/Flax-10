import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("Pagination coverage topup", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("react");
  });

  it("renders safely when nav buttons cannot attach their refs", async () => {
    vi.resetModules();
    vi.doMock("react", async () => {
      const actual = await vi.importActual("react");
      return {
        ...actual,
        useRef: () => ({
          get current() {
            return null;
          },
          set current(_) {},
        }),
      };
    });

    const { Pagination } = await import("../../components/pagination/Pagination");
    render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "← Previous" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next →" })).toBeInTheDocument();
  });
});
