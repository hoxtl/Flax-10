import { vi } from "vitest";

export function createMutableState(overrides = {}) {
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

export function createMockRefs() {
  return {
    campusMarkers: { current: [] },
    homePointer: { current: { remove: vi.fn(), togglePopup: vi.fn(), _popup: { isOpen: vi.fn(() => false) } } },
    homePopup: { current: null },
    map: { current: { addControl: vi.fn(), on: vi.fn(), flyTo: vi.fn(), resize: vi.fn(), fitBounds: vi.fn() } },
    mapContainer: { current: document.createElement("div") },
    routeLayerAdded: { current: true },
    startMarker: { current: { remove: vi.fn(), setLngLat: vi.fn() } },
    startPopup: { current: { remove: vi.fn() } },
  };
}
