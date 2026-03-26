/*
 * Section rendering for the task feed body.
 */

import { AnimatePresence, motion as Motion } from "framer-motion";

import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";

import CompletedTasksSection from "./CompletedTasksSection";
import SuggestedReadingsSection from "./SuggestedReadingsSection";
import TaskSection from "./TaskSection";
import { getVisibleSections } from "./taskFeedSectionConfigs";

import styles from "./TaskFeedSections.module.css";
import { useAuth } from "../../../context/AuthContext";

const LIST_SWITCH_ANIM = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: "easeIn" } },
};

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
  const { profile } = useAuth();
  const isTeacher = profile?.role === "teacher";
  const canShow = props.readingList && !props.data.search.trim() && !isTeacher;
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
  const editHandler = props.readingList ? undefined : props.onEditTask;
  const sectionHandlers = { ...props.sectionPropsWithHandlers, onEditTask: editHandler };
  const sections = getVisibleSections(props.activeFilter, props.data).map(
    (section) => ({ ...section, ...sectionHandlers }),
  );

  return (
    <div className={styles.sectionsWrap}>
      <AnimatePresence mode="wait">
        <Motion.div className={styles.sections} key={`sections-${props.activeListId ?? "all"}`} {...LIST_SWITCH_ANIM}>
          <SearchEmptyBlock data={props.data} />
          {!props.data.showSearchEmptyState && <TaskSectionList sections={sections} />}
          {!props.data.showSearchEmptyState && <SuggestedReadingsBlock {...props} />}
          {!props.data.showSearchEmptyState && <CompletedBlock {...props} onEditTask={editHandler} />}
        </Motion.div>
      </AnimatePresence>
    </div>
  );
}
