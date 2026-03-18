import { useState } from "react";
import { FormInput, SectionHeader, SubmitButton, ErrorMessage } from "./SettingsUI";
import PasswordStrength from "../common/PasswordStrength";
import styles from "../../pages/Settings/Settings.module.css";

function isStrongPassword(password) {
  if (!password) return true;
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  return hasMinLength && hasNumber && hasLetter && hasSymbol;
}

export default function SecurityForm({ onSave, isSaving, error }) {
  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [saveSignal, setSaveSignal] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const hasUnsaved = Boolean(formData.newPassword || formData.confirmPassword);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await onSave(formData);
    if (ok) {
      setFormData({ newPassword: "", confirmPassword: "" });
      setSaveSignal((s) => s + 1);
    }
  };
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader title="Change Password" />
      <ErrorMessage message={error} />
      <div className={styles.twoColLayout}>
        <div>
          <div className={styles.settingsTile}>
            <FormInput id="newPassword" label="New Password" type="password" value={formData.newPassword} onChange={handleChange} required />
            <PasswordStrength password={formData.newPassword} />
            <FormInput id="confirmPassword" label="Confirm New Password" type="password" value={formData.confirmPassword} onChange={handleChange} required />
            <SubmitButton
              isSaving={isSaving}
              label="Change Password"
              savingLabel="Changing..."
              hasUnsaved={hasUnsaved}
              saveSignal={saveSignal}
            />
          </div>
        </div>
        <div className={styles.contextCard}>
          <span className={styles.contextCardEmoji}>🔐</span>
          <h3 className={styles.contextCardTitle}>Password tips</h3>
          <ul className={styles.contextCardList}>
            <li>Use a unique passphrase with mixed characters</li>
            <li>Avoid birthdays, names, and common words</li>
            <li>Update it after suspicious activity</li>
          </ul>
        </div>
      </div>
    </form>
  );
}
