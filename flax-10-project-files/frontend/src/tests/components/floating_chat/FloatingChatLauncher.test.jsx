import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { mockUseAuth, mockUseFloatingChatState } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseFloatingChatState: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("../../../components/floating_chat/useFloatingChatState.jsx", () => ({
  useFloatingChatState: mockUseFloatingChatState,
}));

vi.mock("../../../components/floating_chat/ChatPromptBubble", () => ({
  default: ({ onAsk, onMinimize, text }) => (
    <div data-testid="prompt-bubble">
      <span>{text}</span>
      <button type="button" onClick={onAsk}>Ask from prompt</button>
      <button type="button" onClick={onMinimize}>Minimize prompt</button>
    </div>
  ),
}));

vi.mock("../../../components/floating_chat/FloatingChatFab", () => ({
  default: ({ open, minimized, onClick }) => (
    <button
      type="button"
      data-testid="chat-fab"
      data-open={String(open)}
      data-minimized={String(minimized)}
      onClick={onClick}
    >
      Floating fab
    </button>
  ),
}));

vi.mock("../../../components/floating_chat/styles/FloatingChat.module.css", () => ({
  default: { root: "root" },
}));

import FloatingChat from "../../../components/floating_chat/components/FloatingChat.jsx";

function createChat(overrides = {}) {
  return {
    open: false,
    showPrompt: false,
    minimized: false,
    promptText: "Ask Flax something",
    openPrompt: vi.fn(),
    minimizePrompt: vi.fn(),
    toggleFab: vi.fn(),
    renderWindow: vi.fn(() => <div data-testid="chat-window">Window</div>),
    ...overrides,
  };
}

describe("FloatingChat launcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ profile: null });
    mockUseFloatingChatState.mockReturnValue(createChat());
  });

  it("passes a non-teacher flag to the hook and only renders the fab when closed", () => {
    const chat = createChat();
    mockUseFloatingChatState.mockReturnValue(chat);

    render(<FloatingChat />);

    expect(mockUseFloatingChatState).toHaveBeenCalledWith(false);
    expect(chat.renderWindow).not.toHaveBeenCalled();
    expect(screen.queryByTestId("chat-window")).not.toBeInTheDocument();
    expect(screen.queryByTestId("prompt-bubble")).not.toBeInTheDocument();
    expect(screen.getByTestId("chat-fab")).toHaveAttribute("data-open", "false");
    expect(screen.getByTestId("chat-fab")).toHaveAttribute("data-minimized", "false");
  });

  it("renders the window and prompt for teachers and forwards child callbacks", () => {
    const chat = createChat({
      open: true,
      showPrompt: true,
      minimized: true,
      promptText: "Need help with editing? Talk to Flax",
    });
    mockUseAuth.mockReturnValue({ profile: { role: "teacher" } });
    mockUseFloatingChatState.mockReturnValue(chat);

    render(<FloatingChat />);

    expect(mockUseFloatingChatState).toHaveBeenCalledWith(true);
    expect(chat.renderWindow).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("chat-window")).toBeInTheDocument();
    expect(screen.getByTestId("prompt-bubble")).toHaveTextContent("Need help with editing? Talk to Flax");

    fireEvent.click(screen.getByText("Ask from prompt"));
    expect(chat.openPrompt).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Minimize prompt"));
    expect(chat.minimizePrompt).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("chat-fab"));
    expect(chat.toggleFab).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("chat-fab")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("chat-fab")).toHaveAttribute("data-minimized", "true");
  });
});
