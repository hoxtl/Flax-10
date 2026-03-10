import styles from "../../pages/Settings/Settings.module.css";
import AnimatedDropdown from "../ui/AnimatedDropdown";

export function TabButton({ id, label, isActive, onClick }) {
  return (
    <button className={`${styles.tab} ${isActive ? styles.tabActive : ""}`} onClick={() => onClick(id)}>
      {label}
    </button>
  );
}

export function SettingsTabs({ activeTab, onChange }) {
  const tabs = [
    { id: "account", label: "Account" },
    { id: "security", label: "Security" },
    { id: "preferences", label: "Preferences" },
    { id: "home", label: "Home Address" },
    { id: "sleep", label: "Sleep" },
  ];
  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <TabButton key={tab.id} id={tab.id} label={tab.label} isActive={activeTab === tab.id} onClick={onChange} />
      ))}
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className={styles.successBanner}>
      <span>✅</span><span>{message}</span>
    </div>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className={styles.errorMessage}>
      <span>⚠️</span><span>{message}</span>
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
      <button type="submit" className={styles.btnPrimary} disabled={isSaving}>
        {isSaving ? savingLabel : label}
      </button>
    </div>
  );
}

export function FormInput({ id, label, type = "text", value, onChange, required, name, maxLength }) {
  const remaining = maxLength ? maxLength - value.length : null;
  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>
        {label}
        {maxLength && <span style={{ color: 'var(--muted)', fontSize: '0.9em', marginLeft: '5px' }}>({remaining} characters remaining)</span>}
      </label>
      <input type={type} id={id} name={name || id} value={value} onChange={onChange} required={required} maxLength={maxLength} />
    </div>
  );
}

export function FormSelect({ id, label, value, onChange, options, grouped }) {
  const handleChange = (val) => onChange({ target: { value: val } });
  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>{label}</label>
      <AnimatedDropdown value={value} onChange={handleChange} options={options} grouped={grouped} placeholder="Select" searchable={grouped} />
    </div>
  );
}

export function ThemeSelector({ value, onChange }) {
  return (
    <div className={styles.themeSelector}>
      <button type="button" className={`${styles.themeOption} ${value === 'light' ? styles.active : ''}`} onClick={() => onChange('light')}>
        <span className={styles.themeIcon}>☀️</span>
        <span className={styles.themeLabel}>Light</span>
      </button>
      <button type="button" className={`${styles.themeOption} ${value === 'dark' ? styles.active : ''}`} onClick={() => onChange('dark')}>
        <span className={styles.themeIcon}>🌙</span>
        <span className={styles.themeLabel}>Dark</span>
      </button>
    </div>
  );
}

