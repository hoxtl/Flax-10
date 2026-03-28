import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../../../components/common/loading_state/SkeletonBlock", () => ({
  default: ({ className }) => <div data-testid="skeleton-block" className={className} />,
}));

import { HomepageSkeleton } from "../../../../pages/homepage/components/HomepageSkeleton";

describe("HomepageSkeleton", () => {
  it("renders the homepage loading layout with timeline rows", () => {
    render(<HomepageSkeleton />);

    expect(screen.getByRole("generic", { busy: true })).toBeInTheDocument();
    expect(screen.getAllByTestId("skeleton-block")).toHaveLength(16);
  });
});
