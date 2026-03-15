import { useState, useEffect } from "react";
import { getUserProfile } from "../../api/userService";
import { requestTeacherRole } from "../../api/adminApi";
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
  };
}

function getYearOptions() {
  return ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"].map((y) => ({
    value: y,
    label: y,
  }));
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
  const [currentCourse, setCurrentCourse] = useState(user?.major || "");

  useEffect(() => {
    getUserProfile()
      .then((data) => {
        setFormData((prev) => ({
          ...prev,
          year: data?.year || prev.year,
        }));
        if (data?.role) {
          setLiveRole(data.role);
          syncRoleToStorage(data.role);
        }
        if (data?.major !== undefined) {
          setCurrentCourse(data.major || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return { formData, handleChange, liveRole, currentCourse };
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

function CourseDisplay({ course }) {
  return (
    <div className={styles.formGroup}>
      <label>Course</label>
      <div className={styles.lockedCourse}>
        {course ? course : <em>No course set</em>}
      </div>
      <p className={styles.courseHint}>
        To change your course, go to the <strong>Course Change</strong> tab and
        submit a request for admin approval.
      </p>
    </div>
  );
}

function CourseRow({ formData, onChange }) {
  return (
    <div className={styles.formRow}>
      <FormSelect
        id="year"
        label="Year"
        value={formData.year}
        onChange={(e) =>
          onChange({ target: { name: "year", value: e.target.value } })
        }
        options={getYearOptions()}
      />
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
  const { formData, handleChange, liveRole, currentCourse } =
    useAccountForm(user);
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader title="Personal Information" />
      <PersonalInfoFields formData={formData} onChange={handleChange} />
      <CourseRow formData={formData} onChange={handleChange} />
      <CourseDisplay course={currentCourse} />
      <TeacherRoleSection role={liveRole} />
      <SubmitButton
        isSaving={isSaving}
        label="Save Changes"
        savingLabel="Saving..."
      />
    </form>
  );
}
