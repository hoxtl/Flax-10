import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import AttendanceSummary from "../../../components/analytics/components/AttendanceSummary";

describe("AttendanceSummary", () => {
  it("renders the attendance rate, counts, and navigation link", () => {
    render(
      <MemoryRouter>
        <AttendanceSummary
          className="summary-link"
          overall={{ attended: 7, missed: 3 }}
          pct={70}
          textColor="#123456"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getAllByText("attended").length).toBeGreaterThan(0);
    expect(screen.getAllByText("missed").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "View all →" })).toHaveAttribute("href", "/attendance");
  });
});
