// src/components/Home/HomeStudyCoachCard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import analyticsService from "../../api/analyticsService";
import { InsightsPanel } from "../Analytics/AIInsightsTab";
import styles from "./HomeStudyCoachCard.module.css";

export default function HomeStudyCoachCard({ days = 7 }) {
  const nav = useNavigate();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

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
    <div className={styles.wrap}>
      {/* Top CTA bar */}
      <div className={styles.cta}>
        <div className={styles.ctaText}>
          <div className={styles.ctaTitle}>Want a personalised schedule?</div>
          <div className={styles.ctaSub}>
            Get a quick study plan based on your week — peak hours, gaps, and
            priorities.
          </div>
        </div>

        <button
          className={styles.ctaLink}
          type="button"
          onClick={() => nav("/analytics")}
        >
          Want detailed insights? →
        </button>
      </div>

      {/* Reuse the Analytics widget in compact mode */}
      <div className={styles.widgetShell}>
        <InsightsPanel
          insights={insights}
          loading={loading}
          onGenerate={generate}
          period={days}
          compact
        />
      </div>

      {/* Bottom link (optional, but you had this before) */}
      <button
        className={styles.viewAllBtn}
        type="button"
        onClick={() => nav("/analytics")}
      >
        View full AI coach →
      </button>
    </div>
  );
}