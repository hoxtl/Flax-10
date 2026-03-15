/**
 * Account settings form for personal information (name, email, year, course).
 * Teacher role management has moved to the Academic tab.
 */
import { useState, useEffect } from "react";
import { getUserProfile } from "../../api/userService";
import { getMyCourseChangeRequest, requestCourseChange, cancelCourseChangeRequest } from "../../api/adminApi";
import { KCL_DEPARTMENTS } from "../../lib/kclCourses";
import { FormInput, FormSelect, SectionHeader, SubmitButton } from "./SettingsUI";
import StandardModal from "../common/StandardModal/StandardModal";
import AnimatedDropdown from "../common/AnimatedDropdown/AnimatedDropdown";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import RequestStatusCard from "../common/RequestStatusCard/RequestStatusCard";
import styles from "../../pages/Settings/Settings.module.css";

const COURSE_REQUEST_CACHE_KEY = "course_change_pending_request";

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

function normaliseCourseRequest(data) {
  if (!data) return null;
  const raw = Array.isArray(data)
    ? data.find((item) => String(item?.status || item?.request_status || "").toLowerCase() === "pending") || data[0]
    : data;
  if (!raw || typeof raw !== "object") return null;
  const status = String(raw.status || raw.request_status || "").toLowerCase();
  const requested_course =
    raw.requested_course ||
    raw.requestedCourse ||
    raw.new_course ||
    raw.desired_course ||
    "";
  return {
    ...raw,
    status,
    requested_course,
  };
}

