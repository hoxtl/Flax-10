import { useState } from "react";
import styles from "./Settings.module.css";

// Single tab button
function TabButton({ id, label, isActive, onClick }) {
  const className = `${styles.tab} ${isActive ? styles.tabActive : ""}`;
  return (
    <button className={className} onClick={() => onClick(id)}>
      {label}
    </button>
  );
}

// Tab navigation
function SettingsTabs({ activeTab, onChange }) {
  const tabs = [
    { id: "account", label: "Account" },
    { id: "security", label: "Security" },
    { id: "preferences", label: "Preferences" },
  ];

  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          id={tab.id}
          label={tab.label}
          isActive={activeTab === tab.id}
          onClick={onChange}
        />
      ))}
    </div>
  );
}

// Success banner
function SuccessBanner({ message }) {
  if (!message) return null;

  return (
    <div className={styles.successBanner}>
      <span>✅</span>
      <span>{message}</span>
    </div>
  );
}

// Error message
function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div className={styles.errorMessage}>
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}

// Form input field
function FormInput({ id, label, type = "text", value, onChange, required, name }) {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>{label}</label>
      <input
        type={type}
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}

// Form select field
function FormSelect({ id, label, value, onChange, options, name }) {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>{label}</label>
      <select id={id} name={name || id} value={value} onChange={onChange}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Form section header
function SectionHeader({ title, description }) {
  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {description && <p className={styles.formDescription}>{description}</p>}
    </div>
  );
}

// Submit button
function SubmitButton({ isSaving, label, savingLabel }) {
  return (
    <div className={styles.formActions}>
      <button type="submit" className={styles.btnPrimary} disabled={isSaving}>
        {isSaving ? savingLabel : label}
      </button>
    </div>
  );
}

// Get initial account data
function getInitialAccountData(user) {
  return {
    name: user?.name || "",
    email: user?.email || "",
    year: user?.year || "Year 2",
    major: user?.major || "Computer Science",
  };
}

// Get year options
function getYearOptions() {
  return [
    { value: "Year 1", label: "Year 1" },
    { value: "Year 2", label: "Year 2" },
    { value: "Year 3", label: "Year 3" },
    { value: "Year 4", label: "Year 4" },
  ];
}

// Account form
function AccountForm({ user, onSave, isSaving }) {
  const [formData, setFormData] = useState(getInitialAccountData(user));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader title="Personal Information" />
      
      <FormInput
        id="name"
        label="Full Name"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <FormInput
        id="email"
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <div className={styles.formRow}>
        <FormSelect
          id="year"
          label="Year"
          value={formData.year}
          onChange={handleChange}
          options={getYearOptions()}
        />

        <FormInput
          id="major"
          label="Major"
          value={formData.major}
          onChange={handleChange}
        />
      </div>

      <SubmitButton
        isSaving={isSaving}
        label="Save Changes"
        savingLabel="Saving..."
      />
    </form>
  );
}

// Get initial password data
function getInitialPasswordData() {
  return {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
}

// Security form
function SecurityForm({ onSave, isSaving, error }) {
  const [formData, setFormData] = useState(getInitialPasswordData());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader
        title="Change Password"
        description="Ensure your password is at least 8 characters long"
      />

      <ErrorMessage message={error} />

      <FormInput
        id="currentPassword"
        label="Current Password"
        type="password"
        value={formData.currentPassword}
        onChange={handleChange}
        required
      />

      <FormInput
        id="newPassword"
        label="New Password"
        type="password"
        value={formData.newPassword}
        onChange={handleChange}
        required
      />

      <FormInput
        id="confirmPassword"
        label="Confirm New Password"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
      />

      <SubmitButton
        isSaving={isSaving}
        label="Change Password"
        savingLabel="Changing..."
      />
    </form>
  );
}

// Preferences panel
function PreferencesPanel() {
  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>Preferences</h2>
      <p className={styles.formDescription}>Customize your StudyFlax experience</p>
      <p style={{ color: "var(--muted)", marginTop: "40px" }}>
        Preferences coming soon...
      </p>
    </div>
  );
}

// Page header
function SettingsHeader({ onBack }) {
  return (
    <div className={styles.header}>
      <button className={styles.backButton} onClick={onBack}>
        ←
      </button>
      <h1 className={styles.title}>Settings</h1>
    </div>
  );
}

// Show success message temporarily
function showTemporaryMessage(setter, message, duration = 3000) {
  setter(message);
  setTimeout(() => setter(""), duration);
}

// Validate password length
function isPasswordTooShort(password) {
  return password.length < 8;
}

// Validate passwords match
function passwordsDoNotMatch(pass1, pass2) {
  return pass1 !== pass2;
}

// Main Settings page
export default function Settings({ user, onBack }) {
  const [activeTab, setActiveTab] = useState("account");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleAccountSave = async (data) => {
    setIsSaving(true);
    try {
      console.log("Saving account:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showTemporaryMessage(setSuccessMessage, "Account updated successfully!");
    } catch (error) {
      console.error("Failed to update account:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSave = async (data) => {
    setPasswordError("");

    if (isPasswordTooShort(data.newPassword)) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    if (passwordsDoNotMatch(data.newPassword, data.confirmPassword)) {
      setPasswordError("New passwords do not match");
      return;
    }

    setIsSaving(true);
    try {
      console.log("Changing password");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showTemporaryMessage(setSuccessMessage, "Password changed successfully!");
    } catch (error) {
      setPasswordError("Failed to change password. Check your current password.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <SettingsHeader onBack={onBack} />
      <SuccessBanner message={successMessage} />

      <div className={styles.content}>
        <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className={styles.panel}>
          {activeTab === "account" && (
            <AccountForm user={user} onSave={handleAccountSave} isSaving={isSaving} />
          )}

          {activeTab === "security" && (
            <SecurityForm
              onSave={handlePasswordSave}
              isSaving={isSaving}
              error={passwordError}
            />
          )}

          {activeTab === "preferences" && <PreferencesPanel />}
        </div>
      </div>
    </div>
  );
}