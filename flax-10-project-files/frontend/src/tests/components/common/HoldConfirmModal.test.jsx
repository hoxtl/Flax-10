import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";

import HoldConfirmModal from "../../../components/common/hold_confirm_modal/HoldConfirmModal";

vi.mock("../../../components/common/standard_modal/StandardModal", () => ({
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

  function renderHoldModal(props = {}) {
    const onConfirm = vi.fn();
    render(
      <HoldConfirmModal
        title="Delete session"
        holdDuration={100}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        {...props}
      />
    );
    const holdButton = screen.getByRole("button", { name: props.holdLabel ?? "Hold to Delete" });
    return { holdButton, onConfirm };
  }

  function advance(ms) {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

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
    expect(screen.getByText("This cannot be undone")).toBeInTheDocument();
    expect(screen.getByText("All progress will be lost.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep session" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  describe("hold progress", () => {
    it("shows progress while held and resets on release", () => {
      const { holdButton } = renderHoldModal({ holdLabel: "Hold to confirm" });
      fireEvent.mouseDown(holdButton);
      advance(48);
      expect(screen.getByText("Hold…")).toBeInTheDocument();
      expect(holdButton.querySelector("span[style]")?.style.width).not.toBe("0%");

      fireEvent.mouseUp(holdButton);
      expect(screen.getByText("Hold to confirm")).toBeInTheDocument();
      expect(holdButton.querySelector("span[style]")).toBeNull();
    });

    it("cancels the hold when the cursor leaves", () => {
      const { holdButton } = renderHoldModal({ holdLabel: "Hold to confirm" });
      fireEvent.mouseDown(holdButton);
      advance(16);
      fireEvent.mouseLeave(holdButton);
      expect(holdButton.querySelector("span[style]")).toBeNull();
    });

    it("confirms after the hold duration completes", () => {
      const { holdButton, onConfirm } = renderHoldModal({ holdLabel: "Hold to confirm" });
      fireEvent.touchStart(holdButton);
      advance(120);
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Hold to confirm")).toBeInTheDocument();
    });
  });

  it("supports the default labels and touch cancellation", () => {
    const { holdButton } = renderHoldModal();
    fireEvent.touchStart(holdButton);
    advance(32);
    expect(screen.getByText("Hold…")).toBeInTheDocument();
    fireEvent.touchEnd(holdButton);
    expect(screen.getByText("Hold to Delete")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep It" })).toBeInTheDocument();
  });
});
