/*
 * Page header block for the task feed.
 */

import PageHeader from "../../../components/common/page_header/PageHeader";

import { taskFeedHintStyle } from "./taskFeedConstants";

export default function TaskFeedHeader({ title, subtitle, isReadingList }) {
  const hint = isReadingList
    ? "Reading List tasks cannot be edited as they are set by teachers"
    : "✦ Right click to edit or delete a task";
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      details={<span style={taskFeedHintStyle}>{hint}</span>}
      compact
    />
  );
}
