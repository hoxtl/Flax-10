import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => {
      const Tag = typeof tag === "string" ? tag : "div";
      const rest = { ...props };
      delete rest.initial;
      delete rest.animate;
      delete rest.exit;
      delete rest.transition;
      delete rest.whileHover;
      delete rest.whileTap;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
}));

vi.mock("lucide-react", () => ({
  MessageCircle: () => <svg aria-label="message-circle" />,
  X: () => <svg aria-label="close-x" />,
  ChevronDown: () => <svg aria-label="chevron-down" />,
}));

vi.mock("../../../components/common/PrimaryButton/PrimaryButton", () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../components/StudyCoachPanel", () => ({
  default: ({ initialMessage, onClose }) => (
    <div>
      <div>{initialMessage}</div>
      <button onClick={onClose}>Close panel</button>
    </div>
  ),
}));

import FloatingChatFab from "../../../components/floatingChat/FloatingChatFab";
import ChatPromptBubble from "../../../components/floatingChat/ChatPromptBubble";
import { useFloatingChatState } from "../../../components/floatingChat/useFloatingChatState";

describe("floating chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the fab label for open, minimized, and default states", () => {
    const onClick = vi.fn();
    const { rerender } = render(<FloatingChatFab open={false} minimized={false} onClick={onClick} />);
    expect(screen.getByRole("button", { name: "Open chat" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();

    rerender(<FloatingChatFab open={false} minimized onClick={onClick} />);
    expect(screen.getByRole("button", { name: "Show prompt" })).toBeInTheDocument();

    rerender(<FloatingChatFab open minimized={false} onClick={onClick} />);
    expect(screen.getByRole("button", { name: "Close chat" })).toBeInTheDocument();
  });

  it("renders the prompt bubble with default and custom text", () => {
    const onAsk = vi.fn();
    const onMinimize = vi.fn();
    const { rerender } = render(<ChatPromptBubble onAsk={onAsk} onMinimize={onMinimize} />);

    fireEvent.click(screen.getByRole("button", { name: "Ask Flax" }));
    fireEvent.click(screen.getByRole("button", { name: "Minimize" }));
    expect(onAsk).toHaveBeenCalled();
    expect(onMinimize).toHaveBeenCalled();
    expect(screen.getByText(/Not sure how long a task will take/)).toBeInTheDocument();

    rerender(<ChatPromptBubble onAsk={onAsk} onMinimize={onMinimize} text="Custom prompt" />);
    expect(screen.getByText("Custom prompt")).toBeInTheDocument();
  });

  it("builds route prompts, prompt visibility, open events, and close handlers", () => {
    const wrapper = ({ children }) => (
      <MemoryRouter initialEntries={["/calendar?user_id=4&shared_name=Alex"]}>
        {children}
      </MemoryRouter>
    );

    const { result, rerender } = renderHook(() => useFloatingChatState(), { wrapper });

    expect(result.current.showPrompt).toBe(true);
    expect(result.current.promptText).toMatch(/meeting times/i);
    act(() => result.current.minimizePrompt());
    expect(result.current.minimized).toBe(true);

    act(() => result.current.toggleFab());
    expect(result.current.minimized).toBe(false);

    act(() => {
      window.dispatchEvent(new CustomEvent("flax-open-chat", { detail: { initialMessage: "Hello there" } }));
    });
    expect(result.current.open).toBe(true);
    expect(result.current.renderWindow()).toBeTruthy();

    const routeWrapper = ({ children }) => (
      <MemoryRouter initialEntries={["/modules"]}>
        {children}
      </MemoryRouter>
    );

    rerender({ wrapper: routeWrapper });
  });

  it("renders the floating window panel and closes it through the returned callback", () => {
    const wrapper = ({ children }) => <MemoryRouter initialEntries={["/tasks"]}>{children}</MemoryRouter>;
    const { result } = renderHook(() => useFloatingChatState(), { wrapper });

    act(() => result.current.toggleFab());
    render(result.current.renderWindow());
    expect(screen.getByText("Close panel")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close panel"));
  });
});
