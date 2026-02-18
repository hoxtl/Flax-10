import { useState, useRef, useEffect } from 'react';
import analyticsService from '../../api/analyticsService';
import styles from './AIInsightsTab.module.css';

const InsightsPanel = ({ insights, loading, onGenerate, period }) => (
  <div className={styles.panel}>
    <div className={styles.panelHeader}>
      <h3>✨ AI Study Insights</h3>
      <button className={styles.generateBtn} onClick={onGenerate} disabled={loading}>
        {loading ? 'Analysing...' : 'Generate Insights'}
      </button>
    </div>
    {loading && (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Analysing your last {period} days of study data...</p>
      </div>
    )}
    {!loading && insights && (
      <div className={styles.insightsText}>
        {insights.split('\n').map((line, i) => (
          <p key={`line-${i}`}>{line || '\u00A0'}</p>
        ))}
      </div>
    )}
    {!loading && !insights && (
      <div className={styles.empty}>
        <span>🤖</span>
        <p>Click "Generate Insights" to get a personalised analysis of your study patterns, strengths, and a recommended schedule.</p>
      </div>
    )}
  </div>
);

const ChatMessage = ({ message, index }) => (
  <div className={`${styles.message} ${styles[message.role]}`}>
    <div className={styles.messageBubble}>
      {message.content.split('\n').map((line, i) => (
        <p key={`msg-${index}-line-${i}`}>{line || '\u00A0'}</p>
      ))}
    </div>
  </div>
);

const SUGGESTIONS = [
  'When should I study this week?',
  'Am I a night owl or morning person?',
  'How can I improve my consistency?',
  'What does my study pattern say about me?',
];

const ChatPanel = ({ period }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.aiChat(updated, period);
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch {
      setError('Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className={styles.chatPanel}>
      <div className={styles.panelHeader}>
        <h3>💬 Chat with Study AI</h3>
        {messages.length > 0 && <button className={styles.clearBtn} onClick={() => setMessages([])}>Clear</button>}
      </div>
      <div className={styles.chatMessages}>
        {messages.length === 0 && (
          <div className={styles.chatEmpty}>
            <p>Ask me anything about your study habits. I have access to your real data.</p>
            <div className={styles.suggestions}>
              {SUGGESTIONS.map(s => (
                <button key={s} className={styles.suggestion} onClick={() => setInput(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => <ChatMessage key={`msg-${i}`} message={msg} index={i} />)}
        {loading && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.messageBubble}><span className={styles.typing}>●●●</span></div>
          </div>
        )}
        {error && <p className={styles.error}>{error}</p>}
        <div ref={bottomRef} />
      </div>
      <div className={styles.chatInput}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your study patterns, schedule, or habits..."
          rows={2}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} className={styles.sendBtn}>Send</button>
      </div>
    </div>
  );
};

const AIInsightsTab = ({ period }) => {
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
};

export default AIInsightsTab;
