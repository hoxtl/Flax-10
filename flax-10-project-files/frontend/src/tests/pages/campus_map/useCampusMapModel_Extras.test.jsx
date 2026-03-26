import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { useCampusMapModel } from "../../../pages/campus_map/hooks/useCampusMapModel";
import { createMutableState, createMockRefs } from "./campusMapTestUtils";

const geocodeAddressMock = vi.fn();
const getEventsMock = vi.fn();
const journeyPlannerMock = vi.fn();
const clearRouteSourceMock = vi.fn();
const fetchWalkingRouteMock = vi.fn();

let mockRefs;
let mockState;

vi.mock("../../../api/geocodeApi", () => ({
  geocodeAddress: (...args) => geocodeAddressMock(...args),
  reverseGeocode: vi.fn(),
}));

vi.mock("../../../api/eventApi", () => ({
  getEvents: (...args) => getEventsMock(...args),
}));

vi.mock("../../../api/tflApi", () => ({
  tflService: {
    getTfLDelays: vi.fn(),
    journeyPlanner: (...args) => journeyPlannerMock(...args),
  },
}));

vi.mock("../../../pages/campus_map/hooks/useCampusMapRefs", () => ({
  useCampusMapRefs: () => mockRefs,
}));

vi.mock("../../../pages/campus_map/hooks/useCampusMapState", () => ({
  useCampusMapState: () => mockState,
}));

vi.mock("../../../pages/campus_map/hooks/useDisruptions", () => ({
  useDisruptions: () => ({ disruptions: [{ id: "delay" }], loading: true }),
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
  displayRoute: vi.fn(),
  fetchWalkingRoute: (...args) => fetchWalkingRouteMock(...args),
  getEffectiveDestination: vi.fn((customDestination, selectedCampus) =>
    customDestination || (selectedCampus ? { lat: selectedCampus.coords[1], lng: selectedCampus.coords[0] } : null)
  ),
  handleMapLoad: vi.fn(),
  parseRouteInfo: vi.fn((route) => ({ id: route.id })),
  syncHomeMarker: vi.fn(),
  syncSelectedCampusPopup: vi.fn(),
  syncStartMarker: vi.fn(),
}));

vi.mock("mapbox-gl", () => ({
  default: {
    Map: vi.fn(() => ({ addControl: vi.fn(), on: vi.fn(), flyTo: vi.fn(), resize: vi.fn(), fitBounds: vi.fn() })),
    NavigationControl: vi.fn(),
    LngLatBounds: vi.fn().mockImplementation(function() {
      return { extend: vi.fn().mockReturnThis() };
    }),
  },
}));

