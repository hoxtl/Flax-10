import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reverseGeocodeMock = vi.fn();
const journeyPlannerMock = vi.fn();
const responsiveMock = vi.fn();
const handleMapLoadMock = vi.fn();
const createMapClickHandlerMock = vi.fn(() => vi.fn());
const cleanupMapMock = vi.fn();
const clearRouteSourceMock = vi.fn();
const syncHomeMarkerMock = vi.fn();
const syncStartMarkerMock = vi.fn();
const syncSelectedCampusPopupMock = vi.fn();
const fetchWalkingRouteMock = vi.fn();
const displayRouteMock = vi.fn();
const parseRouteInfoMock = vi.fn((route) => ({ parsed: route.id }));
const getEffectiveDestinationMock = vi.fn();

let mockRefs;
let mockState;
let mapInstance;

vi.mock("../../../api/geocodeApi", () => ({
  reverseGeocode: (...args) => reverseGeocodeMock(...args),
}));

vi.mock("../../../api/tflApi", () => ({
  tflService: {
    journeyPlanner: (...args) => journeyPlannerMock(...args),
  },
}));

vi.mock("../../../pages/CampusMap/hooks/useCampusMapRefs", () => ({
  useCampusMapRefs: () => mockRefs,
}));

vi.mock("../../../pages/CampusMap/hooks/useCampusMapState", () => ({
  useCampusMapState: () => mockState,
}));

vi.mock("../../../pages/CampusMap/hooks/useDisruptions", () => ({
  useDisruptions: () => ({ disruptions: [{ id: 1 }], loading: false }),
}));

vi.mock("../../../pages/CampusMap/hooks/useHomeAddress", () => ({
  useHomeAddress: () => ({ userHome: { address: "Home", lat: 51.5, lng: -0.1 } }),
}));

vi.mock("../../../pages/CampusMap/hooks/useResponsiveCampusMap", () => ({
  useResponsiveCampusMap: (...args) => responsiveMock(...args),
}));

vi.mock("../../../pages/CampusMap/mapHelpers", () => ({
  cleanupMap: (...args) => cleanupMapMock(...args),
  clearRouteSource: (...args) => clearRouteSourceMock(...args),
  createMapClickHandler: (...args) => createMapClickHandlerMock(...args),
  displayRoute: (...args) => displayRouteMock(...args),
  fetchWalkingRoute: (...args) => fetchWalkingRouteMock(...args),
  getEffectiveDestination: (...args) => getEffectiveDestinationMock(...args),
  handleMapLoad: (...args) => handleMapLoadMock(...args),
  parseRouteInfo: (...args) => parseRouteInfoMock(...args),
  syncHomeMarker: (...args) => syncHomeMarkerMock(...args),
  syncSelectedCampusPopup: (...args) => syncSelectedCampusPopupMock(...args),
  syncStartMarker: (...args) => syncStartMarkerMock(...args),
}));

vi.mock("mapbox-gl", () => ({
  default: {
    Map: vi.fn(function Map() {
      return mapInstance;
    }),
    NavigationControl: vi.fn(function NavigationControl() {}),
    LngLatBounds: vi.fn().mockImplementation(function Bounds() {
      return { extend: vi.fn().mockReturnThis() };
    }),
  },
}));

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ search: "" }),
}));

import { useCampusMapModel } from "../../../pages/CampusMap/hooks/useCampusMapModel";

function createMutableState(overrides = {}) {
  const state = {
    selection: {
      customDestination: null,
      selectedCampus: null,
      startLocation: null,
      ...overrides.selection,
    },
    routes: {
      loadingRoute: false,
      loadingTflRoute: false,
      routeError: "",
      routeInfo: null,
      tflRouteError: "",
      tflRouteInfo: null,
      ...overrides.routes,
    },
    form: {
      manualDestination: "",
      manualStart: "",
      ...overrides.form,
    },
    ui: {
      isMobile: false,
      locating: false,
      mapLoaded: true,
      minSkeletonElapsed: true,
      mobileInitialOpen: true,
      tflInstructions: false,
      walkingInstructions: false,
      ...overrides.ui,
    },
  };
  const wrapSetter = (key) =>
    vi.fn((updater) => {
      state[key] = typeof updater === "function" ? updater(state[key]) : updater;
      return state[key];
    });
  const api = {
    setSelection: wrapSetter("selection"),
    setRoutes: wrapSetter("routes"),
    setForm: wrapSetter("form"),
    setUi: wrapSetter("ui"),
  };
  Object.defineProperties(api, {
    selection: { get: () => state.selection },
    routes: { get: () => state.routes },
    form: { get: () => state.form },
    ui: { get: () => state.ui },
  });
  return api;
}

function renderModel(overrides) {
  if (overrides) {
    mockState = createMutableState(overrides);
  }
  return renderHook(() => useCampusMapModel());
}

function captureGeolocationCallbacks() {
  const callbacks = {};
  global.navigator.geolocation.getCurrentPosition.mockImplementation((success, error) => {
    callbacks.success = success;
    callbacks.error = error;
  });
  return callbacks;
}

