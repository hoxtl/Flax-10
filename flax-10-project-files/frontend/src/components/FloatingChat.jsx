import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import analyticsService from '../api/analyticsService';
import styles from './FloatingChat.module.css';

const SUGGESTIONS = [
  'When should I study this week?',
  'Am I a night owl or morning person?',
  'How can I improve my consistency?',
  'What does my study pattern say about me?',
];

function TypingIndicator() {
  return (
    <div className={`${styles.bubble} ${styles.bubbleAI}`}>
      <span className={styles.dot} style={{ animationDelay: '0ms' }} />
      <span className={styles.dot} style={{ animationDelay: '160ms' }} />
      <span className={styles.dot} style={{ animationDelay: '320ms' }} />
    </div>
  );
}

const mdComponents = (styles) => ({
  h1: ({children}) => <h1 className={styles.mdH1}>{children}</h1>,
  h2: ({children}) => <h2 className={styles.mdH2}>{children}</h2>,
  h3: ({children}) => <h3 className={styles.mdH3}>{children}</h3>,
  p:  ({children}) => <p  className={styles.mdP}>{children}</p>,
  li: ({children}) => <li className={styles.mdLi}>{children}</li>,
  ul: ({children}) => <ul className={styles.mdUl}>{children}</ul>,
  ol: ({children}) => <ol className={styles.mdOl}>{children}</ol>,
  strong: ({children}) => <strong className={styles.mdStrong}>{children}</strong>,
});

function ChatWindow({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    const updated = [...messages, { role: 'user', content: msg }];
    setMessages(updated);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.aiChat(updated, 30);
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch {
      setError('Could not get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <motion.div
      className={styles.window}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>✦</span>
          <div>
            <div className={styles.headerTitle}>Study Coach</div>
            <div className={styles.headerSub}>Ask about your study habits</div>
          </div>
        </div>
        <div className={styles.headerActions}>
          {messages.length > 0 && (
            <button className={styles.clearBtn} onClick={() => setMessages([])}>Clear</button>
          )}
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
      </div>

      <div className={styles.messages}>
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div className={styles.empty}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className={styles.emptyIcon}>💬</div>
              <p className={styles.emptyText}>I have access to your real study data. Ask me anything.</p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className={styles.suggestion} onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div key={i}
              className={`${styles.messageRow} ${msg.role === 'user' ? styles.rowUser : styles.rowAI}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
              {msg.role === 'assistant' && <div className={styles.avatar}>✦</div>}
              <div className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI}`}>
                {msg.role === 'user'
                  ? <p className={styles.bubbleLine}>{msg.content}</p>
                  : <div className={styles.markdownBody}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents(styles)}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                }
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div key="typing" className={`${styles.messageRow} ${styles.rowAI}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className={styles.avatar}>✦</div>
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
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about your study patterns…"
          rows={1}
          disabled={loading}
        />
        <button className={styles.sendBtn} onClick={() => send()} disabled={loading || !input.trim()}>↑</button>
      </div>
    </motion.div>
  );
}

export default function FloatingChat() {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.root}>
      <AnimatePresence>
        {open && <ChatWindow onClose={() => setOpen(false)} />}
      </AnimatePresence>

      <motion.button
        className={styles.fab}
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>✕</motion.span>
            : <motion.span key="open"  initial={{ rotate: 90,  opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>✦</motion.span>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
