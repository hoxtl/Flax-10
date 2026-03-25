import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import WelcomeBackgroundPaths from "../../../components/Welcome/WelcomeBackgroundPaths";

let mockReducedMotion = false;
let motionValueSets = [];

vi.mock("framer-motion", () => {
  const React = require("react");

  return {
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      path: (props) => <path {...props} />,
    },
    useReducedMotion: () => mockReducedMotion,
    useMotionValue: (initial) => {
      const set = vi.fn();
      motionValueSets.push(set);
      return { get: () => initial, set };
    },
    useSpring: (mv) => mv,
  };
});

describe("WelcomeBackgroundPaths", () => {
  beforeEach(() => {
    mockReducedMotion = false;
    motionValueSets = [];

    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals?.();
  });

  it("renders two sets of paths (default flip and flip=-1)", () => {
    const { container } = render(<WelcomeBackgroundPaths />);

    // 28 paths * 2 svg groups = 56
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(56);
  });

  it("updates motion values on mousemove (normal innerWidth/innerHeight)", () => {
    render(<WelcomeBackgroundPaths />);

    const [setX, setY] = motionValueSets;
    expect(setX).toBeDefined();
    expect(setY).toBeDefined();

    Object.defineProperty(window, "innerWidth", { value: 1000, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 500, configurable: true });

    fireEvent.mouseMove(window, { clientX: 750, clientY: 250 });

    expect(setX).toHaveBeenCalledWith(2.5);
    expect(setY).toHaveBeenCalledWith(0);
  });

  it("covers (window.innerWidth || 1) and (window.innerHeight || 1) fallback branches", () => {
    render(<WelcomeBackgroundPaths />);

    const [setX, setY] = motionValueSets;

    Object.defineProperty(window, "innerWidth", { value: 0, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 0, configurable: true });

    fireEvent.mouseMove(window, { clientX: 1, clientY: 1 });

    expect(setX).toHaveBeenCalledWith(5);
    expect(setY).toHaveBeenCalledWith(5);
  });

  it("does not attach mousemove listener when reduced motion is enabled", () => {
    mockReducedMotion = true;

    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<WelcomeBackgroundPaths />);

    expect(addSpy).not.toHaveBeenCalledWith("mousemove", expect.any(Function), expect.anything());

    fireEvent.mouseMove(window, { clientX: 500, clientY: 300 });
    const [setX, setY] = motionValueSets;
    expect(setX).toBeDefined();
    expect(setY).toBeDefined();
    expect(setX).not.toHaveBeenCalled();
    expect(setY).not.toHaveBeenCalled();

    unmount();
    expect(removeSpy).not.toHaveBeenCalledWith("mousemove", expect.any(Function));
  });

  it("applies embedded and custom class names", () => {
    const { container } = render(<WelcomeBackgroundPaths embedded className="extra" count={2} intensity={1.4} speed={0.05} />);
    expect(container.firstChild.className).toContain("extra");
  });
});
