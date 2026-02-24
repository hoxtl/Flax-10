import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import analyticsService from '../../api/analyticsService';
import styles from './AIInsightsTab.module.css';

export function InsightsPanel({ insights, loading, onGenerate, period }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Study Analysis</h3>
          <p className={styles.panelSub}>Last {period} days · AI generated</p>
        </div>
        <button className={styles.generateBtn} onClick={onGenerate} disabled={loading}>
          {loading ? <span className={styles.btnSpinner} /> : <>✦ Generate</>}
        </button>
      </div>

      <div className={styles.panelBody}>
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" className={styles.centeredState}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className={styles.pulseRing} />
              <p>Analysing your study patterns…</p>
            </motion.div>
          )}

          {!loading && insights && (
            <motion.div key="insights" className={styles.insightsScrollBody}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <div className={styles.markdownBody}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 className={styles.mdH1}>{children}</h1>,
                    h2: ({children}) => <h2 className={styles.mdH2}>{children}</h2>,
                    h3: ({children}) => <h3 className={styles.mdH3}>{children}</h3>,
                    p:  ({children}) => <p  className={styles.mdP}>{children}</p>,
                    li: ({children}) => <li className={styles.mdLi}>{children}</li>,
                    ul: ({children}) => <ul className={styles.mdUl}>{children}</ul>,
                    ol: ({children}) => <ol className={styles.mdOl}>{children}</ol>,
                    strong: ({children}) => <strong className={styles.mdStrong}>{children}</strong>,
                  }}
                >
                  {insights}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}

          {!loading && !insights && (
            <motion.div key="empty" className={styles.centeredState}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className={styles.emptyIcon}>🤖</div>
              <p className={styles.emptyTitle}>Ready to analyse</p>
              <p className={styles.emptyText}>
                Get a personalised breakdown of your study patterns, peak hours, and a recommended schedule.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

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

export function ChatPanel({ period }) {
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
      const res = await analyticsService.aiChat(updated, period);
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
    <div className={styles.chatPanel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Study Coach</h3>
          <p className={styles.panelSub}>Ask anything about your habits</p>
        </div>
        {messages.length > 0 && (
          <button className={styles.clearBtn} onClick={() => setMessages([])}>Clear</button>
        )}
      </div>

      <div className={styles.chatMessages}>
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div className={styles.chatEmpty}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className={styles.emptyIcon}>💬</div>
              <p className={styles.emptyText}>I have access to your real study data. Ask me anything.</p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={`sug-${i}`} className={styles.suggestion} onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div key={`msg-${i}`}
              className={`${styles.messageRow} ${msg.role === 'user' ? styles.rowUser : styles.rowAI}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              {msg.role === 'assistant' && <div className={styles.avatar}>✦</div>}
              <div className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI}`}>
                {msg.role === 'user'
                  ? <p className={styles.bubbleLine}>{msg.content}</p>
                  : <div className={styles.markdownBody}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className={styles.mdH1}>{children}</h1>,
                          h2: ({children}) => <h2 className={styles.mdH2}>{children}</h2>,
                          h3: ({children}) => <h3 className={styles.mdH3}>{children}</h3>,
                          p:  ({children}) => <p  className={styles.mdP}>{children}</p>,
                          li: ({children}) => <li className={styles.mdLi}>{children}</li>,
                          ul: ({children}) => <ul className={styles.mdUl}>{children}</ul>,
                          ol: ({children}) => <ol className={styles.mdOl}>{children}</ol>,
                          strong: ({children}) => <strong className={styles.mdStrong}>{children}</strong>,
                        }}
                      >
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
        {error && <p className={styles.chatError}>{error}</p>}
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
    </div>
  );
}

export default function AIInsightsTab({ period }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getAiInsights(period);
      setInsights(res.insights);
    } catch {
      setError('Failed to generate insights. Check your API key configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.aiTab}>
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.aiGrid}>
        <InsightsPanel insights={insights} loading={loading} onGenerate={generate} period={period} />
        <ChatPanel period={period} />
      </div>
    </div>
  );
}