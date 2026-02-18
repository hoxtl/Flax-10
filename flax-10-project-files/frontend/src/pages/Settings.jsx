import { useState } from "react";
import styles from "./Settings.module.css";
import { useTheme } from "../context/ThemeContext";
import { updateUserSettings } from '../api/userService';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
function FormInput({ id, label, type = "text", value, onChange, required, name, maxLength }) {
  const remaining_chars = maxLength ? maxLength - value.length : null;

  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>{label}
        {maxLength && (
          <span style={{ color: 'var(--muted)', fontSize: '0.9em', marginLeft: '5px' }}>
            ({remaining_chars} characters remaining)
          </span>
        )}
      </label>
      <input
        type={type}
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
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

// Theme selector component
function ThemeSelector({ value, onChange }) {
  return (
    <div className={styles.themeSelector}>
      <button
        type="button"
        className={`${styles.themeOption} ${value === 'light' ? styles.active : ''}`}
        onClick={() => onChange('light')}
      >
        <span className={styles.themeIcon}>☀️</span>
        <span className={styles.themeLabel}>Light</span>
      </button>
      <button
        type="button"
        className={`${styles.themeOption} ${value === 'dark' ? styles.active : ''}`}
        onClick={() => onChange('dark')}
      >
        <span className={styles.themeIcon}>🌙</span>
        <span className={styles.themeLabel}>Dark</span>
      </button>
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
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    year: user?.year || "Year 2",
    major: user?.major || "Computer Science",
  };
}

// Get year options
function getYearOptions() {
  return [
    { value: "Foundation Year", label: "Foundation Year" },
    { value: "Year 1", label: "Year 1" },
    { value: "Year 2", label: "Year 2" },
    { value: "Year 3", label: "Year 3" },
    { value: "Year 4", label: "Year 4" },
    { value: "Year 5", label: "Year 5" },
    { value: "Year 6", label: "Year 6" },
    { value: "Year 7", label: "Year 7" },
    { value: "Year 8", label: "Year 8" }
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
        id="firstName"
        name="firstName"
        label="First Name"
        value={formData.firstName}
        onChange={handleChange}
        required
      />

      <FormInput
        id="lastName"
        name="lastName"
        label="Last Name"
        value={formData.lastName}
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
          maxLength={100}
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
function PreferencesPanel({ onSave, isSaving }) {
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({
    theme: theme,
  });

  function handleThemeChange(newTheme) {
    setFormData(prev => ({ ...prev, theme: newTheme }));
    setTheme(newTheme);
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(formData);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader
        title="Appearance"
        description="Customize how StudyFlax looks"
      />

      <div className={styles.formGroup}>
        <label>Theme</label>
        <p className={styles.formDescription}>
          Choose your preferred color scheme. This will be saved and applied every time you log in.
        </p>
        <ThemeSelector value={formData.theme} onChange={handleThemeChange} />
      </div>

      <SubmitButton
        isSaving={isSaving}
        label="Save Preferences"
        savingLabel="Saving..."
      />
    </form>
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
    setPasswordError("");

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPasswordError("You are not logged in, please try again...");
        setIsSaving(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/settings/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          first_name: data.firstName,
          last_name: data.lastName,
          year: data.year,
          major: data.major
        })
      });

      const responseData = await response.json();

      if (response.ok) {
        if (responseData.user) {
          localStorage.setItem('user', JSON.stringify(responseData.user));
          showTemporaryMessage(setSuccessMessage, "The account has been updated!");

          setTimeout(() => {
            onBack();
            window.location.reload();
          }, 1000);
        }
        else {
          setPasswordError(responseData.error || "The account update has failed...");
        }
      }
    } catch (error) {
      console.error("Update account error: ", error)
      setPasswordError("Action failed, please try again...")
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
      const token = localStorage.getItem('token');
      if (!token) {
        setPasswordError("You are not logged in");
        setIsSaving(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/settings/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          password: data.newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      showTemporaryMessage(setSuccessMessage, "Password changed successfully! Please log in again with your new password.");
      
      // Log out user after password change
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }, 2000);
      
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError(error.message || "Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesSave = async (data) => {
    setIsSaving(true);
    try {
      const response = await updateUserSettings({ theme: data.theme });
      
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      showTemporaryMessage(setSuccessMessage, "Preferences saved successfully!");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      showTemporaryMessage(setSuccessMessage, "Failed to save preferences");
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

          {activeTab === "preferences" && (
            <PreferencesPanel onSave={handlePreferencesSave} isSaving={isSaving} />
          )}
        </div>
      </div>
    </div>
  );
}
