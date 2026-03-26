/**
 * Covers CampusMap helper branches for markers, routes, and geocoding.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { markerInstances, boundsExtend, MockLngLatBounds } = vi.hoisted(() => {
  const markerInstances = [];
  const boundsExtend = vi.fn(function extend() {
    return this;
  });
  const MockLngLatBounds = vi.fn().mockImplementation(function MockLngLatBounds() {
    return { extend: boundsExtend };
  });
  return { markerInstances, boundsExtend, MockLngLatBounds };
});

vi.mock("../../../api/geocodeApi", () => ({
  reverseGeocode: vi.fn(),
}));

vi.mock("mapbox-gl", () => ({
  default: {
    Marker: vi.fn().mockImplementation(function Marker(options = {}) {
      const element = options.element || document.createElement("div");
      const instance = {
        addTo: vi.fn().mockReturnThis(),
        getElement: vi.fn(() => element),
        getPopup: vi.fn(() => instance._popup),
        remove: vi.fn(),
        setLngLat: vi.fn().mockReturnThis(),
        setPopup: vi.fn((popup) => {
          instance._popup = popup;
          return instance;
        }),
        togglePopup: vi.fn(),
      };
      markerInstances.push(instance);
      return instance;
    }),
    Popup: vi.fn().mockImplementation(function Popup() {
      const instance = {
        addTo: vi.fn().mockReturnThis(),
        isOpen: vi.fn(() => false),
        remove: vi.fn(),
        setHTML: vi.fn((html) => {
          const container = document.createElement("div");
          container.innerHTML = html;
          document.body.appendChild(container);
          return instance;
        }),
        setLngLat: vi.fn().mockReturnThis(),
        togglePopup: vi.fn(),
      };
      return instance;
    }),
    LngLatBounds: MockLngLatBounds,
    accessToken: "test-token",
  },
}));

import { reverseGeocode } from "../../../api/geocodeApi";
import { KCL_CAMPUSES } from "../../../lib/kclCampuses";
import {
  cleanupMap,
  clearRouteSource,
  createMapClickHandler,
  displayRoute,
  fetchWalkingRoute,
  fitMapToRoute,
  getEffectiveDestination,
  handleMapLoad,
  parseRouteInfo,
  syncHomeMarker,
  syncSelectedCampusPopup,
  syncStartMarker,
} from "../../../pages/CampusMap/mapHelpers";

const createMapMock = () => ({
  addLayer: vi.fn(),
  addSource: vi.fn(),
  fitBounds: vi.fn(),
  flyTo: vi.fn(),
  getSource: vi.fn(() => ({ setData: vi.fn() })),
  getStyle: vi.fn(() => ({ layers: [{ id: "labels", type: "symbol", layout: { "text-field": "name" } }] })),
  remove: vi.fn(),
});

function createRefs() {
  return {
    campusMarkers: { current: [] },
    homePointer: { current: null },
    homePopup: { current: null },
    map: { current: createMapMock() },
    routeLayerAdded: { current: false },
    startMarker: { current: null },
    startPopup: { current: null },
  };
}

describe("mapHelpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    markerInstances.length = 0;
    document.body.innerHTML = "";
    global.fetch = vi.fn();
  });

  it("adds building, route, and campus marker layers when the map loads", () => {
    const refs = createRefs();
    const onCampusMarkerSelect = vi.fn();

    handleMapLoad(refs, onCampusMarkerSelect);

    expect(refs.map.current.addSource).toHaveBeenCalledWith(
      "route",
      expect.objectContaining({ type: "geojson" }),
    );
    expect(refs.map.current.addLayer).toHaveBeenCalledTimes(3);
    expect(refs.campusMarkers.current).toHaveLength(KCL_CAMPUSES.length);

    const firstMarker = refs.campusMarkers.current[0];
    firstMarker.getElement().dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(onCampusMarkerSelect).toHaveBeenCalledWith(
      KCL_CAMPUSES[0],
      refs.campusMarkers.current,
      firstMarker,
    );
  });

  it("updates selection and manual start text on map click when reverse geocoding succeeds", async () => {
    reverseGeocode.mockResolvedValueOnce("Strand, London");
    const setSelection = vi.fn((updater) => updater({ startLocation: null }));
    const setForm = vi.fn((updater) => updater({ manualStart: "" }));

    const handler = createMapClickHandler(setSelection, setForm);
    await handler({
      lngLat: { lat: 51.5, lng: -0.11 },
      originalEvent: { defaultPrevented: false },
    });

    expect(setSelection).toHaveBeenCalled();
    expect(setForm).toHaveBeenCalled();
    expect(reverseGeocode).toHaveBeenCalledWith(51.5, -0.11);
  });

  it("updates start location without mutating manual text when reverse geocoding returns nothing", async () => {
    reverseGeocode.mockResolvedValueOnce("");
    const setSelection = vi.fn((updater) => updater({ startLocation: null }));
    const setForm = vi.fn();

    const handler = createMapClickHandler(setSelection, setForm);
    await handler({
      lngLat: { lat: 51.5, lng: -0.11 },
      originalEvent: { defaultPrevented: false },
    });

    expect(setSelection).toHaveBeenCalled();
    expect(setForm).not.toHaveBeenCalled();
  });

  it("ignores prevented map clicks", async () => {
    const setSelection = vi.fn();
    const setForm = vi.fn();

    await createMapClickHandler(setSelection, setForm)({
      lngLat: { lat: 1, lng: 2 },
      originalEvent: { defaultPrevented: true },
    });

    expect(setSelection).not.toHaveBeenCalled();
    expect(setForm).not.toHaveBeenCalled();
  });

  it("creates and wires a home marker, then uses home as the journey start", async () => {
    vi.useFakeTimers();
    reverseGeocode.mockResolvedValueOnce("Home sweet home");
    const refs = createRefs();
    const setSelection = vi.fn((updater) => updater({ startLocation: null }));
    const setForm = vi.fn((updater) => updater({ manualStart: "" }));
    const userHome = { address: "", lat: 51.49, lng: -0.12 };

    syncHomeMarker(refs, true, null, userHome, setSelection, setForm);
    vi.advanceTimersByTime(100);

    document.getElementById("setHomeAsStart").click();
    await Promise.resolve();

    expect(setSelection).toHaveBeenCalled();
    expect(setForm).toHaveBeenCalled();
  });

  it("does not reopen the home popup when start location already matches home", () => {
    vi.useFakeTimers();
    const refs = createRefs();
    const userHome = { address: "Home", lat: 51.49, lng: -0.12 };

    syncHomeMarker(refs, true, { lat: 51.49, lng: -0.12 }, userHome, vi.fn(), vi.fn());

    expect(refs.homePointer.current.togglePopup).not.toHaveBeenCalled();
  });

  it("does nothing when the home marker cannot yet be synced", () => {
    const refs = createRefs();
    syncHomeMarker(refs, false, null, { address: "Home", lat: 1, lng: 2 }, vi.fn(), vi.fn());
    syncHomeMarker(refs, true, null, null, vi.fn(), vi.fn());
    expect(refs.homePointer.current).toBeNull();
  });

  it("syncs the start marker and start popup only when a start location exists", () => {
    const refs = createRefs();
    refs.startMarker.current = { remove: vi.fn() };
    refs.startPopup.current = { remove: vi.fn() };

    syncStartMarker(refs, true, { lat: 51.5, lng: -0.1 });

    expect(refs.startMarker.current.setLngLat).toHaveBeenCalledWith([-0.1, 51.5]);

    const idleRefs = createRefs();
    syncStartMarker(idleRefs, false, { lat: 1, lng: 2 });
    syncStartMarker(idleRefs, true, null);
    expect(idleRefs.startMarker.current).toBeNull();
  });

  it("toggles only the selected campus popup once markers are loaded", () => {
    const closedMarker = { getPopup: vi.fn(() => ({ isOpen: vi.fn(() => false) })), togglePopup: vi.fn() };
    const openMarker = { getPopup: vi.fn(() => ({ isOpen: vi.fn(() => true) })), togglePopup: vi.fn() };
    const markersRef = { current: [closedMarker, openMarker] };

    syncSelectedCampusPopup(markersRef, true, KCL_CAMPUSES[0]);

    expect(closedMarker.togglePopup).toHaveBeenCalledTimes(1);
    expect(openMarker.togglePopup).toHaveBeenCalledTimes(1);

    syncSelectedCampusPopup(markersRef, false, KCL_CAMPUSES[0]);
    expect(closedMarker.togglePopup).toHaveBeenCalledTimes(1);
  });

  it("displays and clears route data on the map source", () => {
    const setData = vi.fn();
    const map = {
      fitBounds: vi.fn(),
      getSource: vi.fn(() => ({ setData })),
    };
    const route = { geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] } };

    displayRoute(map, route);
    clearRouteSource(map);
    clearRouteSource(null);

    expect(setData).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ features: [expect.objectContaining({ geometry: route.geometry })] }),
    );
    expect(setData).toHaveBeenNthCalledWith(2, { features: [], type: "FeatureCollection" });
    expect(map.fitBounds).toHaveBeenCalled();
  });

  it("fetches the first walking route and throws when the API request fails", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ routes: [{ id: "route-1" }, { id: "route-2" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ routes: [] }),
      })
      .mockResolvedValueOnce({ ok: false });

    await expect(fetchWalkingRoute({ lat: 1, lng: 2 }, { lat: 3, lng: 4 })).resolves.toEqual({ id: "route-1" });
    await expect(fetchWalkingRoute({ lat: 1, lng: 2 }, { lat: 3, lng: 4 })).resolves.toBeNull();
    await expect(fetchWalkingRoute({ lat: 1, lng: 2 }, { lat: 3, lng: 4 })).rejects.toThrow("API map failed...");
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("2,1;4,3"));
  });

  it("parses route info and resolves the effective destination", () => {
    const route = {
      distance: 1500,
      duration: 700,
      legs: [{
        steps: [
          { distance: 100, duration: 60, maneuver: { instruction: "Walk ahead", type: "depart" } },
        ],
      }],
    };

    expect(parseRouteInfo(route)).toEqual({
      distance: 1500,
      duration: 700,
      steps: [{ distance: 100, duration: 60, instruction: "Walk ahead", type: "depart" }],
    });
    expect(getEffectiveDestination({ lat: 1, lng: 2 }, KCL_CAMPUSES[0])).toEqual({ lat: 1, lng: 2 });
    expect(getEffectiveDestination(null, KCL_CAMPUSES[0])).toEqual({
      lat: KCL_CAMPUSES[0].coords[1],
      lng: KCL_CAMPUSES[0].coords[0],
    });
    expect(getEffectiveDestination(null, null)).toBeNull();
  });

  it("fits the map to a route path", () => {
    const map = { fitBounds: vi.fn() };
    fitMapToRoute(map, [[0, 0], [1, 1], [2, 2]]);
    expect(MockLngLatBounds).toHaveBeenCalledWith([0, 0], [0, 0]);
    expect(boundsExtend).toHaveBeenCalledTimes(3);
    expect(map.fitBounds).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ duration: 1500 }),
    );
  });

  it("does not call setForm when setHomeStart resolves with no address", async () => {
    vi.useFakeTimers();
    reverseGeocode.mockResolvedValueOnce(null);
    const refs = createRefs();
    const setSelection = vi.fn((updater) => updater({ startLocation: null }));
    const setForm = vi.fn();
    const userHome = { address: "", lat: 51.49, lng: -0.12 };

    syncHomeMarker(refs, true, null, userHome, setSelection, setForm);
    vi.advanceTimersByTime(100);

    document.getElementById("setHomeAsStart").click();
    await Promise.resolve();
    await Promise.resolve();

    expect(setSelection).toHaveBeenCalled();
    expect(setForm).not.toHaveBeenCalled();
  });

  it("closes home popup after setting home as start", async () => {
    vi.useFakeTimers();
    reverseGeocode.mockResolvedValueOnce("Home Street");
    const refs = createRefs();
    const setSelection = vi.fn();
    const userHome = { address: "", lat: 51.49, lng: -0.12 };
    syncHomeMarker(refs, true, null, userHome, setSelection, vi.fn());
    const pointer = refs.homePointer.current;
    pointer._popup.isOpen.mockReturnValue(true);
    vi.advanceTimersByTime(100);
    document.getElementById("setHomeAsStart").click();
    await Promise.resolve();
    await Promise.resolve();
    expect(setSelection).toHaveBeenCalled();
    expect(pointer.togglePopup).toHaveBeenCalled();
  });

  it("cleans up markers, popups, and the map instance", () => {
    const refs = createRefs();
    refs.campusMarkers.current = [{ remove: vi.fn() }, { remove: vi.fn() }];
    refs.homePointer.current = { remove: vi.fn() };
    refs.homePopup.current = { remove: vi.fn() };
    refs.startMarker.current = { remove: vi.fn() };
    refs.startPopup.current = { remove: vi.fn() };

    cleanupMap(refs);

    expect(refs.campusMarkers.current).toEqual([]);
    expect(refs.map.current).toBeNull();
  });
});
