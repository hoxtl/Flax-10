import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SegmentDetailPanel from "../../../pages/attendance/components/SegmentDetailPanel";

vi.mock("../../../pages/attendance/components/SegmentDetailHeader", () => ({
  default: ({ segmentLabel, count, onClose }) => (
    <div>
      <span>{segmentLabel}</span>
      <span>{count} events</span>
      <button type="button" onClick={onClose}>
        close-panel
      </button>
    </div>
  ),
}));

vi.mock("../../../pages/attendance/components/SegmentDetailList", () => ({
  default: ({ events, toggling, onToggleStatus }) => (
    <div>
      <span data-testid="events-count">{events.length}</span>
      <span data-testid="toggling-json">{JSON.stringify(toggling)}</span>
      <button type="button" onClick={() => onToggleStatus(events[0].id, events[0].attended)}>
        toggle-first
      </button>
    </div>
  ),
}));

describe("SegmentDetailPanel", () => {
  it("renders the header, event count, custom class, and close handler", () => {
    const onClose = vi.fn();
    const { container } = render(
      <SegmentDetailPanel
        segmentLabel="Lecture"
        events={[{ id: 1, title: "Algebra", attended: false }]}
        onClose={onClose}
        className="extra-panel"
      />,
    );

    expect(screen.getByText("Lecture")).toBeInTheDocument();
    expect(screen.getByText("1 events")).toBeInTheDocument();
    expect(screen.getByTestId("events-count")).toHaveTextContent("1");
    expect(container.firstChild.className).toMatch(/extra-panel/);

    fireEvent.click(screen.getByRole("button", { name: /close-panel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("tracks toggling state while onToggleStatus runs", async () => {
    const onToggleStatus = vi.fn(() => new Promise((resolve) => { setTimeout(resolve, 50); }));
    render(<SegmentDetailPanel segmentLabel="Lab" events={[{ id: 4, title: "Lab", attended: true }]} onToggleStatus={onToggleStatus} />);
    fireEvent.click(screen.getByRole("button", { name: /toggle-first/i }));
    await waitFor(() => expect(screen.getByTestId("toggling-json")).toHaveTextContent('"4":true'));
    expect(onToggleStatus).toHaveBeenCalledWith(4, false);
  });

  it("resets toggling state after onToggleStatus completes", async () => {
    let resolveToggle;
    const onToggleStatus = vi.fn(() => new Promise((resolve) => { resolveToggle = resolve; }));
    render(<SegmentDetailPanel segmentLabel="Lab" events={[{ id: 4, title: "Lab", attended: true }]} onToggleStatus={onToggleStatus} />);
    fireEvent.click(screen.getByRole("button", { name: /toggle-first/i }));
    resolveToggle();
    await waitFor(() => expect(screen.getByTestId("toggling-json")).toHaveTextContent('"4":false'));
  });

  it("resets toggling state even when no status callback is provided", async () => {
    render(
      <SegmentDetailPanel
        segmentLabel="Seminar"
        events={[{ id: 8, title: "Law", attended: false }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /toggle-first/i }));

    await waitFor(() =>
      expect(screen.getByTestId("toggling-json")).toHaveTextContent('"8":false'),
    );
  });
});
