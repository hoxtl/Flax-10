import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCampusMapModel } from "../../../pages/CampusMap/hooks/useCampusMapModel";

const reverseGeocodeMock = vi.fn();

vi.mock("../../../api/geocodeApi", () => ({
  reverseGeocode: reverseGeocodeMock,
}));

vi.mock("../../../pages/CampusMap/hooks/useCampusMapRefs", () => ({
  useCampusMapRefs: () => ({ mapContainer: { current: null }, map: { current: null } }),
}));

vi.mock("../../../pages/CampusMap/hooks/useCampusMapState", () => ({
  useCampusMapState: () => ({
    ui: { locating: false },
    setUi: vi.fn(),
    setSelection: vi.fn(),
    setForm: vi.fn(),
  }),
}));

describe("useCampusMapModel - Geolocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global.navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 51, longitude: 0 } })) },
    });
  });

  it("handles geolocate start", async () => {
    reverseGeocodeMock.mockResolvedValue("London");
    const { result } = renderHook(() => useCampusMapModel());
    await act(async () => {
      result.current.handleGeolocateStart();
    });
    expect(reverseGeocodeMock).toHaveBeenCalled();
  });
});
