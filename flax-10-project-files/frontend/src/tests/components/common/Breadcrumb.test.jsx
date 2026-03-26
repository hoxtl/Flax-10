import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Breadcrumb from "../../../components/common/Breadcrumb/Breadcrumb";

describe("Breadcrumb", () => {
  it("renders nothing when crumbs are missing or empty", () => {
    const { container, rerender } = render(<Breadcrumb />);
    expect(container.firstChild).toBeNull();

    rerender(<Breadcrumb crumbs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders linked crumbs, separators, and a current page crumb", () => {
    render(
      <Breadcrumb
        crumbs={[
          { label: "Home", navKey: "home" },
          { label: "Profile", navKey: "profile" },
          { label: "Achievements" },
        ]}
      />
    );

    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByText("Achievements")).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByText("/")).toHaveLength(2);
  });

  it("dispatches the custom navigate event for clickable crumbs", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    render(<Breadcrumb crumbs={[{ label: "Analytics", navKey: "analytics" }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Analytics" }));

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "navigate",
        detail: "analytics",
      })
    );
  });
});
