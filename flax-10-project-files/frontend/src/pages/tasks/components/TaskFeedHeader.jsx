/*
 * Page header block for the task feed.
 */

import PageHeader from "../../../components/common/page_header/PageHeader";

import { taskFeedHintStyle } from "./TaskFeedConstants";

export default function TaskFeedHeader({ title, subtitle }) {
  const hint = "✦ Right click to edit or delete a task";
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      details={<span style={taskFeedHintStyle}>{hint}</span>}
      compact
    />
  );
}
