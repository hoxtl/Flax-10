/**
 * Academic panel — course change requests and teacher role management.
 */
import { useState, useEffect } from "react";
import { KCL_DEPARTMENTS } from "../../lib/kclCourses";
import {
  requestCourseChange,
  getMyCourseChangeRequest,
  cancelCourseChangeRequest,
  requestTeacherRole,
  cancelTeacherRoleRequest,
} from "../../api/adminApi";
import { useAuth } from "../../context/AuthContext";
import AnimatedDropdown from "../common/AnimatedDropdown/AnimatedDropdown";
import InlineAlert from "../common/InlineAlert/InlineAlert";
import { SectionHeader } from "./SettingsUI";
import StandardModal from "../common/StandardModal/StandardModal";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import RequestStatusCard from "../common/RequestStatusCard/RequestStatusCard";
import SectionSkeleton from "../common/LoadingState/SectionSkeleton";
import styles from "../../pages/Settings/Settings.module.css";

const groupedCourses = Object.entries(KCL_DEPARTMENTS).map(([dept, courses]) => ({
  label: dept,
  options: courses.map((c) => ({ value: c, label: c })),
}));

const TEACHER_REQUEST_CACHE_KEY = "teacher_request_pending";

function getCachedTeacherRequest() {
  try {
    return localStorage.getItem(TEACHER_REQUEST_CACHE_KEY) === "true";
  } catch (_) {
    return false;
  }
}

function setCachedTeacherRequest() {
  try { localStorage.setItem(TEACHER_REQUEST_CACHE_KEY, "true"); } catch (_) {}
}

function clearCachedTeacherRequest() {
  try { localStorage.removeItem(TEACHER_REQUEST_CACHE_KEY); } catch (_) {}
}


