import { useState, useEffect } from "react";
import { getUserProfile } from "../../api/userService";
import { requestTeacherRole } from "../../api/adminApi";
import { KCL_DEPARTMENTS } from "../../lib/kclCourses";
import {
  FormInput,
  FormSelect,
  SectionHeader,
  SubmitButton,
} from "./SettingsUI";
import styles from "../../pages/Settings/Settings.module.css";

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
  return ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"].map((y) => ({
    value: y,
    label: y,
  }));
}

function getCourseOptions() {
  return Object.entries(KCL_DEPARTMENTS).map(([dept, courses]) => ({
    label: dept,
    options: courses.map((c) => ({ value: c, label: c })),
  }));
}

function CourseLabel() {
  return <label className={styles.courseLabel}>Course</label>;
}

function LockedCourseField({ major }) {
  return (
    <div className={styles.courseWrap}>
      <CourseLabel />
      <div className={styles.lockedCourse}>{major}</div>
      <p className={styles.courseHint}>
        🔒 Course cannot be changed after initial setup.
      </p>
    </div>
  );
}

function EditableCourseField({ value, onChange }) {
  return (
    <div className={styles.courseWrap}>
      <CourseLabel />
      <FormSelect
        id="major"
        name="major"
        label=""
        value={value}
        onChange={onChange}
        options={getCourseOptions()}
        grouped={true}
      />
      <p className={styles.courseHint}>
        ⚠️ Choose carefully — this cannot be changed later.
      </p>
    </div>
  );
}

function syncRoleToStorage(role) {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);
    if (u.role !== role) {
      u.role = role;
      localStorage.setItem("user", JSON.stringify(u));
      window.dispatchEvent(new Event("auth-changed"));
    }
  } catch (_) {}
}

function useAccountForm(user) {
  const [formData, setFormData] = useState(getInitialData(user));
  const [liveRole, setLiveRole] = useState(user?.role || "student");

  useEffect(() => {
    getUserProfile()
      .then((data) => {
        setFormData((prev) => ({
          ...prev,
          year: data?.year || prev.year,
          major: data?.major || prev.major,
        }));
        if (data?.role) {
          setLiveRole(data.role);
          syncRoleToStorage(data.role);
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return { formData, handleChange, liveRole };
}

function PersonalInfoFields({ formData, onChange }) {
  return (
    <>
      <FormInput
        id="firstName"
        name="firstName"
        label="First Name"
        value={formData.firstName}
        onChange={onChange}
        required
      />
      <FormInput
        id="lastName"
        name="lastName"
        label="Last Name"
        value={formData.lastName}
        onChange={onChange}
        required
      />
      <FormInput
        id="email"
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={onChange}
        required
      />
    </>
  );
}

function CourseRow({ formData, onChange }) {
  return (
    <div className={styles.formRow}>
      <FormSelect
        id="year"
        label="Year"
        value={formData.year}
        onChange={onChange}
        options={getYearOptions()}
      />
      {formData.major ? (
        <LockedCourseField major={formData.major} />
      ) : (
        <EditableCourseField value={formData.major} onChange={onChange} />
      )}
    </div>
  );
}

function TeacherBadge() {
  return (
    <div className={styles.teacherBadge}>
      <span className={styles.teacherBadgeIcon}>🎓</span>
      <div>
        <strong>You are a Teacher</strong>
        <p className={styles.teacherBadgeSub}>
          You have access to module creation and teacher features.
        </p>
      </div>
    </div>
  );
}

function TeacherPending() {
  return (
    <div className={styles.teacherPending}>
      <span>⏳</span>
      <div>
        <strong>Teacher Request Pending</strong>
        <p className={styles.teacherBadgeSub}>
          An admin will review your request shortly.
        </p>
      </div>
    </div>
  );
}

function useTeacherRequest() {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");

  const handleRequest = async () => {
    setStatus("loading");
    try {
      const res = await requestTeacherRole();
      setMessage(res?.message || "Request submitted!");
      setStatus("done");
      syncRoleToStorage("pending_teacher");
    } catch (e) {
      setMessage(e.message || "Request failed.");
      setStatus("error");
    }
  };

  return { status, message, handleRequest };
}

function TeacherRequestButton({ onRequest, status, message }) {
  return (
    <div className={styles.teacherRequest}>
      <div>
        <strong>Become a Teacher</strong>
        <p className={styles.teacherBadgeSub}>
          Teachers can create and manage modules. Submit a request for admin
          approval.
        </p>
      </div>
      {status === "done" ? (
        <span className={styles.teacherSuccess}>{message}</span>
      ) : (
        <button
          type="button"
          className={styles.teacherBtn}
          onClick={onRequest}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Requesting…" : "🎓 Request Teacher Role"}
        </button>
      )}
      {status === "error" && <p className={styles.teacherError}>{message}</p>}
    </div>
  );
}

function TeacherRoleSection({ role }) {
  const { status, message, handleRequest } = useTeacherRequest();
  return (
    <div className={styles.teacherSection}>
      <SectionHeader title="Role" />
      {role === "teacher" && <TeacherBadge />}
      {role === "pending_teacher" && <TeacherPending />}
      {role === "student" && (
        <TeacherRequestButton
          onRequest={handleRequest}
          status={status}
          message={message}
        />
      )}
    </div>
  );
}

export default function AccountForm({ user, onSave, isSaving }) {
  const { formData, handleChange, liveRole } = useAccountForm(user);
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader title="Personal Information" />
      <PersonalInfoFields formData={formData} onChange={handleChange} />
      <CourseRow formData={formData} onChange={handleChange} />
      <TeacherRoleSection role={liveRole} />
      <SubmitButton
        isSaving={isSaving}
        label="Save Changes"
        savingLabel="Saving..."
      />
    </form>
  );
}
