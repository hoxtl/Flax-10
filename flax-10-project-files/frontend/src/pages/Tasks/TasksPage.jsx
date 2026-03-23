/*
 * Tasks page shell that wires page state into the sidebar, feed, and modals.
 */

import useTasksPage from "./hooks/useTasksPage";
import TasksPageContent from "./TasksPageContent";
import TasksPageSkeleton from "./TasksPageSkeleton";

export default function TasksPage() {
  const page = useTasksPage();
  if (page.loading) return <TasksPageSkeleton />;
  return <TasksPageContent page={page} />;
}
