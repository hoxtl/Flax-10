/*
 * Section rendering for the task feed body.
 */

import SearchEmptyState from "../../../components/common/SearchEmptyState/SearchEmptyState";

import CompletedTasksSection from "./CompletedTasksSection";
import SuggestedReadingsSection from "./SuggestedReadingsSection";
import TaskSection from "./TaskSection";
import { getVisibleSections } from "./taskFeedSectionConfigs";

import styles from "./TaskFeedSections.module.css";

function SearchEmptyBlock({ data }) {
  if (!data.showSearchEmptyState) return null;

  return (
    <SearchEmptyState
      query={data.search}
      itemLabel="tasks"
      onClear={() => data.setSearch("")}
    />
  );
}

function TaskSectionList({ sections }) {
  return sections.map((section) => (
    <TaskSection key={section.sectionType} {...section} />
  ));
}

function SuggestedReadingsBlock(props) {
  const canShow = props.readingList && !props.data.search.trim();
  if (!canShow) return null;

  return (
    <SuggestedReadingsSection
      key={props.activeListId}
      activeList={props.activeList}
      onTaskAdded={props.onTaskAdded}
      taskCount={props.taskCount}
      pendingTasks={props.data.pending}
      completedTasks={props.data.completed}
    />
  );
}

function CompletedBlock({ data, lists, onToggleComplete, onDeleteTask, onEditTask }) {
  if (data.filteredCompleted.length === 0) return null;

  return (
    <CompletedTasksSection
      tasks={data.filteredCompleted}
      sortBy={data.sortBy}
      listMap={data.listMap}
      lists={lists}
      onToggleComplete={onToggleComplete}
      onDeleteTask={onDeleteTask}
      onEditTask={onEditTask}
    />
  );
}

export default function TaskFeedSections(props) {
  const sections = getVisibleSections(props.activeFilter, props.data).map(
    (section) => ({ ...section, ...props.sectionPropsWithHandlers }),
  );

  return (
    <div className={styles.sectionsWrap}>
      <div className={styles.sections} key={`sections-${props.activeListId ?? "all"}`}>
        <SearchEmptyBlock data={props.data} />
        {!props.data.showSearchEmptyState && <TaskSectionList sections={sections} />}
        {!props.data.showSearchEmptyState && <SuggestedReadingsBlock {...props} />}
        {!props.data.showSearchEmptyState && <CompletedBlock {...props} />}
      </div>
    </div>
  );
}
