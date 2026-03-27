import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateEventMock = vi.fn();
const geocodeAddressMock = vi.fn();
const dispatchMock = vi.fn();

vi.mock("../../../../api/eventApi", () => ({
  updateEvent: (...args) => updateEventMock(...args),
}));

vi.mock("../../../../api/geocodeApi", () => ({
  geocodeAddress: (...args) => geocodeAddressMock(...args),
}));

vi.mock("../../../../context/CalendarContext", () => ({
  useCalendarDispatch: () => dispatchMock,
}));

import { useTableEdit } from "../../../../components/calendar/hooks/useTableEdit";

describe("useTableEdit location and tag edges", () => {
  const events = [{
    id: 1,
    title: "Study block",
    location: "Old room",
    location_latitude: 51.5,
    location_longitude: -0.11,
    location_validated: true,
    start_time: "2026-03-15T09:00:00Z",
    end_time: "2026-03-15T10:00:00Z",
  }];
  const tags = [
    { id: 1, label: "Work" },
    { id: 2, label: "Deep Work" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    updateEventMock.mockResolvedValue({});
  });

  it("clears stored coordinates when the location is blanked out", async () => {
    const { result } = renderHook(() => useTableEdit(events, tags));

    act(() => result.current.startEdit(1, "location", "Old room"));
    await act(async () => {
      await result.current.saveWithValue("   ");
    });

    expect(updateEventMock).toHaveBeenCalledWith(1, expect.objectContaining({
      location: "   ",
      location_latitude: null,
      location_longitude: null,
      location_validated: false,
    }));
    expect(dispatchMock).toHaveBeenCalledWith(expect.objectContaining({
      type: "UPDATE_EVENT",
      payload: expect.objectContaining({ location_validated: false }),
    }));
  });

  it("marks locations invalid when geocoding fails", async () => {
    geocodeAddressMock.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useTableEdit(events, tags));

    act(() => result.current.startEdit(1, "location", "Old room"));
    await act(async () => {
      await result.current.saveWithValue("Library");
    });

    expect(updateEventMock).toHaveBeenCalledWith(1, expect.objectContaining({
      location: "Library",
      location_validated: false,
    }));
  });

  it("stores returned coordinates when geocoding succeeds", async () => {
    geocodeAddressMock.mockResolvedValueOnce({ latitude: 51.501, longitude: -0.142 });
    const { result } = renderHook(() => useTableEdit(events, tags));

    act(() => result.current.startEdit(1, "location", "Old room"));
    await act(async () => {
      await result.current.saveWithValue("Library");
    });

    expect(updateEventMock).toHaveBeenCalledWith(1, expect.objectContaining({
      location: "Library",
      location_latitude: 51.501,
      location_longitude: -0.142,
      location_validated: true,
    }));
  });

  it("matches numeric string tag ids and clears empty tag values", async () => {
    const { result, rerender } = renderHook(({ providedTags }) => useTableEdit(events, providedTags), {
      initialProps: { providedTags: tags },
    });

    act(() => result.current.startEdit(1, "tag", null));
    await act(async () => {
      await result.current.saveWithValue("2");
    });

    expect(updateEventMock).toHaveBeenCalledWith(1, expect.objectContaining({
      tag: "2",
      tag_id: "2",
      tag_name: "Deep Work",
    }));

    rerender({ providedTags: undefined });
    act(() => result.current.startEdit(1, "tag", "2"));
    await act(async () => {
      await result.current.saveWithValue("");
    });

    expect(updateEventMock).toHaveBeenLastCalledWith(1, expect.objectContaining({
      tag: null,
      tag_id: null,
      tag_name: null,
    }));
  });
});