function ThemeCard({ t, currentTheme, onChange }) {
  const isActive = currentTheme === t.id;
  return (
    <div className={`${styles.themeCard} ${isActive ? styles.active : ''}`} onClick={() => onChange(t.id)}>
      <span className={styles.themeName}>{t.name}</span>
      <div className={styles.themePreviewContainer}>
        {/* Light Preview */}
        <div className={styles.themePreview} style={{ background: t.light.bg, borderColor: t.light.border }}>
          <span className={styles.swatchTitle} style={{ color: t.light.text }}>Light</span>
          <div className={styles.swatchGrid}>
            <div className={styles.swatch} style={{ background: t.light.primary }} />
            <div className={styles.swatch} style={{ background: t.light.highlight }} />
            <div className={styles.swatch} style={{ background: t.light.card }} />
            <div className={styles.swatch} style={{ background: t.light.sidebar }} />
          </div>
        </div>
        {/* Dark Preview */}
        <div className={styles.themePreview} style={{ background: t.dark.bg, borderColor: t.dark.border }}>
          <span className={styles.swatchTitle} style={{ color: t.dark.text }}>Dark</span>
          <div className={styles.swatchGrid}>
            <div className={styles.swatch} style={{ background: t.dark.primary }} />
            <div className={styles.swatch} style={{ background: t.dark.highlight }} />
            <div className={styles.swatch} style={{ background: t.dark.card }} />
            <div className={styles.swatch} style={{ background: t.dark.sidebar }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemeGridSelector({ value, onChange }) {
  const GROUPS = [
    {
      label: '🔥 Warm',
      themes: [
        {
          id: 'flax', name: 'Flax',
          light: { bg: '#F8F5F2', card: '#FFFCFA', sidebar: '#EEEAE4', primary: '#7B6751', highlight: '#C4A35A', border: 'rgba(74,52,33,0.12)', text: '#1A1A1A' },
          dark: { bg: '#1a1310', card: '#241a14', sidebar: '#201812', primary: '#B89B7E', highlight: '#E8DCC8', border: 'rgba(180,155,126,0.18)', text: '#f1f5f9' }
        },
        {
          id: 'sunset', name: 'Sunset',
          light: { bg: '#F9F4F2', card: '#FFFFFF', sidebar: '#F1E6E2', primary: '#C46A5A', highlight: '#E7A095', border: 'rgba(100,50,40,0.12)', text: '#1A1A1A' },
          dark: { bg: '#241C1A', card: '#2D2321', sidebar: '#281F1D', primary: '#E7A095', highlight: '#C46A5A', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
        },
        {
          id: 'terracotta', name: 'Terracotta',
          light: { bg: '#F7F2EF', card: '#FFFFFF', sidebar: '#EFE3DF', primary: '#B65C45', highlight: '#D58C78', border: 'rgba(120,60,40,0.12)', text: '#1A1A1A' },
          dark: { bg: '#231916', card: '#2D201C', sidebar: '#271D1A', primary: '#D58C78', highlight: '#B65C45', border: 'rgba(200,140,120,0.18)', text: '#f1f5f9' }
        },
        {
          id: 'amber', name: 'Amber',
          light: { bg: '#FAF5EF', card: '#FFFFFF', sidebar: '#F1E5D7', primary: '#B57A42', highlight: '#E3B285', border: 'rgba(120,80,30,0.12)', text: '#1A1A1A' },
          dark: { bg: '#1F1A12', card: '#29221A', sidebar: '#241E16', primary: '#E3B285', highlight: '#B57A42', border: 'rgba(200,160,100,0.18)', text: '#f1f5f9' }
        },
      ],
    },
    {
      label: '❄️ Cool',
      themes: [
        {
          id: 'ocean', name: 'Ocean',
          light: { bg: '#F3F7FA', card: '#FFFFFF', sidebar: '#E7EFF5', primary: '#4F6D8A', highlight: '#7FA7C2', border: 'rgba(50,70,90,0.12)', text: '#1A1A1A' },
          dark: { bg: '#1C252E', card: '#242F3A', sidebar: '#202A34', primary: '#7FA7C2', highlight: '#4F6D8A', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
        },
        {
          id: 'indigo', name: 'Indigo',
          light: { bg: '#F3F4FA', card: '#FFFFFF', sidebar: '#E8EBF5', primary: '#4C5D8A', highlight: '#8C9FD1', border: 'rgba(60,70,120,0.12)', text: '#1A1A1A' },
          dark: { bg: '#1C1E2C', card: '#232534', sidebar: '#20222F', primary: '#8C9FD1', highlight: '#4C5D8A', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
        },
        {
          id: 'teal', name: 'Teal',
          light: { bg: '#F2F7F7', card: '#FFFFFF', sidebar: '#E4F0F0', primary: '#3F7C7C', highlight: '#7DB5B5', border: 'rgba(40,90,90,0.12)', text: '#1A1A1A' },
          dark: { bg: '#192526', card: '#1F2E30', sidebar: '#1D2A2B', primary: '#7DB5B5', highlight: '#3F7C7C', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
        },
        {
          id: 'forest', name: 'Forest',
          light: { bg: '#F2F6F3', card: '#FFFFFF', sidebar: '#E6EFE8', primary: '#4E6B57', highlight: '#7FA88C', border: 'rgba(50,80,60,0.12)', text: '#1A1A1A' },
          dark: { bg: '#1A2019', card: '#222822', sidebar: '#1E2420', primary: '#7FA88C', highlight: '#4E6B57', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
        },
      ],
    },
    {
      label: '🌸 Soft',
      themes: [
        {
          id: 'rose', name: 'Rose',
          light: { bg: '#FAF3F5', card: '#FFFFFF', sidebar: '#F3E6EA', primary: '#B86A7A', highlight: '#E2A7B1', border: 'rgba(130,60,80,0.12)', text: '#1A1A1A' },
          dark: { bg: '#241820', card: '#2E202A', sidebar: '#281C26', primary: '#E2A7B1', highlight: '#B86A7A', border: 'rgba(220,160,180,0.15)', text: '#f1f5f9' }
        },
        {
          id: 'lavender', name: 'Lavender',
          light: { bg: '#F5F3F8', card: '#FFFFFF', sidebar: '#ECE7F3', primary: '#6B5C8E', highlight: '#A79BC8', border: 'rgba(70,60,100,0.12)', text: '#1A1A1A' },
          dark: { bg: '#211E27', card: '#2A2632', sidebar: '#25212C', primary: '#A79BC8', highlight: '#6B5C8E', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
        },
        {
          id: 'sage', name: 'Sage',
          light: { bg: '#F3F6F3', card: '#FFFFFF', sidebar: '#E7ECE7', primary: '#6F8F7B', highlight: '#A6C0AE', border: 'rgba(60,80,60,0.12)', text: '#1A1A1A' },
          dark: { bg: '#1E2521', card: '#252E29', sidebar: '#212924', primary: '#A6C0AE', highlight: '#6F8F7B', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
        },
        {
          id: 'sand', name: 'Sand',
          light: { bg: '#F6F3EE', card: '#FFFFFF', sidebar: '#ECE7E0', primary: '#8C7A61', highlight: '#C8B79C', border: 'rgba(100,80,50,0.12)', text: '#1A1A1A' },
          dark: { bg: '#201D18', card: '#28251F', sidebar: '#24211C', primary: '#C8B79C', highlight: '#8C7A61', border: 'rgba(180,160,130,0.18)', text: '#f1f5f9' }
        },
      ],
    },
  ];

  return (
    <div>
      {GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: '24px' }}>
          <p className={styles.groupLabel}>{group.label}</p>
          <div className={styles.themeGrid}>
            {group.themes.map(t => (
              <ThemeCard key={t.id} t={t} currentTheme={value} onChange={onChange} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
