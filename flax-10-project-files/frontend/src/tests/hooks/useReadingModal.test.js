import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

import { useReadingModal } from "../../components/modules/hooks/useReadingModal";

const getReadingsMock = vi.fn();
const createReadingMock = vi.fn();
const updateReadingMock = vi.fn();
const deleteReadingMock = vi.fn();
const showToastMock = vi.fn();

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

vi.mock("../../api/readingApi", () => ({
  getReadings: (...args) => getReadingsMock(...args),
  createReading: (...args) => createReadingMock(...args),
  updateReading: (...args) => updateReadingMock(...args),
  deleteReading: (...args) => deleteReadingMock(...args),
}));

vi.mock("../../context/ToastContext", () => ({
  useToast: () => showToastMock,
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
    expect(showToastMock).toHaveBeenCalledWith("Reading added.", { variant: "success" });

    act(() => result.current.openEdit({ id: 1, title: "Week 1" }));
    await act(async () => {
      await result.current.handleSubmit({ title: "Updated reading" });
    });
    expect(updateReadingMock).toHaveBeenCalledWith(9, 1, { title: "Updated reading" });
    expect(showToastMock).toHaveBeenCalledWith("Reading updated.", { variant: "success" });

    await act(async () => {
      await result.current.handleDelete(1);
    });
    expect(deleteReadingMock).toHaveBeenCalledWith(9, 1);
    expect(showToastMock).toHaveBeenCalledWith("Reading deleted.", { variant: "success" });
    expect(getReadingsMock).toHaveBeenCalledTimes(4);
  });

  it("normalizes empty reading responses to an empty list and resets edit state on create", async () => {
    getReadingsMock.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useReadingModal(11));

    await waitFor(() => expect(result.current.readings).toEqual([]));

    act(() => result.current.openEdit({ id: 1, title: "Old reading" }));
    expect(result.current.editing).toEqual({ id: 1, title: "Old reading" });

    act(() => result.current.openCreate());
    expect(result.current.editing).toBeNull();
    expect(result.current.showForm).toBe(true);
  });

  it("normalizes empty reload responses after deletes", async () => {
    getReadingsMock
      .mockResolvedValueOnce([{ id: 1, title: "Week 1" }])
      .mockResolvedValueOnce(null);

    const { result } = renderHook(() => useReadingModal(12));
    await waitFor(() => expect(result.current.readings).toEqual([{ id: 1, title: "Week 1" }]));

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(result.current.readings).toEqual([]);
  });

  it("ignores late initial loads after unmount", async () => {
    const pending = deferred();
    getReadingsMock.mockReturnValueOnce(pending.promise);

    const { unmount } = renderHook(() => useReadingModal(13));
    unmount();

    await act(async () => {
      pending.resolve([{ id: 7, title: "Late reading" }]);
      await pending.promise;
    });
  });
});
