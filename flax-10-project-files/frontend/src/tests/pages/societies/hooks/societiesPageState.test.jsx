import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

let params;
let societiesState;
const setParamsMock = vi.hoisted(() => vi.fn());
const useSocietiesMock = vi.hoisted(() => vi.fn());
const useUnreportSocietyMock = vi.hoisted(() => vi.fn());
const handleUnreport = vi.hoisted(() => vi.fn());
const showToastMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useSearchParams: () => [params, setParamsMock],
  };
});

vi.mock("../../../../components/society/hooks/useSocieties", () => ({
  useSocieties: () => useSocietiesMock(),
}));

vi.mock("../../../../components/society/hooks/useUnreportSociety", () => ({
  useUnreportSociety: (...args) => useUnreportSocietyMock(...args),
}));

vi.mock("../../../../context/ToastContext", () => ({
  useToast: () => showToastMock,
}));

import { useSocietiesPage } from "../../../../pages/societies/hooks/societiesPageState";

describe("useSocietiesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    showToastMock.mockReset();
    params = new URLSearchParams();
    setParamsMock.mockImplementation((updater) => {
      params = updater(params) || params;
    });
    societiesState = {
      societies: [{ id: 1, name: "Photography Club" }],
      loading: false,
      handleCreate: vi.fn().mockResolvedValue({ id: 23, name: "Photography Club", create_meta: {} }),
      refresh: vi.fn(),
      updateSocietyLocally: vi.fn(),
      removeSociety: vi.fn(),
    };
    useSocietiesMock.mockReturnValue(societiesState);
    useUnreportSocietyMock.mockReturnValue(handleUnreport);
  });

  it("reads navigation params and updates them through the returned actions", () => {
    params = new URLSearchParams("tab=all&id=9");
    const { result, rerender } = renderHook(() => useSocietiesPage());

    expect(result.current.view).toBe("all");
    expect(result.current.selectedSocietyId).toBe("9");

    act(() => {
      result.current.setView("my");
      result.current.selectSociety("15");
    });
    rerender();

    expect(params.get("tab")).toBe("my");
    expect(params.get("id")).toBe("15");

    act(() => {
      result.current.clearSelection();
    });
    rerender();

    expect(params.get("id")).toBeNull();
  });

  it("toggles society creation and reporting modal state", () => {
    const { result, rerender } = renderHook(() => useSocietiesPage());
    act(() => {
      result.current.setShowCreateModal(true);
      result.current.setReportingSociety({ id: 7, name: "D" });
    });
    rerender();
    expect(result.current.showCreateModal).toBe(true);
    expect(result.current.reportingSociety).toEqual({ id: 7, name: "D" });
  });

  it("handles society creation flow", async () => {
    const { result, rerender } = renderHook(() => useSocietiesPage());
    await act(async () => { await result.current.onCreate({ name: "N" }); });
    rerender();
    expect(societiesState.handleCreate).toHaveBeenCalledWith({ name: "N" });
    expect(result.current.showCreateModal).toBe(false);
    expect(showToastMock).toHaveBeenCalledWith("Photography Club created successfully.", { variant: "success" });
  });

  it("handles reporting success logic", () => {
    const { result } = renderHook(() => useSocietiesPage());
    act(() => { result.current.onReportSuccess(7); });
    expect(societiesState.updateSocietyLocally).toHaveBeenCalledWith(7, { has_reported: true });
  });

  it("wires the unreport handler with local update support", () => {
    renderHook(() => useSocietiesPage());

    expect(useUnreportSocietyMock).toHaveBeenCalledWith(societiesState.updateSocietyLocally);
  });

  it.each([
    [
      {
        id: 31,
        name: "Debate Club",
        create_meta: { collaboratorFailures: [{ username: "alex" }], ratificationError: true },
      },
      "Debate Club was created, but some collaborators and the ratification request still need attention.",
      "info",
    ],
    [
      {
        id: 32,
        name: "Drama Club",
        create_meta: { collaboratorFailures: [{ username: "sam" }] },
      },
      "Drama Club was created, but some collaborators could not be added yet.",
      "info",
    ],
    [
      {
        id: 33,
        name: "Law Society",
        create_meta: { ratificationError: true },
      },
      "Law Society was created, but the ratification request still needs to be sent.",
      "info",
    ],
  ])("shows the correct create toast for %s", async (created, expectedMessage, expectedVariant) => {
    societiesState.handleCreate.mockResolvedValueOnce(created);
    const { result } = renderHook(() => useSocietiesPage());

    await act(async () => {
      await result.current.onCreate({ name: created.name });
    });

    expect(showToastMock).toHaveBeenCalledWith(expectedMessage, { variant: expectedVariant });
  });
});
