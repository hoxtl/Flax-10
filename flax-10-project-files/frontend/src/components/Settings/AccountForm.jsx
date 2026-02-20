import { useState, useEffect } from "react";
import { getUserProfile } from '../../api/userService';
import { KCL_DEPARTMENTS } from "../../lib/kclCourses";
import { FormInput, FormSelect, SectionHeader, SubmitButton } from "./SettingsUI";
import styles from "../../pages/Settings.module.css";

function getInitialData(user) {
  return {
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    year: user?.year || "",
    major: user?.major || "",
  };
}

function getYearOptions() {
  return ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"].map(y => ({ value: y, label: y }));
}

function getCourseOptions() {
  return Object.entries(KCL_DEPARTMENTS).map(([dept, courses]) => ({
    label: dept,
    options: courses.map(c => ({ value: c, label: c }))
  }));
}

function LockedCourseField({ major }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Course</label>
      <div style={{
        padding: '0.6rem 0.8rem',
        borderRadius: '8px',
        border: '1px solid var(--border, #ddd)',
        background: 'var(--muted-bg, #f5f5f5)',
        color: 'var(--muted)',
        fontSize: '0.95rem',
      }}>
        {major}
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
        🔒 Course cannot be changed after initial setup.
      </p>
    </div>
  );
}

function EditableCourseField({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Course</label>
      <FormSelect id="major" name="major" label="" value={value} onChange={onChange} options={getCourseOptions()} grouped={true} />
      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
        ⚠️ Choose carefully — this cannot be changed later.
      </p>
    </div>
  );
}

export default function AccountForm({ user, onSave, isSaving }) {
  const [formData, setFormData] = useState(getInitialData(user));

  useEffect(() => {
    getUserProfile().then(data => {
      setFormData(prev => ({ ...prev, year: data?.year || "", major: data?.major || "" }));
    }).catch(() => {});
  }, []);

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
      <SectionHeader title="Personal Information" />
      <FormInput id="firstName" name="firstName" label="First Name" value={formData.firstName} onChange={handleChange} required />
      <FormInput id="lastName" name="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} required />
      <FormInput id="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} required />
      <div className={styles.formRow}>
        <FormSelect id="year" label="Year" value={formData.year} onChange={handleChange} options={getYearOptions()} />
        {formData.major
          ? <LockedCourseField major={formData.major} />
          : <EditableCourseField value={formData.major} onChange={handleChange} />
        }
      </div>
      <SubmitButton isSaving={isSaving} label="Save Changes" savingLabel="Saving..." />
    </form>
  );
}