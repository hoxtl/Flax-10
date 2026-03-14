import { useState } from "react";
import { FormInput, SectionHeader, SubmitButton, ErrorMessage } from "./SettingsUI";
import styles from "../../pages/Settings/Settings.module.css";

const RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Contains a number", test: (p) => /\d/.test(p) },
  { label: "Contains a letter", test: (p) => /[a-zA-Z]/.test(p) },
  { label: "Contains a special character", test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

function PasswordStrength({ password }) {
  if (!password) return null;
  const passed = RULES.filter((r) => r.test(password)).length;
  const pct = (passed / RULES.length) * 100;
  const color =
    passed <= 1 ? "#ef4444" : passed === 2 ? "#f97316" : passed === 3 ? "#eab308" : "#22c55e";

  return (
    <div className={styles.passwordStrength}>
      <div className={styles.passwordStrengthBar}>
        <div
          className={styles.passwordStrengthFill}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <ul className={styles.passwordRules}>
        {RULES.map((r) => {
          const ok = r.test(password);
          return (
            <li key={r.label} className={ok ? styles.rulePassed : styles.ruleFailed}>
              <span className={styles.ruleIcon}>{ok ? "✓" : "✗"}</span>
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function SecurityForm({ onSave, isSaving, error }) {
  const [formData, setFormData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader title="Change Password" description="Ensure your password is at least 8 characters long" />
      <ErrorMessage message={error} />
      <FormInput id="currentPassword" label="Current Password" type="password" value={formData.currentPassword} onChange={handleChange} required />
      <FormInput id="newPassword" label="New Password" type="password" value={formData.newPassword} onChange={handleChange} required />
      <PasswordStrength password={formData.newPassword} />
      <FormInput id="confirmPassword" label="Confirm New Password" type="password" value={formData.confirmPassword} onChange={handleChange} required />
      <SubmitButton isSaving={isSaving} label="Change Password" savingLabel="Changing..." />
    </form>
  );
}
