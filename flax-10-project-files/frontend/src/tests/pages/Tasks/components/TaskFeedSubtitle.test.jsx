import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { getTaskFeedSubtitle } from "../../../../pages/Tasks/components/TaskFeedSubtitle";

function renderSubtitle(activeList, isReadingActive) {
  render(<div>{getTaskFeedSubtitle(activeList, isReadingActive)}</div>);
}

describe("TaskFeedSubtitle", () => {
  it("renders the generic task subtitle when no reading list is active", () => {
    renderSubtitle(null, false);

    expect(screen.getByText(/urgent tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/coursework/i)).toBeInTheDocument();
  });

  it("renders module and course text for a structured reading list", () => {
    renderSubtitle({ name: "CS4404 - Machine Learning" }, true);

    expect(screen.getByText(/keep your/i)).toBeInTheDocument();
    expect(screen.getByText(/machine learning \(cs4404\)/i)).toBeInTheDocument();
    expect(screen.getByText(/revision prep/i)).toBeInTheDocument();
  });

  it("falls back to a module-only label or a generic module label", () => {
    const { rerender } = render(<div>{getTaskFeedSubtitle({ name: "Reading list - Clinical Skills" }, true)}</div>);
    expect(screen.getByText(/clinical skills/i)).toBeInTheDocument();

    rerender(<div>{getTaskFeedSubtitle({ name: "Seminar notes" }, true)}</div>);
    expect(screen.getByText(/this module/i)).toBeInTheDocument();
  });
});
