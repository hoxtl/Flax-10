import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LandingSectionNav from "../../../components/ui/landing-page/LandingSectionNav";
import LandingTopPills from "../../../components/ui/landing-page/LandingTopPills";

const styles = new Proxy({}, { get: (_, key) => key });

describe("landing page components", () => {
  it("renders top pills when present and hides them when empty", () => {
    const { rerender, container } = render(
      <LandingTopPills styles={styles} topPills={["Plan smarter", "Stay focused"]} />,
    );

    expect(screen.getByLabelText("Key features")).toBeInTheDocument();
    expect(screen.getByText(/Plan smarter/)).toBeInTheDocument();
    expect(screen.getByText(/Stay focused/)).toBeInTheDocument();

    rerender(<LandingTopPills styles={styles} topPills={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders section navigation with badges and scrolls to the chosen section", () => {
    const scrollIntoView = vi.fn();
    const sectionRefs = {
      current: [
        { scrollIntoView },
        { scrollIntoView: vi.fn() },
      ],
    };

    render(
      <LandingSectionNav
        activeSection={1}
        sectionRefs={sectionRefs}
        sections={[
          { id: "hero", title: "Hero", badge: "Intro" },
          { id: "features", title: "Features" },
        ]}
        styles={styles}
      />,
    );

    expect(screen.getByText("Intro")).toBeInTheDocument();
    expect(screen.getByText("Section 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go to Hero" }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });
});
