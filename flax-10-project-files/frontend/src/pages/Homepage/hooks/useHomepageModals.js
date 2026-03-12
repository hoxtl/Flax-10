import { useState } from "react";

export function useHomepageModals(defaultShowCreateTaskModal, defaultPlanTimelineReadItem) {
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(defaultShowCreateTaskModal);
  const [showCreateListFromTask, setShowCreateListFromTask] = useState(false);
  const [lastCreatedListId, setLastCreatedListId] = useState(null);
  const [rescheduleTask, setRescheduleTask] = useState(null);
  const [planTimelineReadItem, setPlanTimelineReadItem] = useState(defaultPlanTimelineReadItem);
  const [selectedDeadline, setSelectedDeadline] = useState(null);
  const [selectedModulePill, setSelectedModulePill] = useState(null);

  return {
    showCreateTaskModal, setShowCreateTaskModal,
    showCreateListFromTask, setShowCreateListFromTask,
    lastCreatedListId, setLastCreatedListId,
    rescheduleTask, setRescheduleTask,
    planTimelineReadItem, setPlanTimelineReadItem,
    selectedDeadline, setSelectedDeadline,
    selectedModulePill, setSelectedModulePill,
  };
}
