/*
 * Message list area for the study coach panel.
 */

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ScheduleImportPanel from "./ScheduleImportPanel";
import { STUDY_COACH_MARKDOWN } from "./studyCoachMarkdown.jsx";
import { STUDY_COACH_SUGGESTIONS } from "./studyCoachSuggestions";
import TypingIndicator from "./TypingIndicator";
import styles from "./studyCoachStyles";

const MotionDiv = motion.div;

export default function StudyCoachMessages({ bottomRef, error, loading, messages, onSend }) {
  return (
    <div className={styles.messages}>
      <AnimatePresence>
        <EmptyStateBlock messages={messages} onSend={onSend} />
        {messages.map((message, index) => (
          <MessageRow key={`${message.role}-${index}`} message={message} />
        ))}
        {loading && <TypingRow />}
      </AnimatePresence>
      {error && <p className={styles.error}>{error}</p>}
      <div ref={bottomRef} />
    </div>
  );
}

function EmptyStateBlock({ messages, onSend }) {
  if (messages.length > 0) return null;
  return (
    <MotionDiv className={styles.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <EmptyStateCopy />
      <SuggestionList onSend={onSend} />
    </MotionDiv>
  );
}

function EmptyStateCopy() {
  return (
    <>
      <div className={styles.emptyIcon} aria-hidden="true">
        <MessageCircle size={22} />
      </div>
      <p className={styles.emptyText}>
        Hi, I'm Flax! I can help you plan your study time, estimate tasks, and stay on track. What would you like to know?
      </p>
    </>
  );
}

function SuggestionList({ onSend }) {
  return (
    <div className={styles.suggestions}>
      {STUDY_COACH_SUGGESTIONS.map((suggestion) => (
        <button key={suggestion} className={styles.suggestion} onClick={() => onSend(suggestion)}>
          {suggestion}
        </button>
      ))}
    </div>
  );
}

function MessageRow({ message }) {
  return (
    <MotionDiv className={getMessageRowClassName(message.role)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
      {message.role === "assistant" && <AssistantAvatar />}
      <div className={styles.bubbleGroup}>
        <MessageBubble message={message} />
        {message.role === "assistant" && message.suggested_events?.length > 0 && <ScheduleImportPanel events={message.suggested_events} />}
      </div>
    </MotionDiv>
  );
}

function AssistantAvatar() {
  return (
    <div className={styles.avatar} aria-hidden="true">
      <MessageCircle size={14} />
    </div>
  );
}

function MessageBubble({ message }) {
  if (message.role === "user") return <UserBubble content={message.content} />;
  return <AssistantBubble content={message.content} />;
}

function UserBubble({ content }) {
  return (
    <div className={`${styles.bubble} ${styles.bubbleUser}`}>
      <p className={styles.bubbleLine}>{content}</p>
    </div>
  );
}

function AssistantBubble({ content }) {
  return (
    <div className={`${styles.bubble} ${styles.bubbleAI}`}>
      <div className={styles.markdownBody}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={STUDY_COACH_MARKDOWN}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function TypingRow() {
  return (
    <MotionDiv key="typing" className={`${styles.messageRow} ${styles.rowAI}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AssistantAvatar />
      <TypingIndicator />
    </MotionDiv>
  );
}

function getMessageRowClassName(role) {
  return `${styles.messageRow} ${role === "user" ? styles.rowUser : styles.rowAI}`;
}
