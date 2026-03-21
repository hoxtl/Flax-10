/*
 * GroupWork project header metadata.
 */

import { Users, Calendar } from "lucide-react";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import UserModuleDropdown from "../../../components/Modules/UserModuleDropdown";
import styles from "./ProjectHeader.module.css";

export function ProjectHeaderMeta({ project, members, onPatch }) {
  return (
    <div className={styles.headerBody}>
      <ProjectModuleTag project={project} onPatch={onPatch} />
      <div className={styles.metaRow}>
        <ProjectMembersMeta count={members.length} />
        <ProjectDeadlineMeta deadline={project.deadline} onPatch={onPatch} />
      </div>
    </div>
  );
}

function ProjectModuleTag({ project, onPatch }) {
  return (
    <div className={styles.moduleTag}>
      <div className={styles.moduleDot} />
      <UserModuleDropdown value={project.course_code || ""} onChange={(value) => onPatch({ course_code: value })} placeholder="Module" className={styles.headerModuleDropdown} />
    </div>
  );
}

function ProjectMembersMeta({ count }) {
  return <MetaItem icon={<Users size={14} className={styles.metaIcon} />}><span>{count} members</span></MetaItem>;
}

function ProjectDeadlineMeta({ deadline, onPatch }) {
  return (
    <MetaItem icon={<Calendar size={14} className={styles.metaIcon} />}>
      <div className={styles.deadlinePill}>
        <DateTimePicker value={deadline} onChange={(value) => onPatch({ deadline: value })} dateOnly placeholder="dd / mm / yyyy" hideIcon triggerClassName={styles.detailDateTrigger} />
      </div>
    </MetaItem>
  );
}

function MetaItem({ icon, children }) {
  return (
    <div className={styles.metaItem}>
      {icon}
      {children}
    </div>
  );
}
