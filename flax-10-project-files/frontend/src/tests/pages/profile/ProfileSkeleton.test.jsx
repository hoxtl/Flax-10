import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import ProfileSkeleton from "../../../pages/profile/components/ProfileSkeleton";

describe("ProfileSkeleton", () => {
  it("renders the header skeleton and the default right column widgets", () => {
    render(<ProfileSkeleton blocks={<div data-testid="left-block">Left block</div>} />);

    expect(document.querySelectorAll('[class*="skelAvatar"]').length).toBe(1);
    expect(document.querySelectorAll('[class*="skelName"]').length).toBe(1);
    expect(document.querySelectorAll('[class*="skelBio"]').length).toBe(1);
    expect(document.querySelectorAll('[class*="skelStat"]').length).toBe(4);
    expect(screen.getByTestId("left-block")).toBeInTheDocument();
    expect(document.querySelectorAll('[class*="skelWidget"]').length).toBe(3);
  });

  it("renders without left blocks when none are provided", () => {
    const { container } = render(<ProfileSkeleton />);

    expect(container.querySelector('[data-testid="left-block"]')).toBeNull();
    expect(document.querySelectorAll('[class*="skelWidget"]').length).toBe(3);
  });
});
