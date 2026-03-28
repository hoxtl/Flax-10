import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LandingPageContent from "../../../../components/ui/landing_page/LandingPageContent";
import { defaultGlobeConfig } from "../../../../components/ui/landing_page/landingPageConstants";

vi.mock("../../../../components/common", () => ({
  PrimaryButton: ({ children, className, onClick, variant }) => (
    <button type="button" className={className} data-variant={variant} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("../../../../components/ui/components/globe", () => ({
  default: () => <div data-testid="landing-globe" />,
}));

const styles = new Proxy({}, { get: (_, key) => key });

const primaryAction = vi.fn();
const secondaryAction = vi.fn();

const sections = [
  {
    id: "hero", title: "Hero", subtitle: "Everything in one place", description: "A focused overview",
    align: "center", badge: "01",
    features: [{ title: "Track progress", description: "Stay on top of the day." }],
    content: <div>Inline content</div>,
    actions: [
      { label: "Get started", onClick: primaryAction },
      { label: "Learn more", variant: "secondary", onClick: secondaryAction },
    ],
  },
  { id: "details", title: "Details", description: "A second section", align: "right" },
  { id: "finish", title: "Finish", description: "The final step" },
];

const containerRef = { current: null };
const sectionRefs = { current: [] };

function renderLanding() {
  return render(
    <LandingPageContent
      activeSection={1}
      className="extra-shell"
      containerRef={containerRef}
      displayTransform="translate3d(10vw, 20vh, 0)"
      globeOpacity={0.5}
      scrollProgress={0.35}
      sectionRefs={sectionRefs}
      sections={sections}
      styles={styles}
      topPills={["Plan", "Focus"]}
    />,
  );
}

describe("LandingPageContent and landing sections", () => {
  it("renders the composed landing layout, globe defaults, and section content", () => {
    renderLanding();

    expect(defaultGlobeConfig.positions).toHaveLength(4);
    expect(screen.getByTestId("landing-globe")).toBeInTheDocument();
    expect(screen.getByLabelText("Key features")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Landing page sections" })).toBeInTheDocument();
    expect(screen.getByText("Hero")).toBeInTheDocument();
    expect(screen.getByText("Everything in one place")).toBeInTheDocument();
    expect(screen.getByText("Track progress")).toBeInTheDocument();
    expect(screen.getByText("Inline content")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Get started"));
    fireEvent.click(screen.getByText("Learn more"));
    expect(primaryAction).toHaveBeenCalledTimes(1);
    expect(secondaryAction).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Learn more")).toHaveAttribute("data-variant", "secondary");
  });

  it("applies correct section classes and styles", () => {
    const { container } = renderLanding();
    const renderedSections = container.querySelectorAll("section");
    expect(renderedSections).toHaveLength(3);
    expect(renderedSections[0].className).toContain("sectionFirst");
    expect(renderedSections[0].className).toContain("sectionCenter");
    expect(renderedSections[0].className).toContain("sectionInactive");
    expect(renderedSections[1].className).toContain("sectionAlternate");
    expect(renderedSections[1].className).toContain("sectionRight");
    expect(renderedSections[1].className).toContain("sectionActive");
    expect(renderedSections[2].className).toContain("sectionLast");
    expect(renderedSections[1].style.getPropertyValue("--section-delay")).toBe("0.08s");
    expect(renderedSections[0].style.getPropertyValue("--section-shift")).toBe("-10px");
    expect(renderedSections[1].style.getPropertyValue("--section-shift")).toBe("10px");
    expect(renderedSections[1].querySelector(".featureGrid")).toBeNull();
    expect(renderedSections[1].querySelector(".sectionContent")).toBeNull();
    expect(renderedSections[1].querySelector(".actionRow")).toBeNull();
  });

  it("populates section refs and wrapper styles", () => {
    const { container } = renderLanding();
    expect(sectionRefs.current).toHaveLength(3);
    expect(sectionRefs.current[1]?.id).toBe("details");
    expect(container.querySelector(".wrapper")).toHaveClass("extra-shell");
    expect(container.querySelector(".progressBar")).toHaveStyle({ transform: "scaleX(0.35)" });
    expect(container.querySelector(".globeWrap")).toHaveStyle({
      opacity: "0.5",
      transform: "translate3d(10vw, 20vh, 0)",
    });
  });
});
