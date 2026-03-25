import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => {
      const Tag = typeof tag === "string" ? tag : "div";
      const rest = { ...props };
      delete rest.initial;
      delete rest.animate;
      delete rest.exit;
      delete rest.transition;
      delete rest.layoutId;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
}));

import { TabBar, TabContent } from "../../../components/common/TabBar/TabBar";

describe("TabBar", () => {
  it("renders tabs, applies variant classes, and changes tabs on click", () => {
    const onTabChange = vi.fn();
    render(
      <TabBar
        tabs={[{ id: "one", label: "One" }, { id: "two", label: "Two" }]}
        activeTab="one"
        onTabChange={onTabChange}
        layoutId="custom-underline"
        variant="compact"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Two" }));
    expect(onTabChange).toHaveBeenCalledWith("two");
    expect(screen.getByRole("button", { name: "One" }).className).toContain("tabActive");
    expect(screen.getByRole("button", { name: "Two" }).className).toContain("compact");
  });

  it("renders animated tab content with a custom min height", () => {
    render(
      <TabContent activeTab="details" minHeight={180}>
        <div>Panel body</div>
      </TabContent>
    );

    expect(screen.getByText("Panel body")).toBeInTheDocument();
    expect(screen.getByText("Panel body").parentElement).toHaveStyle({ minHeight: "180px" });
  });

  it("uses the default variant and min height when optional props are omitted", () => {
    render(
      <>
        <TabBar
          tabs={[{ id: "one", label: "One" }, { id: "two", label: "Two" }]}
          activeTab="two"
          onTabChange={vi.fn()}
        />
        <TabContent activeTab="summary">
          <div>Default panel</div>
        </TabContent>
      </>
    );

    expect(screen.getByRole("button", { name: "One" })).toBeInTheDocument();
    expect(screen.getByText("Default panel").parentElement).toHaveStyle({ minHeight: "320px" });
  });
});
