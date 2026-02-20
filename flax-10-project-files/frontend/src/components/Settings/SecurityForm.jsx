import { useState } from "react";
import { FormInput, SectionHeader, SubmitButton, ErrorMessage } from "./SettingsUI";
import styles from "../../pages/Settings/Settings.module.css";

function getInitialData() {
  return { currentPassword: "", newPassword: "", confirmPassword: "" };
}

export default function SecurityForm({ onSave, isSaving, error }) {
  const [formData, setFormData] = useState(getInitialData());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader title="Change Password" description="Ensure your password is at least 8 characters long" />
      <ErrorMessage message={error} />
      <FormInput id="currentPassword" label="Current Password" type="password" value={formData.currentPassword} onChange={handleChange} required />
      <FormInput id="newPassword" label="New Password" type="password" value={formData.newPassword} onChange={handleChange} required />
      <FormInput id="confirmPassword" label="Confirm New Password" type="password" value={formData.confirmPassword} onChange={handleChange} required />
      <SubmitButton isSaving={isSaving} label="Change Password" savingLabel="Changing..." />
    </form>
  );
}