/**
 * Homepage overlay collection.
 */

import { X, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { ModulePill, TypePill, getModulePillColors } from "./ModulePill";

function getModuleInfo(selectedModulePill, enrolledModules) {
  const code = selectedModulePill.code || "";
  const id = selectedModulePill.id;
  const module = (enrolledModules || []).find((item) => (id && String(item.id) === String(id)) || (item.module_code || "").toUpperCase() === code.toUpperCase());
  return { code, colors: getModulePillColors(code), department: module?.department || module?.school || null, description: module?.description || null, id, leader: module?.module_leader || module?.leader || null, name: module?.module_name || module?.name || null };
}

export function HomepageOverlays(props) {
  return (
    <>
      <ModuleOverlay {...props} />
      <DeadlineOverlay {...props} />
    </>
  );
}

function ModuleOverlay(props) {
  if (!props.selectedModulePill) return null;
  const moduleInfo = getModuleInfo(props.selectedModulePill, props.enrolledModules);
  const moduleUrl = moduleInfo.id ? `/modules?moduleId=${moduleInfo.id}` : `/modules?code=${encodeURIComponent(moduleInfo.code)}`;

  return (
    <div className={props.styles.deadlineDetailOverlay} onClick={() => props.setSelectedModulePill(null)} role="dialog" aria-modal aria-labelledby="module-card-title">
      <div className={props.styles.moduleCardCard} onClick={(event) => event.stopPropagation()}>
        <ModuleOverlayHeader {...props} colors={moduleInfo.colors} code={moduleInfo.code} />
        <h2 id="module-card-title" className={props.styles.moduleCardCode} style={{ color: moduleInfo.colors.text }}>{moduleInfo.code}</h2>
        {moduleInfo.name && <p className={props.styles.moduleCardName}>{moduleInfo.name}</p>}
        {moduleInfo.department && <p className={props.styles.moduleCardDept}>{moduleInfo.department}</p>}
        {moduleInfo.description && <p className={props.styles.moduleCardDesc}>{truncateText(moduleInfo.description, 120)}</p>}
        {moduleInfo.leader && <p className={props.styles.moduleCardLeader}>Leader: {moduleInfo.leader}</p>}
        <div className={props.styles.moduleCardDivider} />
        <Link to={moduleUrl} className={props.styles.moduleCardLink} style={{ background: moduleInfo.colors.text }} onClick={() => props.setSelectedModulePill(null)}>
          View module →
        </Link>
      </div>
    </div>
  );
}

function ModuleOverlayHeader(props) {
  return (
    <div className={props.styles.moduleCardHeader}>
      <div className={props.styles.moduleCardColorBar} style={{ background: props.colors.bg, color: props.colors.text }}>
        {props.code.slice(0, 2)}
      </div>
      <button type="button" className={props.styles.deadlineDetailClose} onClick={() => props.setSelectedModulePill(null)} aria-label="Close">
        <X size={14} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

function DeadlineOverlay(props) {
  if (!props.selectedDeadline) return null;

  return (
    <div className={props.styles.deadlineDetailOverlay} onClick={() => props.setSelectedDeadline(null)} role="dialog" aria-modal aria-labelledby="deadline-detail-title">
      <div className={props.styles.deadlineDetailCard} onClick={(event) => event.stopPropagation()}>
        <DeadlineHeader {...props} />
        <h2 id="deadline-detail-title" className={props.styles.deadlineDetailTitle}>{props.selectedDeadline.assessment_title || props.selectedDeadline.title || "Assignment"}</h2>
        <DeadlineDate {...props} />
        {props.selectedDeadline.description && <p className={props.styles.deadlineDetailDesc}>{props.selectedDeadline.description}</p>}
        {props.selectedDeadline.location && <DeadlineLocation {...props} />}
        <DeadlineLink {...props} />
      </div>
    </div>
  );
}

function DeadlineHeader(props) {
  return (
    <div className={props.styles.deadlineDetailHeader}>
      <div className={props.styles.deadlineDetailPills}>
        {props.selectedDeadline.module_code && <ModulePill moduleCode={props.selectedDeadline.module_code} />}
        {props.selectedDeadline.deadline_type && <TypePill typeLabel={capitalize(props.selectedDeadline.deadline_type)} accentColor={props.selectedDeadline.module_code ? getModulePillColors(props.selectedDeadline.module_code).accent : undefined} />}
      </div>
    </div>
  );
}

function DeadlineDate(props) {
  if (!props.selectedDeadline.start_due_date) return null;
  const dateLabel = new Date(props.selectedDeadline.start_due_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return <p className={props.styles.deadlineDetailDate}>Due: {dateLabel}</p>;
}

function DeadlineLocation(props) {
  return (
    <p className={props.styles.deadlineDetailMeta}>
      <MapPin size={14} className={props.styles.deadlineDetailMetaIcon} aria-hidden />
      {props.selectedDeadline.location}
    </p>
  );
}

function DeadlineLink(props) {
  const href = getDeadlineModuleUrl(props.selectedDeadline);
  return href ? <Link to={href} className={props.styles.deadlineDetailLink} onClick={() => props.setSelectedDeadline(null)}>Go to module →</Link> : null;
}

function getDeadlineModuleUrl(deadline) {
  if (deadline.module_id != null || deadline.module != null) return `/modules?moduleId=${deadline.module_id ?? deadline.module}`;
  return deadline.module_code ? `/modules?code=${encodeURIComponent(deadline.module_code)}` : null;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function truncateText(value, limit) {
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
}
