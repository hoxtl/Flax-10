import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

let params;
let societiesState;
const setParamsMock = vi.hoisted(() => vi.fn());
const useSocietiesMock = vi.hoisted(() => vi.fn());
const useUnreportSocietyMock = vi.hoisted(() => vi.fn());
const handleUnreport = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useSearchParams: () => [params, setParamsMock],
  };
});

vi.mock("../../components/Society/hooks/useSocieties", () => ({
  useSocieties: () => useSocietiesMock(),
}));

vi.mock("../../components/Society/hooks/useUnreportSociety", () => ({
  useUnreportSociety: (...args) => useUnreportSocietyMock(...args),
}));

import { useSocietiesPage } from "../../pages/Societies/societiesPageState";

describe("useSocietiesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params = new URLSearchParams();
    setParamsMock.mockImplementation((updater) => {
      params = updater(params) || params;
    });
    societiesState = {
      societies: [{ id: 1, name: "Photography Club" }],
      loading: false,
      handleCreate: vi.fn().mockResolvedValue({ id: 23 }),
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

  it("exposes modal state, handles create flow, and marks societies as reported", async () => {
    const { result, rerender } = renderHook(() => useSocietiesPage());

    act(() => {
      result.current.setShowCreateModal(true);
      result.current.setReportingSociety({ id: 7, name: "Debate Society" });
    });
    rerender();

    expect(result.current.showCreateModal).toBe(true);
    expect(result.current.reportingSociety).toEqual({ id: 7, name: "Debate Society" });

    await act(async () => {
      await result.current.onCreate({ name: "New club" });
    });
    rerender();

    expect(societiesState.handleCreate).toHaveBeenCalledWith({ name: "New club" });
    expect(result.current.showCreateModal).toBe(false);
    expect(params.get("id")).toBe("23");

    act(() => {
      result.current.onReportSuccess(7);
    });

    expect(societiesState.updateSocietyLocally).toHaveBeenCalledWith(7, { has_reported: true });
  });

  it("wires the unreport handler with local update support", () => {
    renderHook(() => useSocietiesPage());

    expect(useUnreportSocietyMock).toHaveBeenCalledWith(societiesState.updateSocietyLocally);
  });
});
