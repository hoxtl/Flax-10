import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import BackToTop from "../../../components/common/BackToTop/BackToTop";

vi.mock("lucide-react", () => ({
  ArrowUp: () => <svg data-testid="arrow-up" />,
}));

describe("BackToTop", () => {
  let scrollingElement;
  let contentContainer;
  let dashboardMain;
  let dashboardContentNoScrollTo;

  beforeEach(() => {
    vi.clearAllMocks();

    scrollingElement = document.createElement("div");
    contentContainer = document.createElement("div");
    dashboardMain = document.createElement("div");
    dashboardContentNoScrollTo = document.createElement("div");

    contentContainer.className = "page-content";
    dashboardMain.setAttribute("data-dashboard-main", "true");
    dashboardContentNoScrollTo.setAttribute("data-dashboard-main-content", "true");

    contentContainer.scrollTop = 0;
    dashboardMain.scrollTop = 0;
    dashboardContentNoScrollTo.scrollTop = 90;

    contentContainer.scrollTo = vi.fn(({ top }) => {
      contentContainer.scrollTop = top;
    });
    dashboardMain.scrollTo = vi.fn(({ top }) => {
      dashboardMain.scrollTop = top;
    });

    document.body.appendChild(contentContainer);
    document.body.appendChild(dashboardMain);
    document.body.appendChild(dashboardContentNoScrollTo);

    Object.defineProperty(document, "scrollingElement", {
      configurable: true,
      value: scrollingElement,
    });

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 0,
    });

    window.scrollTo = vi.fn();
    global.requestAnimationFrame = vi.fn((callback) => {
      callback();
      return 1;
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders immediately when alwaysVisible is true", () => {
    render(<BackToTop alwaysVisible />);
    expect(screen.getByRole("button", { name: /back to top/i })).toBeInTheDocument();
  });

  it("stays hidden until a tracked container has been scrolled", () => {
    const { rerender } = render(<BackToTop containerSelector=".page-content" />);
    expect(screen.queryByRole("button", { name: /back to top/i })).not.toBeInTheDocument();

    contentContainer.scrollTop = 120;
    fireEvent.scroll(contentContainer);
    rerender(<BackToTop containerSelector=".page-content" />);

    expect(screen.getByRole("button", { name: /back to top/i })).toBeInTheDocument();
  });

  it("scrolls matching containers back to the top when clicked", () => {
    render(<BackToTop alwaysVisible containerSelector=".page-content" />);
    fireEvent.click(screen.getByRole("button", { name: /back to top/i }));

    expect(contentContainer.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(dashboardMain.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("gracefully does nothing when no scroll containers are found", () => {
    render(<BackToTop alwaysVisible containerSelector=".missing-container" />);
    fireEvent.click(screen.getByRole("button", { name: /back to top/i }));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("falls back to assigning scrollTop when a container has no scrollTo method", () => {
    render(<BackToTop alwaysVisible containerSelector="[data-dashboard-main-content]" />);
    fireEvent.click(screen.getByRole("button", { name: /back to top/i }));

    expect(dashboardContentNoScrollTo.scrollTop).toBe(0);
  });
});
