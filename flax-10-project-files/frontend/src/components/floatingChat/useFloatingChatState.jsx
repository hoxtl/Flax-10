/*
 * State and event handling for the floating chat launcher.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import StudyCoachPanel from "../StudyCoachPanel";
import styles from "../FloatingChat.module.css";

const TASK_PROMPT_MESSAGE = "Hey! I have a task I need to plan. Can you help me figure out how long it might take? Ask me what the task is and I'll describe it.";
const MODULE_PROMPT_MESSAGE = "Hey! I'm not sure which modules to pick next semester. I don't really know what I'm into yet — can you ask me some questions about my interests, schedule, and what kind of learning style I prefer to help me figure it out?";
const SOCIETY_PROMPT_MESSAGE = "Hey! I want to join some King's societies, but I don't know where to start. Can you ask me a few questions about my interests, personality, time commitment, and whether I want something social, sporty, creative, cultural, or career-focused, then suggest some societies that would suit me?";
const ANALYTICS_PROMPT_MESSAGE = "Hey! I'm looking at my analytics and I want help understanding what my results actually mean. Can you talk me through the patterns you notice, what seems to be going well, what might need attention, and a few practical changes I could try next?";
const MotionDiv = motion.div;

function getSharedCalendarPrompt(search = "") {
  const params = new URLSearchParams(search);
  const sharedUserId = params.get("user_id");
  if (!sharedUserId) return null;
  const sharedName = params.get("shared_name") || "this person";
  return {
    show: true,
    message: `Help me write an email to ${sharedName} suggesting three possible meeting times based on their shared calendar. Ask me what we are meeting about, then draft a friendly email I can send.`,
    text: "Want to draft an email with 3 meeting times? Ask Flax.",
  };
}

function getPromptContext(location) {
  const { pathname, search } = location;
  if (pathname.startsWith("/calendar")) {
    const sharedCalendarPrompt = getSharedCalendarPrompt(search);
    if (sharedCalendarPrompt) return sharedCalendarPrompt;
  }
  if (pathname.startsWith("/tasks")) return { show: true, message: TASK_PROMPT_MESSAGE, text: "Not sure how long a task will take? Ask me!" };
  if (pathname.startsWith("/modules")) return { show: true, message: MODULE_PROMPT_MESSAGE, text: "Curious about new modules? Let Flax help you pick!" };
  if (pathname.startsWith("/societies")) return { show: true, message: SOCIETY_PROMPT_MESSAGE, text: "Don't know what societies to pick? Ask Flax." };
  if (pathname.startsWith("/analytics")) return { show: true, message: ANALYTICS_PROMPT_MESSAGE, text: "Need help understanding your results? Ask Flax." };
  return { show: false, message: "", text: "" };
}

export function useFloatingChatState() {
  const state = useFloatingChatStore();
  const location = useLocation();
  useOpenEvent(state.setInitialMessage, state.setOpen);
  useRoutePromptReset(location.pathname, location.search, state.open, state.setInitialMessage);
  useFirstPromptVisit(location, state.setMinimized);
  const promptCtx = getPromptContext(location);
  return {
    minimized: state.minimized,
    open: state.open,
    showPrompt: promptCtx.show && !state.open && !state.minimized,
    promptText: promptCtx.text,
    promptMessage: promptCtx.message,
    minimizePrompt: () => state.setMinimized(true),
    openPrompt: () => { state.setInitialMessage(promptCtx.message); state.setOpen(true); state.setMinimized(false); },
    renderWindow: () => renderFloatingWindow(state.initialMessage, () => closeChat(state)),
    toggleFab: () => toggleFloatingChat(state),
  };
}

function useRoutePromptReset(pathname, search, open, setInitialMessage) {
  useEffect(() => {
    if (open) return;
    setInitialMessage("");
  }, [open, pathname, search, setInitialMessage]);
}

function useFirstPromptVisit(location, setMinimized) {
  const seenPromptRoutes = useRef(new Set());

  useEffect(() => {
    const promptKey = getPromptRouteKey(location);
    if (!promptKey || seenPromptRoutes.current.has(promptKey)) return;
    seenPromptRoutes.current.add(promptKey);
    setMinimized(false);
  }, [location, setMinimized]);
}

function getPromptRouteKey(location) {
  const { pathname, search } = location;
  if (pathname.startsWith("/calendar")) {
    const sharedUserId = new URLSearchParams(search).get("user_id");
    if (sharedUserId) return `shared-calendar-${sharedUserId}`;
  }
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/modules")) return "modules";
  if (pathname.startsWith("/societies")) return "societies";
  if (pathname.startsWith("/analytics")) return "analytics";
  return null;
}

function useOpenEvent(setInitialMessage, setOpen) {
  useEffect(() => {
    const onOpen = (event) => {
      const message = event?.detail?.initialMessage;
      setInitialMessage(typeof message === "string" ? message : "");
      setOpen(true);
    };
    window.addEventListener("flax-open-chat", onOpen);
    return () => window.removeEventListener("flax-open-chat", onOpen);
  }, [setInitialMessage, setOpen]);
}

function useFloatingChatStore() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  return { initialMessage, minimized, open, setInitialMessage, setMinimized, setOpen };
}

function toggleFloatingChat(state) {
  if (state.minimized) return state.setMinimized(false);
  state.setOpen((current) => !current);
}

function closeChat(state) {
  state.setOpen(false);
  state.setInitialMessage("");
}

function renderFloatingWindow(initialMessage, onClose) {
  return (
    <AnimatePresence>
      <MotionDiv className={styles.window} initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
        <StudyCoachPanel period={30} initialMessage={initialMessage} subtitle="Ask me anything" className={styles.windowPanel} onClose={onClose} />
      </MotionDiv>
    </AnimatePresence>
  );
}
