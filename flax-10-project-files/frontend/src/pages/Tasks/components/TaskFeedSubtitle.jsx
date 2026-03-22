/*
 * Subtitle helpers for the task feed header.
 */

import { parseReadingListName } from "../utils/readingListUtils";

const genericTaskFeedSubtitle = (
  <>
    Plan and track your <em>urgent tasks</em>, <em>coursework</em>,{" "}
    <em>admin</em>, and <em>life</em>.
  </>
);

function getModuleLabel(parsed) {
  if (parsed.moduleName && parsed.moduleCode) {
    return `${parsed.moduleName} (${parsed.moduleCode})`;
  }

  return parsed.moduleName || parsed.moduleCode || "this module";
}

export function getTaskFeedSubtitle(activeList, isReadingActive) {
  if (!activeList || !isReadingActive) return genericTaskFeedSubtitle;
  const parsed = parseReadingListName(activeList.name);

  return (
    <>
      Keep your <em>{getModuleLabel(parsed)}</em> readings,{" "}
      <em>lecture notes</em>, <em>past papers</em>, and <em>revision prep</em>
      {" "}in one place.
    </>
  );
}
