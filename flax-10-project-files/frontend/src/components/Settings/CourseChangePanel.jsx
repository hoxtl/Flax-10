import { useState, useEffect } from "react";
import { KCL_DEPARTMENTS } from "../../lib/kclCourses";
import {
  requestCourseChange,
  getMyCourseChangeRequest,
} from "../../api/adminApi";
import styles from "../../pages/Settings/Settings.module.css";

function StatusBadge({ status, requestedCourse, currentCourse }) {
  if (status === "pending") {
    return (
      <div className={styles.teacherPending}>
        <div className={styles.teacherBadge}>
          <span>⏳</span>
          <div>
            <strong>Course change pending</strong>
            <p className={styles.teacherBadgeSub}>
              Requested: <em>{requestedCourse}</em>
              {currentCourse ? ` (from ${currentCourse})` : ""}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className={styles.teacherPending}>
        <div className={styles.teacherBadge}>
          <span>✅</span>
          <div>
            <strong>Course change approved</strong>
            <p className={styles.teacherBadgeSub}>
              Your course has been updated to <em>{requestedCourse}</em>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className={styles.teacherPending}>
        <div className={styles.teacherBadge}>
          <span>❌</span>
          <div>
            <strong>Course change rejected</strong>
            <p className={styles.teacherBadgeSub}>
              Your request to change to <em>{requestedCourse}</em> was rejected.
              You may submit a new request below.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function CourseSelector({ value, onChange }) {
  const allCourses = Object.entries(KCL_DEPARTMENTS).flatMap(
    ([dept, courses]) => courses.map((c) => ({ dept, course: c })),
  );

  return (
    <select
      className={styles.courseSelect}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— Select a course —</option>
      {Object.entries(KCL_DEPARTMENTS).map(([dept, courses]) => (
        <optgroup key={dept} label={dept}>
          {courses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export default function CourseChangePanel({ user }) {
  const [existingRequest, setExistingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showApproved, setShowApproved] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyCourseChangeRequest()
      .then((data) => {
        if (!cancelled) {
          setExistingRequest(data || null);
          setLoading(false);
          if (data?.status === "approved") {
            const key = `ccr_approved_seen_${data.id}`;
            if (localStorage.getItem(key)) {
              setShowApproved(false);
            } else {
              localStorage.setItem(key, "true");
              setTimeout(() => setShowApproved(false), 5000);
            }
          }
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showForm =
    !loading &&
    (!existingRequest ||
      existingRequest.status === "rejected" ||
      existingRequest.status === "approved");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedCourse) {
      setError("Please select a course.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestCourseChange(selectedCourse);
      setExistingRequest(result);
      setSelectedCourse("");
      setSuccess("Your course change request has been submitted.");
    } catch (err) {
      setError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.teacherPending}>
        <p style={{ opacity: 0.6 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>Course Change Request</h2>
      <p className={styles.formDescription}>
        Submit a request to change your registered course. An admin will review
        and approve or reject it.
      </p>

      {existingRequest && existingRequest.status === "pending" && (
        <StatusBadge
          status="pending"
          requestedCourse={existingRequest.requested_course}
          currentCourse={existingRequest.current_course}
        />
      )}

      {existingRequest &&
        existingRequest.status === "approved" &&
        showApproved && (
          <StatusBadge
            status="approved"
            requestedCourse={existingRequest.requested_course}
            currentCourse={existingRequest.current_course}
          />
        )}

      {existingRequest && existingRequest.status === "rejected" && (
        <StatusBadge
          status="rejected"
          requestedCourse={existingRequest.requested_course}
          currentCourse={existingRequest.current_course}
        />
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: "1.2rem" }}>
          <div className={styles.formGroup}>
            <label htmlFor="course-select">Select new course</label>
            <CourseSelector
              value={selectedCourse}
              onChange={setSelectedCourse}
            />
          </div>

          {error && (
            <div className={styles.teacherError} role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className={styles.teacherSuccess} role="status">
              {success}
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
