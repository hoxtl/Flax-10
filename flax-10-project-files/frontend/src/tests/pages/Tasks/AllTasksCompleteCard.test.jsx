/**
 * Tests for Tasks AllTasksCompleteCard: rendering emoji, message, sub, CTA button, and children.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AllTasksCompleteCard from "../../../pages/Tasks/components/AllTasksCompleteCard";

describe("AllTasksCompleteCard", () => {
  it("renders default emoji and message", () => {
    render(<AllTasksCompleteCard message="All done!" />);
    expect(screen.getByText("All done!")).toBeInTheDocument();
    expect(screen.getByText("🎉")).toBeInTheDocument();
  });

  it("renders custom emoji when provided", () => {
    render(<AllTasksCompleteCard emoji="✨" message="Done" />);
    expect(screen.getByText("✨")).toBeInTheDocument();
  });

  it("renders sub text when provided", () => {
    render(<AllTasksCompleteCard message="Done" sub="You can relax now." />);
    expect(screen.getByText("You can relax now.")).toBeInTheDocument();
  });

  it("renders CTA button when ctaLabel and onCtaClick provided", () => {
    const onCtaClick = vi.fn();
    render(<AllTasksCompleteCard message="Done" ctaLabel="View calendar" onCtaClick={onCtaClick} />);
    const btn = screen.getByRole("button", { name: /View calendar/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onCtaClick).toHaveBeenCalledTimes(1);
  });

  it("does not render CTA when ctaLabel missing", () => {
    render(<AllTasksCompleteCard message="Done" onCtaClick={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders children when no CTA button", () => {
    render(
      <AllTasksCompleteCard message="Done">
        <span data-testid="child">Extra content</span>
      </AllTasksCompleteCard>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Extra content")).toBeInTheDocument();
  });
});
