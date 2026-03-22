/*
 * Presentational teacher-role states and actions.
 */
import InlineAlert from "../../Common/InlineAlert/InlineAlert";
import PrimaryButton from "../../Common/PrimaryButton/PrimaryButton";
import RequestStatusCard from "../../Common/RequestStatusCard/RequestStatusCard";
import styles from "../../../pages/Settings/Settings.module.css";
import SettingsContextCard from "../SettingsContextCard";
import { SectionHeader } from "../SettingsUI";

function TeacherCard({ title, subtitle, action }) {
  return (
    <div className={styles.teacherCard}>
      <div className={styles.teacherCardIcon}>🎓</div>
      <div className={styles.teacherCardBody}>
        <p className={styles.teacherCardTitle}>{title}</p>
        <p className={styles.teacherCardSub}>{subtitle}</p>
      </div>
      {action ? <div className={styles.teacherCardAction}>{action}</div> : null}
    </div>
  );
}

function PendingTeacherCard({ section }) {
  return <RequestStatusCard icon="⏳" title="Teacher request pending" subtitle="An admin will review your request shortly." onCancel={section.handleCancelTeacher} cancelling={section.cancelling} successMessage={section.teacherNotice ? `✓ ${section.teacherNotice}` : null} />;
}

function StudentTeacherCard({ section }) {
  const action = section.status === "done"
    ? <span className={`${styles.statusTag} ${styles.statusTagSuccess}`}>✓ Requested</span>
    : <PrimaryButton type="button" pill onClick={() => section.setShowModal(true)}>Apply</PrimaryButton>;
  return <TeacherCard title="Become a Teacher" subtitle="Submit a request for admin approval to unlock module creation and teaching tools." action={action} />;
}

export default function TeacherRoleContent({ section, liveRole }) {
  return (
    <div className={styles.academicSection}>
      <SectionHeader title="Role" description="Want to create modules and teach? Apply for teacher access 🎓" />
      <div className={styles.twoColLayout}>
        <div>
          {liveRole === "teacher" ? <TeacherCard title="You're a Teacher" subtitle="You have access to module creation and all teacher features." /> : null}
          {liveRole === "pending_teacher" ? <PendingTeacherCard section={section} /> : null}
          {liveRole === "student" || !liveRole ? <StudentTeacherCard section={section} /> : null}
          <InlineAlert message={section.status === "error" ? section.message : null} variant="error" />
        </div>
        <SettingsContextCard emoji="🎓" title="Teacher access" body="Teachers can create modules, set assessments, and manage student groups across KCL." items={["Create & manage modules", "Set deadlines for groups", "View student progress"]} />
      </div>
    </div>
  );
}
