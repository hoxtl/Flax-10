/*
 * Presentational layout for the password form.
 */

import PasswordStrength from "../common/PasswordStrength";
import styles from "../../pages/Settings/Settings.module.css";
import SettingsContextCard from "./SettingsContextCard";
import { ErrorMessage, FormInput, SectionHeader, SubmitButton } from "./SettingsUI";

function SecurityFields({ formData, handleChange, isSaving, hasUnsaved, saveSignal }) {
  return (
    <div className={styles.settingsTile}>
      <FormInput id="newPassword" label="New Password" type="password" value={formData.newPassword} onChange={handleChange} required />
      <PasswordStrength password={formData.newPassword} />
      <FormInput id="confirmPassword" label="Confirm New Password" type="password" value={formData.confirmPassword} onChange={handleChange} required />
      <SubmitButton isSaving={isSaving} label="Change Password" savingLabel="Changing..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
    </div>
  );
}

export default function SecurityFormLayout(props) {
  return (
    <form onSubmit={props.onSubmit} className={styles.form}>
      <SectionHeader title="Change Password" />
      <ErrorMessage message={props.error} />
      <div className={styles.twoColLayout}>
        <div><SecurityFields {...props} /></div>
        <SettingsContextCard emoji="🔐" title="Password tips" items={["Use a unique passphrase with mixed characters", "Avoid birthdays, names, and common words", "Update it after suspicious activity"]} />
      </div>
    </form>
  );
}