function CourseChangeSection() {
  const { profile, loading: authLoading, refreshProfile } = useAuth();
  const [existingRequest, setExistingRequest] = useState(null);
  const [currentCourse, setCurrentCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showApproved, setShowApproved] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    if (authLoading) return;

    getMyCourseChangeRequest()
      .then((req) => {
      if (isCancelled) return;
      setExistingRequest(req || null);
      setCurrentCourse(req?.current_course || profile?.major || "Not set");
      if (req?.status === "approved") {
        const key = `ccr_approved_seen_${req.id}`;
        if (localStorage.getItem(key)) {
          setShowApproved(false);
        } else {
          localStorage.setItem(key, "true");
          setTimeout(() => setShowApproved(false), 5000);
        }
      }
    }).finally(() => { if (!isCancelled) setLoading(false); });
    return () => { isCancelled = true; };
  }, [profile, authLoading]);

  const isPending = existingRequest?.status === "pending";
  const isApproved = existingRequest?.status === "approved" && showApproved;
  const isRejected = existingRequest?.status === "rejected";
  const showForm = !loading && (!existingRequest || isRejected || (existingRequest?.status === "approved" && !showApproved));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!selectedCourse) { setError("Please select a course."); return; }
    setSubmitting(true);
    try {
      const result = await requestCourseChange(selectedCourse);
      setExistingRequest(result);
      setSelectedCourse("");
      setSuccess("Course change request submitted.");
    } catch (err) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true); setError("");
    try {
      await cancelCourseChangeRequest();
      setExistingRequest(null);
    } catch (e) {
      setError(e.message || "Failed to cancel.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <SectionSkeleton label="Loading course info" rows={2} />;

  return (
    <div className={styles.academicSection}>
      <SectionHeader
        title="Course Change"
        description="Switching degrees? Drop a request and an admin will take it from there 📋"
      />

      <div className={styles.twoColLayout}>
        <div className={styles.academicSectionInner}>
          <div className={styles.currentCourseRow}>
            <div className={styles.currentCourseInfo}>
              <span className={styles.currentCourseLabel}>Current course</span>
              <span className={styles.currentCourseName}>{currentCourse}</span>
            </div>

            {isPending && (
              <div className={styles.statusTagActionRow}>
                <span className={`${styles.statusTag} ${styles.statusTagPending}`}>
                  ⏳ Change pending · <em className={styles.fieldMeta}>{existingRequest.requested_course}</em>
                </span>
                <button type="button" className={styles.cancelRequestBtn} disabled={cancelling} onClick={handleCancel}>
                  {cancelling ? "Cancelling…" : "Cancel"}
                </button>
              </div>
            )}

            {isApproved && (
              <span className={`${styles.statusTag} ${styles.statusTagSuccess}`}>
                ✅ Approved · <em className={styles.fieldMeta}>{existingRequest.requested_course}</em>
              </span>
            )}
          </div>

          <InlineAlert
            message={isRejected ? `Request to change to ${existingRequest.requested_course} was rejected. Submit a new one below.` : null}
            variant="error"
          />

          <InlineAlert message={error} variant="error" />

          {showForm && (
            <form onSubmit={handleSubmit}>
              <div className={styles.changeRequestArea}>
                <div className={styles.changeRequestLabel}>Request a different course</div>
                <AnimatedDropdown
                  value={selectedCourse}
                  onChange={setSelectedCourse}
                  options={groupedCourses}
                  grouped
                  searchable
                  placeholder="Search for a course..."
                  searchPlaceholder="Type to search courses"
                  emptyMessage="No courses found"
                  menuMaxHeight={260}
                />
                <InlineAlert message={success} variant="success" />
                <div className={`${styles.formActions} ${styles.formActionsPadded}`}>
                  <PrimaryButton type="submit" disabled={submitting} pill>
                    {submitting ? "Submitting…" : "Submit Request"}
                  </PrimaryButton>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className={styles.contextCard}>
          <span className={styles.contextCardEmoji}>📋</span>
          <h3 className={styles.contextCardTitle}>Why request a change?</h3>
          <p className={styles.contextCardBody}>
            Updating your course helps us personalise your deadlines, module recommendations, and schedule.
          </p>
          <ul className={styles.contextCardList}>
            <li>Tailored module suggestions</li>
            <li>Correct deadline calendar</li>
            <li>Accurate lecturer links</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function TeacherApplyModal({ onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError("Please tell us why you'd like to become a teacher."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await requestTeacherRole(reason);
      onSuccess(res);
    } catch (err) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StandardModal
      title="Apply for Teacher Role"
      subtitle="Tell us why you'd like to teach"
      onClose={onClose}
      backdropClassName={styles.modalBlurBackdrop}
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>
            Why should you be a teacher?
            <span aria-hidden="true"> *</span>
          </label>
          <textarea
            className={styles.modalTextarea}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us about your teaching experience, expertise, or why you'd like to create modules..."
            rows={4}
            required
            aria-required="true"
          />
        </div>
        <div className={styles.modalWarning}>
          <span className={styles.modalWarningIcon}>⚠️</span>
          <span>Your request may be <strong>accepted or rejected</strong>. You'll be notified once a decision is made.</span>
        </div>
        <InlineAlert message={error} variant="error" />
        <div className={styles.formActions}>
          <PrimaryButton type="submit" disabled={submitting} pill>
            {submitting ? "Submitting…" : "Submit Application"}
          </PrimaryButton>
        </div>
      </form>
    </StandardModal>
  );
}

function TeacherRoleSection() {
  const { profile, loading: authLoading, refreshProfile } = useAuth();
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [teacherNotice, setTeacherNotice] = useState(() =>
    getCachedTeacherRequest() ? "Request sent." : "",
  );

  useEffect(() => {
    if (!authLoading && profile?.role === "pending_teacher") {
      setCachedTeacherRequest();
      setTeacherNotice("Request sent.");
    }
  }, [profile, authLoading]);

  const handleApplySuccess = (res) => {
    setMessage(res?.message || "Request submitted!");
    setStatus("done");
    refreshProfile();
    setCachedTeacherRequest();
    setTeacherNotice("Request sent.");
    setShowModal(false);
  };

  const handleCancelTeacher = async () => {
    setCancelling(true);
    try {
      await cancelTeacherRoleRequest();
      refreshProfile();
      setStatus(null);
      clearCachedTeacherRequest();
      setTeacherNotice("");
    } catch (e) {
      setMessage(e.message || "Failed to cancel.");
      setStatus("error");
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading) return <SectionSkeleton label="Loading role info" rows={1} />;

  const liveRole = profile?.role;

  return (
    <div className={styles.academicSection}>
      <SectionHeader title="Role" description="Want to create modules and teach? Apply for teacher access 🎓" />

      <div className={styles.twoColLayout}>
        <div>
          {liveRole === "teacher" && (
            <div className={styles.teacherCard}>
              <div className={styles.teacherCardIcon}>🎓</div>
              <div className={styles.teacherCardBody}>
                <p className={styles.teacherCardTitle}>You're a Teacher</p>
                <p className={styles.teacherCardSub}>You have access to module creation and all teacher features.</p>
              </div>
            </div>
          )}

          {liveRole === "pending_teacher" && (
            <RequestStatusCard
              icon="⏳"
              title="Teacher request pending"
              subtitle="An admin will review your request shortly."
              onCancel={handleCancelTeacher}
              cancelling={cancelling}
              successMessage={teacherNotice ? `✓ ${teacherNotice}` : null}
            />
          )}

          {(liveRole === "student" || (!liveRole && !loading)) && (
            <div className={styles.teacherCard}>
              <div className={styles.teacherCardIcon}>🎓</div>
              <div className={styles.teacherCardBody}>
                <p className={styles.teacherCardTitle}>Become a Teacher</p>
                <p className={styles.teacherCardSub}>Submit a request for admin approval to unlock module creation and teaching tools.</p>
              </div>
              <div className={styles.teacherCardAction}>
                {status === "done" ? (
                  <span className={`${styles.statusTag} ${styles.statusTagSuccess}`}>✓ Requested</span>
                ) : (
                  <PrimaryButton type="button" pill onClick={() => setShowModal(true)}>
                    Apply
                  </PrimaryButton>
                )}
              </div>
            </div>
          )}

          <InlineAlert message={status === "error" ? message : null} variant="error" />
        </div>

        <div className={styles.contextCard}>
          <span className={styles.contextCardEmoji}>🎓</span>
          <h3 className={styles.contextCardTitle}>Teacher access</h3>
          <p className={styles.contextCardBody}>
            Teachers can create modules, set assessments, and manage student groups across KCL.
          </p>
          <ul className={styles.contextCardList}>
            <li>Create & manage modules</li>
            <li>Set deadlines for groups</li>
            <li>View student progress</li>
          </ul>
        </div>
      </div>

      {showModal && (
        <TeacherApplyModal
          onClose={() => setShowModal(false)}
          onSuccess={handleApplySuccess}
        />
      )}
    </div>
  );
}

export default function CourseChangePanel({ user }) {
  return (
    <div className={styles.form}>
      <CourseChangeSection user={user} />
      <TeacherRoleSection />
    </div>
  );
}
