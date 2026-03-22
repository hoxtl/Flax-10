/*
 * Page header block for the task feed.
 */

import PageHeader from "../../../components/common/PageHeader/PageHeader";

import { taskFeedHintStyle } from "./TaskFeedConstants";

export default function TaskFeedHeader({ title, subtitle }) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      details={<span style={taskFeedHintStyle}>✦ Right click to edit or delete a task</span>}
      compact
    />
  );
}