function getCachedPendingRequest() {
  try {
    const cached = localStorage.getItem(COURSE_REQUEST_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (!parsed?.requested_course) return null;
    return {
      status: "pending",
      requested_course: parsed.requested_course,
    };
  } catch (_) {
    return null;
  }
}

function setCachedPendingRequest(requestedCourse) {
  try {
    localStorage.setItem(
      COURSE_REQUEST_CACHE_KEY,
      JSON.stringify({ requested_course: requestedCourse, created_at: Date.now() }),
    );
  } catch (_) {}
}

function clearCachedPendingRequest() {
  try {
    localStorage.removeItem(COURSE_REQUEST_CACHE_KEY);
  } catch (_) {}
}

function useAccountForm(user) {
  const initialData = getInitialData(user);
  const [formData, setFormData] = useState(initialData);
  const [initialFormData, setInitialFormData] = useState(initialData);
  const [currentCourse, setCurrentCourse] = useState(user?.major || "");
  const [pendingRequest, setPendingRequest] = useState(null);

  useEffect(() => {
    getUserProfile()
      .then((data) => {
        const nextYear = data?.year || "";
        setFormData((prev) => ({ ...prev, year: nextYear || prev.year }));
        setInitialFormData((prev) => ({ ...prev, year: nextYear || prev.year }));
        if (data?.major !== undefined) setCurrentCourse(data.major || "");
      })
      .catch(() => {});

    getMyCourseChangeRequest()
      .then((data) => {
        const req = normaliseCourseRequest(data);
        if (!req) {
          setPendingRequest(getCachedPendingRequest());
          return;
        }
        if (req.status === "pending") {
          setPendingRequest(req);
          if (req.requested_course) setCachedPendingRequest(req.requested_course);
          return;
        }
        clearCachedPendingRequest();
        setPendingRequest(null);
      })
      .catch(() => {
        setPendingRequest(getCachedPendingRequest());
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return {
    formData,
    initialFormData,
    setInitialFormData,
    handleChange,
    currentCourse,
    pendingRequest,
    setPendingRequest,
  };
}

function PersonalInfoFields({ formData, onChange }) {
  return (
    <>
      <div className={styles.formRow}>
        <FormInput id="firstName" name="firstName" label="First Name" value={formData.firstName} onChange={onChange} required />
        <FormInput id="lastName" name="lastName" label="Last Name" value={formData.lastName} onChange={onChange} required />
      </div>
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
    if (!reason.trim()) {
      setError("Please tell us why you want to change course.");
      return;
    }
    if (!selectedCourse) { setError("Please select a course."); return; }
    setSubmitting(true);
    setError("");
    try {
      const result = await requestCourseChange(selectedCourse);
      onSuccess(result, selectedCourse);
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
      backdropClassName={styles.modalBlurBackdrop}
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>
            Why do you want to change?
            <span className={styles.requiredAsterisk} aria-hidden="true"> *</span>
          </label>
          <textarea
            className={styles.modalTextarea}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us a bit about why you'd like to switch..."
            rows={3}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>
            Desired course
            <span className={styles.requiredAsterisk} aria-hidden="true"> *</span>
          </label>
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

function CourseDisplay({ course, pendingRequest, onRequestClick, onCancelRequest, cancellingRequest, successMessage }) {
  return (
    <div className={styles.formGroup}>
      <label>Course</label>
      <div className={styles.lockedCourse}>
        {course ? course : <em>No course set</em>}
      </div>
      {pendingRequest ? (
        <div style={{ marginTop: 8 }}>
          <RequestStatusCard
            icon="⏳"
            title="Course change request pending"
            subtitle={
              <>
                An admin will review your request shortly.
                {pendingRequest.requested_course ? <> &middot; <em>{pendingRequest.requested_course}</em></> : null}
              </>
            }
            onCancel={onCancelRequest}
            cancelling={cancellingRequest}
            successMessage={successMessage}
          />
        </div>
      ) : (
        <button type="button" className={styles.courseChangeLink} onClick={onRequestClick}>
          Request a course change &rarr;
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
  const {
    formData,
    initialFormData,
    setInitialFormData,
    handleChange,
    currentCourse,
    pendingRequest,
    setPendingRequest,
  } = useAccountForm(user);
  const [showModal, setShowModal] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const [courseRequestNotice, setCourseRequestNotice] = useState(() =>
    getCachedPendingRequest() ? "Request sent." : "",
  );
  const [saveSignal, setSaveSignal] = useState(0);

  const hasUnsaved =
    formData.firstName !== initialFormData.firstName ||
    formData.lastName !== initialFormData.lastName ||
    formData.email !== initialFormData.email ||
    formData.year !== initialFormData.year;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasUnsaved) return;
    const ok = await onSave(formData);
    if (ok) {
      setInitialFormData(formData);
      setSaveSignal((s) => s + 1);
    }
  };

  const handleCancelCourseRequest = async () => {
    setCancellingRequest(true);
    try {
      await cancelCourseChangeRequest();
      clearCachedPendingRequest();
      setPendingRequest(null);
      setCourseRequestNotice("");
    } catch {
      // keep silent here to avoid noisy UX in account card; request remains visible if cancel fails
    } finally {
      setCancellingRequest(false);
    }
  };

  const handleCourseRequestSuccess = (result, selectedCourse) => {
    const req = normaliseCourseRequest(result) || {
      status: "pending",
      requested_course: selectedCourse || "",
    };
    const courseName = req.requested_course || selectedCourse || "";
    if (courseName) setCachedPendingRequest(courseName);
    setPendingRequest({ ...req, status: "pending", requested_course: courseName });
    setShowModal(false);
    setCourseRequestNotice("Request sent.");
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
              onCancelRequest={handleCancelCourseRequest}
              cancellingRequest={cancellingRequest}
              successMessage={courseRequestNotice ? `✓ ${courseRequestNotice}` : null}
            />
            <SubmitButton
              isSaving={isSaving}
              label="Save Changes"
              savingLabel="Saving..."
              hasUnsaved={hasUnsaved}
              saveSignal={saveSignal}
            />
          </div>
        </div>
        <div className={styles.contextCard}>
          <span className={styles.contextCardEmoji}>🧾</span>
          <h3 className={styles.contextCardTitle}>Account setup</h3>
          <p className={styles.contextCardBody}>
            Keep your profile updated for a personalised experience.
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
          onSuccess={handleCourseRequestSuccess}
        />
      )}
    </form>
  );
}
