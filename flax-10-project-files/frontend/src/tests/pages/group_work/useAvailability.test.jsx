import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

import { useAvailability } from "../../../pages/group_work/hooks/useAvailability";

const confirmMock = vi.fn();
const toastMock = vi.fn();

vi.mock("../../../pages/group_work/hooks/groupWorkHooks", () => ({
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

  it("keeps defaults when the initial fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: vi.fn() }));
    renderAvailability();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("suggestions").textContent).toBe("[]");
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
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("Meeting suggestion deleted."));
  });

  it("skips deleting when confirmation is rejected", async () => {
    confirmMock.mockResolvedValue(false);
    renderAvailability();
    fireEvent.click(screen.getByText("delete"));
    await waitFor(() => expect(confirmMock).toHaveBeenCalledWith({
      title: "Delete Suggestion",
      message: "Delete this meeting suggestion?",
      confirmText: "Delete",
      isDanger: true,
    }));
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

  it("does not toast or refetch when suggestion submission fails", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(createApiPayload()) })
      .mockResolvedValueOnce({ ok: false }));

    renderAvailability();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    toastMock.mockReset();

    fireEvent.click(screen.getByText("suggest"));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(toastMock).not.toHaveBeenCalled();
    // fetch should NOT have been called a 3rd time (no refetch)
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not refresh or toast when delete API call fails", async () => {
    confirmMock.mockResolvedValue(true);
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(createApiPayload()) })
      .mockResolvedValueOnce({ ok: false }));

    renderAvailability();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    toastMock.mockReset();

    fireEvent.click(screen.getByText("delete"));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(toastMock).not.toHaveBeenCalled();
    // No 3rd call means fetchAvail was not triggered
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("shows a success toast when accepting a meeting slot", async () => {
    renderAvailability();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    fireEvent.click(screen.getByText("accept"));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith(
      "You accepted the meeting slot.",
      { variant: "success" }
    ));
  });

  it("does not toast or refetch when vote fails", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(createApiPayload()) })
      .mockResolvedValueOnce({ ok: false }));

    renderAvailability();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    toastMock.mockReset();

    fireEvent.click(screen.getByText("accept"));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(toastMock).not.toHaveBeenCalled();
    // No 3rd fetch call means fetchAvail was not triggered
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not toast or refetch when decline vote fails", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(createApiPayload()) })
      .mockResolvedValueOnce({ ok: false }));

    renderAvailability();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    toastMock.mockReset();

    fireEvent.click(screen.getByText("decline"));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("clears suggestingSlot after handleSuggestTime resolves", async () => {
    renderAvailability();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    // First set a slot so it's non-null
    fireEvent.click(screen.getByText("set slot"));
    await waitFor(() => expect(screen.getByTestId("slot").textContent).toBe("2026-04-10T09:00:00.000Z"));

    // Now suggest - this calls handleSuggestTime then setSuggestingSlot(null)
    fireEvent.click(screen.getByText("suggest"));
    await waitFor(() => expect(screen.getByTestId("slot").textContent).toBe("none"));
  });

  it("clears suggestingSlot even when suggestion submission fails", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(createApiPayload()) })
      .mockResolvedValueOnce({ ok: false }));

    renderAvailability();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    // Set a slot first
    fireEvent.click(screen.getByText("set slot"));
    await waitFor(() => expect(screen.getByTestId("slot").textContent).toBe("2026-04-10T09:00:00.000Z"));

    // Suggest with failed fetch - slot should still be cleared
    fireEvent.click(screen.getByText("suggest"));
    await waitFor(() => expect(screen.getByTestId("slot").textContent).toBe("none"));
  });

  it("toasts and refetches after successful suggestion", async () => {
    renderAvailability();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    fireEvent.click(screen.getByText("suggest"));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("You proposed a time for the team."));
    // The initial fetch + suggest POST + refetch = 3 calls
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
  });

  it("toasts and refetches after successful deletion", async () => {
    confirmMock.mockResolvedValue(true);
    renderAvailability();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    fireEvent.click(screen.getByText("delete"));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("Meeting suggestion deleted."));
    // The initial fetch + delete + refetch = 3 calls
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
  });
});
