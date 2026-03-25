import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useClickOutside } from "../../components/common/hooks/useClickOutside";

describe("common useClickOutside", () => {
  it("calls the handler only for outside clicks", () => {
    const onOutside = vi.fn();
    const node = document.createElement("div");
    document.body.appendChild(node);
    const ref = { current: node };

    renderHook(() => useClickOutside(ref, onOutside));

    node.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(onOutside).not.toHaveBeenCalled();

    document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(onOutside).toHaveBeenCalledTimes(1);

    document.body.removeChild(node);
  });

  it("removes the event listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const ref = { current: document.createElement("div") };

    const { unmount } = renderHook(() => useClickOutside(ref, vi.fn()));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("does not attach listeners when the ref is not ready", () => {
    const addSpy = vi.spyOn(document, "addEventListener");

    renderHook(() => useClickOutside({ current: null }, vi.fn()));

    expect(addSpy).not.toHaveBeenCalledWith("mousedown", expect.any(Function));
    addSpy.mockRestore();
  });
});
