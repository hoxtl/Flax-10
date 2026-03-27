import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePopoverDismiss } from "../../../../../pages/homepage/hooks/mini_timeline/usePopoverDismiss";

// Helpers

function makeRef(element = null) {
  return { current: element };
}

function fireMousedown(target) {
  const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "target", { value: target, configurable: true });
  document.dispatchEvent(event);
}

// Tests

describe("usePopoverDismiss", () => {
  let onClose;

  beforeEach(() => {
    onClose = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing (adds no mousedown listener) when activeId is falsy", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    renderHook(() => usePopoverDismiss(null, makeRef(), onClose));
    const mousedownCalls = addSpy.mock.calls.filter(([event]) => event === "mousedown");
    expect(mousedownCalls).toHaveLength(0);
    addSpy.mockRestore();
  });

  it("does not call onClose when activeId is null and a mousedown fires", () => {
    renderHook(() => usePopoverDismiss(null, makeRef(), onClose));
    fireMousedown(document.body);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when clicking outside the popover ref", () => {
    const outside = document.createElement("div");
    document.body.appendChild(outside);

    const popoverEl = document.createElement("div");
    document.body.appendChild(popoverEl);

    const ref = makeRef(popoverEl);
    renderHook(() => usePopoverDismiss("some-id", ref, onClose));

    act(() => fireMousedown(outside));

    expect(onClose).toHaveBeenCalledTimes(1);

    document.body.removeChild(outside);
    document.body.removeChild(popoverEl);
  });

  it("does not call onClose when clicking inside the popover ref", () => {
    const popoverEl = document.createElement("div");
    const insideEl = document.createElement("span");
    popoverEl.appendChild(insideEl);
    document.body.appendChild(popoverEl);

    const ref = makeRef(popoverEl);
    renderHook(() => usePopoverDismiss("some-id", ref, onClose));

    act(() => fireMousedown(insideEl));

    expect(onClose).not.toHaveBeenCalled();

    document.body.removeChild(popoverEl);
  });

  it("does not call onClose when clicking the popover container itself", () => {
    const popoverEl = document.createElement("div");
    document.body.appendChild(popoverEl);

    const ref = makeRef(popoverEl);
    renderHook(() => usePopoverDismiss("some-id", ref, onClose));

    // contains() returns true for the element itself
    act(() => fireMousedown(popoverEl));

    expect(onClose).not.toHaveBeenCalled();

    document.body.removeChild(popoverEl);
  });

  it("removes the mousedown listener when unmounted", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() => usePopoverDismiss("some-id", makeRef(), onClose));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("removes the listener when activeId changes from truthy to falsy", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { rerender } = renderHook(({ id }) => usePopoverDismiss(id, makeRef(), onClose), {
      initialProps: { id: "active-id" },
    });

    rerender({ id: null });

    expect(removeSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("handles a ref whose current is null without throwing", () => {
    const ref = makeRef(null); // current is null — contains will throw unless guarded
    renderHook(() => usePopoverDismiss("some-id", ref, onClose));

    // Should not throw
    expect(() => act(() => fireMousedown(document.body))).not.toThrow();
    // onClose should be called because null?.contains() is undefined (falsy)
    expect(onClose).toHaveBeenCalled();
  });
});
