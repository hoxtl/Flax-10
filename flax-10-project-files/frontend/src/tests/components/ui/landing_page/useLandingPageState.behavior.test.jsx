/*
 * Tests for landing page scroll state and animation behaviour.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLandingPageState } from "../../../../components/ui/landing_page/useLandingPageState";

function defineMutableNumberProperty(target, key, initialValue) {
  let current = initialValue;
  Object.defineProperty(target, key, {
    configurable: true,
    get: () => current,
    set: (nextValue) => {
      current = nextValue;
    },
  });
}

function defineReadonlyNumberProperty(target, key, value) {
  Object.defineProperty(target, key, {
    configurable: true,
    get: () => value,
  });
}

function prepareElement(element, prepare) {
  if (!element || element.dataset.prepared) {
    return;
  }

  element.dataset.prepared = "true";
  prepare(element);
}

function setContainerRef(state, element) {
  state.containerRef.current = element;
  prepareElement(element, (node) => {
    defineMutableNumberProperty(node, "scrollTop", 0);
    defineReadonlyNumberProperty(node, "scrollHeight", 1800);
    defineReadonlyNumberProperty(node, "clientHeight", 400);
  });
}

function setSectionRef(state, index, element) {
  state.sectionRefs.current[index] = element;
  prepareElement(element, (node) => {
    defineReadonlyNumberProperty(node, "offsetTop", index * 500);
    node.getBoundingClientRect = () => ({
      top: index * 500 - (state.containerRef.current?.scrollTop || 0),
      height: 400,
    });
  });
}

function LandingStateHarness({ globeConfig, sections }) {
  const state = useLandingPageState(sections, globeConfig);
  return (
    <div>
      <div data-testid="scroll-container" ref={(element) => setContainerRef(state, element)} />
      {sections.map((section, index) => (
        <div
          key={section.id}
          data-testid={`section-${index}`}
          ref={(element) => setSectionRef(state, index, element)}
        />
      ))}
      <output data-testid="active">{String(state.activeSection)}</output><output data-testid="opacity">{String(state.globeOpacity)}</output>
      <output data-testid="progress">{String(state.scrollProgress)}</output><output data-testid="transform">{state.displayTransform}</output>
      <output data-testid="top-pills">{state.topPills.join(",")}</output>
    </div>
  );
}

describe("useLandingPageState behavior", () => {
  let frameId;
  let frameCallbacks;
  let requestAnimationFrameSpy;
  let cancelAnimationFrameSpy;

  beforeEach(() => {
    frameId = 0;
    frameCallbacks = new Map();
    requestAnimationFrameSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frameId += 1;
      frameCallbacks.set(frameId, callback);
      return frameId;
    });
    cancelAnimationFrameSpy = vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      frameCallbacks.delete(id);
    });
  });

  afterEach(() => {
    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });

  function runFrame(id) {
    const callback = frameCallbacks.get(id);
    if (!callback) {
      return;
    }

    frameCallbacks.delete(id);
    act(() => {
      callback(performance.now());
    });
  }

  function runCurrentFrames() {
    [...frameCallbacks.keys()].forEach((id) => runFrame(id));
  }

  function renderHarness() {
    const sections = [
      { id: "hero", pills: ["Fast", "Calm"] },
      { id: "middle" },
      { id: "finish" },
    ];
    const { unmount } = render(
      <LandingStateHarness
        sections={sections}
        globeConfig={{
          positions: [
            { left: "10%", top: "20%", scale: 1.4 },
            { left: "30%", top: "40%" },
          ],
        }}
      />,
    );
    return { ...utils, scrollContainer: screen.getByTestId("scroll-container") };
  }

  it("uses the initial scroll container state and top pills", () => {
    renderHarness();
    expect(screen.getByTestId("top-pills").textContent).toBe("Fast,Calm");
    expect(screen.getByTestId("opacity").textContent).toBe("0.85");
    expect(screen.getByTestId("progress").textContent).toBe("0");
    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    runCurrentFrames();
    expect(screen.getByTestId("transform").textContent).toContain("translate3d(10vw, 20vh, 0)");
  });

  it("throttles scroll handlers and updates active section state", () => {
    const { scrollContainer } = renderHarness();
    const callsBeforeScroll = requestAnimationFrameSpy.mock.calls.length;
    act(() => {
      scrollContainer.scrollTop = 900;
      fireEvent.scroll(scrollContainer);
      fireEvent.scroll(scrollContainer);
    });

    expect(requestAnimationFrameSpy.mock.calls.length - callsBeforeScroll).toBe(1);
    runFrame(Math.max(...frameCallbacks.keys()));
    expect(screen.getByTestId("active").textContent).toBe("2");
    expect(screen.getByTestId("opacity").textContent).toBe("0.38");
    expect(Number(screen.getByTestId("progress").textContent)).toBeGreaterThan(0.6);
  });

  it("updates the transform when scrolling and resets the active section", () => {
    const { scrollContainer } = renderHarness();
    runCurrentFrames();
    act(() => {
      scrollContainer.scrollTop = 900;
      fireEvent.scroll(scrollContainer);
    });
    runFrame(Math.max(...frameCallbacks.keys()));
    runCurrentFrames();
    expect(screen.getByTestId("transform").textContent).not.toContain("translate3d(10vw, 20vh, 0)");
    act(() => {
      scrollContainer.scrollTop = 100;
      fireEvent.scroll(scrollContainer);
    });
    runFrame(Math.max(...frameCallbacks.keys()));
    expect(screen.getByTestId("active").textContent).toBe("0");
  });

  it("cleans up animation frames on unmount", () => {
    const { unmount } = renderHarness();
    unmount();
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });
});
