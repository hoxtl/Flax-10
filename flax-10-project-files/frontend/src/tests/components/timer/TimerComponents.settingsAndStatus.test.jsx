import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SessionStatus, TimerSettings } from "../../../components/timer/components/TimerComponents";

describe("TimerComponents settings and status", () => {
  it("renders the current session progress text", () => {
    render(<SessionStatus current={1} total={4} />);
    expect(screen.getByText("Session 2 of 4")).toBeInTheDocument();
  });

  it("shows and clears the minimum work-time disclaimer through direct input edits", () => {
    const onUpdate = vi.fn();
    render(<TimerSettings work={25} breakTime={5} sessions={3} onUpdate={onUpdate} disabled={false} />);

    const workInput = screen.getAllByRole("spinbutton")[0];
    const select = vi.fn();
    workInput.select = select;

    fireEvent.focus(workInput);
    expect(select).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(workInput, { key: "Enter" });
    fireEvent.change(workInput, { target: { value: "0" } });
    expect(screen.getByText("* Minimum study time is 1 minute")).toBeInTheDocument();

    fireEvent.blur(workInput);
    expect(onUpdate).toHaveBeenCalledWith("work", 1);
    expect(screen.queryByText("* Minimum study time is 1 minute")).not.toBeInTheDocument();
  });

  it("updates work, break, and session values through the real stepper controls", () => {
    const onUpdate = vi.fn();
    render(<TimerSettings work={10} breakTime={0} sessions={2} onUpdate={onUpdate} disabled={false} />);

    const workInput = screen.getAllByRole("spinbutton")[0];
    fireEvent.change(workInput, { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "Increase Work (min)" }));
    fireEvent.click(screen.getByRole("button", { name: "Decrease Work (min)" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase Break (min)" }));
    fireEvent.click(screen.getByRole("button", { name: "Decrease Break (min)" }));
    fireEvent.click(screen.getByRole("button", { name: "Decrease Sessions" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase Sessions" }));

    expect(onUpdate).toHaveBeenCalledWith("work", 11);
    expect(onUpdate).toHaveBeenCalledWith("break", 1);
    expect(onUpdate).toHaveBeenCalledWith("sessions", 1);
  });
});
