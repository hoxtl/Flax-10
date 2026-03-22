/*
 * Floating launcher for the study coach.
 */

import ChatPromptBubble from "./FloatingChat/ChatPromptBubble";
import FloatingChatFab from "./FloatingChat/FloatingChatFab";
import { useFloatingChatState } from "./FloatingChat/useFloatingChatState.jsx";
import styles from "./FloatingChat.module.css";

export default function FloatingChat() {
  const chat = useFloatingChatState();
  return (
    <div className={styles.root}>
      {chat.open && chat.renderWindow()}
      {chat.showPrompt && <ChatPromptBubble onAsk={chat.openPrompt} onMinimize={chat.minimizePrompt} text={chat.promptText} />}
      <FloatingChatFab open={chat.open} minimized={chat.minimized} onClick={chat.toggleFab} />
    </div>
  );
}
