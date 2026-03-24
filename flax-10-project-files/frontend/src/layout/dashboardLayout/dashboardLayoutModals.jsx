/*
 * Dashboard layout modal composition.
 */

import { useState } from "react";

import { EventModal } from "../../components/Calendar/EventModal/EventModal";
import CreateSocietyModal from "../../components/Society/CreateSocietyModal";
import DeadlineModal from "../../components/Modules/Deadlines/DeadlineModal";
import ReadingModal from "../../components/Modules/Readings/ReadingModal";
import QuickAddModal from "../../components/Dashboard/QuickAddModal";
import { LeaveTimerModal } from "../../components/Timer/TimerPopups";
import CreateTaskModal from "../../pages/Tasks/components/CreateTaskModal";
import { createSociety } from "../../api/societyApi";
import { createTask } from "../../api/taskApi";
import { handlePendingAction } from "./dashboardLayoutActions";
import { useDashboardTaskModalOptions } from "./useDashboardTaskModalOptions";

function closeQuickAdd(state) {
  state.setShowQuickAdd(false);
  state.setQuickAddInitialView("type");
}

export function QuickAddGate({ open, onClose, onSelectType, isTeacher, initialView }) {
  if (!open) return null;
  return (
    <QuickAddModal
      onClose={onClose}
      onSelectType={onSelectType}
      isTeacher={isTeacher}
      initialView={initialView}
    />
  );
}

export function EventModalGate({ modal }) {
  if (!modal.isModalOpen) return null;
  return (
    <EventModal
      event={modal.modalEvent}
      initialType={modal.modalType}
      initialDate={modal.modalInitialDate}
      onClose={modal.closeModal}
    />
  );
}

function useSocietyCreation(setShowSocietyModal) {
  return async (form) => {
    try {
      await createSociety(form);
      setShowSocietyModal(false);
    } catch (e) {
      console.error("Failed to create society:", e);
    }
  };
}

export function GlobalTaskModal({ onClose }) {
  const { lists, enrolledModules } = useDashboardTaskModalOptions();
  return <CreateTaskPanel lists={lists} modules={enrolledModules} onClose={onClose} />;
}

function CreateTaskPanel({ lists, modules, onClose }) {
  const handleSave = async (data) => {
    try {
      await createTask(data);
      onClose();
      window.dispatchEvent(new Event("task-created"));
    } catch (e) {
      console.error("Failed to create task:", e);
    }
  };
  return <CreateTaskModal lists={lists} modules={modules} onSave={handleSave} onClose={onClose} />;
}

export function DashboardModals({ state }) {
  const createSocietyHandler = useSocietyCreation(state.setShowSocietyModal);
  return (
    <>
      <QuickAddGate
        open={state.showQuickAdd}
        onClose={() => closeQuickAdd(state)}
        onSelectType={state.onSelectType}
        isTeacher={state.user?.role === "teacher"}
        initialView={state.quickAddInitialView}
      />
      <EventModalGate modal={state.modal} />
      <SocietyModal state={state} onCreate={createSocietyHandler} />
      <TaskModal state={state} />
      <DeadlineGate state={state} />
      <ReadingGate state={state} />
    </>
  );
}

function SocietyModal({ state, onCreate }) {
  if (!state.showSocietyModal) return null;
  return <CreateSocietyModal onClose={() => state.setShowSocietyModal(false)} onCreate={onCreate} />;
}

function TaskModal({ state }) {
  if (!state.showTaskModal) return null;
  return <GlobalTaskModal onClose={() => state.setShowTaskModal(false)} />;
}

function DeadlineGate({ state }) {
  if (!state.deadlineModule) return null;
  return <DeadlineModal module={state.deadlineModule} onClose={() => state.setDeadlineModule(null)} startCreating />;
}

function ReadingGate({ state }) {
  if (!state.readingModule) return null;
  return <ReadingModal module={state.readingModule} onClose={() => state.setReadingModule(null)} />;
}

export function LeaveTimerActions({ pendingNav, setPendingNav, t, setShowQuickAdd, onNavChange }) {
  const onPause = () => runPauseAction(t, pendingNav, setShowQuickAdd, onNavChange, setPendingNav);
  const onTakeBreak = () => runTakeBreakAction(t, setPendingNav);
  const onExit = () => runExitAction(t, pendingNav, setShowQuickAdd, onNavChange, setPendingNav);
  return (
    <LeaveTimerModal
      onCancel={() => setPendingNav(null)}
      onPause={onPause}
      onExit={onExit}
      onTakeBreak={onTakeBreak}
      timeLeftSeconds={Math.max(0, Number(t.timeLeft || 0))}
      sessionTotalSeconds={getSessionTotalSeconds(t)}
    />
  );
}

function runPauseAction(t, pendingNav, setShowQuickAdd, onNavChange, setPendingNav) {
  if (!t.isPaused) t.togglePause();
  handlePendingAction(pendingNav, setShowQuickAdd, onNavChange);
  setPendingNav(null);
}

function runTakeBreakAction(t, setPendingNav) {
  t.setMode("break");
  t.setTimeLeft(5 * 60);
  t.setIsActive(true);
  setPendingNav(null);
}

function runExitAction(t, pendingNav, setShowQuickAdd, onNavChange, setPendingNav) {
  t.setIsActive(false);
  t.resetTimer();
  handlePendingAction(pendingNav, setShowQuickAdd, onNavChange);
  setPendingNav(null);
}

function getSessionTotalSeconds(t) {
  const minutes = Number((t.mode === "break" ? t.breakTime : t.workTime) || 25);
  return Math.max(60, minutes * 60);
}
