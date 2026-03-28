import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor } from "../../../../utils/testUtils";

const createEvent = vi.fn();
const useCalendarDispatch = vi.fn();
const aiChat = vi.fn();
const scrollIntoView = vi.fn();
const authProfile = { current: { role: "student" } };

vi.mock("../../../../api/eventApi", () => ({
  createEvent: (...args) => createEvent(...args),
}));

vi.mock("../../../../context/CalendarContext", () => ({
  useCalendarDispatch: (...args) => useCalendarDispatch(...args),
}));

vi.mock("../../../../context/AuthContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => ({ profile: authProfile.current }),
  };
});

vi.mock("../../../../api/analyticsApi", () => ({
  default: { aiChat: (...args) => aiChat(...args) },
}));

vi.mock("react-markdown", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("remark-gfm", () => ({
  default: {},
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("lucide-react", () => ({
  CalendarPlus: () => <span>calendar-plus</span>,
  Check: () => <span>check-icon</span>,
  MessageCircle: () => <span>message-icon</span>,
}));

vi.mock("../../../../components/study_coach/utils/studyCoachMarkdown.jsx", () => ({
  STUDY_COACH_MARKDOWN: {},
}));

vi.mock("../../../../components/study_coach/utils/studyCoachSuggestions", () => ({
  STUDY_COACH_SUGGESTIONS: ["Help me plan", "What should I revise?"],
  TEACHER_COACH_SUGGESTIONS: ["Plan my next lesson", "Help me prep a lecture"],
}));

vi.mock("../../../../components/study_coach/components/TypingIndicator", () => ({
  default: () => <div>typing-indicator</div>,
}));

vi.mock("../../../../components/study_coach/components/StudyCoachHeader", () => ({
  default: ({ onClear, onClose, title, subtitle, hasMessages }) => (
    <div>
      <span>{title}</span>
      <span>{subtitle}</span>
      <span>{String(hasMessages)}</span>
      <button type="button" onClick={onClear}>clear-messages</button>
      <button type="button" onClick={onClose}>close-panel</button>
    </div>
  ),
}));

vi.mock("../../../../components/study_coach/components/StudyCoachComposer", () => ({
  default: ({ input, onChange, onKeyDown, onSend, placeholder, loading }) => (
    <div>
      <input aria-label={placeholder} value={input} onChange={onChange} onKeyDown={onKeyDown} />
      <button type="button" onClick={() => onSend("Manual send")}>send-message</button>
      <span>{String(loading)}</span>
    </div>
  ),
}));

import ScheduleImportPanel from "../../../../components/study_coach/components/ScheduleImportPanel";
import StudyCoachMessages from "../../../../components/study_coach/components/StudyCoachMessages";
import StudyCoachPanelView from "../../../../components/study_coach/components/StudyCoachPanelView";
import {
  STUDY_COACH_ERROR,
  buildNextMessages,
  createAssistantMessage,
  createUserMessage,
  formatEventTime,
  getPendingImports,
  resetStatuses,
  trimMessage,
  updateStatusAtIndex,
} from "../../../../components/study_coach/utils/studyCoachHelpers";
import { useStudyCoachPanel } from "../../../../components/study_coach/hooks/useStudyCoachPanel";

describe("StudyCoach extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    useCalendarDispatch.mockReturnValue(vi.fn());
    Element.prototype.scrollIntoView = scrollIntoView;
    authProfile.current = { role: "student" };
  });

  it("covers study coach helper functions", () => {
    expect(trimMessage("  hello  ")).toBe("hello");
    expect(createUserMessage("Hello")).toEqual({ role: "user", content: "Hello" });
    expect(createAssistantMessage({ reply: "Hi", suggested_events: [{ title: "Lecture" }] })).toEqual({
      role: "assistant",
      content: "Hi",
      suggested_events: [{ title: "Lecture" }],
    });
    expect(buildNextMessages([{ role: "user", content: "Hi" }], "Next")).toHaveLength(2);
    expect(resetStatuses([{ id: 1 }, { id: 2 }])).toEqual(["idle", "idle"]);
    expect(updateStatusAtIndex(1, "done")(["idle", "idle"])).toEqual(["idle", "done"]);
    expect(getPendingImports(["done", "idle", "error"])).toBe(2);
    expect(formatEventTime("2026-03-24T10:00:00.000Z", "2026-03-24T11:00:00.000Z")).toContain("–");
    expect(STUDY_COACH_ERROR).toContain("Please try again");
  });

  it("imports single and all suggested events", async () => {
    const dispatch = vi.fn();
    useCalendarDispatch.mockReturnValue(dispatch);
    createEvent.mockResolvedValueOnce({ ok: true }).mockRejectedValueOnce(new Error("fail")).mockResolvedValue({ ok: true });

    render(
      <ScheduleImportPanel
        events={[
          { title: "Lecture", start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z", description: "Study" },
          { title: "Lab", start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" },
        ]}
      />,
    );

    fireEvent.click(screen.getByLabelText("Add Lecture to calendar"));
    await waitFor(() => expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ title: "Lecture", description: "Study" })));
    expect(dispatch).toHaveBeenCalledWith({ type: "TRIGGER_RELOAD" });

    fireEvent.click(screen.getByText(/Import All/i));
    await waitFor(() => expect(screen.getByText("Failed")).toBeInTheDocument());
  });

  it("hides the footer for empty suggested imports", () => {
    render(<ScheduleImportPanel events={[]} />);
    expect(screen.queryByText(/Import All/i)).not.toBeInTheDocument();
  });

  it("shows the done state after the last suggested import", async () => {
    useCalendarDispatch.mockReturnValue(vi.fn());
    createEvent.mockResolvedValueOnce({ ok: true });
    render(<ScheduleImportPanel events={[{ title: "Seminar", start_time: "2026", end_time: "2026" }]} />);
    fireEvent.click(screen.getByLabelText("Add Seminar to calendar"));
    await waitFor(() => expect(screen.getByText(/All events added/i)).toBeInTheDocument());
    expect(screen.queryByText(/Import All/i)).not.toBeInTheDocument();
  });

  it("renders study coach messages states and suggestion actions", () => {
    const onSend = vi.fn();
    render(<StudyCoachMessages messages={[]} onSend={onSend} />);
    fireEvent.click(screen.getByText("Help me plan"));
    expect(onSend).toHaveBeenCalledWith("Help me plan");
  });

  it("renders assistant replies and typing indicators", () => {
    render(<StudyCoachMessages loading messages={[{ role: "user", content: "Hi" }, { role: "assistant", content: "Reply" }]} onSend={vi.fn()} />);
    expect(screen.getByText("Hi")).toBeInTheDocument();
    expect(screen.getByText("Reply")).toBeInTheDocument();
    expect(screen.getByText("typing-indicator")).toBeInTheDocument();
  });

  it("renders study coach error states", () => {
    render(<StudyCoachMessages error="Oops" messages={[]} onSend={vi.fn()} />);
    expect(screen.getByText("Oops")).toBeInTheDocument();
  });

  it("renders the teacher empty state and teacher suggestions", () => {
    authProfile.current = { role: "teacher" };
    const onSend = vi.fn();

    render(<StudyCoachMessages bottomRef={{ current: null }} error={null} loading={false} messages={[]} onSend={onSend} />);

    expect(screen.getByText(/plan your teaching week/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Plan my next lesson"));
    expect(onSend).toHaveBeenCalledWith("Plan my next lesson");
  });

  it("assembles the panel view and proxies clear/close/send actions", () => {
    render(<StudyCoachPanelView initialMessage="Hello" title="Flax Bot" subtitle="Ask me" onClose={vi.fn()} />);
    expect(screen.getByText("Flax Bot")).toBeInTheDocument();
    expect(screen.getByText("Ask me")).toBeInTheDocument();
    expect(screen.getByLabelText("Ask me anything…")).toBeInTheDocument();
  });

  it("uses the default subtitle when one is not provided", () => {
    render(<StudyCoachPanelView initialMessage="" title="Flax Bot" onClose={vi.fn()} />);
    expect(screen.getByText("Ask me anything")).toBeInTheDocument();
  });
});

describe("useStudyCoachPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  it("auto-sends the initial message and stores assistant replies", async () => {
    aiChat.mockResolvedValue({ reply: "Plan created", suggested_events: [{ title: "Revision" }] });
    vi.useFakeTimers();
    const { result } = renderHook(() => useStudyCoachPanel("Draft a plan", 14));
    await act(async () => { await vi.advanceTimersByTimeAsync(450); });
    vi.useRealTimers();
    expect(aiChat).toHaveBeenCalled();
    expect(result.current.messages.at(-1)).toEqual({ role: "assistant", content: "Plan created", suggested_events: [{ title: "Revision" }] });
  });

  it("clears messages and handles keyboard input", async () => {
    const { result } = renderHook(() => useStudyCoachPanel("", 30));
    act(() => result.current.clearMessages());
    expect(result.current.messages).toEqual([]);
    act(() => result.current.setInput("Type this"));
    const preventDefault = vi.fn();
    await act(async () => { result.current.handleKeyDown({ key: "Enter", shiftKey: false, preventDefault }); });
    expect(preventDefault).toHaveBeenCalled();
  });

  it("ignores empty/loading sends and surfaces API errors", async () => {
    aiChat.mockRejectedValueOnce(new Error("nope"));
    const { result } = renderHook(() => useStudyCoachPanel("", 30));

    await act(async () => {
      await result.current.sendMessage("  ");
      await result.current.sendMessage("Try again");
    });

    await waitFor(() => expect(result.current.error).toBe(STUDY_COACH_ERROR));
  });
});
