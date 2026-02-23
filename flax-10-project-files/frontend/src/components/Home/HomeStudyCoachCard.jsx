import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import analyticsService from "../../api/analyticsService";
import styles from "./HomeStudyCoachCard.module.css";

function pickTwoLineSummary(insights) {
  if (!insights) return "";

  // Support either string or array responses
  if (typeof insights === "string") {
    return insights.split("\n").filter(Boolean).slice(0, 2).join(" ");
  }

  if (Array.isArray(insights)) {
    return insights
      .map((x) => (typeof x === "string" ? x : x?.text || x?.title || ""))
      .filter(Boolean)
      .slice(0, 2)
      .join(" ");
  }

  // Object fallback
  if (typeof insights === "object") {
    const a = insights.summary || insights.overview || insights.message;
    if (typeof a === "string") {
      return a.split("\n").filter(Boolean).slice(0, 2).join(" ");
    }
  }

  return "";
}

export default function HomeStudyCoachCard({ days = 7 }) {
  const nav = useNavigate();
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getAiInsights(days);
      const s = pickTwoLineSummary(res?.insights || res);
      setSummary(s);
      setHasGenerated(true);
    } catch {
      setSummary("");
      setHasGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div>
          <div className={styles.title}>Generate Weekly Plan</div>
          <div className={styles.sub}>Last {days} days · AI coach</div>
        </div>

        <button className={styles.linkBtn} onClick={() => nav("/analytics")}>
          View →
        </button>
      </div>

      <div className={styles.body}>
        {!hasGenerated ? (
          <p className={styles.placeholder}>
            Generate a short plan based on your recent study behaviour.
          </p>
        ) : summary ? (
          <p className={styles.summary}>{summary}</p>
        ) : (
          <p className={styles.placeholder}>
            No insights yet — try generating again.
          </p>
        )}

        <button
          className={styles.primaryBtn}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>
    </div>
  );
}