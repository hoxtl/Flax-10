import SectionSkeleton from "../Common/LoadingState/SectionSkeleton";
import TeacherApplyModal from "./course/TeacherApplyModal";
import TeacherRoleContent from "./course/TeacherRoleContent";
import useTeacherRoleSection from "./course/useTeacherRoleSection";
import styles from "../../pages/Settings/Settings.module.css";

function TeacherRoleSection() {
  const section = useTeacherRoleSection();
  if (section.loading) return <SectionSkeleton label="Loading role info" rows={1} />;
  const liveRole = section.profile?.role;

  return (
    <>
      <TeacherRoleContent section={section} liveRole={liveRole} />
      {section.showModal ? <TeacherApplyModal onClose={() => section.setShowModal(false)} onSuccess={section.handleApplySuccess} /> : null}
    </>
  );
}

export default function CourseChangePanel({ user }) {
  return (
    <div className={styles.form}>
      <TeacherRoleSection />
    </div>
  );
}
