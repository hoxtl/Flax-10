import { useState, useEffect } from "react";
import { getUserProfile } from '../../api/userService';
import { KCL_DEPARTMENTS } from "../../lib/kclCourses";
import { FormInput, FormSelect, SectionHeader, SubmitButton } from "./SettingsUI";
import styles from "../../pages/Settings/Settings.module.css";

function getInitialData(user) {
  return { firstName: user?.first_name || "", lastName: user?.last_name || "", email: user?.email || "", year: user?.year || "", major: user?.major || "" };
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

const lockedStyle = { padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--search-bg)', color: 'var(--muted)', fontSize: '0.95rem' };
const wrapStyle = { display: 'flex', flexDirection: 'column', flex: 1 };
const labelStyle = { fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' };
const hintStyle = { fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' };

function CourseLabel({ children }) {
  return <label style={labelStyle}>Course</label>;
}

function LockedCourseField({ major }) {
  return (
    <div style={wrapStyle}>
      <CourseLabel />
      <div style={lockedStyle}>{major}</div>
      <p style={hintStyle}>🔒 Course cannot be changed after initial setup.</p>
    </div>
  );
}

function EditableCourseField({ value, onChange }) {
  return (
    <div style={wrapStyle}>
      <CourseLabel />
      <FormSelect id="major" name="major" label="" value={value} onChange={onChange} options={getCourseOptions()} grouped={true} />
      <p style={hintStyle}>⚠️ Choose carefully — this cannot be changed later.</p>
    </div>
  );
}

function useAccountForm(user) {
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
  return { formData, handleChange };
}

function PersonalInfoFields({ formData, onChange }) {
  return (
    <>
      <FormInput id="firstName" name="firstName" label="First Name" value={formData.firstName} onChange={onChange} required autoComplete="given-name" />
      <FormInput id="lastName" name="lastName" label="Last Name" value={formData.lastName} onChange={onChange} required autoComplete="family-name" />
      <FormInput id="email" label="Email Address" type="email" value={formData.email} onChange={onChange} required autoComplete="email" />
    </>
  );
}

function CourseRow({ formData, onChange }) {
  return (
    <div className={styles.formRow}>
      <FormSelect id="year" label="Year" value={formData.year} onChange={onChange} options={getYearOptions()} />
      {formData.major
        ? <LockedCourseField major={formData.major} />
        : <EditableCourseField value={formData.major} onChange={onChange} />
      }
    </div>
  );
}

export default function AccountForm({ user, onSave, isSaving }) {
  const { formData, handleChange } = useAccountForm(user);
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader title="Personal Information" />
      <PersonalInfoFields formData={formData} onChange={handleChange} />
      <CourseRow formData={formData} onChange={handleChange} />
      <SubmitButton isSaving={isSaving} label="Save Changes" savingLabel="Saving..." />
    </form>
  );
}