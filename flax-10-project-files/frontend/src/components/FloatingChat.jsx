/*
 * Floating launcher for the study coach.
 */

import ChatPromptBubble from "./floatingChat/ChatPromptBubble";
import FloatingChatFab from "./floatingChat/FloatingChatFab";
import { useFloatingChatState } from "./floatingChat/useFloatingChatState.jsx";
import styles from "./FloatingChat.module.css";

export default function FloatingChat() {
  const chat = useFloatingChatState();
  return (
    <div className={styles.root}>
      {chat.open && chat.renderWindow()}
      {chat.showPrompt && <ChatPromptBubble onAsk={chat.openTaskPrompt} onMinimize={chat.minimizePrompt} />}
      <FloatingChatFab open={chat.open} minimized={chat.minimized} onClick={chat.toggleFab} />
    </div>
  );
}
