import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, MessageCircle, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import analyticsService from "../api/analyticsService";
import styles from "./StudyCoachPanel.module.css";

const SUGGESTIONS = [
  "When should I study this week?",
  "Am I a night owl or morning person?",
  "Plan my week around my deadlines",
  "How can I improve my consistency?",
  "What does my study pattern say about me?",
];

const mdComponents = {
  h1: ({ children }) => <h1 className={styles.mdH1}>{children}</h1>,
  h2: ({ children }) => <h2 className={styles.mdH2}>{children}</h2>,
  h3: ({ children }) => <h3 className={styles.mdH3}>{children}</h3>,
  p: ({ children }) => <p className={styles.mdP}>{children}</p>,
  li: ({ children }) => <li className={styles.mdLi}>{children}</li>,
  ul: ({ children }) => <ul className={styles.mdUl}>{children}</ul>,
  ol: ({ children }) => <ol className={styles.mdOl}>{children}</ol>,
  strong: ({ children }) => <strong className={styles.mdStrong}>{children}</strong>,
};

function TypingIndicator() {
  return (
    <div className={`${styles.bubble} ${styles.bubbleAI}`}>
      <span className={styles.dot} style={{ animationDelay: "0ms" }} />
      <span className={styles.dot} style={{ animationDelay: "160ms" }} />
      <span className={styles.dot} style={{ animationDelay: "320ms" }} />
    </div>
  );
}

export default function StudyCoachPanel({
  period = 30,
  initialMessage = "",
  title = "Study Coach",
  subtitle = "Ask about your study habits",
  placeholder = "Ask about your study patterns…",
  className = "",
  onClose,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const didAutoSend = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const msg = (initialMessage || "").trim();
    if (!msg || didAutoSend.current || loading) return;
    didAutoSend.current = true;
    const timer = setTimeout(() => send(msg), 400);
    return () => clearTimeout(timer);
  }, [initialMessage, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const updated = [...messages, { role: "user", content: msg }];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await analyticsService.aiChat(updated, period);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      setError("Could not get a response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon} aria-hidden="true">
            <Sparkles size={16} />
          </span>
          <div>
            <h3 className={styles.headerTitle}>{title}</h3>
            <p className={styles.headerSub}>{subtitle}</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          {messages.length > 0 && (
            <button className={styles.clearBtn} onClick={() => setMessages([])}>
              Clear
            </button>
          )}
          {onClose && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close chat">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.messages}>
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              className={styles.empty}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.emptyIcon} aria-hidden="true">
                <MessageCircle size={22} />
              </div>
              <p className={styles.emptyText}>
                Hi, I'm Flax! I can help you plan your study time, estimate tasks, and stay on track. What would you like to know?
              </p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    className={styles.suggestion}
                    onClick={() => send(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, index) => (
            <motion.div
              key={`${msg.role}-${index}`}
              className={`${styles.messageRow} ${
                msg.role === "user" ? styles.rowUser : styles.rowAI
              }`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {msg.role === "assistant" && (
                <div className={styles.avatar} aria-hidden="true">
                  <MessageCircle size={14} />
                </div>
              )}
              <div className={`${styles.bubble} ${msg.role === "user" ? styles.bubbleUser : styles.bubbleAI}`}>
                {msg.role === "user" ? (
                  <p className={styles.bubbleLine}>{msg.content}</p>
                ) : (
                  <div className={styles.markdownBody}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div
              key="typing"
              className={`${styles.messageRow} ${styles.rowAI}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className={styles.avatar} aria-hidden="true">
                <MessageCircle size={14} />
              </div>
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className={styles.error}>{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputRow}>
        <textarea
          className={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          rows={onClose ? 3 : 1}
          disabled={loading}
        />
        <button
          className={styles.sendBtn}
          onClick={() => send()}
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          <ArrowUp size={32} strokeWidth={3.1} />
        </button>
      </div>
    </div>
  );
}
