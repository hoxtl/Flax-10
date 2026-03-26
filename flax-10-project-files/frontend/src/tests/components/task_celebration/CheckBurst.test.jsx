/**
 * Tests for CheckBurst: wrap with burst particles, active/inactive className.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckBurst } from "../../../components/task_celebration/CheckBurst";

describe("CheckBurst", () => {
  it("renders children", () => {
    render(<CheckBurst active={false}><button>Check</button></CheckBurst>);
    expect(screen.getByRole("button", { name: /Check/i })).toBeInTheDocument();
  });

  it("renders burst container with 8 particles", () => {
    const { container } = render(<CheckBurst active={false} />);
    const particles = container.querySelectorAll("[style*='--angle']");
    expect(particles.length).toBe(8);
  });

  it("applies active class when active is true", () => {
    const { container } = render(<CheckBurst active={true} />);
    const wrap = container.firstChild;
    expect(wrap.className).toMatch(/active/);
  });

  it("does not apply active class when active is false", () => {
    const { container } = render(<CheckBurst active={false} />);
    const wrap = container.firstChild;
    expect(wrap.className).not.toMatch(/active/);
  });

  it("appends custom className when provided", () => {
    const { container } = render(<CheckBurst active={false} className="custom" />);
    const wrap = container.firstChild;
    expect(wrap.className).toMatch(/custom/);
  });
});
