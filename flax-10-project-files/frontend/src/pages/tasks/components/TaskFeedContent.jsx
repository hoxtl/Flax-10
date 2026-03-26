/*
 * Rendered content blocks for the task feed.
 */

import TaskFeedHeader from "./TaskFeedHeader";
import TaskFeedMobileLists from "./TaskFeedMobileLists";
import TaskFeedSections from "./TaskFeedSections";
import TaskFeedSubHeader from "./TaskFeedSubHeader";

import layoutStyles from "./TaskFeedLayout.module.css";
import toolbarStyles from "./TaskFeedToolbar.module.css";
import sectionStyles from "./TaskFeedSections.module.css";

const styles = { ...layoutStyles, ...toolbarStyles, ...sectionStyles };

function FeedSubHeader({ props, vm }) {
  return (
    <TaskFeedSubHeader
      data={vm.data}
      lists={props.lists}
      activeListId={props.activeListId}
      activeFilter={props.activeFilter}
      defaultDueDateForNewTask={props.defaultDueDateForNewTask}
      onAddTask={props.onAddTask}
      onListError={props.onListError}
      onCreateTask={props.onCreateTask}
      onOpenLists={() => vm.setShowMobileLists(true)}
      onSelectFilter={props.onSelectFilter || vm.sidebarProps.onSelectFilter}
      onSelectList={props.onSelectList || vm.sidebarProps.onSelectList}
      isMobile={vm.isMobile}
    />
  );
}

function FeedSections({ props, vm }) {
  return (
    <TaskFeedSections
      data={vm.data}
      sectionPropsWithHandlers={vm.sectionPropsWithHandlers}
      activeFilter={props.activeFilter}
      activeListId={props.activeListId}
      lists={props.lists}
      onToggleComplete={props.onToggleComplete}
      onDeleteTask={props.onDeleteTask}
      onEditTask={props.onEditTask}
      readingList={vm.readingList}
      activeList={vm.activeList}
      onTaskAdded={props.onReloadTasks}
      taskCount={props.tasks?.length}
    />
  );
}

function FeedListsModal({ props, vm }) {
  return (
    <TaskFeedMobileLists
      isMobile={vm.isMobile}
      showMobileLists={vm.showMobileLists}
      modalLists={vm.modalLists}
      modalTasks={vm.modalTasks}
      activeListId={props.activeListId}
      onSelectList={props.onSelectList || vm.sidebarProps.onSelectList}
      onSelectFilter={props.onSelectFilter || vm.sidebarProps.onSelectFilter}
      onNewList={vm.sidebarProps.onNewList}
      onClose={() => vm.setShowMobileLists(false)}
    />
  );
}

export default function TaskFeedContent({ props, vm }) {
  return (
    <div className={styles.feed}>
      <TaskFeedHeader title={vm.data.headerTitle} subtitle={vm.taskFeedSubtitle} isReadingList={vm.readingList} />
      <FeedSubHeader props={props} vm={vm} />
      <FeedSections props={props} vm={vm} />
      <FeedListsModal props={props} vm={vm} />
    </div>
  );
}
