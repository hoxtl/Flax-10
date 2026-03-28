import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import ProfileSkeleton from "../../../../pages/profile/components/ProfileSkeleton";

// Mock styles
vi.mock("../../../../pages/profile/styles/ProfilePage.module.css", () => ({
  default: {
    container: "container",
    fullSkelContainer: "fullSkelContainer",
    skelHeader: "skelHeader",
    skelAvatar: "skelAvatar",
    skelHeaderInfo: "skelHeaderInfo",
    skelName: "skelName",
    skelBio: "skelBio",
    skelStatsRow: "skelStatsRow",
    skelStat: "skelStat",
    skelBody: "skelBody",
    skelLeftCol: "skelLeftCol",
    skelRightCol: "skelRightCol",
    skelWidget: "skelWidget"
  }
}));

describe("ProfileSkeleton", () => {
  it("renders correctly with blocks", () => {
    const { container } = render(
      <ProfileSkeleton blocks={<div data-testid="mock-blocks">Blocks Content</div>} />
    );
    
    expect(container.querySelector(".container")).toBeInTheDocument();
    expect(container.querySelector(".fullSkelContainer")).toBeInTheDocument();
    expect(container.querySelector(".skelHeader")).toBeInTheDocument();
    expect(container.querySelector(".skelAvatar")).toBeInTheDocument();
    expect(container.querySelector(".skelBody")).toBeInTheDocument();
    expect(container.querySelector(".skelLeftCol")).toBeInTheDocument();
    expect(container.querySelector(".skelRightCol")).toBeInTheDocument();
    
    // Verify blocks are passed through
    expect(container.querySelector('[data-testid="mock-blocks"]')).toBeInTheDocument();
    expect(container.textContent).toContain("Blocks Content");
  });

  it("renders subcomponents in header and body", () => {
    const { container } = render(<ProfileSkeleton />);
    
    // Header info
    expect(container.querySelector(".skelHeaderInfo")).toBeInTheDocument();
    expect(container.querySelector(".skelName")).toBeInTheDocument();
    expect(container.querySelector(".skelBio")).toBeInTheDocument();
    
    // Stats row
    expect(container.querySelector(".skelStatsRow")).toBeInTheDocument();
    expect(container.querySelectorAll(".skelStat")).toHaveLength(3);
    
    // Right column widgets
    expect(container.querySelectorAll(".skelWidget")).toHaveLength(3);
  });
});
