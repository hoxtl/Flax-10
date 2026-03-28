import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../../../hooks/useCountUp", () => ({
  useCountUp: () => ({ current: null }),
}));

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      ...actual.motion,
      circle: (props) => <circle {...props} />,
    },
  };
});

vi.mock("../../../../pages/profile/components/widgets/ProfileCompat.module.css", () => ({
  default: {
    compatCard: "compatCard",
    compatHero: "compatHero",
    compatRing: "compatRing",
    compatRingTrack: "compatRingTrack",
    compatRingProgress: "compatRingProgress",
    compatRingWrap: "compatRingWrap",
    compatHeroContent: "compatHeroContent",
    compatHeroLabel: "compatHeroLabel",
    compatHeroValueRow: "compatHeroValueRow",
    compatHeroValue: "compatHeroValue",
    compatHeroUnit: "compatHeroUnit",
    compatHeroMatch: "compatHeroMatch",
    compatDetail: "compatDetail",
    studyTogetherBtn: "studyTogetherBtn",
    compatBottomRow: "compatBottomRow",
    sparklineWrap: "sparklineWrap",
    sparklineLabel: "sparklineLabel",
    sparklineDots: "sparklineDots",
    sparkDot: "sparkDot",
    sparkDot0: "sparkDot0",
    sparkDot1: "sparkDot1",
    sparkDot2: "sparkDot2",
    sparkDot3: "sparkDot3",
  },
}));

import { CompatibilityScore } from "../../../../pages/profile/components/widgets/CompatibilityScore";

describe("CompatibilityScore CSS fallback", () => {
  it("falls back to the base spark dot class when a level class is missing", () => {
    render(
      <CompatibilityScore
        viewedSummary={{ persona: { id: "night_owl" } }}
        currentUserSummary={{ persona: { id: "night_owl" } }}
        sharedModuleCount={2}
        totalModuleCount={2}
        activitySparkline={[
          { date: "1", level: 4 },
          { date: "2", level: 4 },
          { date: "3", level: 4 },
          { date: "4", level: 4 },
          { date: "5", level: 4 },
          { date: "6", level: 4 },
          { date: "7", level: 4 },
        ]}
      />,
    );

    expect(screen.getByText("Study momentum")).toBeInTheDocument();
    const dots = document.querySelectorAll(".sparkDot");
    expect(dots.length).toBe(7);
  });
});
