/**
 * Account settings form for personal information (name, email, year, course).
 * Teacher role management has moved to the Academic tab.
 */
import { useState, useEffect } from "react";
import { getUserProfile } from "../../api/userService";
import { getMyCourseChangeRequest, requestCourseChange } from "../../api/adminApi";
import { KCL_DEPARTMENTS } from "../../lib/kclCourses";
import { FormInput, FormSelect, SectionHeader, SubmitButton } from "./SettingsUI";
import StandardModal from "../common/StandardModal/StandardModal";
import AnimatedDropdown from "../common/AnimatedDropdown/AnimatedDropdown";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import styles from "../../pages/Settings/Settings.module.css";

const groupedCourses = Object.entries(KCL_DEPARTMENTS).map(([dept, courses]) => ({
  label: dept,
  options: courses.map((c) => ({ value: c, label: c })),
}));

function getInitialData(user) {
  return {
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    year: user?.year || "",
  };
}

function getYearOptions() {
  return ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"].map((y) => ({
    value: y,
    label: y,
  }));
}

function useAccountForm(user) {
  const [formData, setFormData] = useState(getInitialData(user));
  const [currentCourse, setCurrentCourse] = useState(user?.major || "");
  const [pendingRequest, setPendingRequest] = useState(null);

  useEffect(() => {
    getUserProfile()
      .then((data) => {
        setFormData((prev) => ({ ...prev, year: data?.year || prev.year }));
        if (data?.major !== undefined) setCurrentCourse(data.major || "");
      })
      .catch(() => {});

    getMyCourseChangeRequest()
      .then((data) => { if (data?.status === "pending") setPendingRequest(data); })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return { formData, handleChange, currentCourse, pendingRequest, setPendingRequest };
}

function PersonalInfoFields({ formData, onChange }) {
  return (
    <>
      <FormInput id="firstName" name="firstName" label="First Name" value={formData.firstName} onChange={onChange} required />
      <FormInput id="lastName" name="lastName" label="Last Name" value={formData.lastName} onChange={onChange} required />
      <FormInput id="email" label="Email Address" type="email" value={formData.email} onChange={onChange} required />
    </>
  );
}

function CourseChangeModal({ onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) { setError("Please select a course."); return; }
    setSubmitting(true);
    setError("");
    try {
      const result = await requestCourseChange(selectedCourse);
      onSuccess(result);
    } catch (err) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StandardModal
      title="Request Course Change"
      subtitle="Your request will be reviewed by an admin"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Why do you want to change?</label>
          <textarea
            className={styles.modalTextarea}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us a bit about why you'd like to switch..."
            rows={3}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Desired course</label>
          <AnimatedDropdown
            value={selectedCourse}
            onChange={setSelectedCourse}
            options={groupedCourses}
            grouped
            searchable
            usePortal
            placeholder="Search for a course..."
            searchPlaceholder="Type to search courses"
            emptyMessage="No courses found"
            menuMaxHeight={220}
          />
        </div>
        <div className={styles.modalWarning}>
          <span className={styles.modalWarningIcon}>⚠️</span>
          <span>Your request may be <strong>accepted or rejected</strong>. You'll be notified once a decision is made.</span>
        </div>
        {error && <div className={styles.teacherError} role="alert">{error}</div>}
        <div className={styles.formActions}>
          <PrimaryButton type="submit" disabled={submitting} pill>
            {submitting ? "Submitting…" : "Submit Request"}
          </PrimaryButton>
        </div>
      </form>
    </StandardModal>
  );
}

function CourseDisplay({ course, pendingRequest, onRequestClick }) {
  return (
    <div className={styles.formGroup}>
      <label>Course</label>
      <div className={styles.lockedCourse}>
        {course ? course : <em>No course set</em>}
      </div>
      {pendingRequest ? (
        <div className={styles.courseChangePending}>
          <span>⏳</span>
          <span>Awaiting admin approval · <em>{pendingRequest.requested_course}</em></span>
        </div>
      ) : (
        <button type="button" className={styles.courseChangeLink} onClick={onRequestClick}>
          Request a course change →
        </button>
      )}
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} props.user - Authenticated user object
 * @param {Function} props.onSave
 * @param {boolean} props.isSaving
 */
export default function AccountForm({ user, onSave, isSaving }) {
  const { formData, handleChange, currentCourse, pendingRequest, setPendingRequest } = useAccountForm(user);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader
        title="Personal Information"
        description="Your profile details and current degree are shown everywhere across the app 👋"
      />
      <div className={styles.twoColLayout}>
        <div>
          <div className={styles.settingsTile}>
            <PersonalInfoFields formData={formData} onChange={handleChange} />
            <div className={styles.formRow}>
              <FormSelect
                id="year"
                label="Year"
                value={formData.year}
                onChange={(e) => handleChange({ target: { name: "year", value: e.target.value } })}
                options={getYearOptions()}
              />
            </div>
            <CourseDisplay
              course={currentCourse}
              pendingRequest={pendingRequest}
              onRequestClick={() => setShowModal(true)}
            />
            <SubmitButton isSaving={isSaving} label="Save Changes" savingLabel="Saving..." />
          </div>
        </div>
        <div className={styles.contextCard}>
          <span className={styles.contextCardEmoji}>🧾</span>
          <h3 className={styles.contextCardTitle}>Account setup</h3>
          <p className={styles.contextCardBody}>
            Keep your profile updated so StudyFlax can personalise your modules, reminders and timetable flow.
          </p>
          <ul className={styles.contextCardList}>
            <li>Accurate first and last name for your timetable display</li>
            <li>Correct year and course for relevant recommendations</li>
            <li>Email helps with secure access and notifications</li>
          </ul>
        </div>
      </div>
      {showModal && (
        <CourseChangeModal
          onClose={() => setShowModal(false)}
          onSuccess={(result) => { setPendingRequest(result); setShowModal(false); }}
        />
      )}
    </form>
  );
}
