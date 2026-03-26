import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import LocationLink from "../../../components/common/LocationLink/LocationLink";

function renderLink(props) {
  return render(
    <MemoryRouter>
      <LocationLink {...props} />
    </MemoryRouter>
  );
}

describe("LocationLink", () => {
  it("renders nothing without a location", () => {
    const { container } = renderLink({});
    expect(container.firstChild).toBeNull();
  });

  it("builds the default map link and renders icon and text class names", () => {
    renderLink({
      location: "Bush House",
      className: "outer-link",
      iconClassName: "custom-icon",
      textClassName: "custom-text",
      iconSize: 20,
    });

    const link = screen.getByRole("link", { name: "Open UniMap for Bush House" });
    expect(link).toHaveAttribute("href", "/map?destination=Bush%20House");
    expect(link.className).toContain("outer-link");

    const icon = link.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("width", "20");
    expect(icon?.className.baseVal || icon?.getAttribute("class") || "").toContain("custom-icon");

    expect(screen.getByText("Bush House")).toHaveClass("custom-text");
  });

  it("uses a custom route, hides the icon, and forwards clicks", () => {
    const onClick = vi.fn();
    renderLink({
      location: "Strand Campus",
      to: "/campus-map",
      showIcon: false,
      onClick,
    });

    const link = screen.getByRole("link", { name: "Open UniMap for Strand Campus" });
    expect(link).toHaveAttribute("href", "/campus-map");
    expect(link.querySelector("svg")).toBeNull();

    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses the default icon size and icon class trimming when no custom props are passed", () => {
    renderLink({ location: "Maughan Library" });

    const link = screen.getByRole("link", { name: "Open UniMap for Maughan Library" });
    const icon = link.querySelector("svg");

    expect(icon).toHaveAttribute("width", "14");
    expect(icon?.getAttribute("class") || "").not.toContain("undefined");
  });
});
