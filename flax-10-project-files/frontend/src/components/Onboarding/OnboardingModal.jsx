import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KCL_DEPARTMENTS } from "../../lib/kclCourses";
import AnimatedDropdown from "./AnimatedDropdown";
import SuccessScreen from "./SuccessScreen";
import styles from "./OnboardingModal.module.css";

const YEARS = ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function getCourseOptions() {
  return Object.entries(KCL_DEPARTMENTS).map(([dept, courses]) => ({
    label: dept,
    options: courses.map(c => ({ value: c, label: c }))
  }));
}

function WarningBox({ major, confirmed, onConfirm }) {
  return (
    <div style={{
      marginTop: '1rem', padding: '0.85rem 1rem', borderRadius: '8px',
      background: 'var(--warning-bg, #fff8e6)',
      border: '1px solid var(--warning-border, #f0c040)',
      fontSize: '0.85rem', color: 'var(--warning-text, #7a5c00)',
    }}>
      <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>⚠️ Are you sure you want to select <em>{major}</em>?</p>
      <p style={{ margin: '0 0 0.75rem', lineHeight: 1.5 }}>
        This cannot be changed after setup. Your modules will be automatically assigned based on this course.
      </p>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
        <input type="checkbox" checked={confirmed} onChange={e => onConfirm(e.target.checked)} />
        I understand this cannot be changed later
      </label>
    </div>
  );
}

async function submitOnboarding(year, major) {
  const token = localStorage.getItem("token");
  await fetch(`${API_BASE_URL}/onboarding/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Token ${token}` },
    body: JSON.stringify({ year, major }),
  });
}

export default function OnboardingModal({ isOpen, onComplete }) {
  const [year, setYear] = useState("");
  const [major, setMajor] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!year || !major || !confirmed) return;
    setLoading(true);
    await submitOnboarding(year, major).catch(console.error);
    setLoading(false);
    setDone(true);
  };

  const handleMajorChange = (val) => { setMajor(val); setConfirmed(false); };

  return (
    <div className={styles.overlay}>
      <motion.div className={styles.modal}
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {done ? <SuccessScreen key="success" major={major} onComplete={onComplete} /> : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className={styles.title}>Welcome to StudyFlax 👋</h2>
              <p className={styles.subtitle}>Tell us about yourself so we can set up your modules.</p>

              <label className={styles.label}>Year of Study</label>
              <AnimatedDropdown value={year} onChange={setYear} placeholder="Select your year" options={YEARS} grouped={false} />

              <label className={styles.label} style={{ marginTop: '1rem' }}>Course</label>
              <AnimatedDropdown value={major} onChange={handleMajorChange} placeholder="Select your course" options={getCourseOptions()} grouped={true} />

              <AnimatePresence>
                {year && major && (
                  <motion.div initial={{ opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 8, height: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} style={{ overflow: 'hidden' }}
                  >
                    <WarningBox major={major} confirmed={confirmed} onConfirm={setConfirmed} />
                  </motion.div>
                )}
              </AnimatePresence>

              <button className={styles.btn} onClick={handleSubmit} disabled={!year || !major || !confirmed || loading}>
                {loading ? "Setting up your modules..." : "Get Started"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}