/*
 * Reusable module badge for group work project rows and headers.
 */

import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function GroupWorkProjectModuleBadge({ project, linkClassName, badgeClassName, codeClassName }) {
  const code = project?.course_code;
  const name = project?.module_name;
  if (!code && !name) return null;
  return (
    <Link
      to={`/modules?code=${encodeURIComponent(code || "")}`}
      className={linkClassName}
      aria-label={`Open ${name || code} module`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className={badgeClassName}>
        <BookOpen size={12} aria-hidden />
        <span className={codeClassName}>{code || name}</span>
        {code && name && <span>{name}</span>}
      </span>
    </Link>
  );
}