describe("useCampusMapModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mapInstance = {
      addControl: vi.fn(),
      fitBounds: vi.fn(),
      flyTo: vi.fn(),
      on: vi.fn((event, callback) => {
        if (event === "load") callback();
      }),
      resize: vi.fn(),
    };
    mockRefs = {
      campusMarkers: { current: [] },
      homePointer: { current: null },
      homePopup: { current: null },
      map: { current: null },
      mapContainer: { current: document.createElement("div") },
      routeLayerAdded: { current: true },
      startMarker: { current: null },
      startPopup: { current: null },
    };
    mockState = createMutableState();
    reverseGeocodeMock.mockResolvedValue("Current location");
    fetchWalkingRouteMock.mockResolvedValue({ id: "walk-1" });
    journeyPlannerMock.mockResolvedValue({ duration: 20 });
    getEffectiveDestinationMock.mockImplementation((customDestination, selectedCampus) => {
      if (customDestination) return customDestination;
      if (selectedCampus) return { lat: selectedCampus.coords[1], lng: selectedCampus.coords[0] };
      return null;
    });
    global.requestAnimationFrame = vi.fn((callback) => {
      callback();
      return 1;
    });
    global.cancelAnimationFrame = vi.fn();
    Object.defineProperty(global.navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn(),
      },
    });
  });

  describe("initialisation", () => {
    it("initialises map setup and exposes stable model fields", () => {
      const { result, unmount } = renderModel();

      expect(responsiveMock).toHaveBeenCalledWith(mockState.setUi, mockState.ui.isMobile);
      expect(mapInstance.addControl).toHaveBeenCalled();
      expect(handleMapLoadMock).toHaveBeenCalled();
      expect(createMapClickHandlerMock).toHaveBeenCalledWith(mockState.setSelection, mockState.setForm);
      expect(result.current).toMatchObject({
        disruptions: [{ id: 1 }],
        loadingDisruptions: false,
        mapContainer: mockRefs.mapContainer,
        showInitialSkeleton: false,
      });

      unmount();
      expect(cleanupMapMock).toHaveBeenCalledWith(mockRefs);
    });
  });

  describe("selection and form helpers", () => {
    it("updates selection, form, and panel state through returned handlers", () => {
      const campus = { name: "Strand Campus", coords: [-0.116, 51.5114] };
      const { result } = renderModel();

      act(() => {
        result.current.handleSelectCampus(campus);
        result.current.setManualDestination("Library");
        result.current.setManualStart("Home");
        result.current.clearCustomDestination();
        result.current.toggleTflInstructions();
        result.current.toggleWalkingInstructions();
        result.current.flyToCampus(campus);
      });

      expect(mockState.form).toMatchObject({ manualDestination: "Library", manualStart: "Home" });
      expect(mockState.selection.selectedCampus).toEqual(campus);
      expect(mockState.ui).toMatchObject({ tflInstructions: true, walkingInstructions: true });
      expect(mapInstance.flyTo).toHaveBeenCalled();
    });
  });

  describe("reset helpers", () => {
    it("clears start, campus, and destination selections", () => {
      const { result } = renderModel({
        selection: {
          customDestination: { address: "Old", lat: 1, lng: 2 },
          selectedCampus: { id: "strand" },
          startLocation: { lat: 3, lng: 4 },
        },
        form: { manualDestination: "Old", manualStart: "Start" },
      });

      act(() => {
        result.current.handleClearStart();
        result.current.handleClearCampus();
        result.current.clearAllSelections();
      });

      expect(clearRouteSourceMock).toHaveBeenCalled();
      expect(mockState.selection).toMatchObject({
        startLocation: null,
        selectedCampus: null,
        customDestination: null,
      });
      expect(mockState.form).toMatchObject({ manualStart: "", manualDestination: "" });
    });
  });

  describe("geolocation helpers", () => {
    it("populates start location and manual text via geolocate start", async () => {
      reverseGeocodeMock.mockResolvedValueOnce("Student Union");
      const callbacks = captureGeolocationCallbacks();
      const { result } = renderModel();

      act(() => result.current.handleGeolocateStart());
      await act(async () => {
        await callbacks.success({ coords: { latitude: 51.51, longitude: -0.12 } });
      });

      expect(mockState.selection.startLocation).toEqual({ lat: 51.51, lng: -0.12 });
      expect(mockState.form.manualStart).toBe("Student Union");
    });

    it("creates fallback destination details when reverse geocode fails", async () => {
      reverseGeocodeMock.mockRejectedValueOnce(new Error("no reverse geocode"));
      const callbacks = captureGeolocationCallbacks();
      const { result } = renderModel();

      act(() => result.current.handleGeolocateDestination());
      await act(async () => {
        await callbacks.success({ coords: { latitude: 51.52, longitude: -0.13 } });
      });

      expect(mockState.selection.customDestination).toEqual({
        address: "51.52000, -0.13000",
        lat: 51.52,
        lng: -0.13,
        name: "Current location",
      });
      expect(mockState.form.manualDestination).toBe("51.52000, -0.13000");
    });

    it("resets the locating flag when geolocation errors", () => {
      const callbacks = captureGeolocationCallbacks();
      const { result } = renderModel();

      act(() => result.current.handleGeolocateStart());
      act(() => callbacks.error());

      expect(mockState.ui.locating).toBe(false);
    });
  });

  describe("route calculations", () => {
    it("loads walking and TfL route data when both ends are selected", async () => {
      renderModel({
        selection: {
          customDestination: { lat: 51.53, lng: -0.14, address: "Destination" },
          selectedCampus: null,
          startLocation: { lat: 51.5, lng: -0.1 },
        },
      });

      await waitFor(() => expect(fetchWalkingRouteMock).toHaveBeenCalled());
      expect(displayRouteMock).toHaveBeenCalledWith(mockRefs.map.current, { id: "walk-1" });
      expect(parseRouteInfoMock).toHaveBeenCalledWith({ id: "walk-1" });
      expect(journeyPlannerMock).toHaveBeenCalledWith(51.5, -0.1, 51.53, -0.14);
      expect(mockState.routes).toMatchObject({
        routeInfo: { parsed: "walk-1" },
        tflRouteInfo: { duration: 20 },
      });
    });

    it("surfaces walking route and TfL failures", async () => {
      fetchWalkingRouteMock.mockResolvedValueOnce(null);
      journeyPlannerMock.mockRejectedValueOnce(new Error("TfL down"));

      renderModel({
        selection: {
          customDestination: { lat: 51.53, lng: -0.14, address: "Destination" },
          startLocation: { lat: 51.5, lng: -0.1 },
        },
      });

      await waitFor(() => expect(clearRouteSourceMock).toHaveBeenCalled());
      expect(mockState.routes.routeError).toMatch(/No walking route found/i);
      expect(mockState.routes.tflRouteError).toMatch(/Failed to calculate TfL route/i);
    });

    it("resets route state when journey data is incomplete or layers missing", async () => {
      renderModel({
        selection: {
          customDestination: null,
          selectedCampus: null,
          startLocation: { lat: 51.5, lng: -0.1 },
        },
        routes: {
          routeInfo: { stale: true },
          tflRouteInfo: { stale: true },
        },
      });
      mockRefs.routeLayerAdded.current = false;

      await waitFor(() => expect(clearRouteSourceMock).toHaveBeenCalled());
      expect(mockState.routes.routeInfo).toBeNull();
      expect(mockState.routes.tflRouteInfo).toBeNull();
      expect(fetchWalkingRouteMock).not.toHaveBeenCalled();
    });
  });

  describe("manual journey planning", () => {
    it("retains campus selection when manual journey is calculated", async () => {
      fetchWalkingRouteMock.mockRejectedValueOnce(new Error("walking down"));
      const { result } = renderModel({
        selection: {
          customDestination: null,
          selectedCampus: { name: "Strand Campus", coords: [-0.116, 51.5114] },
          startLocation: { lat: 51.5, lng: -0.1 },
        },
        form: { manualDestination: "Somerset House" },
      });
      await waitFor(() => expect(fetchWalkingRouteMock).toHaveBeenCalled());
      expect(mockState.routes.routeError).toMatch(/Could not calculate the route/i);
      act(() => {
        result.current.handleUserJourneyCalculate(
          { latitude: 51.499, longitude: -0.101 },
          { latitude: 51.52, longitude: -0.12 },
        );
      });
      expect(mockState.selection.startLocation).toEqual({ lat: 51.499, lng: -0.101 });
      expect(mockState.selection.selectedCampus).toEqual({ name: "Strand Campus", coords: [-0.116, 51.5114] });
      expect(mockState.selection.customDestination).toBeNull();
      expect(mapInstance.fitBounds).toHaveBeenCalled();
    });

    it("creates a manual destination when no campus is selected", () => {
      const { result } = renderModel({
        selection: {
          customDestination: null,
          selectedCampus: null,
          startLocation: null,
        },
        form: { manualDestination: "Somerset House" },
      });
      act(() => {
        result.current.handleUserJourneyCalculate(
          { latitude: 51.5, longitude: -0.1 },
          { latitude: 51.51, longitude: -0.12 },
        );
      });
      expect(mockState.selection.customDestination).toEqual({
        address: "Somerset House",
        lat: 51.51,
        lng: -0.12,
        name: "Somerset House",
      });
      expect(mockState.selection.startLocation).toEqual({ lat: 51.5, lng: -0.1 });
      expect(mapInstance.fitBounds).toHaveBeenCalled();
    });
  });

  describe("geolocation availability", () => {
    it("does nothing when geolocation is unavailable", () => {
      Object.defineProperty(global.navigator, "geolocation", {
        configurable: true,
        value: undefined,
      });

      const { result } = renderModel();

      act(() => {
        result.current.handleGeolocate();
        result.current.handleGeolocateDestination();
        result.current.handleGeolocateStart();
      });

      expect(mockState.ui.locating).toBe(false);
      expect(reverseGeocodeMock).not.toHaveBeenCalled();
    });
  });
});
