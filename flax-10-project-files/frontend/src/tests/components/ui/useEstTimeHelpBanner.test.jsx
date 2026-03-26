import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const readDismissedStateMock = vi.hoisted(() => vi.fn());
const persistDismissedStateMock = vi.hoisted(() => vi.fn());

vi.mock("../../../components/ui/est_time_help_banner/estTimeHelpBannerUtils", () => ({
  readDismissedState: readDismissedStateMock,
  persistDismissedState: persistDismissedStateMock,
}));

import { useEstTimeHelpBanner } from "../../../components/ui/est_time_help_banner/useEstTimeHelpBanner";

describe("useEstTimeHelpBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readDismissedStateMock.mockReturnValue(false);
  });

  it("hydrates dismissed state from storage and reacts to persist flag changes", () => {
    const { result, rerender } = renderHook(
      ({ persistDismiss }) => useEstTimeHelpBanner(persistDismiss),
      { initialProps: { persistDismiss: false } },
    );

    expect(readDismissedStateMock).toHaveBeenCalledWith(false);
    expect(result.current.dismissed).toBe(false);

    readDismissedStateMock.mockReturnValueOnce(true);
    rerender({ persistDismiss: true });

    expect(readDismissedStateMock).toHaveBeenLastCalledWith(true);
    expect(result.current.dismissed).toBe(true);
  });

  it("dismisses the banner in state and persists when requested", () => {
    const { result } = renderHook(() => useEstTimeHelpBanner(true));

    act(() => {
      result.current.dismissBanner();
    });

    expect(result.current.dismissed).toBe(true);
    expect(persistDismissedStateMock).toHaveBeenCalledWith(true);
  });
});
