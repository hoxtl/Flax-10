import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const reduceMotion = vi.fn(() => true);

vi.mock("framer-motion", () => ({
  motion: {
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  useReducedMotion: () => reduceMotion(),
}));

import { LeaveTimerModal, EndEarlyModal } from "../../../../components/timer/popups/ExitModals";

describe("Exit modals coverage", () => {
  it("uses the reduced-motion progress branch and onTakeBreak when provided", () => {
    const onCancel = vi.fn();
    const onTakeBreak = vi.fn();
    const onPause = vi.fn();

    render(
      <LeaveTimerModal
        onCancel={onCancel}
        onPause={onPause}
        onExit={vi.fn()}
        onTakeBreak={onTakeBreak}
        timeLeftSeconds={30}
        sessionTotalSeconds={120}
      />,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75");
    fireEvent.click(screen.getByText("Take a 5m Break instead"));
    expect(onTakeBreak).toHaveBeenCalled();
    expect(onPause).not.toHaveBeenCalled();
  });

  it("falls back to onPause when take-break is not supplied", () => {
    const onPause = vi.fn();

    render(
      <LeaveTimerModal
        onCancel={vi.fn()}
        onPause={onPause}
        onExit={vi.fn()}
        timeLeftSeconds={60}
        sessionTotalSeconds={120}
      />,
    );

    fireEvent.click(screen.getByText("Take a 5m Break instead"));
    expect(onPause).toHaveBeenCalled();
  });

  it("renders both end-early copy branches", () => {
    const { rerender } = render(<EndEarlyModal onConfirm={vi.fn()} onCancel={vi.fn()} elapsedSeconds={60} goalSeconds={300} />);
    expect(screen.getByText(/You're so close to your/)).toBeInTheDocument();

    rerender(<EndEarlyModal onConfirm={vi.fn()} onCancel={vi.fn()} elapsedSeconds={360} goalSeconds={300} />);
    expect(screen.getByText(/already reached your/)).toBeInTheDocument();
  });
});
