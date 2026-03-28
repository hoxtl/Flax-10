import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import ErrorBoundary from "../../../../components/common/error_boundary/ErrorBoundary";

function ProblemChild() {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when nothing fails", () => {
    render(<ErrorBoundary><div>Safe content</div></ErrorBoundary>);
    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("renders the provided fallback when a child throws", () => {
    render(<ErrorBoundary fallback={<div>Custom fallback</div>}><ProblemChild /></ErrorBoundary>);
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });

  it("calls onRetry instead of reloading the page", () => {
    const onRetry = vi.fn();
    render(<ErrorBoundary onRetry={onRetry}><ProblemChild /></ErrorBoundary>);
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("reloads the page when retrying without an onRetry callback", () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload },
    });

    render(<ErrorBoundary><ProblemChild /></ErrorBoundary>);
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("shows debug details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(<ErrorBoundary><ProblemChild /></ErrorBoundary>);

    expect(screen.getByText("Error: boom")).toBeInTheDocument();
    process.env.NODE_ENV = originalEnv;
  });
});
