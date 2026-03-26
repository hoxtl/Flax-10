/*
 * Course display and request-status UI for the account form.
 */
<<<<<<< HEAD

import styles from "../../../pages/settings/Settings.module.css";
import RequestStatusCard from "../../common/request_status_card/RequestStatusCard";
=======
import styles from "../../../pages/Settings/Settings.module.css";
import RequestStatusCard from "../../common/RequestStatusCard/RequestStatusCard";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

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

<<<<<<< HEAD
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
=======
export default function CourseDisplay(props) {
  const { course, pendingRequest, onRequestClick, onCancelRequest, cancellingRequest, successMessage } = props;
  return <CourseDisplayContent course={course} pendingRequest={pendingRequest} onRequestClick={onRequestClick} onCancelRequest={onCancelRequest} cancellingRequest={cancellingRequest} successMessage={successMessage} />;
}

function CourseDisplayContent(props) {
  const { course, pendingRequest, onRequestClick, onCancelRequest, cancellingRequest, successMessage } = props;
  return <CourseDisplayCard course={course} pendingRequest={pendingRequest} onRequestClick={onRequestClick} onCancelRequest={onCancelRequest} cancellingRequest={cancellingRequest} successMessage={successMessage} />;
}

function CourseDisplayCard({ course, pendingRequest, onRequestClick, onCancelRequest, cancellingRequest, successMessage }) {
  return <div className={styles.formGroup}><label>Course</label><div className={styles.lockedCourse}>{course ? <em>{course}</em> : <em>No course set</em>}</div>{pendingRequest ? <PendingCourseRequest pendingRequest={pendingRequest} onCancelRequest={onCancelRequest} cancellingRequest={cancellingRequest} successMessage={successMessage} /> : <RequestButton onRequestClick={onRequestClick} />}</div>;
}

function PendingCourseRequest({ pendingRequest, onCancelRequest, cancellingRequest, successMessage }) {
  return <div style={{ marginTop: 8 }}><RequestStatusCard icon="⏳" title="Course change request pending" subtitle={<PendingRequestSubtitle requestedCourse={pendingRequest.requested_course} />} onCancel={onCancelRequest} cancelling={cancellingRequest} successMessage={successMessage} /></div>;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
