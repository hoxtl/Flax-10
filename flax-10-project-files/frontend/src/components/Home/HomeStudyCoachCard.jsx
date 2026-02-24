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
    <div style={{ borderRadius: 14, overflow: "hidden" }}>
      <InsightsPanel
        insights={insights}
        loading={loading}
        onGenerate={generate}
        period={days}
      />
      <button
        onClick={() => nav("/analytics")}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          padding: "0.6rem 0.85rem",
          cursor: "pointer",
          fontWeight: 650,
          color: "var(--primary)",
          textAlign: "left",
          borderTop: "1px solid var(--border)",
        }}
      >
        View full AI coach →
      </button>
    </div>
  );
}