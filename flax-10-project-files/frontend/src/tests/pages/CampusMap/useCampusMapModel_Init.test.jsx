import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCampusMapModel } from "../../../pages/CampusMap/hooks/useCampusMapModel";
import { createMutableState, createMockRefs } from "./campusMapTestUtils";

const responsiveMock = vi.fn();
const handleMapLoadMock = vi.fn();
const createMapClickHandlerMock = vi.fn(() => vi.fn());
const cleanupMapMock = vi.fn();
const syncHomeMarkerMock = vi.fn();
const syncStartMarkerMock = vi.fn();
const syncSelectedCampusPopupMock = vi.fn();

let mockRefs;
let mockState;
let mapInstance;

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
  clearRouteSource: vi.fn(),
  createMapClickHandler: (...args) => createMapClickHandlerMock(...args),
  displayRoute: vi.fn(),
  fetchWalkingRoute: vi.fn(),
  getEffectiveDestination: vi.fn(),
  handleMapLoad: (...args) => handleMapLoadMock(...args),
  parseRouteInfo: vi.fn(),
  syncHomeMarker: (...args) => syncHomeMarkerMock(...args),
  syncSelectedCampusPopup: (...args) => syncSelectedCampusPopupMock(...args),
  syncStartMarker: (...args) => syncStartMarkerMock(...args),
}));
vi.mock("mapbox-gl", () => ({
  default: {
    Map: vi.fn().mockImplementation(function() { return mapInstance; }),
    NavigationControl: vi.fn(),
    LngLatBounds: vi.fn().mockImplementation(function() { return { extend: vi.fn().mockReturnThis() }; }),
  },
}));

describe("useCampusMapModel - Initialisation", () => {
  const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

  beforeEach(() => {
    vi.clearAllMocks();
    mapInstance = { addControl: vi.fn(), on: vi.fn((e, cb) => e === "load" && cb()), flyTo: vi.fn(), resize: vi.fn(), fitBounds: vi.fn() };
    mockRefs = createMockRefs();
    mockRefs.map.current = mapInstance;
    mockState = createMutableState();
  });

  it("initialises map setup", () => {
    mockRefs.map.current = null;
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    expect(responsiveMock).toHaveBeenCalledWith(mockState.setUi, mockState.ui.isMobile);
    expect(handleMapLoadMock).toHaveBeenCalled();
    expect(createMapClickHandlerMock).toHaveBeenCalled();
    expect(result.current.disruptions).toEqual([{ id: 1 }]);
  });

  it("handles map load campus selection toggle", () => {
    mockRefs.map.current = null;
    renderHook(() => useCampusMapModel(), { wrapper });
    const handleCampusSelect = handleMapLoadMock.mock.calls[0][1];
    const firstMarker = { getPopup: vi.fn(() => ({ isOpen: vi.fn(() => false) })), togglePopup: vi.fn() };
    const secondMarker = { getPopup: vi.fn(() => ({ isOpen: vi.fn(() => true) })), togglePopup: vi.fn() };
    act(() => {
      handleCampusSelect({ id: "strand" }, [firstMarker, secondMarker], firstMarker);
    });
    expect(mockState.selection.selectedCampus).toEqual({ id: "strand" });
    expect(firstMarker.togglePopup).toHaveBeenCalled();
    expect(secondMarker.togglePopup).toHaveBeenCalled();
  });

  it("toggles the clicked marker once when its popup is already open", () => {
    mockRefs.map.current = null;
    renderHook(() => useCampusMapModel(), { wrapper });
    const handleCampusSelect = handleMapLoadMock.mock.calls[0][1];
    const clickedMarker = { getPopup: vi.fn(() => ({ isOpen: vi.fn(() => true) })), togglePopup: vi.fn() };

    act(() => {
      handleCampusSelect({ id: "waterloo" }, [clickedMarker], clickedMarker);
    });

    expect(clickedMarker.togglePopup).toHaveBeenCalledTimes(1);
  });

  it("updates selection and form state via handlers", () => {
    const campus = { name: "Strand", coords: [0, 0] };
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    act(() => {
      result.current.handleSelectCampus(campus);
      result.current.setManualDestination("Library");
      result.current.setManualStart("Home");
    });
    expect(mockState.form.manualDestination).toBe("Library");
    expect(mockState.form.manualStart).toBe("Home");
    expect(mockState.selection.selectedCampus).toEqual(campus);
  });

  it("toggles instructions and flies to campus", () => {
    const campus = { name: "Strand", coords: [0, 0] };
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    act(() => {
      result.current.toggleTflInstructions();
      result.current.toggleWalkingInstructions();
      result.current.flyToCampus(campus);
    });
    expect(mockState.ui.tflInstructions).toBe(true);
    expect(mockState.ui.walkingInstructions).toBe(true);
    expect(mapInstance.flyTo).toHaveBeenCalled();
  });

  it("clears selections through route reset helpers", () => {
    mockState = createMutableState({ selection: { selectedCampus: { id: "s" }, startLocation: { lat: 1, lng: 2 } } });
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    act(() => {
      result.current.handleClearStart();
      result.current.handleClearCampus();
      result.current.clearAllSelections();
    });
    expect(mockState.selection.startLocation).toBeNull();
    expect(mockState.selection.selectedCampus).toBeNull();
  });
});
