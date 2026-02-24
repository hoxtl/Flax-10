import { useState } from "react";
import { Link } from "react-router-dom";
import analyticsService from "../../api/analyticsService";
import styles from "./HomeStudyCoachCard.module.css";

export default function HomeStudyCoachCard({ days = 7 }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading]   = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getAiInsights(days);
      setInsights(res?.insights || "");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>WANT A PERSONALISED SCHEDULE?</span>
          <span className={styles.sub}>
            Get a quick study plan based on your week — peak hours, gaps, and priorities.
          </span>
          <Link className={styles.link} to="/analytics">Want detailed insights? →</Link>
        </div>
        <button
          type="button"
          className={styles.generateBtn}
          onClick={generate}
          disabled={loading}
        >
          {loading ? "…" : "Generate ✦"}
        </button>
      </div>

      <div className={styles.body}>
        {loading && (
          <div className={styles.centeredState}>
            <div className={styles.spinner} />
            <p className={styles.stateText}>Analysing your study patterns…</p>
          </div>
        )}
        {!loading && insights && (
          <div className={styles.insightsBody}>
            <InsightMarkdown text={insights} />
          </div>
        )}
        {!loading && !insights && (
          <div className={styles.centeredState}>
            <span className={styles.emptyIcon}>🤖</span>
            <p className={styles.emptyTitle}>Generate your plan</p>
            <p className={styles.stateText}>
              Tap "Generate" to get a personalised schedule suggestion.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function boldify(str) {
  return str.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function InsightMarkdown({ text }) {
  return (
    <div>
      {text.split("\n").map((line, i) => {
        if (line.startsWith("### ")) return <h4 key={i} className={styles.mdH}>{line.slice(4)}</h4>;
        if (line.startsWith("## "))  return <h3 key={i} className={styles.mdH}>{line.slice(3)}</h3>;
        if (line.startsWith("- ") || line.startsWith("* ")) return (
          <div key={i} className={styles.mdLi}>
            <span className={styles.mdBullet}>•</span>
            <span dangerouslySetInnerHTML={{ __html: boldify(line.slice(2)) }} />
          </div>
        );
        if (!line.trim()) return <div key={i} className={styles.mdSpacer} />;
        return <p key={i} className={styles.mdP} dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
      })}
    </div>
  );
}