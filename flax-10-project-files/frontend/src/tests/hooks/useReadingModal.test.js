import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

import { useReadingModal } from "../../components/Modules/hooks/useReadingModal";

const getReadingsMock = vi.fn();
const createReadingMock = vi.fn();
const updateReadingMock = vi.fn();
const deleteReadingMock = vi.fn();

vi.mock("../../api/readingApi", () => ({
  getReadings: (...args) => getReadingsMock(...args),
  createReading: (...args) => createReadingMock(...args),
  updateReading: (...args) => updateReadingMock(...args),
  deleteReading: (...args) => deleteReadingMock(...args),
}));

describe("useReadingModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getReadingsMock.mockResolvedValue([{ id: 1, title: "Week 1" }]);
    createReadingMock.mockResolvedValue({});
    updateReadingMock.mockResolvedValue({});
    deleteReadingMock.mockResolvedValue({});
  });

  it("loads readings and supports create/edit/close state", async () => {
    const { result } = renderHook(() => useReadingModal(7));
    await waitFor(() => expect(result.current.readings).toEqual([{ id: 1, title: "Week 1" }]));

    act(() => result.current.openCreate());
    expect(result.current.showForm).toBe(true);
    expect(result.current.editing).toBeNull();

    act(() => result.current.openEdit({ id: 1, title: "Week 1" }));
    expect(result.current.editing).toEqual({ id: 1, title: "Week 1" });

    act(() => result.current.close());
    expect(result.current.showForm).toBe(false);
  });

  it("submits create and update flows and reloads after delete", async () => {
    const { result } = renderHook(() => useReadingModal(9));
    await waitFor(() => expect(result.current.readings.length).toBe(1));

    await act(async () => {
      await result.current.handleSubmit({ title: "New reading" });
    });
    expect(createReadingMock).toHaveBeenCalledWith(9, { title: "New reading" });

    act(() => result.current.openEdit({ id: 1, title: "Week 1" }));
    await act(async () => {
      await result.current.handleSubmit({ title: "Updated reading" });
    });
    expect(updateReadingMock).toHaveBeenCalledWith(9, 1, { title: "Updated reading" });

    await act(async () => {
      await result.current.handleDelete(1);
    });
    expect(deleteReadingMock).toHaveBeenCalledWith(9, 1);
    expect(getReadingsMock).toHaveBeenCalledTimes(4);
  });
});