function wrapperWithEntry(entry = "/map") {
  return ({ children }) => <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>;
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useCampusMapModel - extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T09:00:00.000Z"));

    mockRefs = createMockRefs();
    mockState = createMutableState();
    fetchWalkingRouteMock.mockResolvedValue(null);
    journeyPlannerMock.mockResolvedValue(null);
    getEventsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("syncs a destination query once and focuses the map on geocoded coordinates", async () => {
    geocodeAddressMock.mockResolvedValue({ latitude: 51.501, longitude: -0.141 });

    const { rerender } = renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry("/map?destination=%20Bush%20House%20") });

    await flushEffects();
    expect(geocodeAddressMock).toHaveBeenCalledWith("Bush House");
    expect(mockState.form.manualDestination).toBe("Bush House");
    expect(mockState.selection.customDestination).toEqual({
      address: "Bush House",
      lat: 51.501,
      lng: -0.141,
      name: "Bush House",
    });
    expect(mockRefs.map.current.flyTo).toHaveBeenCalledWith({
      center: [-0.141, 51.501],
      duration: 1200,
      pitch: 55,
      zoom: 15,
    });

    rerender();
    await flushEffects();
    expect(geocodeAddressMock).toHaveBeenCalledTimes(1);
  });

  it("ignores geocode failures and null results without updating the selection", async () => {
    geocodeAddressMock.mockRejectedValueOnce(new Error("no geocode"));
    renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry("/map?destination=Failing%20place") });
    await flushEffects();
    expect(mockState.selection.customDestination).toBeNull();
    expect(mockRefs.map.current.flyTo).not.toHaveBeenCalled();
  });

  it("ignores null geocode results for a different destination query", async () => {
    geocodeAddressMock.mockResolvedValueOnce(null);
    renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry("/map?destination=Null%20result") });
    await flushEffects();
    expect(mockState.selection.customDestination).toBeNull();
    expect(mockRefs.map.current.flyTo).not.toHaveBeenCalled();
  });

  it("ignores blank upcoming-event locations and geocodes valid ones with the event title", async () => {
    geocodeAddressMock.mockResolvedValue({ latitude: 51.49, longitude: -0.09 });

    const { result } = renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry() });

    act(() => {
      result.current.handleSelectUpcomingEvent({ title: "Missing location" });
      result.current.handleSelectUpcomingEvent({ location: "   ", title: "Ignore me" });
    });
    expect(geocodeAddressMock).not.toHaveBeenCalled();

    act(() => {
      result.current.handleSelectUpcomingEvent({ location: "Waterloo Campus" });
    });

    await flushEffects();
    expect(geocodeAddressMock).toHaveBeenCalledWith("Waterloo Campus");
    expect(mockState.form.manualDestination).toBe("Waterloo Campus");
    expect(mockState.selection.customDestination).toEqual({
      address: "Waterloo Campus",
      lat: 51.49,
      lng: -0.09,
      name: "Waterloo Campus",
    });
  });

  it("drops late upcoming-event results after unmount", async () => {
    let resolveEvents;
    getEventsMock.mockReturnValueOnce(new Promise((resolve) => {
      resolveEvents = resolve;
    }));

    const { unmount } = renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry() });

    unmount();

    await act(async () => {
      resolveEvents([{ id: "late", location: "A", start_time: "2026-03-26T09:05:00.000Z" }]);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(geocodeAddressMock).not.toHaveBeenCalled();
  });

  it("resets route info and shows the initial skeleton while the map is still booting", async () => {
    mockState = createMutableState({
      routes: {
        routeInfo: { old: true },
        tflRouteInfo: { old: true },
      },
      ui: {
        mapLoaded: false,
        minSkeletonElapsed: true,
      },
    });

    const { result } = renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry() });

    await flushEffects();
    expect(clearRouteSourceMock).toHaveBeenCalled();
    expect(result.current.showInitialSkeleton).toBe(true);
    expect(result.current.loadingDisruptions).toBe(true);
    expect(result.current.disruptions).toEqual([{ id: "delay" }]);
    expect(mockState.routes.routeInfo).toBeNull();
    expect(mockState.routes.tflRouteInfo).toBeNull();
  });

  it("resets route info when the route layer is not ready", async () => {
    mockRefs.routeLayerAdded.current = false;
    mockState = createMutableState({
      selection: {
        customDestination: { lat: 1, lng: 1 },
        startLocation: { lat: 2, lng: 2 },
      },
      routes: {
        routeInfo: { old: true },
        tflRouteInfo: { old: true },
      },
    });

    renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry() });
    await flushEffects();

    expect(clearRouteSourceMock).toHaveBeenCalled();
    expect(mockState.routes.routeInfo).toBeNull();
    expect(mockState.routes.tflRouteInfo).toBeNull();
  });

  const setupMapClearing = () => {
    mockState = createMutableState({
      selection: { customDestination: { address: "L", lat: 51.5, lng: -0.1 }, selectedCampus: { id: "s", coords: [-0.1, 51.5] }, startLocation: { lat: 51.4, lng: -0.0 } },
      routes: { routeInfo: { id: "w" }, tflRouteInfo: { id: "t" } },
      form: { manualDestination: "L", manualStart: "H" },
    });
  };
  it("clears start and campus selections", async () => {
    setupMapClearing();
    const { result } = renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry() });
    await act(async () => { result.current.handleClearStart(); result.current.handleClearCampus(); });
    expect(mockRefs.startMarker.current).toBeNull();
    expect(mockState.selection.startLocation).toBeNull();
    expect(mockState.selection.selectedCampus).toBeNull();
  });
  it("clears markers and manual fields", async () => {
    setupMapClearing();
    const startMarker = mockRefs.startMarker.current, startPopup = mockRefs.startPopup.current;
    const { result } = renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry() });
    await act(async () => { result.current.handleClearStart(); result.current.handleClearCampus(); });
    expect(startMarker.remove).toHaveBeenCalled();
    expect(startPopup.remove).toHaveBeenCalled();
    expect(mockState.form.manualStart).toBe("");
    expect(mockState.form.manualDestination).toBe("");
  });
  it("clears routes and custom destination", async () => {
    setupMapClearing();
    const { result } = renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry() });
    await act(async () => { result.current.handleClearStart(); result.current.handleClearCampus(); });
    expect(mockState.selection.customDestination).toBeNull();
    expect(mockState.routes.routeInfo).toBeNull();
  });

  it("preserves selection during journey calc", async () => {
    mockState = createMutableState({
      selection: { customDestination: { address: "S", lat: 51.5, lng: -0.1, name: "S" }, selectedCampus: { id: "s", coords: [-0.1, 51.5] } },
      form: { manualDestination: "M" },
    });
    const { result } = renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry() });
    await act(async () => { result.current.handleUserJourneyCalculate({ latitude: 51.5, longitude: -0.1 }, { latitude: 51.52, longitude: -0.13 }); });
    expect(mockState.selection.customDestination.address).toBe("S");
    expect(mockState.selection.startLocation).toEqual({ lat: 51.5, lng: -0.1 });
    expect(mockRefs.map.current.fitBounds).toHaveBeenCalled();
  });

  it("filters and sorts upcoming events", async () => {
    getEventsMock.mockResolvedValue([
      { id: "noloc", location: "", start_time: "2026-03-26T09:15:00.000Z" },
      { id: "ongoing", location: "C", start_time: "2026-03-26T08:30:00.000Z", end_time: "2026-03-26T09:30:00.000Z" },
      { id: "soon-1", location: "E", start_time: "2026-03-26T09:05:00.000Z" },
      { id: "soon-2", location: "D", start_time: "2026-03-26T09:10:00.000Z" },
      { id: "soon-3", location: "F", start_time: "2026-03-26T09:20:00.000Z" },
      { id: "soon-4", location: "G", start_time: "2026-03-26T09:40:00.000Z" },
      { id: "soon-5", location: "H", start_time: "2026-03-26T09:50:00.000Z" },
      { id: "too-far", location: "I", start_time: "2026-03-26T12:30:00.000Z" },
    ]);
    const { result } = renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry() });
    await flushEffects();
    expect(result.current.upcomingEvents.map(e => e.id)).toEqual(["ongoing", "soon-1", "soon-2", "soon-3", "soon-4"]);
  });

  it("treats a null upcoming-events response as an empty list", async () => {
    getEventsMock.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry() });

    await flushEffects();
    expect(result.current.upcomingEvents).toEqual([]);
  });

  it("refreshes upcoming events when the tab becomes visible again", async () => {
    getEventsMock
      .mockResolvedValueOnce([{ id: "first", location: "A", start_time: "2026-03-26T09:05:00.000Z" }])
      .mockResolvedValueOnce([{ id: "second", location: "A", start_time: "2026-03-26T09:10:00.000Z" }]);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });

    const { result } = renderHook(() => useCampusMapModel(), { wrapper: wrapperWithEntry() });
    await flushEffects();
    expect(result.current.upcomingEvents.map((event) => event.id)).toEqual(["first"]);

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getEventsMock).toHaveBeenCalledTimes(2);
    expect(result.current.upcomingEvents.map((event) => event.id)).toEqual(["second"]);
  });
});
