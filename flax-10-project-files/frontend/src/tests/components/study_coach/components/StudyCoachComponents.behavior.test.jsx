/*
 * Tests for study coach panel and composer components.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "../../../../utils/testUtils";

const useAuth = vi.fn();
const useStudyCoachPanel = vi.fn();
const setInput = vi.fn();
const handleKeyDown = vi.fn();
const sendMessage = vi.fn();
const clearMessages = vi.fn();
const bottomRef = { current: null };

vi.mock("../../../../context/AuthContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: (...args) => useAuth(...args),
  };
});

vi.mock("../../../../components/study_coach/hooks/useStudyCoachPanel", () => ({
  useStudyCoachPanel: (...args) => useStudyCoachPanel(...args),
}));

vi.mock("lucide-react", () => ({
  ArrowUp: () => <span>arrow-up</span>,
  MessageCircle: () => <span>message-circle</span>,
  Sparkles: () => <span>sparkles</span>,
  X: () => <span>x-icon</span>,
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("react-markdown", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("remark-gfm", () => ({
  default: {},
}));

vi.mock("../../../../components/study_coach/components/ScheduleImportPanel", () => ({
  default: ({ events }) => <div>schedule-import:{events.length}</div>,
}));

vi.mock("../../../../components/study_coach/utils/studyCoachMarkdown.jsx", () => ({
  STUDY_COACH_MARKDOWN: {},
}));

vi.mock("../../../../components/study_coach/utils/studyCoachSuggestions", () => ({
  STUDY_COACH_SUGGESTIONS: ["Help me plan", "What should I revise?"],
  TEACHER_COACH_SUGGESTIONS: ["Plan my next lesson", "Help me prep a lecture"],
}));

import TypingIndicator from "../../../../components/study_coach/components/TypingIndicator";
import StudyCoachComposer from "../../../../components/study_coach/components/StudyCoachComposer";
import StudyCoachHeader from "../../../../components/study_coach/components/StudyCoachHeader";
import StudyCoachMessages from "../../../../components/study_coach/components/StudyCoachMessages";
import StudyCoachPanelView from "../../../../components/study_coach/components/StudyCoachPanelView";

function renderComposer(overrides = {}) {
  return render(
    <StudyCoachComposer
      input=""
      loading={false}
      onChange={vi.fn()}
      onKeyDown={vi.fn()}
      onSend={vi.fn()}
      placeholder="Ask here"
      {...overrides}
    />,
  );
}

describe("study coach component coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ profile: null });
    useStudyCoachPanel.mockReturnValue({
      messages: [],
      loading: false,
      error: "",
      bottomRef,
      input: "Draft a study plan",
      setInput,
      handleKeyDown,
      sendMessage,
      clearMessages,
    });
  });

  it("renders the real typing indicator", () => {
    const { container } = render(<TypingIndicator />);
    expect(container.querySelectorAll("span")).toHaveLength(3);
  });

  it("handles composer input and keyboard events", () => {
    const onChange = vi.fn();
    const onKeyDown = vi.fn();
    renderComposer({ onChange, onKeyDown });
    const textarea = screen.getByPlaceholderText("Ask here");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onChange).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("sends messages when the composer has content", () => {
    const onSend = vi.fn();
    renderComposer({ input: "Hello", onSend });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSend).toHaveBeenCalledWith();
  });

  it("disables the composer while loading", () => {
    renderComposer({ input: "Hello", loading: true });
    expect(screen.getByPlaceholderText("Ask here")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("renders header actions when available and hides them otherwise", () => {
    const onClear = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(
      <StudyCoachHeader title="Coach" subtitle="Plan better" hasMessages onClear={onClear} onClose={onClose} />,
    );

    expect(screen.getByText("Coach")).toBeInTheDocument();
    expect(screen.getByText("Plan better")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear"));
    fireEvent.click(screen.getByLabelText("Close chat"));
    expect(onClear).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();

    rerender(<StudyCoachHeader title="Coach" subtitle="Plan better" hasMessages={false} onClear={onClear} />);
    expect(screen.queryByText("Clear")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Close chat")).not.toBeInTheDocument();
  });

  it("renders empty, teacher, error, typing, and suggested-event message states", () => {
    const onSend = vi.fn();
    const { rerender } = render(
      <StudyCoachMessages bottomRef={bottomRef} error="" loading={false} messages={[]} onSend={onSend} />,
    );

    expect(screen.getByText(/plan your study time/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Help me plan"));
    expect(onSend).toHaveBeenCalledWith("Help me plan");

    useAuth.mockReturnValue({ profile: { role: "teacher" } });
    rerender(<StudyCoachMessages bottomRef={bottomRef} error="Oops" loading messages={[{ role: "assistant", content: "Reply", suggested_events: [{ title: "Lecture" }] }]} onSend={onSend} />);
    expect(screen.getByText("Reply")).toBeInTheDocument();
    expect(screen.getByText("schedule-import:1")).toBeInTheDocument();
    expect(screen.getByText("Oops")).toBeInTheDocument();
    expect(screen.getAllByText("message-circle").length).toBeGreaterThan(0);
  });

  it("renders the real panel view with default values", () => {
    render(<StudyCoachPanelView onClose={vi.fn()} />);
    expect(useStudyCoachPanel).toHaveBeenCalledWith("", 30);
    expect(screen.getByText("Flax Bot")).toBeInTheDocument();
    expect(screen.getByText("Ask me anything")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Ask me anything…"), { target: { value: "New prompt" } });
    expect(setInput).toHaveBeenCalledWith("New prompt");
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(sendMessage).toHaveBeenCalledWith();
  });

  it("renders the panel view with custom copy and class wiring", () => {
    useStudyCoachPanel.mockReturnValue({
      messages: [{ role: "user", content: "Hi" }],
      loading: false,
      error: "",
      bottomRef,
      input: "Question",
      setInput,
      handleKeyDown,
      sendMessage,
      clearMessages,
    });
    render(<StudyCoachPanelView period={45} initialMessage="Hello" className="custom-shell" title="Coach" subtitle="Custom" placeholder="Type here" onClose={vi.fn()} />);
    expect(useStudyCoachPanel).toHaveBeenLastCalledWith("Hello", 45);
    expect(screen.getByText("Coach")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });
});
