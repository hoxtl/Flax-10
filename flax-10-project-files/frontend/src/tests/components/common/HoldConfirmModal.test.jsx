import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";

import HoldConfirmModal from "../../../components/common/HoldConfirmModal/HoldConfirmModal";

vi.mock("../../../components/common/StandardModal/StandardModal", () => ({
  default: ({ title, onClose, children }) => (
    <div data-testid="modal-shell">
      <h2>{title}</h2>
      <button type="button" onClick={onClose}>
        Close
      </button>
      {children}
    </div>
  ),
}));

describe("HoldConfirmModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders warning content and lets the user cancel", () => {
    const onCancel = vi.fn();

    render(
      <HoldConfirmModal
        title="Delete session"
        warningBanner="This cannot be undone"
        warningText="All progress will be lost."
        cancelLabel="Keep session"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText("Delete session")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone")).toBeInTheDocument();
    expect(screen.getByText("All progress will be lost.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep session" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("updates progress while held, resets on release, and confirms after a full hold", () => {
    const onConfirm = vi.fn();

    render(
      <HoldConfirmModal
        title="Delete session"
        holdDuration={100}
        holdLabel="Hold to confirm"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    const holdButton = screen.getByRole("button", { name: "Hold to confirm" });

    fireEvent.mouseDown(holdButton);
    act(() => {
      vi.advanceTimersByTime(48);
    });

    expect(screen.getByText("Hold…")).toBeInTheDocument();
    expect(holdButton.querySelector("span[style]")?.style.width).not.toBe("0%");

    fireEvent.mouseUp(holdButton);
    expect(screen.getByText("Hold to confirm")).toBeInTheDocument();
    expect(holdButton.querySelector("span[style]")).toBeNull();

    fireEvent.mouseDown(holdButton);
    act(() => {
      vi.advanceTimersByTime(16);
    });
    fireEvent.mouseLeave(holdButton);
    expect(holdButton.querySelector("span[style]")).toBeNull();

    fireEvent.touchStart(holdButton);
    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Hold to confirm")).toBeInTheDocument();
  });

  it("supports the default labels and touch cancellation", () => {
    render(
      <HoldConfirmModal
        title="Delete session"
        holdDuration={100}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const holdButton = screen.getByRole("button", { name: "Hold to Delete" });
    fireEvent.touchStart(holdButton);
    act(() => {
      vi.advanceTimersByTime(32);
    });
    expect(screen.getByText("Hold…")).toBeInTheDocument();

    fireEvent.touchEnd(holdButton);
    expect(screen.getByText("Hold to Delete")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep It" })).toBeInTheDocument();
  });
});
