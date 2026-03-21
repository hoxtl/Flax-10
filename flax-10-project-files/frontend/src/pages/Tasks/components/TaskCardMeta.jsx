/*
 * Task card meta badges for list, module, society, people, and project links.
 */

import { ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

import { getModuleColor } from "../utils/taskCardUtils";

import styles from "./TaskCardMeta.module.css";

function ModulePillLink({ task }) {
  const moduleColours = getModuleColor(task.module_code);
  const moduleId = task.module_id ?? task.module ?? task.moduleId;
  const to = moduleId ? `/modules?moduleId=${moduleId}` : `/modules?code=${encodeURIComponent(task.module_code)}`;
<<<<<<< HEAD
  const pillStyle = { color: moduleColours.text, background: "transparent", borderColor: moduleColours.border };
  return (
    <Link to={to} className={`${styles.modulePill} ${styles.modulePillLink}`} style={pillStyle} onClick={(event) => event.stopPropagation()} title={`Open ${task.module_code} module`}>
=======
  return (
    <Link to={to} className={`${styles.modulePill} ${styles.modulePillLink}`} style={{ color: moduleColours.text, background: "transparent", borderColor: moduleColours.border }} onClick={(event) => event.stopPropagation()} title={`Open ${task.module_code} module`}>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      {task.module_code}
    </Link>
  );
}

function ListBadge({ listName, listColour }) {
<<<<<<< HEAD
  const colour = listColour || "var(--task-list-fallback)";
=======
  const colour = listColour || "#a89890";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  const style = { "--lc": colour, background: `color-mix(in srgb, ${colour} 8%, transparent)`, borderColor: `color-mix(in srgb, ${colour} 18%, transparent)` };
  return <span className={styles.listIndicator} style={style}><span className={styles.listDot} style={{ background: colour }} />{listName}</span>;
}

function SocietyPill({ task }) {
  const societyName = task.society_name || task.society?.name || "";
  const societyId = task.society_id || task.society?.id;
  if (!societyName) return null;
  const to = societyId ? `/societies?id=${societyId}` : `/societies?search=${encodeURIComponent(societyName)}`;
  return <Link to={to} className={styles.societyPill} onClick={(event) => event.stopPropagation()} title={`Open ${societyName}`}>🏛️ {societyName}</Link>;
}

function PeoplePill({ task }) {
  const peopleCount = task.assignees_count ?? task.people_count ?? task.group_member_count ?? (Array.isArray(task.assignees) ? task.assignees.length : null);
  if (!Number.isFinite(Number(peopleCount)) || Number(peopleCount) <= 0) return null;
  return <Link to="/users" className={styles.peoplePill} onClick={(event) => event.stopPropagation()} title="Open users">👥 {peopleCount} people</Link>;
}

function ProjectPill({ task }) {
<<<<<<< HEAD
=======
  if (!task.group_project_name) return null;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  return <span className={styles.projectPill} title={`Project: ${task.group_project_name}`}><ClipboardList size={11} className={styles.projectPillIcon} />{task.group_project_name}</span>;
}

export default function TaskCardMeta({ task, listName, hideListBadge, listColour, isCompleted }) {
  return (
    <div className={`${styles.meta} ${isCompleted ? styles.metaDone : ""}`}>
      {listName && !hideListBadge && <ListBadge listName={listName} listColour={listColour} />}
      {task.module_code && <ModulePillLink task={task} />}
      <SocietyPill task={task} />
      <PeoplePill task={task} />
      {task.group_project_name && <span className={styles.projectWrap}><ProjectPill task={task} /></span>}
    </div>
  );
}
