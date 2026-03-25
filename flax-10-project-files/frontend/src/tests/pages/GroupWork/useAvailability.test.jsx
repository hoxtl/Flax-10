import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

import { useAvailability } from "../../../pages/GroupWork/hooks/useAvailability";

const confirmMock = vi.fn();
const toastMock = vi.fn();

vi.mock("../../../pages/GroupWork/hooks/groupWorkHooks", () => ({
  getAuthHeaders: vi.fn(() => ({ Authorization: "Token abc" })),
}));

vi.mock("../../../context/ToastContext", () => ({
  useToast: () => toastMock,
}));

function AvailabilityHarness() {
  const model = useAvailability(77, confirmMock);
  return (
    <div>
      <div data-testid="loading">{String(model.loading)}</div>
      <div data-testid="suggestions">{JSON.stringify(model.suggestions)}</div>
      <div data-testid="slot">{model.suggestingSlot ? model.suggestingSlot.start : "none"}</div>
      <button onClick={() => model.setSuggestingSlot({ start: "2026-04-10T09:00:00.000Z" })}>set slot</button>
      <button onClick={() => model.handleSuggestTime({ start: "2026-04-11T09:00:00.000Z" })}>suggest</button>
      <button onClick={() => model.handleDelete(9)}>delete</button>
      <button onClick={() => model.handleVote(9, "accepted")}>accept</button>
      <button onClick={() => model.handleVote(9, "declined")}>decline</button>
    </div>
  );
}

function createApiPayload(overrides = {}) {
  return {
    suggestions: [{ id: 1 }],
    active_suggestions: [],
    current_user_id: 3,
    project_members: [{ id: 2 }],
    team_size: 2,
    ...overrides,
  };
}

function stubFetch(payload) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(payload ?? createApiPayload()),
  });
}

function renderAvailability() {
  return render(<AvailabilityHarness />);
}

describe("useAvailability", () => {
  beforeEach(() => {
    toastMock.mockReset();
    confirmMock.mockReset();
    vi.stubGlobal("fetch", stubFetch());
  });

  it("loads availability data on mount", async () => {
    renderAvailability();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("suggestions").textContent).toContain('"id":1');
  });

  it("updates the suggesting slot when the setter is used", async () => {
    renderAvailability();
    fireEvent.click(screen.getByText("set slot"));
    await waitFor(() => expect(screen.getByTestId("slot").textContent).toBe("2026-04-10T09:00:00.000Z"));
  });

  it("submits a new meeting suggestion", async () => {
    renderAvailability();
    fireEvent.click(screen.getByText("suggest"));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      "/api/group-work/projects/77/suggestions/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          start_time: "2026-04-11T09:00:00.000Z",
          end_time: "2026-04-11T10:00:00.000Z",
        }),
      })
    ));
  });

  it("deletes a suggestion after confirmation", async () => {
    confirmMock.mockResolvedValue(true);
    renderAvailability();
    fireEvent.click(screen.getByText("delete"));
    await waitFor(() => expect(confirmMock).toHaveBeenCalled());
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      "/api/group-work/suggestions/9/",
      expect.objectContaining({ method: "DELETE" })
    ));
  });

  it("skips deleting when confirmation is rejected", async () => {
    confirmMock.mockResolvedValue(false);
    renderAvailability();
    fireEvent.click(screen.getByText("delete"));
    await waitFor(() => expect(confirmMock).toHaveBeenCalled());
    expect(fetch).not.toHaveBeenCalledWith(
      "/api/group-work/suggestions/9/",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("posts an accepted vote", async () => {
    renderAvailability();
    fireEvent.click(screen.getByText("accept"));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      "/api/group-work/suggestions/9/respond/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ status: "accepted" }),
      })
    ));
  });

  it("shows a toast when declining a suggestion", async () => {
    renderAvailability();
    fireEvent.click(screen.getByText("decline"));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith(
      "You declined the meeting slot.",
      { variant: "neutral" }
    ));
  });
});
