import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCampusMapModel } from "../../../pages/CampusMap/hooks/useCampusMapModel";

const {
  responsiveMock,
  handleMapLoadMock,
  createMapClickHandlerMock,
  cleanupMapMock,
} = vi.hoisted(() => ({
  responsiveMock: vi.fn(),
  handleMapLoadMock: vi.fn(),
  createMapClickHandlerMock: vi.fn(() => vi.fn()),
  cleanupMapMock: vi.fn(),
}));

vi.mock("../../../pages/CampusMap/hooks/useCampusMapRefs", () => ({
  useCampusMapRefs: () => ({
    campusMarkers: { current: [] },
    mapContainer: { current: document.createElement("div") },
    map: { current: null },
    routeLayerAdded: { current: false },
    startMarker: { current: null },
    startPopup: { current: null },
  }),
}));

vi.mock("../../../pages/CampusMap/hooks/useCampusMapState", () => ({
  useCampusMapState: () => ({
    setUi: vi.fn(),
    ui: { isMobile: false, mapLoaded: true },
    setSelection: vi.fn(),
    selection: { startLocation: null, selectedCampus: null, customDestination: null },
    setForm: vi.fn(),
    form: { manualDestination: "", manualStart: "" },
    setRoutes: vi.fn(),
  }),
}));

vi.mock("../../../api/eventApi", () => ({
  getEvents: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../../../pages/CampusMap/hooks/useDisruptions", () => ({
  useDisruptions: () => ({ disruptions: [], loading: false }),
}));

vi.mock("../../../pages/CampusMap/hooks/useHomeAddress", () => ({
  useHomeAddress: () => ({ userHome: null }),
}));

vi.mock("../../../pages/CampusMap/hooks/useResponsiveCampusMap", () => ({
  useResponsiveCampusMap: (...args) => responsiveMock(...args),
}));

vi.mock("../../../pages/CampusMap/mapHelpers", () => ({
  cleanupMap: cleanupMapMock,
  handleMapLoad: handleMapLoadMock,
  createMapClickHandler: createMapClickHandlerMock,
  clearRouteSource: vi.fn(),
  getEffectiveDestination: vi.fn(() => null),
  syncHomeMarker: vi.fn(),
  syncStartMarker: vi.fn(),
  syncSelectedCampusPopup: vi.fn(),
}));

vi.mock("mapbox-gl", () => ({
  default: {
    Map: vi.fn(function Map() {
      return {
        addControl: vi.fn(),
        on: vi.fn((event, handler) => {
          if (event === "load") handler();
        }),
        flyTo: vi.fn(),
      };
    }),
    NavigationControl: vi.fn(),
    LngLatBounds: vi.fn(() => ({ extend: vi.fn().mockReturnThis() })),
  },
}));

describe("useCampusMapModel - Initialisation", () => {
  const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

  it("initialises map setup", () => {
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    expect(handleMapLoadMock).toHaveBeenCalled();
    expect(result.current.mapContainer).toBeDefined();
  });

  it("handles campus selection", () => {
    const campus = { name: "Strand", coords: [0, 0] };
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    act(() => {
      result.current.handleSelectCampus(campus);
    });
    // Further assertions would depend on state mock behavior
  });
});
