/*
 * Shared module badge link for GroupWork project surfaces.
 */

import { Link } from "react-router-dom";
import Badge from "../../../components/common/Badge/Badge";

function getProjectModuleLabel(project) {
  return project.module_name || project.course_code;
}

export default function ProjectModuleBadge({ project, linkClassName, badgeClassName, codeClassName, ariaLabel }) {
  if (!project.course_code && !project.module_name) return null;
  const label = getProjectModuleLabel(project);
  return (
    <Link to={`/modules?code=${encodeURIComponent(project.course_code || "")}`} className={linkClassName} aria-label={ariaLabel || `Open ${label} module`}>
      <Badge className={badgeClassName}>
        {project.course_code ? <span className={codeClassName}>{project.course_code}</span> : null}
        <span>{label}</span>
      </Badge>
    </Link>
  );
}
