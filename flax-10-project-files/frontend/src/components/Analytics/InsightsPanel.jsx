/*
 * AI insights panel.
 */

import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { buildMarkdownComponents } from '../common/markdown/buildMarkdownComponents.jsx';
import styles from './AIInsightsTab.module.css';

const FADE = { initial: { opacity: 0 }, animate: { opacity: 1 } };
const MotionDiv = motion.div;

const MARKDOWN_COMPONENTS = buildMarkdownComponents(styles);

const EMPTY_TEXT = {
  full: {
    title: 'Ready to analyse',
    text: 'Get a personalised breakdown of your study patterns, peak hours, and a recommended schedule.',
  },
  compact: {
    title: 'Generate your plan',
    text: 'Tap "Generate" to get a personalised schedule suggestion.',
  },
};

function PanelHeader({ period, loading, onGenerate }) {
  return (
    <div className={styles.panelHeader}>
      <div>
        <h3 className={styles.panelTitle}>Study Analysis</h3>
        <p className={styles.panelSub}>Last {period} days · AI generated</p>
      </div>
      <button className={styles.generateBtn} onClick={onGenerate} disabled={loading}>
        {loading ? <span className={styles.btnSpinner} /> : <>✦ Generate</>}
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <MotionDiv key="loading" className={styles.centeredState} {...FADE} exit={{ opacity: 0 }}>
      <div className={styles.pulseRing} />
      <p>Analysing your study patterns…</p>
    </MotionDiv>
  );
}

function InsightsContent({ insights }) {
  return (
    <MotionDiv key="insights" className={styles.insightsScrollBody} {...FADE} transition={{ duration: 0.3 }}>
      <div className={styles.markdownBody}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
          {insights}
        </ReactMarkdown>
      </div>
    </MotionDiv>
  );
}

function EmptyState({ compact }) {
  const { title, text } = compact ? EMPTY_TEXT.compact : EMPTY_TEXT.full;
  return (
    <MotionDiv key={compact ? 'empty-compact' : 'empty'} className={styles.centeredState} {...FADE}>
      <div className={styles.emptyIcon}>🤖</div>
      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptyText}>{text}</p>
    </MotionDiv>
  );
}

function PanelBody({ insights, loading, compact }) {
  return (
    <div className={styles.panelBody}>
      <AnimatePresence mode="wait">
        {loading && <LoadingState />}
        {!loading && insights && <InsightsContent insights={insights} />}
        {!loading && !insights && <EmptyState compact={compact} />}
      </AnimatePresence>
    </div>
  );
}

export function InsightsPanel({ insights, loading, onGenerate, period, compact = false }) {
  return (
    <div className={styles.panel}>
      {!compact && <PanelHeader period={period} loading={loading} onGenerate={onGenerate} />}
      <PanelBody insights={insights} loading={loading} compact={compact} />
    </div>
  );
}
