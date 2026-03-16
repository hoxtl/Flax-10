import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import analyticsService from "../../api/analyticsService";
import StudyCoachPanel from "../StudyCoachPanel";
import styles from "./AIInsightsTab.module.css";

export function InsightsPanel({ insights, loading, onGenerate, period, compact = false }) {
  return (
    <div className={styles.panel}>
      {/* On Home we already show a CTA header, so hide this */}
      {!compact && (
        <div className={styles.panelHeader}>
          <div>
            <h3 className={styles.panelTitle}>Study Analysis</h3>
            <p className={styles.panelSub}>Last {period} days · AI generated</p>
          </div>
          <button
            className={styles.generateBtn}
            onClick={onGenerate}
            disabled={loading}
          >
            {loading ? <span className={styles.btnSpinner} /> : <>✦ Generate</>}
          </button>
        </div>
      )}

      <div className={styles.panelBody}>
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              className={styles.centeredState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.pulseRing} />
              <p>Analysing your study patterns…</p>
            </motion.div>
          )}

          {!loading && insights && (
            <motion.div
              key="insights"
              className={styles.insightsScrollBody}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.markdownBody}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className={styles.mdH1}>{children}</h1>,
                    h2: ({ children }) => <h2 className={styles.mdH2}>{children}</h2>,
                    h3: ({ children }) => <h3 className={styles.mdH3}>{children}</h3>,
                    p: ({ children }) => <p className={styles.mdP}>{children}</p>,
                    li: ({ children }) => <li className={styles.mdLi}>{children}</li>,
                    ul: ({ children }) => <ul className={styles.mdUl}>{children}</ul>,
                    ol: ({ children }) => <ol className={styles.mdOl}>{children}</ol>,
                    strong: ({ children }) => <strong className={styles.mdStrong}>{children}</strong>,
                  }}
                >
                  {insights}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}

          {/* On Home, don’t show the duplicate “Ready to analyse” paragraph */}
          {!loading && !insights && !compact && (
            <motion.div
              key="empty"
              className={styles.centeredState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className={styles.emptyIcon}>🤖</div>
              <p className={styles.emptyTitle}>Ready to analyse</p>
              <p className={styles.emptyText}>
                Get a personalised breakdown of your study patterns, peak hours, and a recommended schedule.
              </p>
            </motion.div>
          )}

          {/* On Home in compact mode, keep it clean */}
          {!loading && !insights && compact && (
            <motion.div
              key="empty-compact"
              className={styles.centeredState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className={styles.emptyIcon}>🤖</div>
              <p className={styles.emptyTitle}>Generate your plan</p>
              <p className={styles.emptyText}>
                Tap “Generate” to get a personalised schedule suggestion.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ChatPanel({ period }) {
  return (
    <StudyCoachPanel
      period={period}
      subtitle="Ask anything about your habits"
      className={styles.chatPanel}
    />
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
      setError("Failed to generate insights. Check your API key configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.aiTab}>
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.aiGrid}>
        <InsightsPanel
          insights={insights}
          loading={loading}
          onGenerate={generate}
          period={period}
        />
        <ChatPanel period={period} />
      </div>
    </div>
  );
}
