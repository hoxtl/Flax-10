/**
 * Shared UI primitives and the sidebar navigation for the Settings page.
 */
import { User, Lock, Palette, MapPin, BookOpen } from "lucide-react";
import styles from "../../pages/Settings/Settings.module.css";
import AnimatedDropdown from "../common/AnimatedDropdown";
import FormField from "../common/FormField/FormField";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import TextInput from "../common/TextInput/TextInput";

const TAB_CONFIG = [
  { id: "account",     label: "Account",     icon: User,     group: "Profile" },
  { id: "home",        label: "Location",    icon: MapPin,   group: "Profile" },
  { id: "security",    label: "Security",    icon: Lock,     group: "Profile" },
  { id: "preferences", label: "Preferences", icon: Palette,  group: "Preferences" },
  { id: "course",      label: "Academic",    icon: BookOpen, group: "Academic" },
];

function getInitials(user) {
  if (!user) return "?";
  const first = user.first_name?.[0] || "";
  const last  = user.last_name?.[0]  || "";
  return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
}

function getGreeting(user) {
  const firstName = user?.first_name || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();
  if (hour < 12) return { text: `Good morning, ${firstName}`, icon: "☀️" };
  if (hour < 17) return { text: `Good afternoon, ${firstName}`, icon: "🌤️" };
  return { text: `Good evening, ${firstName}`, icon: "🌙" };
}

function getProfileCompletion(user) {
  const checks = [
    Boolean(user?.first_name),
    Boolean(user?.last_name),
    Boolean(user?.email),
    Boolean(user?.major),
    Boolean(user?.year_of_study || user?.year),
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

/**
 * Vertical sidebar navigation with grouped nav items and a user profile header.
 *
 * @param {object} props
 * @param {string} props.activeTab
 * @param {Function} props.onChange
 * @param {object} props.user
 */
export function SettingsSidebar({ activeTab, onChange, user }) {
  const groups = [...new Set(TAB_CONFIG.map((t) => t.group))];
  const greeting = getGreeting(user);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarProfile}>
        <div className={styles.avatar}>{getInitials(user)}</div>
        <div className={styles.sidebarProfileInfo}>
          <div className={styles.sidebarName}>
            {greeting.icon} {greeting.text}
          </div>
          <div className={styles.sidebarRole}>
            {user?.role === "teacher" ? "Teacher" : "Student"}
          </div>
        </div>
      </div>

      {(() => {
        const pct = getProfileCompletion(user);
        return pct < 100 ? (
          <div className={styles.profileCompletion}>
            <div className={styles.profileCompletionHeader}>
              <span>Profile</span>
              <span>{pct}%</span>
            </div>
            <div className={styles.profileCompletionBar}>
              <div className={styles.profileCompletionFill} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : null;
      })()}

      <nav className={styles.sidebarNav}>
        {groups.map((group) => (
          <div key={group} style={{ width: "100%" }}>
            <div className={styles.sidebarSectionLabel}>{group}</div>
            {TAB_CONFIG.filter((t) => t.group === group).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`${styles.navItem} ${activeTab === tab.id ? styles.navItemActive : ""}`}
                  onClick={() => onChange(tab.id)}
                >
                  <Icon className={styles.navIcon} size={15} strokeWidth={2} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function SettingsTabs({ activeTab, onChange }) {
  return <SettingsSidebar activeTab={activeTab} onChange={onChange} />;
}

export function TabButton({ id, label, isActive, onClick }) {
  return (
    <button
      className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
      onClick={() => onClick(id)}
    >
      {label}
    </button>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className={styles.successBanner}>
      <span>✅</span>
      <span>{message}</span>
    </div>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className={styles.errorMessage}>
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}

export function SectionHeader({ title, description }) {
  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {description && <p className={styles.formDescription}>{description}</p>}
    </div>
  );
}

export function SubmitButton({ isSaving, label, savingLabel }) {
  return (
    <div className={styles.formActions}>
      <PrimaryButton
        type="submit"
        className={styles.btnPrimary}
        disabled={isSaving}
        pill
      >
        {isSaving ? savingLabel : label}
      </PrimaryButton>
    </div>
  );
}

export function FormInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  required,
  name,
  maxLength,
}) {
  const remaining = maxLength ? maxLength - value.length : null;
  return (
    <FormField
      className={styles.formGroup}
      htmlFor={id}
      label={
        <>
          {label}
          {maxLength && (
            <span style={{ color: "var(--muted)", fontSize: "0.9em", marginLeft: "5px" }}>
              ({remaining} characters remaining)
            </span>
          )}
        </>
      }
    >
      <TextInput
        type={type}
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
      />
    </FormField>
  );
}

export function FormSelect({ id, label, value, onChange, options, grouped }) {
  const handleChange = (val) => onChange({ target: { value: val } });
  return (
    <FormField className={styles.formGroup} htmlFor={id} label={label}>
      <AnimatedDropdown
        value={value}
        onChange={handleChange}
        options={options}
        grouped={grouped}
        placeholder="Select"
        searchable={grouped}
      />
    </FormField>
  );
}

/**
 * Theme selection cards with mini UI preview mockups.
 *
 * @param {object} props
 * @param {"light"|"dark"} props.value
 * @param {Function} props.onChange
 */
export function ThemeSelector({ value, onChange }) {
  return (
    <div className={styles.themeSelector}>
      {[
        { id: "light", label: "Light" },
        { id: "dark",  label: "Dark" },
      ].map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`${styles.themeOption} ${value === opt.id ? styles.active : ""}`}
          onClick={() => onChange(opt.id)}
        >
          <div className={`${styles.themePreview} ${opt.id === "light" ? styles.themePreviewLight : styles.themePreviewDark}`}>
            <div className={styles.themePreviewBar} />
            <div className={styles.themePreviewLine} />
            <div className={`${styles.themePreviewLine} ${styles.themePreviewLineShort}`} />
          </div>
          <div className={styles.themeOptionFooter}>
            <span className={styles.themeLabel}>{opt.label}</span>
            <span className={styles.themeCheckmark}>
              {value === opt.id && "✓"}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
