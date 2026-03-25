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

  it("does not fire the handler when the ref is not ready", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const onOutside = vi.fn();

    renderHook(() => useClickOutside({ current: null }, onOutside));

    document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(addSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    expect(onOutside).not.toHaveBeenCalled();
    addSpy.mockRestore();
  });
});
