import { vi } from "vitest";

const createSection = (defaults, overrides = {}) => ({ ...defaults, ...overrides });

const createSelectionState = (overrides = {}) =>
  createSection({ customDestination: null, selectedCampus: null, startLocation: null }, overrides);

const createRoutesState = (overrides = {}) =>
  createSection(
    {
      loadingRoute: false,
      loadingTflRoute: false,
      routeError: "",
      routeInfo: null,
      tflRouteError: "",
      tflRouteInfo: null,
    },
    overrides,
  );

const createFormState = (overrides = {}) =>
  createSection({ manualDestination: "", manualStart: "" }, overrides);

const createUiState = (overrides = {}) =>
  createSection(
    {
      isMobile: false,
      locating: false,
      mapLoaded: true,
      minSkeletonElapsed: true,
      mobileInitialOpen: true,
      tflInstructions: false,
      walkingInstructions: false,
    },
    overrides,
  );

const createSetter = (state) => (key) =>
  vi.fn((updater) => {
    state[key] = typeof updater === "function" ? updater(state[key]) : updater;
    return state[key];
  });

const createAccessors = (state) => ({
  selection: { get: () => state.selection },
  routes: { get: () => state.routes },
  form: { get: () => state.form },
  ui: { get: () => state.ui },
});

export function createMutableState(overrides = {}) {
  const state = {
    selection: createSelectionState(overrides.selection),
    routes: createRoutesState(overrides.routes),
    form: createFormState(overrides.form),
    ui: createUiState(overrides.ui),
  };
  const wrapSetter = createSetter(state);
  const api = {
    setSelection: wrapSetter("selection"),
    setRoutes: wrapSetter("routes"),
    setForm: wrapSetter("form"),
    setUi: wrapSetter("ui"),
  };
  Object.defineProperties(api, createAccessors(state));
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
