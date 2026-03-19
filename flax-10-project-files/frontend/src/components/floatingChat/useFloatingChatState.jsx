/*
 * State and event handling for the floating chat launcher.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import StudyCoachPanel from "../StudyCoachPanel";
import styles from "../FloatingChat.module.css";

const TASK_PROMPT_MESSAGE = "Hey! I have a task I need to plan. Can you help me figure out how long it might take? Ask me what the task is and I'll describe it.";
const MotionDiv = motion.div;

export function useFloatingChatState() {
  const state = useFloatingChatStore();
  const location = useLocation();
  useOpenEvent(state.setInitialMessage, state.setOpen);
  return {
    minimized: state.minimized,
    open: state.open,
    showPrompt: location.pathname.startsWith("/tasks") && !state.open && !state.minimized,
    minimizePrompt: () => state.setMinimized(true),
    openTaskPrompt: () => openTaskPrompt(state),
    renderWindow: () => renderFloatingWindow(state.initialMessage, () => closeChat(state)),
    toggleFab: () => toggleFloatingChat(state),
  };
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

function openTaskPrompt(state) {
  state.setInitialMessage(TASK_PROMPT_MESSAGE);
  state.setOpen(true);
  state.setMinimized(false);
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
