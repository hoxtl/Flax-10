import React from "react";
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

  it("prefers explicit scroll containers and dashboard-main-content fallbacks", async () => {
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    const selected = document.createElement("div");
    selected.className = "selected-container";
    selected.scrollTop = 45;
    document.body.appendChild(selected);

    const fallback = document.createElement("div");
    fallback.setAttribute("data-dashboard-main-content", "true");
    fallback.scrollTop = 75;
    document.body.appendChild(fallback);

    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <ScrollToTop containerSelector=".selected-container" />
      </MemoryRouter>,
    );
    expect(scrollToMock).toHaveBeenCalledWith(0, 0);
    expect(selected.scrollTop).toBe(0);

    document.body.removeChild(selected);
    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <ScrollToTop />
      </MemoryRouter>,
    );
    expect(fallback.scrollTop).toBe(0);
  });

  it("falls back to dashboard-main containers and window-only scrolling", () => {
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    const dashboardMain = document.createElement("div");
    dashboardMain.setAttribute("data-dashboard-main", "true");
    dashboardMain.scrollTop = 32;
    document.body.appendChild(dashboardMain);

    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <ScrollToTop />
      </MemoryRouter>,
    );

    expect(dashboardMain.scrollTop).toBe(0);
    document.body.removeChild(dashboardMain);

    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <ScrollToTop />
      </MemoryRouter>,
    );

    expect(scrollToMock).toHaveBeenCalledWith(0, 0);
  });
});
