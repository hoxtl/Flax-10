/*
 * Floating launcher for the study coach.
 */

import ChatPromptBubble from "./floatingChat/ChatPromptBubble";
import FloatingChatFab from "./floatingChat/FloatingChatFab";
import { useFloatingChatState } from "./floatingChat/useFloatingChatState.jsx";
import { useAuth } from "../context/AuthContext";
import styles from "./FloatingChat.module.css";

export default function FloatingChat() {
  const { profile } = useAuth();
  const isTeacher = profile?.role === "teacher";
  const chat = useFloatingChatState(isTeacher);
  return (
    <div className={styles.root}>
      {chat.open && chat.renderWindow()}
      {chat.showPrompt && <ChatPromptBubble onAsk={chat.openPrompt} onMinimize={chat.minimizePrompt} text={chat.promptText} />}
      <FloatingChatFab open={chat.open} minimized={chat.minimized} onClick={chat.toggleFab} />
    </div>
  );
}
