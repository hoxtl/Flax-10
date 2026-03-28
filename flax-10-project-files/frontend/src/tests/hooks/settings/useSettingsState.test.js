import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import useSettingsState from "../../../components/settings/hooks/useSettingsState";

describe("useSettingsState", () => {
  it("starts with empty/default values and updates each state bucket", () => {
    const { result } = renderHook(() => useSettingsState());

    expect(result.current.isSaving).toBe(false);
    expect(result.current.bannerMessage).toBe("");
    expect(result.current.passwordError).toBe("");
    expect(result.current.homeAddressError).toBe("");

    act(() => {
      result.current.setIsSaving(true);
      result.current.setBannerMessage("Saved");
      result.current.setPasswordError("Password issue");
      result.current.setHomeAddressError("Address issue");
    });

    expect(result.current.isSaving).toBe(true);
    expect(result.current.bannerMessage).toBe("Saved");
    expect(result.current.passwordError).toBe("Password issue");
    expect(result.current.homeAddressError).toBe("Address issue");
  });
});
