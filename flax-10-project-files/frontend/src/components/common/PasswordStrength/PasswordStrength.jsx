/*
 * Password strength metre with rule checklist and colour-coded progress bar.
 */

import styles from "./PasswordStrength.module.css";

const DEFAULT_RULES = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Has a number", test: (p) => /\d/.test(p) },
  { label: "Has a letter", test: (p) => /[a-zA-Z]/.test(p) },
  { label: "Has a symbol", test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

function getStrengthMeta(password, rules) {
  const passed = rules.filter((r) => r.test(password)).length;
  const pct = (passed / rules.length) * 100;
  const tone = passed <= 1 ? "weak" : passed === 2 ? "ok" : passed === 3 ? "good" : "strong";
  const label = passed <= 1 ? "Weak" : passed === 2 ? "Fair" : passed === 3 ? "Good" : "Strong";
  return { pct, tone, label };
}

function StrengthBar({ pct, tone }) {
  return (
    <div className={styles.bar}>
      <div className={`${styles.fill} ${styles[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function RuleList({ rules, password }) {
  return (
    <ul className={styles.rules}>
      {rules.map((rule) => {
        const met = rule.test(password);
        return <li key={rule.label} className={met ? styles.ruleMet : styles.ruleUnmet}>{met ? "✓" : "•"} {rule.label}</li>;
      })}
    </ul>
  );
}

/** Visual password strength indicator with a progress bar and rule checklist. */

export default function PasswordStrength({ password, rules = DEFAULT_RULES, title = "Password strength", showOnlyWhenTyping = true }) {
  if (showOnlyWhenTyping && !password) return null;
  const safePassword = password || "";
  const { pct, tone, label } = getStrengthMeta(safePassword, rules);
  return (
    <div className={styles.root}>
      <div className={styles.header}><span>{title}</span><span>{label}</span></div>
      <StrengthBar pct={pct} tone={tone} />
      <RuleList rules={rules} password={safePassword} />
    </div>
  );
}
