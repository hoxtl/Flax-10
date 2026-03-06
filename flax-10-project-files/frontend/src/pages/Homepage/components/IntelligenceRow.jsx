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
}) {
  const tflDelays = useTflDelays();
  const navigate = useNavigate();

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
      </header>

      <BentoGrid>
        {/* Col 1, Rows 1–2: Right Now — hero card */}
        <BentoCard className={styles.posRightNow}>
          <RightNowWidget
            {...slot5Data}
            tflDelays={tflDelays}
            onOpenTimer={() => navigate("/timer")}
          />
        </BentoCard>

        {/* Cols 2–3, Row 1: Today's Tasks — wide */}
        <BentoCard className={styles.posTodaysTasks}>
          {slot1TodayTasks}
        </BentoCard>

        {/* Col 2, Row 2: Quick Actions */}
        <BentoCard className={styles.posQuickActions}>
          <QuickActionsWidget />
        </BentoCard>

        {/* Col 3, Row 2: Social Discover */}
        <BentoCard className={styles.posSocialDiscover}>
          <SocialDiscoverWidget />
        </BentoCard>

        {/* Col 1, Row 3: Upcoming Deadlines */}
        <BentoCard className={styles.posDeadlines}>
          {slot3Urgent}
        </BentoCard>

        {/* Cols 2–3, Row 3: Study Pulse (focus windows + weekly progress) */}
        <BentoCard className={styles.posStudyPulse}>
          <StudyPulseWidget
            windows={studyPulseWindows ?? []}
            now={studyPulseNow ?? new Date()}
            onStartFocus={studyPulseOnStartFocus}
            deadlines={studyPulseDeadlines ?? []}
          />
        </BentoCard>
      </BentoGrid>
    </section>
  );
}

