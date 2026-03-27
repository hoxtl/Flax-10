/*
 * Loaded content layout for the tasks page.
 */

import { BackToTop } from "../../../components/pagination/Pagination";

import CreateListModal from "./CreateListModal";
import CreateTaskModal from "./CreateTaskModal";
import ListSidebar from "./ListSidebar";
import TaskFeed from "./TaskFeed";
import TasksPageToasts from "./TasksPageToasts";

import styles from "../styles/TasksPage.module.css";

function TasksPageModals({ page }) {
  return (
    <>
      {page.showTaskModal && <CreateTaskModal {...page.taskModalProps} />}
      {page.showListModal && <CreateListModal {...page.listModalProps} />}
      {page.showCreateListFromTask && (
        <CreateListModal {...page.createListFromTaskProps} />
      )}
    </>
  );
}

export default function TasksPageContent({ page }) {
  return (
    <div className={styles.page}>
      <ListSidebar {...page.sidebarProps} />
      <TaskFeed {...page.feedProps} sidebarProps={page.sidebarProps} />
      <TasksPageToasts {...page} />
      <TasksPageModals page={page} />
      <BackToTop />
    </div>
  );
}
