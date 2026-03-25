import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCampusMapModel } from "../../../pages/CampusMap/hooks/useCampusMapModel";

const { reverseGeocodeMock } = vi.hoisted(() => ({
  reverseGeocodeMock: vi.fn(),
}));

vi.mock("../../../api/geocodeApi", () => ({
  reverseGeocode: reverseGeocodeMock,
}));

vi.mock("../../../api/eventApi", () => ({
  getEvents: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../../../pages/CampusMap/hooks/useCampusMapRefs", () => ({
  useCampusMapRefs: () => ({
    campusMarkers: { current: [] },
    mapContainer: { current: null },
    map: { current: null },
    routeLayerAdded: { current: false },
    startMarker: { current: null },
    startPopup: { current: null },
  }),
}));

vi.mock("../../../pages/CampusMap/hooks/useCampusMapState", () => ({
  useCampusMapState: () => ({
    form: { manualDestination: "", manualStart: "" },
    selection: { startLocation: null, selectedCampus: null, customDestination: null },
    ui: { locating: false, mapLoaded: false, isMobile: false },
    setUi: vi.fn(),
    setSelection: vi.fn(),
    setForm: vi.fn(),
    setRoutes: vi.fn(),
  }),
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
  clearRouteSource: vi.fn(),
  cleanupMap: vi.fn(),
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
    Object.defineProperty(global.navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 51, longitude: 0 } })) },
    });
  });

  it("handles geolocate start", async () => {
    reverseGeocodeMock.mockResolvedValue("London");
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    await act(async () => {
      result.current.handleGeolocateStart();
    });
    expect(reverseGeocodeMock).toHaveBeenCalled();
  });
});
