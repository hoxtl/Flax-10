import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import EmptyState from "../../../components/common/empty_state/EmptyState";

describe("EmptyState", () => {
  it("renders the action area when provided", () => {
    render(
      <EmptyState
        title="Nothing here"
        description="Try adding something."
        action={<button type="button">Create item</button>}
      />
    );

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Try adding something.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create item" })).toBeInTheDocument();
  });
});
