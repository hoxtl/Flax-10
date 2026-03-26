import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCampusMapModel } from "../../../pages/CampusMap/hooks/useCampusMapModel";
import { createMutableState, createMockRefs } from "./campusMapTestUtils";

const reverseGeocodeMock = vi.fn();

let mockRefs;
let mockState;

vi.mock("../../../api/geocodeApi", () => ({
  reverseGeocode: (...args) => reverseGeocodeMock(...args),
}));
vi.mock("../../../pages/CampusMap/hooks/useCampusMapRefs", () => ({
  useCampusMapRefs: () => mockRefs,
}));
vi.mock("../../../pages/CampusMap/hooks/useCampusMapState", () => ({
  useCampusMapState: () => mockState,
}));
vi.mock("../../../pages/CampusMap/hooks/useDisruptions", () => ({
  useDisruptions: () => ({ disruptions: [], loading: false }),
}));
vi.mock("../../../pages/CampusMap/hooks/useHomeAddress", () => ({
  useHomeAddress: () => ({ userHome: null }),
}));
vi.mock("../../../pages/CampusMap/hooks/useResponsiveCampusMap", () => ({
  useResponsiveCampusMap: vi.fn(),
}));
vi.mock("../../../pages/CampusMap/mapHelpers", () => ({
  cleanupMap: vi.fn(),
  clearRouteSource: vi.fn(),
  createMapClickHandler: vi.fn(() => vi.fn()),
  displayRoute: vi.fn(),
  fetchWalkingRoute: vi.fn(),
  getEffectiveDestination: vi.fn(),
  handleMapLoad: vi.fn(),
  parseRouteInfo: vi.fn(),
  syncHomeMarker: vi.fn(),
  syncSelectedCampusPopup: vi.fn(),
  syncStartMarker: vi.fn(),
}));

describe("useCampusMapModel - Geolocation", () => {
  const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRefs = createMockRefs();
    mockState = createMutableState();
    Object.defineProperty(global.navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: vi.fn() },
    });
  });

  it("geolocates start location with reverse geocode", async () => {
    let successCb;
    global.navigator.geolocation.getCurrentPosition.mockImplementation((s) => { successCb = s; });
    reverseGeocodeMock.mockResolvedValue("Student Union");
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    act(() => { result.current.handleGeolocateStart(); });
    await act(async () => { await successCb({ coords: { latitude: 51.51, longitude: -0.12 } }); });
    expect(mockState.selection.startLocation).toEqual({ lat: 51.51, lng: -0.12 });
    expect(mockState.form.manualStart).toBe("Student Union");
  });

  it("falls back to coordinate text when start reverse geocoding returns nothing", async () => {
    let successCb;
    global.navigator.geolocation.getCurrentPosition.mockImplementation((s) => { successCb = s; });
    reverseGeocodeMock.mockResolvedValue(null);
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });

    act(() => { result.current.handleGeolocateStart(); });
    await act(async () => { await successCb({ coords: { latitude: 51.53, longitude: -0.14 } }); });

    expect(mockState.form.manualStart).toBe("51.53000, -0.14000");
  });

  it("geolocates custom destination with coordinate fallback", async () => {
    let successCb;
    global.navigator.geolocation.getCurrentPosition.mockImplementation((s) => { successCb = s; });
    reverseGeocodeMock.mockRejectedValue(new Error("no geocode"));
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    act(() => { result.current.handleGeolocateDestination(); });
    await act(async () => { await successCb({ coords: { latitude: 51.52, longitude: -0.13 } }); });
    expect(mockState.selection.customDestination).toEqual({ address: "51.52000, -0.13000", lat: 51.52, lng: -0.13, name: "Current location" });
    expect(mockState.form.manualDestination).toBe("51.52000, -0.13000");
  });

  it("handles geolocation errors gracefully", () => {
    let errorCb;
    global.navigator.geolocation.getCurrentPosition.mockImplementation((_, e) => { errorCb = e; });
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    act(() => { result.current.handleGeolocateStart(); errorCb(); });
    expect(mockState.ui.locating).toBe(false);
  });

  it("does nothing when geolocation is unavailable", () => {
    Object.defineProperty(global.navigator, "geolocation", { configurable: true, value: undefined });
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    act(() => { result.current.handleGeolocate(); });
    expect(mockState.ui.locating).toBe(false);
    expect(reverseGeocodeMock).not.toHaveBeenCalled();
  });
});
