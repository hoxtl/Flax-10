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

  it("renders section navigation with badges", () => {
    render(<LandingSectionNav activeSection={1} sectionRefs={{ current: [] }} sections={[{ id: "h", title: "H", badge: "I" }, { id: "f", title: "F" }]} styles={styles} />);
    expect(screen.getByText("I")).toBeInTheDocument();
  });

  it("scrolls to the chosen section on click", () => {
    const scrollIntoView = vi.fn();
    render(<LandingSectionNav activeSection={1} sectionRefs={{ current: [{ scrollIntoView }, { scrollIntoView: vi.fn() }] }} sections={[{ id: "h", title: "H" }, { id: "f", title: "F" }]} styles={styles} />);
    fireEvent.click(screen.getByRole("button", { name: /go to h/i }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });
});
