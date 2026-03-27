import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { useCampusMapModel } from "../../../pages/campus_map/hooks/useCampusMapModel";
import { createMutableState, createMockRefs } from "./campusMapTestUtils";

let mockRefs;
let mockState;

vi.mock("../../../pages/campus_map/hooks/useCampusMapRefs", () => ({
  useCampusMapRefs: () => mockRefs,
}));
vi.mock("../../../pages/campus_map/hooks/useCampusMapState", () => ({
  useCampusMapState: () => mockState,
}));
vi.mock("../../../pages/campus_map/hooks/useDisruptions", () => ({
  useDisruptions: () => ({ disruptions: [], loading: false }),
}));
vi.mock("../../../pages/campus_map/hooks/useHomeAddress", () => ({
  useHomeAddress: () => ({ userHome: null }),
}));
vi.mock("../../../pages/campus_map/utils/mapHelpers", () => ({
  cleanupMap: vi.fn(),
  clearRouteSource: vi.fn(),
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
vi.mock("mapbox-gl", () => ({
  default: {
    Map: vi.fn(() => ({ addControl: vi.fn(), on: vi.fn(), flyTo: vi.fn(), resize: vi.fn() })),
    NavigationControl: vi.fn(),
    LngLatBounds: vi.fn(() => ({ extend: vi.fn() })),
  },
}));

describe("useCampusMapModel - Core", () => {
  const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRefs = createMockRefs();
    mockState = createMutableState();
  });

  it("exposes stable model fields and hooks", () => {
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    expect(result.current.loadingDisruptions).toBe(false);
    expect(result.current.mapContainer).toBe(mockRefs.mapContainer);
    expect(result.current.showInitialSkeleton).toBe(false);
  });

  it("skips map setup when map is already created", () => {
    mockRefs.map.current = { addControl: vi.fn() };
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    expect(result.current.loadingDisruptions).toBe(false);
  });

  it("handles clearing custom destination", () => {
    mockState = createMutableState({ selection: { customDestination: { lat: 1, lng: 1 } } });
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    act(() => { result.current.clearCustomDestination(); });
    expect(mockState.selection.customDestination).toBeNull();
  });

  it("manages TfL and walking instruction toggles", () => {
    const { result } = renderHook(() => useCampusMapModel(), { wrapper });
    act(() => {
      result.current.toggleTflInstructions();
      result.current.toggleWalkingInstructions();
    });
    expect(mockState.ui.tflInstructions).toBe(true);
    expect(mockState.ui.walkingInstructions).toBe(true);
  });
});
