/*
 * Tests for shared animated dropdown support components.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_, tag) => {
      const Tag = typeof tag === "string" ? tag : "div";
      return ({ children, initial, animate, exit, transition, variants, whileTap, ...props }) => <Tag {...props}>{children}</Tag>;
    },
  }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import AnimatedDropdown from "../../../../components/common/animated_dropdown";
import ScrollToTop from "../../../../components/common/scroll_to_top/ScrollToTop";

function renderScrollToTop(props = {}) {
  return render(
    <MemoryRouter initialEntries={["/tasks"]}>
      <ScrollToTop {...props} />
    </MemoryRouter>,
  );
}

describe("common coverage topups", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("renders the selected flat option state and appends trigger class names", () => {
    const { container } = render(
      <AnimatedDropdown
        value="beta"
        onChange={vi.fn()}
        placeholder="Pick"
        options={[
          { value: "alpha", label: "Alpha" },
          { value: "beta", label: "Beta" },
        ]}
        isOpen
        triggerClassName="extra-trigger"
      />,
    );

    expect(container.querySelector("button.extra-trigger")).not.toBeNull();
    expect(screen.getAllByText("Beta")[1].closest("button")?.className).toContain("dropdownItemActive");
  });

  it("prefers explicit scroll containers", () => {
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;
    const selected = document.createElement("div");
    selected.className = "selected-container";
    selected.scrollTop = 45;
    document.body.appendChild(selected);
    renderScrollToTop({ containerSelector: ".selected-container" });
    expect(scrollToMock).toHaveBeenCalledWith(0, 0);
    expect(selected.scrollTop).toBe(0);
  });

  it("falls back to dashboard-main-content containers", () => {
    const fallback = document.createElement("div");
    fallback.setAttribute("data-dashboard-main-content", "true");
    fallback.scrollTop = 75;
    document.body.appendChild(fallback);
    renderScrollToTop();
    expect(fallback.scrollTop).toBe(0);
  });

  it("falls back to dashboard-main containers and window scrolling", () => {
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;
    const fallback = document.createElement("div");
    fallback.setAttribute("data-dashboard-main", "true");
    fallback.scrollTop = 32;
    document.body.appendChild(fallback);
    renderScrollToTop();
    expect(fallback.scrollTop).toBe(0);
    document.body.removeChild(fallback);
    expect(scrollToMock).toHaveBeenCalledWith(0, 0);
  });
});
