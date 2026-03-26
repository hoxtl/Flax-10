import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCampusMapModel } from "../../../pages/campus_map/hooks/useCampusMapModel";
import { createMutableState, createMockRefs } from "./campusMapTestUtils";

const journeyPlannerMock = vi.fn();
const fetchWalkingRouteMock = vi.fn();
const displayRouteMock = vi.fn();
const parseRouteInfoMock = vi.fn((r) => ({ parsed: r.id }));
const clearRouteSourceMock = vi.fn();

let mockRefs;
let mockState;

vi.mock("../../../api/tflApi", () => ({
  tflService: { journeyPlanner: (...args) => journeyPlannerMock(...args) },
}));
vi.mock("../../../pages/campus_map/hooks/useCampusMapRefs", () => ({
  useCampusMapRefs: () => mockRefs,
}));
vi.mock("../../../pages/campus_map/hooks/useCampusMapState", () => ({
  useCampusMapState: () => mockState,
}));
vi.mock("../../../pages/campus_map/hooks/useDisruptions", () => ({
  useDisruptions: () => ({ disruptions: [], loading: false }),
}));
vi.mock("../../../pages/campus_map/hooks/useHomeAddress", () => ({
  useHomeAddress: () => ({ userHome: null }),
}));
vi.mock("../../../pages/campus_map/hooks/useResponsiveCampusMap", () => ({
  useResponsiveCampusMap: vi.fn(),
}));
vi.mock("../../../pages/campus_map/mapHelpers", () => ({
  cleanupMap: vi.fn(),
  clearRouteSource: (...args) => clearRouteSourceMock(...args),
  createMapClickHandler: vi.fn(() => vi.fn()),
  displayRoute: (...args) => displayRouteMock(...args),
  fetchWalkingRoute: (...args) => fetchWalkingRouteMock(...args),
  getEffectiveDestination: vi.fn((c, s) => c || (s ? { lat: s.coords[1], lng: s.coords[0] } : null)),
  handleMapLoad: vi.fn(),
  parseRouteInfo: (...args) => parseRouteInfoMock(...args),
  syncHomeMarker: vi.fn(),
  syncSelectedCampusPopup: vi.fn(),
  syncStartMarker: vi.fn(),
}));

describe("useCampusMapModel - Routing", () => {
  const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRefs = createMockRefs();
    mockState = createMutableState();
    fetchWalkingRouteMock.mockResolvedValue({ id: "walk-1" });
    journeyPlannerMock.mockResolvedValue({ duration: 20 });
  });

  it("loads walking and TfL route data when endpoints are selected", async () => {
    mockState = createMutableState({
      selection: { customDestination: { lat: 51.53, lng: -0.14 }, startLocation: { lat: 51.5, lng: -0.1 } },
    });
    renderHook(() => useCampusMapModel(), { wrapper });
    await waitFor(() => expect(fetchWalkingRouteMock).toHaveBeenCalled());
    expect(displayRouteMock).toHaveBeenCalled();
    expect(journeyPlannerMock).toHaveBeenCalled();
    expect(mockState.routes.tflRouteInfo).toEqual({ duration: 20 });
  });

  it("handles missing walking routes and TfL failures", async () => {
    mockState = createMutableState({
      selection: { customDestination: { lat: 51.53, lng: -0.14 }, startLocation: { lat: 51.5, lng: -0.1 } },
    });
    fetchWalkingRouteMock.mockResolvedValue(null);
    journeyPlannerMock.mockRejectedValue(new Error("TfL down"));
    renderHook(() => useCampusMapModel(), { wrapper });
    await waitFor(() => expect(clearRouteSourceMock).toHaveBeenCalled());
    expect(mockState.routes.routeError).toMatch(/No walking route found/i);
    expect(mockState.routes.tflRouteError).toMatch(/Failed to calculate TfL route/i);
  });

  it("handles walking route fetch failures separately", async () => {
    fetchWalkingRouteMock.mockRejectedValue(new Error("walking down"));
    mockState = createMutableState({
      selection: { selectedCampus: { coords: [-0.1, 51.5] }, startLocation: { lat: 51.5, lng: -0.1 } },
    });
    renderHook(() => useCampusMapModel(), { wrapper });
    await waitFor(() => expect(fetchWalkingRouteMock).toHaveBeenCalled());
    expect(mockState.routes.routeError).toMatch(/Could not calculate the route/i);
  });

  it("creates manual destination during journey calculation", () => {
    mockState = createMutableState({ form: { manualDestination: "Somerset House" } });
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    act(() => { result.current.handleUserJourneyCalculate({ latitude: 51.5, longitude: -0.1 }, { latitude: 51.51, longitude: -0.12 }); });
    expect(mockState.selection.customDestination).toEqual({ address: "Somerset House", lat: 51.51, lng: -0.12, name: "Somerset House" });
  });

  it("ignores route response after unmount", async () => {
    mockState = createMutableState({ selection: { customDestination: { lat: 1, lng: 1 }, startLocation: { lat: 2, lng: 2 } } });
    let resolveWalk;
    fetchWalkingRouteMock.mockReturnValueOnce(new Promise((r) => { resolveWalk = r; }));
    const { unmount } = renderHook(() => useCampusMapModel(), { wrapper });
    unmount();
    resolveWalk({ id: "walk-2" });
    await act(async () => { await Promise.resolve(); });
    expect(displayRouteMock).not.toHaveBeenCalled();
  });

  it("ignores TfL journey error after unmount", async () => {
    mockState = createMutableState({ selection: { customDestination: { lat: 1, lng: 1 }, startLocation: { lat: 2, lng: 2 } } });
    let rejectJourney;
    journeyPlannerMock.mockReturnValueOnce(new Promise((_, r) => { rejectJourney = r; }));
    const { unmount } = renderHook(() => useCampusMapModel(), { wrapper });
    unmount();
    rejectJourney(new Error("down"));
    await act(async () => { await Promise.resolve(); });
    expect(mockState.routes.tflRouteError).toBe("");
  });
});
