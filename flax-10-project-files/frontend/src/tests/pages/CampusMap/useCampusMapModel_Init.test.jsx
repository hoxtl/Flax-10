import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCampusMapModel } from "../../../pages/CampusMap/hooks/useCampusMapModel";

const responsiveMock = vi.fn();
const handleMapLoadMock = vi.fn();
const createMapClickHandlerMock = vi.fn(() => vi.fn());
const cleanupMapMock = vi.fn();

vi.mock("../../../pages/CampusMap/hooks/useCampusMapRefs", () => ({
  useCampusMapRefs: () => ({
    campusMarkers: { current: [] },
    mapContainer: { current: document.createElement("div") },
    map: { current: null },
  }),
}));

vi.mock("../../../pages/CampusMap/hooks/useCampusMapState", () => ({
  useCampusMapState: () => ({
    setUi: vi.fn(),
    ui: { isMobile: false, mapLoaded: true },
    setSelection: vi.fn(),
    selection: {},
    setForm: vi.fn(),
    form: {},
  }),
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
  syncHomeMarker: vi.fn(),
  syncStartMarker: vi.fn(),
  syncSelectedCampusPopup: vi.fn(),
}));

vi.mock("mapbox-gl", () => ({
  default: {
    Map: vi.fn(() => ({ addControl: vi.fn(), on: vi.fn(), flyTo: vi.fn() })),
    NavigationControl: vi.fn(),
    LngLatBounds: vi.fn(() => ({ extend: vi.fn().mockReturnThis() })),
  },
}));

describe("useCampusMapModel - Initialisation", () => {
  it("initialises map setup", () => {
    const { result } = renderHook(() => useCampusMapModel());
    expect(handleMapLoadMock).toHaveBeenCalled();
    expect(result.current.mapContainer).toBeDefined();
  });

  it("handles campus selection", () => {
    const campus = { name: "Strand", coords: [0, 0] };
    const { result } = renderHook(() => useCampusMapModel());
    act(() => {
      result.current.handleSelectCampus(campus);
    });
    // Further assertions would depend on state mock behavior
  });
});
