/*
 * Mobile list picker wrapper for the task feed.
 */

import MobileTaskListsModal from "./MobileTaskListsModal";

export default function TaskFeedMobileLists(props) {
  if (!props.isMobile || !props.showMobileLists) return null;

  return (
    <MobileTaskListsModal
      lists={props.modalLists}
      tasks={props.modalTasks}
      activeListId={props.activeListId}
      onSelectList={props.onSelectList}
      onSelectFilter={props.onSelectFilter}
      onNewList={props.onNewList}
      onClose={props.onClose}
    />
  );
}
