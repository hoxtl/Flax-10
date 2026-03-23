/*
 * Mobile-only modal for picking a task list.
 */

import StandardModal from "../../../components/common/StandardModal/StandardModal";

import { computeListSidebarCounts } from "../utils/listSidebarUtils";
import { EmptyListsState, MobileListSection } from "./MobileTaskListsParts";
import { getMobileListSectionProps } from "./mobileTaskListsUtils";

import styles from "./MobileTaskListsModal.module.css";

function getSelectHandler(onSelectList, onSelectFilter, onClose) {
  return (listId) => {
    onSelectList?.(listId);
    onSelectFilter?.("all");
    onClose?.();
  };
}

function MobileTaskListsBody(props) {
  const { readingProps, lifeProps } = getMobileListSectionProps(
    props.lists,
    props.listCounts,
    props.activeListId,
    props.onSelectList,
  );

  return (
    <>
      <MobileListSection {...readingProps} />
      <div className={styles.sectionDivider} aria-hidden />
      <MobileListSection {...lifeProps} />
    </>
  );
}

function AddListButton({ onClose, onNewList }) {
  return (
    <button type="button" className={styles.addListBtn} onClick={() => { onClose?.(); onNewList?.(); }}>
      + Add list
    </button>
  );
}

function MobileTaskListsContent(props) {
  if (props.lists.length === 0) return <EmptyListsState />;
  return <MobileTaskListsBody {...props} />;
}

function MobileTaskListsModalBody({ props, listCounts, handleSelectList }) {
  return (
    <>
      <MobileTaskListsContent
        lists={props.lists || []}
        listCounts={listCounts}
        activeListId={props.activeListId}
        onSelectList={handleSelectList}
      />
      <AddListButton onClose={props.onClose} onNewList={props.onNewList} />
    </>
  );
}

export default function MobileTaskListsModal(props) {
  const lists = props.lists || [];
  const tasks = props.tasks || [];
  const { listCounts } = computeListSidebarCounts(tasks, lists);
  const handleSelectList = getSelectHandler(props.onSelectList, props.onSelectFilter, props.onClose);

  return (
    <StandardModal
      title="View lists"
      subtitle="Choose a list to focus your task feed"
      onClose={props.onClose}
      size="sm"
      contentClassName={styles.content}
    >
      <MobileTaskListsModalBody props={props} listCounts={listCounts} handleSelectList={handleSelectList} />
    </StandardModal>
  );
}
