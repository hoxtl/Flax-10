import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import Tabs from "../../../../components/common/tabs/Tabs";

vi.mock("../../../../components/common/tabs/Tabs.module.css", () => ({
  default: {
    container: "container",
    compact: "compact",
    tabBar: "tabBar",
    tab: "tab",
    active: "active",
    headingTab: "headingTab",
    tabIndicator: "tabIndicator",
    content: "content",
  },
}));

describe("Tabs active-tab fallback", () => {
  it("renders no tab content when the active tab id does not match any tab", () => {
    const tabs = [
      { id: "one", label: "One", content: <span>Content One</span> },
      { id: "two", label: "Two", content: <span>Content Two</span> },
    ];

    const { container } = render(<Tabs tabs={tabs} activeTab="missing" onTabChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Two" })).toBeInTheDocument();
    expect(screen.queryByText("Content One")).toBeNull();
    expect(screen.queryByText("Content Two")).toBeNull();
    expect(container.querySelector(".content")?.textContent).toBe("");
  });

  it("accepts a non-default content presence mode while rendering the active tab content", () => {
    render(
      <Tabs
        tabs={[
          { id: "one", label: "One", content: <span>Content One</span> },
          { id: "two", label: "Two", content: <span>Content Two</span> },
        ]}
        activeTab="two"
        onTabChange={vi.fn()}
        contentPresenceMode="sync"
      />,
    );

    expect(screen.getByText("Content Two")).toBeInTheDocument();
  });
});
