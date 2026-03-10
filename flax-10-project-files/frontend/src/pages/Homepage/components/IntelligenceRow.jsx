import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./IntelligenceRow.module.css";
import { tflService } from "../../../api/tflService";
import { RightNowWidget } from "./RightNowWidget";
import { BentoGrid, BentoCard } from "../../../components/ui/bento-grid";
import { QuickActionsWidget } from "./QuickActionsWidget";
import { SocialDiscoverWidget } from "./SocialDiscoverWidget";
import { StudyPulseWidget } from "./StudyPulseWidget";
import { Reorder } from "framer-motion";
import { Settings, Check, Lock, GripHorizontal } from "lucide-react";

function getGreeting(name) {
  const h = new Date().getHours();
  const timeOfDay = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return `Good ${timeOfDay}${name ? `, ${name}` : ""}.`;
}

function getTodayLabel() {
  const now = new Date();
  const day = now.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const date = now.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
  return `${day} · ${date}`;
}

function useTflDelays() {
  const [delays, setDelays] = useState(undefined);
  useEffect(() => {
    tflService.getTfLDelays()
      .then(data => setDelays(Array.isArray(data) ? data : []))
      .catch(() => setDelays([]));
  }, []);
  return delays;
}

export default function IntelligenceRow({
  displayName,
  slot1TodayTasks,
  slot3Urgent,
  studyPulseWindows,
  studyPulseNow,
  studyPulseOnStartFocus,
  studyPulseDeadlines,
  slot5Data,
  homepageWidgets = [],
  isEditingDashboard,
  setIsEditingDashboard,
  saveWidgetLayout
}) {
  const tflDelays = useTflDelays();
  const navigate = useNavigate();

  const renderWidgetContent = (id) => {
    switch (id) {
      case "rightNow":
        return (
          <RightNowWidget
            {...slot5Data}
            tflDelays={tflDelays}
            onOpenTimer={() => navigate("/timer")}
          />
        );
      case "tasks":
        return slot1TodayTasks;
      case "quickActions":
        return <QuickActionsWidget />;
      case "socialDiscover":
        return <SocialDiscoverWidget />;
      case "deadlines":
        return slot3Urgent;
      case "studyPulse":
        return (
          <StudyPulseWidget
            windows={studyPulseWindows ?? []}
            now={studyPulseNow ?? new Date()}
            onStartFocus={studyPulseOnStartFocus}
            deadlines={studyPulseDeadlines ?? []}
          />
        );
      default:
        return null; // fallback for widgets removed or unavailable
    }
  };

  const getWidgetStyleClass = (id) => {
    switch (id) {
      case "rightNow": return styles.posRightNow;
      case "tasks": return styles.posTodaysTasks;
      case "quickActions": return styles.posQuickActions;
      case "socialDiscover": return styles.posSocialDiscover;
      case "deadlines": return styles.posDeadlines;
      case "studyPulse": return styles.posStudyPulse;
      default: return "";
    }
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <motion.span
            className={styles.headerDateRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Calendar className={styles.headerDateIcon} size={14} strokeWidth={2} aria-hidden />
            <span className={styles.headerLabel}>{getTodayLabel()}</span>
          </motion.span>
          <motion.h2
            className={styles.headerTitle}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            {getGreeting(displayName)}
          </motion.h2>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border bg-white shadow-sm hover:bg-stone-50 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            onClick={() => setIsEditingDashboard(!isEditingDashboard)}
          >
            {isEditingDashboard ? (
              <><Check size={14} /> Done Editing</>
            ) : (
              <><Settings size={14} /> Edit Dashboard</>
            )}
          </button>
        </div>
      </header>

      {isEditingDashboard ? (
        <Reorder.Group
          axis="y"
          values={homepageWidgets}
          onReorder={saveWidgetLayout}
          className={styles.grid}
        >
          {homepageWidgets.map((widget) => (
            <Reorder.Item
              key={widget.id}
              value={widget}
              className={getWidgetStyleClass(widget.id)}
            >
              <BentoCard className={isEditingDashboard ? 'opacity-80' : ''}>
                <div className="absolute top-2 right-2 p-1.5 rounded-md bg-stone-100 hover:bg-stone-200 cursor-grab z-10">
                  <GripHorizontal size={14} className="text-stone-500" />
                </div>
                {renderWidgetContent(widget.id)}
              </BentoCard>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <BentoGrid>
          {homepageWidgets.map((widget) => (
            <BentoCard key={widget.id} className={getWidgetStyleClass(widget.id)}>
              {renderWidgetContent(widget.id)}
            </BentoCard>
          ))}
        </BentoGrid>
      )}
    </section>
  );
}

