/**
 * Shared state and ref builders for CampusMap tests.
 */

import { vi } from "vitest";

const createSelection = (overrides = {}) => ({
  customDestination: null,
  selectedCampus: null,
  startLocation: null,
  ...overrides,
});

const createRoutes = (overrides = {}) => ({
  loadingRoute: false,
  loadingTflRoute: false,
  routeError: "",
  routeInfo: null,
  tflRouteError: "",
  tflRouteInfo: null,
  ...overrides,
});

const createForm = (overrides = {}) => ({
  manualDestination: "",
  manualStart: "",
  ...overrides,
});

const createUi = (overrides = {}) => ({
  isMobile: false,
  locating: false,
  mapLoaded: true,
  minSkeletonElapsed: true,
  mobileInitialOpen: true,
  tflInstructions: false,
  walkingInstructions: false,
  ...overrides,
});

function createSetter(state, key) {
  return vi.fn((updater) => {
    state[key] = typeof updater === "function" ? updater(state[key]) : updater;
    return state[key];
  });
}

function createStateApi(state) {
  return {
    setSelection: createSetter(state, "selection"),
    setRoutes: createSetter(state, "routes"),
    setForm: createSetter(state, "form"),
    setUi: createSetter(state, "ui"),
  };
}

function attachStateGetters(api, state) {
  Object.defineProperties(api, {
    selection: { get: () => state.selection },
    routes: { get: () => state.routes },
    form: { get: () => state.form },
    ui: { get: () => state.ui },
  });
  return api;
}

export function createMutableState(overrides = {}) {
  const state = {
    selection: createSelection(overrides.selection),
    routes: createRoutes(overrides.routes),
    form: createForm(overrides.form),
    ui: createUi(overrides.ui),
  };
  return attachStateGetters(createStateApi(state), state);
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
