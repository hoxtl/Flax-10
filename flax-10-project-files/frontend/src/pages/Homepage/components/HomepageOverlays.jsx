/*
 * Homepage overlay collection.
 */
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
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

function getModuleUrl(moduleInfo) {
  return moduleInfo.id ? `/modules?moduleId=${moduleInfo.id}` : `/modules?code=${encodeURIComponent(moduleInfo.code)}`;
}

function ModuleOverlayActions({ styles, setSelectedModulePill, moduleUrl }) {
  const navigate = useNavigate();
  const handleClick = () => { setSelectedModulePill(null); navigate(moduleUrl); };
  return (
    <div className={styles.moduleCardActions}>
      <PrimaryButton type="button" variant="ghost" size="small" pill className={styles.moduleCardLink} onClick={handleClick}>View module</PrimaryButton>
    </div>
  );
}

function ModuleOverlay(props) {
  if (!props.selectedModulePill) return null;
  const moduleInfo = getModuleInfo(props.selectedModulePill, props.enrolledModules);
  const moduleUrl = getModuleUrl(moduleInfo);
  return (
    <div className={props.styles.deadlineDetailOverlay} onClick={() => props.setSelectedModulePill(null)} role="dialog" aria-modal aria-labelledby="module-card-title">
      <div className={props.styles.moduleCardCard} onClick={(event) => event.stopPropagation()}>
        <ModuleOverlayHeader {...props} colors={moduleInfo.colors} code={moduleInfo.code} />
        <ModuleOverlayBody moduleInfo={moduleInfo} styles={props.styles} />
        <div className={props.styles.moduleCardDivider} />
        <ModuleOverlayActions styles={props.styles} setSelectedModulePill={props.setSelectedModulePill} moduleUrl={moduleUrl} />
      </div>
    </div>
  );
}

function ModuleOverlayHeader(props) {
  const colorBarStyle = { background: props.colors.bg, color: props.colors.text };
  return (
    <div className={props.styles.moduleCardHeader}>
      <div className={props.styles.moduleCardColorBar} style={colorBarStyle}>
        {props.code.slice(0, 2)}
      </div>
    </div>
  );
}

function ModuleOverlayBody({ moduleInfo, styles }) {
  return (
    <>
      <h2 id="module-card-title" className={styles.moduleCardCode} style={{ color: moduleInfo.colors.text }}>{moduleInfo.code}</h2>
      {moduleInfo.name ? <p className={styles.moduleCardName}>{moduleInfo.name}</p> : null}
      {moduleInfo.department ? <p className={styles.moduleCardDept}>{moduleInfo.department}</p> : null}
      {moduleInfo.description ? <p className={styles.moduleCardDesc}>{truncateText(moduleInfo.description, 120)}</p> : null}
      {moduleInfo.leader ? <p className={styles.moduleCardLeader}>Leader: {moduleInfo.leader}</p> : null}
    </>
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
        <DeadlineActions {...props} />
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

function DeadlineActions(props) {
  const navigate = useNavigate();
  const href = getDeadlineModuleUrl(props.selectedDeadline);
  if (!href) return null;
  const handleClick = () => { props.setSelectedDeadline(null); navigate(href); };
  return (
    <div className={props.styles.deadlineDetailActions}>
      <PrimaryButton type="button" variant="primary" size="small" pill className={props.styles.deadlineDetailLink} onClick={handleClick}>Go to module</PrimaryButton>
    </div>
  );
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
