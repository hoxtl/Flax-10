/*
 * Loaded content layout for the tasks page.
 */

import { BackToTop } from "../../components/Pagination/Pagination";

import CreateListModal from "./components/CreateListModal";
import CreateTaskModal from "./components/CreateTaskModal";
import ListSidebar from "./components/ListSidebar";
import TaskFeed from "./components/TaskFeed";
import TasksPageToasts from "./TasksPageToasts";

import styles from "./TasksPage.module.css";

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
