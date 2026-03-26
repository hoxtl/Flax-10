/*
 * Course display and request-status UI for the account form.
 */

import styles from "../../../pages/settings/Settings.module.css";
import RequestStatusCard from "../../common/request_status_card/RequestStatusCard";

function PendingRequestSubtitle({ requestedCourse }) {
  return (
    <>
      An admin will review your request shortly.
      {requestedCourse ? <> &middot; <em>{requestedCourse}</em></> : null}
    </>
  );
}

function RequestButton({ onRequestClick }) {
  return (
    <button type="button" className={styles.courseChangeLink} onClick={onRequestClick}>
      Request a course change &rarr;
    </button>
  );
}

function PendingCourseRequest({ pendingRequest, onCancelRequest, cancellingRequest, successMessage }) {
  return (
    <div style={{ marginTop: 8 }}>
      <RequestStatusCard icon="⏳" title="Course change request pending" subtitle={<PendingRequestSubtitle requestedCourse={pendingRequest.requested_course} />} onCancel={onCancelRequest} cancelling={cancellingRequest} successMessage={successMessage} />
    </div>
  );
}

export default function CourseDisplay({ course, pendingRequest, onRequestClick, onCancelRequest, cancellingRequest, successMessage }) {
  return (
    <div className={styles.formGroup}>
      <label>Course</label>
      <div className={styles.lockedCourse}>{course ? <em>{course}</em> : <em>No course set</em>}</div>
      {pendingRequest
        ? <PendingCourseRequest pendingRequest={pendingRequest} onCancelRequest={onCancelRequest} cancellingRequest={cancellingRequest} successMessage={successMessage} />
        : <RequestButton onRequestClick={onRequestClick} />}
    </div>
  );
}
