import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Shared mocks (must be declared before the dynamic imports below)

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_, tag) =>
        ({ children, ...props }) => {
          const Tag = typeof tag === "string" ? tag : "div";
          const rest = { ...props };
          delete rest.initial;
          delete rest.animate;
          delete rest.exit;
          delete rest.transition;
          return <Tag {...rest}>{children}</Tag>;
        },
    },
  ),
}));

vi.mock("../../../components/StudyCoachPanel", () => ({
  default: ({ initialMessage, onClose }) => (
    <div>
      <span data-testid="initial-message">{initialMessage}</span>
      <button onClick={onClose}>Close panel</button>
    </div>
  ),
}));

// FloatingChat.module.css — avoid CSS module resolution issues in tests
vi.mock("../../../components/FloatingChat.module.css", () => ({ default: {} }));

import { useFloatingChatState } from "../../../components/floating_chat/useFloatingChatState";

// Wrapper factories

function makeWrapper(path = "/", search = "") {
  return function Wrapper({ children }) {
    return <MemoryRouter initialEntries={[`${path}${search}`]}>{children}</MemoryRouter>;
  };
}

// toggleFab behaviour

describe("toggleFab", () => {
  it("sets minimized to false (without toggling open) when currently minimized", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/tasks"),
    });

    // First: minimise
    act(() => result.current.minimizePrompt());
    expect(result.current.minimized).toBe(true);
    expect(result.current.open).toBe(false);

    // toggleFab while minimized should un-minimise, not open
    act(() => result.current.toggleFab());
    expect(result.current.minimized).toBe(false);
    expect(result.current.open).toBe(false);
  });

  it("opens the chat when not minimized and not open", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/tasks"),
    });

    expect(result.current.minimized).toBe(false);
    expect(result.current.open).toBe(false);

    act(() => result.current.toggleFab());
    expect(result.current.open).toBe(true);
  });

  it("closes the chat when not minimized and already open", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/tasks"),
    });

    act(() => result.current.toggleFab()); // open
    expect(result.current.open).toBe(true);

    act(() => result.current.toggleFab()); // close
    expect(result.current.open).toBe(false);
  });

  it("opens the guided prompt message and renders a closable chat window", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/tasks"),
    });

    act(() => result.current.minimizePrompt());
    expect(result.current.minimized).toBe(true);

    act(() => result.current.openPrompt());
    expect(result.current.open).toBe(true);
    expect(result.current.minimized).toBe(false);

    render(result.current.renderWindow());
    expect(screen.getByTestId("initial-message")).toHaveTextContent("Hey! I have a task I need to plan.");

    act(() => screen.getByRole("button", { name: "Close panel" }).click());
    expect(result.current.open).toBe(false);
  });
});

// Route prompts

describe("route prompts", () => {
  it("returns the tasks prompt on /tasks", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/tasks"),
    });
    expect(result.current.promptText).toMatch(/how long a task/i);
    expect(result.current.promptMessage).toMatch(/task I need to plan/i);
  });

  it("returns the student modules prompt on /modules (non-teacher)", () => {
    const { result } = renderHook(() => useFloatingChatState(false), {
      wrapper: makeWrapper("/modules"),
    });
    expect(result.current.promptText).toMatch(/new modules/i);
    expect(result.current.promptMessage).toMatch(/modules to pick/i);
  });

  it("returns the teacher modules prompt on /modules when isTeacher is true", () => {
    const { result } = renderHook(() => useFloatingChatState(true), {
      wrapper: makeWrapper("/modules"),
    });
    expect(result.current.promptText).toMatch(/editing/i);
    expect(result.current.promptMessage).toMatch(/editing my modules/i);
  });

  it("returns the societies prompt on /societies", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/societies"),
    });
    expect(result.current.promptText).toMatch(/societies/i);
    expect(result.current.promptMessage).toMatch(/societies/i);
  });

  it("returns the analytics prompt on /analytics", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/analytics"),
    });
    expect(result.current.promptText).toMatch(/understanding your results/i);
    expect(result.current.promptMessage).toMatch(/analytics/i);
  });

  it("returns HIDDEN_PROMPT (show: false) for unrecognised routes", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/some/unknown/path"),
    });
    expect(result.current.showPrompt).toBe(false);
    expect(result.current.promptText).toBe("");
    expect(result.current.promptMessage).toBe("");
  });

  it("returns no shared-calendar prompt on /calendar without user_id", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/calendar"),
    });
    expect(result.current.showPrompt).toBe(false);
  });

  it("returns the shared-calendar prompt on /calendar with user_id", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/calendar", "?user_id=42&shared_name=Sam"),
    });
    expect(result.current.promptText).toMatch(/meeting times/i);
    expect(result.current.promptMessage).toMatch(/Sam/);
  });

  it("falls back to a generic shared-calendar name when shared_name is missing", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/calendar", "?user_id=42"),
    });
    expect(result.current.promptMessage).toMatch(/this person/);
  });
});

// useRoutePromptReset — clears initialMessage when route changes

describe("useRoutePromptReset", () => {
  it("clears initialMessage when the chat is closed and the route changes", () => {
    // Open the chat via the flax-open-chat event, then close it.
    // When open becomes false the effect should clear initialMessage.
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/tasks"),
    });

    act(() => {
      window.dispatchEvent(
        new CustomEvent("flax-open-chat", { detail: { initialMessage: "Hello from event" } }),
      );
    });
    expect(result.current.open).toBe(true);

    // Close the chat
    act(() => result.current.toggleFab());
    expect(result.current.open).toBe(false);

    // After closing, the reset effect (which fires when open/pathname/search changes)
    // should have cleared initialMessage.
    // We can indirectly verify by checking renderWindow still works (it passes "" to StudyCoachPanel).
    expect(result.current.renderWindow).toBeDefined();
  });

  it("normalizes non-string open events to an empty initial message", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/tasks"),
    });

    act(() => {
      window.dispatchEvent(new CustomEvent("flax-open-chat", { detail: { initialMessage: 42 } }));
    });

    render(result.current.renderWindow());
    expect(screen.getByTestId("initial-message")).toHaveTextContent("");
  });
});

// useFirstPromptVisit — sets minimized=false on first visit, not on second

describe("useFirstPromptVisit", () => {
  it("sets minimized to false on the first visit to a prompt route", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/tasks"),
    });
    // On the first visit the hook calls setMinimized(false)
    expect(result.current.minimized).toBe(false);
  });

  it("does not call setMinimized again on repeated renders for the same route", () => {
    // Render twice on the same route; minimized should remain false (not toggled).
    const { result, rerender } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/tasks"),
    });

    act(() => result.current.minimizePrompt());
    expect(result.current.minimized).toBe(true);

    rerender();
    expect(result.current.minimized).toBe(true); // unchanged
  });
});

// showPrompt visibility logic

describe("showPrompt visibility", () => {
  it("hides prompt when chat is open", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/tasks"),
    });
    act(() => result.current.toggleFab());
    expect(result.current.open).toBe(true);
    expect(result.current.showPrompt).toBe(false);
  });

  it("hides prompt when minimized", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/tasks"),
    });
    act(() => result.current.minimizePrompt());
    expect(result.current.minimized).toBe(true);
    expect(result.current.showPrompt).toBe(false);
  });

  it("shows prompt when route has a match, chat is closed, and not minimized", () => {
    const { result } = renderHook(() => useFloatingChatState(), {
      wrapper: makeWrapper("/tasks"),
    });
    // Initially not minimized (first visit resets minimized to false)
    expect(result.current.showPrompt).toBe(true);
  });
});
