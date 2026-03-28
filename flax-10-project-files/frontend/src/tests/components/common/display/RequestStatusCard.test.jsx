import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import RequestStatusCard from "../../../../components/common/request_status_card/RequestStatusCard";

describe("RequestStatusCard", () => {
  it("renders the full card state and calls cancel", () => {
    const onCancel = vi.fn();

    render(
      <RequestStatusCard
        icon={<span data-testid="icon">!</span>}
        title="Request pending"
        subtitle="Waiting for review"
        successMessage="Submitted successfully"
        cancelLabel="Withdraw"
        onCancel={onCancel}
      />
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Submitted successfully")).toBeInTheDocument();
    expect(screen.getByText("Request pending")).toBeInTheDocument();
    expect(screen.getByText("Waiting for review")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("hides the cancel action when absent and shows the cancelling state when disabled", () => {
    const { rerender } = render(<RequestStatusCard title="Approved" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <RequestStatusCard
        title="Cancelling"
        cancelling
        cancellingLabel="Stopping..."
        onCancel={vi.fn()}
      />
    );

    const button = screen.getByRole("button", { name: "Stopping..." });
    expect(button).toBeDisabled();
  });
});
