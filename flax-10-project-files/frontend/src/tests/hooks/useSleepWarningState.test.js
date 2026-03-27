import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import useSleepWarningState from "../../components/settings/hooks/useSleepWarningState";

describe("useSleepWarningState", () => {
  it("starts closed and updates both warning state buckets", () => {
    const { result } = renderHook(() => useSleepWarningState());

    expect(result.current.sleepWarning).toBe(false);
    expect(result.current.pendingAction).toBeNull();

    const pendingAction = () => "run";

    act(() => {
      result.current.setSleepWarning(true);
      result.current.setPendingAction(() => pendingAction);
    });

    expect(result.current.sleepWarning).toBe(true);
    expect(result.current.pendingAction).toBe(pendingAction);
  });
});
