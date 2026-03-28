import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GroupWorkProjectModuleBadge from "@/pages/group_work/components/ProjectModuleBadge";

vi.mock("@/components/common/badge/Badge", () => ({
  default: ({ children, className }) => <div className={className}>{children}</div>,
}));

describe("GroupWorkProjectModuleBadge", () => {
  it("renders nothing when no code or name", () => {
    const { container } = render(
      <MemoryRouter>
        <GroupWorkProjectModuleBadge project={{}} />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders only code when name missing", () => {
    render(
      <MemoryRouter>
        <GroupWorkProjectModuleBadge project={{ course_code: "CS101" }} />
      </MemoryRouter>
    );
    expect(screen.getByText("CS101")).toBeTruthy();
    expect(screen.queryByLabelText(/module/)).toBeTruthy();
  });

  it("renders only name when code missing", () => {
    render(
      <MemoryRouter>
        <GroupWorkProjectModuleBadge project={{ module_name: "Software Engineering" }} />
      </MemoryRouter>
    );
    expect(screen.getByText("Software Engineering")).toBeTruthy();
  });

  it("renders both when present", () => {
    render(
      <MemoryRouter>
        <GroupWorkProjectModuleBadge project={{ course_code: "CS101", module_name: "SE" }} />
      </MemoryRouter>
    );
    expect(screen.getByText("CS101")).toBeTruthy();
    expect(screen.getByText("SE")).toBeTruthy();
  });

  it("stops propagation on click", () => {
    render(
      <MemoryRouter>
        <GroupWorkProjectModuleBadge project={{ course_code: "CS101" }} />
      </MemoryRouter>
    );
    const link = screen.getByRole("link");
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    const stopSpy = vi.spyOn(event, "stopPropagation");
    
    fireEvent(link, event);
    expect(stopSpy).toHaveBeenCalled();
  });

  it("hits aria-label fallback for code when name is missing", () => {
    // Hits line 17: aria-label={`Open ${name || code} module`}
    render(
      <MemoryRouter>
        <GroupWorkProjectModuleBadge project={{ course_code: "CS2" }} />
      </MemoryRouter>
    );
    expect(screen.getByLabelText("Open CS2 module")).toBeTruthy();
  });

  it("hits the inline span for name when code is missing", () => {
    // Hits line 22: <span className={codeClassName}>{code || name}</span>
    render(
      <MemoryRouter>
        <GroupWorkProjectModuleBadge project={{ module_name: "Physics" }} />
      </MemoryRouter>
    );
    expect(screen.getByText("Physics")).toBeTruthy();
  });
});
