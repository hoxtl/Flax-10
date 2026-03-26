import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EntityLinkChip from "../../../components/common/entity_link_chip/EntityLinkChip";

describe("EntityLinkChip", () => {
  it("renders a router link when a destination is provided inside router context", () => {
    render(
      <MemoryRouter>
        <EntityLinkChip to="/societies" className="custom-chip" title="Open societies">
          Societies
        </EntityLinkChip>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Societies" });
    expect(link).toHaveAttribute("href", "/societies");
    expect(link).toHaveAttribute("title", "Open societies");
    expect(link.className).toContain("custom-chip");
  });

  it("stops propagation when the link is clicked", () => {
    const parentClick = vi.fn();

    render(
      <MemoryRouter>
        <div onClick={parentClick}>
          <EntityLinkChip to="/calendar">Calendar</EntityLinkChip>
        </div>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Calendar" }));
    expect(parentClick).not.toHaveBeenCalled();
  });

  it("renders a button and forwards clicks when no router destination is available", () => {
    const onClick = vi.fn();
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <EntityLinkChip onClick={onClick} title="Fallback chip">
          Open modal
        </EntityLinkChip>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open modal" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(parentClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Open modal" })).toHaveAttribute("title", "Fallback chip");
  });
});
