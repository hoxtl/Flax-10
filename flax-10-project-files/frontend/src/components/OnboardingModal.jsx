import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { KCL_DEPARTMENTS } from "../lib/kclCourses";
import styles from "./OnboardingModal.module.css";

const YEARS = ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function AnimatedDropdown({ value, onChange, placeholder, options, grouped }) {
  const [isOpen, setIsOpen] = useState(false);

  const allOptions = grouped
    ? options.flatMap(g => g.options.map(o => ({ ...o, group: g.label })))
    : options.map(o => ({ value: o, label: o }));

  const selectedLabel = allOptions.find(o => o.value === value)?.label || placeholder;

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className={styles.dropdownBtn}
      >
        <span style={{ color: value ? 'inherit' : 'var(--muted)' }}>{selectedLabel}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={16} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className={styles.dropdownMenu}
          >
            {grouped ? (
              options.map((group) => (
                <div key={group.label}>
                  <div className={styles.dropdownGroup}>{group.label}</div>
                  {group.options.map((opt, i) => (
                    <motion.button
                      type="button"
                      key={opt.value}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.02 }}
                      onClick={() => handleSelect(opt.value)}
                      className={`${styles.dropdownItem} ${value === opt.value ? styles.dropdownItemActive : ''}`}
                    >
                      <span>{opt.label}</span>
                      {value === opt.value && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                          <Check size={14} />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              ))
            ) : (
              options.map((opt, i) => (
                <motion.button
                  type="button"
                  key={opt}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.03 }}
                  onClick={() => handleSelect(opt)}
                  className={`${styles.dropdownItem} ${value === opt ? styles.dropdownItemActive : ''}`}
                >
                  <span>{opt}</span>
                  {value === opt && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                      <Check size={14} />
                    </motion.div>
                  )}
                </motion.button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuccessScreen({ major, onComplete }) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      style={{ textAlign: 'center', padding: '1rem 0' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        style={{ fontSize: '3rem', marginBottom: '1rem' }}
      >
        🎉
      </motion.div>
      <h2 className={styles.title} style={{ marginBottom: '0.5rem' }}>You're all set!</h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: 1.6 }}>
        Your modules for <strong>{major}</strong> have been added to your profile.
      </p>
      <div style={{
        background: 'var(--hover-bg, #f5f5f5)',
        borderRadius: '10px',
        padding: '0.9rem 1rem',
        fontSize: '0.88rem',
        color: 'var(--muted)',
        marginBottom: '1.5rem',
        lineHeight: 1.6,
      }}>
        📚 Want to see your enrolled modules in detail?
        Head to <strong>My Enrolments</strong> in the Modules section.
      </div>
      <button className={styles.btn} onClick={onComplete}>
        Go to Dashboard
      </button>
    </motion.div>
  );
}

export default function OnboardingModal({ isOpen, onComplete }) {
  const [year, setYear] = useState("");
  const [major, setMajor] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const courseOptions = Object.entries(KCL_DEPARTMENTS).map(([dept, courses]) => ({
    label: dept,
    options: courses.map(c => ({ value: c, label: c }))
  }));

  const handleSubmit = async () => {
    if (!year || !major || !confirmed) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/onboarding/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Token ${token}` },
        body: JSON.stringify({ year, major }),
      });
      setDone(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {done ? (
            <SuccessScreen key="success" major={major} onComplete={onComplete} />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className={styles.title}>Welcome to StudyFlax 👋</h2>
              <p className={styles.subtitle}>Tell us about yourself so we can set up your modules.</p>

              <label className={styles.label}>Year of Study</label>
              <AnimatedDropdown
                value={year}
                onChange={setYear}
                placeholder="Select your year"
                options={YEARS}
                grouped={false}
              />

              <label className={styles.label} style={{ marginTop: '1rem' }}>Course</label>
              <AnimatedDropdown
                value={major}
                onChange={(val) => { setMajor(val); setConfirmed(false); }}
                placeholder="Select your course"
                options={courseOptions}
                grouped={true}
              />

              <AnimatePresence>
                {year && major && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 8, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      background: 'var(--warning-bg, #fff8e6)',
                      border: '1px solid var(--warning-border, #f0c040)',
                      fontSize: '0.85rem',
                      color: 'var(--warning-text, #7a5c00)',
                    }}>
                      <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>
                        ⚠️ Are you sure you want to select <em>{major}</em>?
                      </p>
                      <p style={{ margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                        This cannot be changed after setup. Your modules will be automatically assigned based on this course.
                      </p>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                        <input
                          type="checkbox"
                          checked={confirmed}
                          onChange={e => setConfirmed(e.target.checked)}
                        />
                        I understand this cannot be changed later
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                className={styles.btn}
                onClick={handleSubmit}
                disabled={!year || !major || !confirmed || loading}
              >
                {loading ? "Setting up your modules..." : "Get Started"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}