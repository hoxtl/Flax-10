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

function LandingStateHarness({ globeConfig, sections }) {
  const state = useLandingPageState(sections, globeConfig);

  return (
    <div>
      <div
        data-testid="scroll-container"
        ref={(element) => {
          state.containerRef.current = element;
          if (element && !element.dataset.prepared) {
            element.dataset.prepared = "true";
            defineMutableNumberProperty(element, "scrollTop", 0);
            defineReadonlyNumberProperty(element, "scrollHeight", 1800);
            defineReadonlyNumberProperty(element, "clientHeight", 400);
          }
        }}
      />
      {sections.map((section, index) => (
        <div
          key={section.id}
          data-testid={`section-${index}`}
          ref={(element) => {
            state.sectionRefs.current[index] = element;
            if (element && !element.dataset.prepared) {
              element.dataset.prepared = "true";
              defineReadonlyNumberProperty(element, "offsetTop", index * 500);
              element.getBoundingClientRect = () => ({
                top: index * 500 - (state.containerRef.current?.scrollTop || 0),
                height: 400,
              });
            }
          }}
        />
      ))}
      <output data-testid="active">{String(state.activeSection)}</output>
      <output data-testid="opacity">{String(state.globeOpacity)}</output>
      <output data-testid="progress">{String(state.scrollProgress)}</output>
      <output data-testid="transform">{state.displayTransform}</output>
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

  it("uses a scroll container, throttles scroll handlers, animates positions, and cleans up frames", () => {
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

    const scrollContainer = screen.getByTestId("scroll-container");
    expect(screen.getByTestId("top-pills").textContent).toBe("Fast,Calm");
    expect(screen.getByTestId("opacity").textContent).toBe("0.85");
    expect(screen.getByTestId("progress").textContent).toBe("0");
    expect(requestAnimationFrameSpy).toHaveBeenCalled();

    runCurrentFrames();
    expect(screen.getByTestId("transform").textContent).toContain("translate3d(10vw, 20vh, 0)");

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

    runCurrentFrames();
    expect(screen.getByTestId("transform").textContent).not.toContain("translate3d(10vw, 20vh, 0)");

    act(() => {
      scrollContainer.scrollTop = 100;
      fireEvent.scroll(scrollContainer);
    });

    runFrame(Math.max(...frameCallbacks.keys()));
    expect(screen.getByTestId("active").textContent).toBe("0");

    unmount();
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });
});
