import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  motion: {
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
}));

import CelebrationEmoji from "../../../../components/common/motion/CelebrationEmoji";
import {
  STANDARD_EASE,
  checkmarkMotion,
  chevronRotateTransition,
  fadeInMotion,
  getDropdownItemMotion,
  getDropdownPanelMotion,
  pageMotion,
  tabContentMotion,
  viewSwapMotion,
} from "../../../../components/common/motion/transitions";

describe("common motion helpers", () => {
  it("returns dropdown panel motion for both directions", () => {
    expect(getDropdownPanelMotion()).toMatchObject({
      initial: { opacity: 0, y: -8, scale: 0.985 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -8, scale: 0.985 },
    });

    expect(getDropdownPanelMotion(true)).toMatchObject({
      initial: { opacity: 0, y: 8, scale: 0.985 },
      exit: { opacity: 0, y: 8, scale: 0.985 },
    });
  });

  it("returns item motion with an index-based delay and shared presets", () => {
    expect(getDropdownItemMotion(3)).toEqual({
      initial: { opacity: 0, x: -10 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.15, delay: 0.06, ease: STANDARD_EASE },
    });

    expect(getDropdownItemMotion()).toEqual({
      initial: { opacity: 0, x: -10 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.15, delay: 0, ease: STANDARD_EASE },
    });

    expect(fadeInMotion.transition.ease).toBe(STANDARD_EASE);
    expect(tabContentMotion.transition.ease).toBe(STANDARD_EASE);
    expect(viewSwapMotion.transition.ease).toBe(STANDARD_EASE);
    expect(pageMotion.transition.ease).toBe(STANDARD_EASE);
    expect(checkmarkMotion.transition.type).toBe("spring");
    expect(chevronRotateTransition.ease).toBe(STANDARD_EASE);
  });

  it("renders the default and custom celebration emoji variants", () => {
    const { rerender } = render(<CelebrationEmoji />);

    let emoji = screen.getByText("🎉");
    expect(emoji).toHaveAttribute("aria-hidden");
    expect(emoji.style.getPropertyValue("--celebration-size")).toBe("2.4rem");

    rerender(<CelebrationEmoji emoji="✨" className="extra" size="3rem" />);

    emoji = screen.getByText("✨");
    expect(emoji.className).toContain("extra");
    expect(emoji.style.getPropertyValue("--celebration-size")).toBe("3rem");
  });
});
