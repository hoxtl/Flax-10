import { afterEach, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const skeletonBlockMock = vi.fn((props) => <div data-testid="skeleton-block" {...props} />);

vi.mock("@/components/common/loading_state/SkeletonBlock", () => ({
  default: (props) => skeletonBlockMock(props),
}));

import GroupWorkIndexSkeleton from "@/pages/group_work/components/GroupWorkIndexSkeleton";

afterEach(() => {
  skeletonBlockMock.mockClear();
});

it("renders stat, form, and list skeleton placeholders", () => {
  render(<GroupWorkIndexSkeleton />);
  expect(screen.getByTestId("groupwork-skeleton")).toBeInTheDocument();
  expect(screen.getAllByTestId("skeleton-block")).toHaveLength(9);
});

it("applies the section-specific heights", () => {
  render(<GroupWorkIndexSkeleton />);
  const heights = skeletonBlockMock.mock.calls.map(([props]) => props.height);
  expect(heights.slice(0, 4)).toEqual(["100px", "100px", "100px", "100px"]);
  expect(heights[4]).toBe("200px");
  expect(heights.slice(5)).toEqual(["80px", "80px", "80px", "80px"]);
});
