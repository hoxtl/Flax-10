/*
 * Hook for managing modules state, enrolments, and CRUD operations.
 */
import { useState, useEffect, useMemo } from 'react';
import { useNotifications } from '../../../context/NotificationContext';
import { getModules, getEnrollments, enrollInModule, disenrolFromModule, deleteModule } from '../../../api/moduleApi.js';
import { fetchTasks } from '../../../api/taskService.js';
import { isEnrolledIn, getEnrollmentId, normaliseModuleCode } from '../utils/moduleUtils.js';
import { createNotify } from '../utils/notifyHelper.js';
import { useConfirm } from '../../../context/ConfirmContext.jsx';

function buildEnrollmentHandlers(enrollments, setEnrollments, notify) {
  return {
    handleEnrollment: (m) => handleEnrollment(m, setEnrollments, notify),
    handleDisenrol: (m) => handleDisenrol(m, enrollments, setEnrollments, notify),
    toggleEnrollment: (m) => isEnrolledIn(m.id, enrollments)
      ? handleDisenrol(m, enrollments, setEnrollments, notify)
      : handleEnrollment(m, setEnrollments, notify),
  };
}

function buildModuleHandlers(setModules, notify, confirmFn) {
  return {
    handleDeleteModule: (m, cb) => handleDeleteModule(m, setModules, notify, confirmFn, cb),
    handleModuleCreated: (m) => { setModules(prev => [...prev, m]); notify('Module created successfully', 'success'); },
    handleModuleUpdated: (m) => { setModules(prev => prev.map(x => x.id === m.id ? m : x)); notify('Module updated successfully', 'success'); },
  };
}

function useModuleActions(modules, enrollments, loading, setModules, setEnrollments, notify, confirmFn, taskCountsByModule) {
  const enrollmentHandlers = buildEnrollmentHandlers(enrollments, setEnrollments, notify);
  const moduleHandlers = buildModuleHandlers(setModules, notify, confirmFn);
  return { modules, enrollments, loading, taskCountsByModule, ...enrollmentHandlers, ...moduleHandlers };
}

function buildTaskCounts(tasks = []) {
  return tasks.reduce((acc, task) => {
    if (task?.completed) return acc;
    const code = normaliseModuleCode(task?.module_code);
    if (!code) return acc;
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {});
}

function extractResults(results) {
  const [modulesRes, enrollmentsRes, tasksRes] = results;
  if (modulesRes.status !== "fulfilled") throw modulesRes.reason;
  if (enrollmentsRes.status !== "fulfilled") throw enrollmentsRes.reason;
  const taskCounts = tasksRes.status === "fulfilled" ? buildTaskCounts(tasksRes.value) : {};
  return { modules: modulesRes.value || [], enrollments: enrollmentsRes.value || [], taskCounts };
}

function applyLoadedData(data, setModules, setEnrollments, setTaskCountsByModule) {
  setModules(data.modules);
  setEnrollments(data.enrollments);
  setTaskCountsByModule(data.taskCounts);
}

function loadData(setLoading, setModules, setEnrollments, setTaskCountsByModule, notify) {
  setLoading(true);
  Promise.allSettled([getModules(), getEnrollments(), fetchTasks()])
    .then(results => applyLoadedData(extractResults(results), setModules, setEnrollments, setTaskCountsByModule))
    .catch(err => notify(err.message, 'error'))
    .finally(() => setLoading(false));
}

async function handleEnrollment(module, setEnrollments, notify) {
  try {
    const new_enrollment = await enrollInModule(module.id);
    setEnrollments(prev => [...prev, new_enrollment]);
    notify(`Successfully enrolled in ${module.module_name}! Check your calendar for any updates.`, 'success');
  } catch (err) {
    notify(err.message, 'error');
  }
}

async function handleDisenrol(module, enrollments, setEnrollments, notify) {
  try {
    const enrollment_id = getEnrollmentId(module.id, enrollments);
    await disenrolFromModule(enrollment_id);
    setEnrollments(prev => prev.filter(e => e.id !== enrollment_id));
    notify(`Unenrolled from ${module.module_name}!`, 'success');
  } catch (err) {
    notify(err.message, 'error');
  }
}

function runOnSuccess(onSuccess) {
  if (onSuccess) onSuccess();
}

async function confirmDelete(module, setModules, notify, onSuccess) {
  try {
    await deleteModule(module.id);
    setModules(prev => prev.filter(e => e.id !== module.id));
    notify('Module deleted successfully', 'success');
    runOnSuccess(onSuccess);
  } catch (err) {
    notify(err.message, 'error');
  }
}

async function handleDeleteModule(module, setModules, notify, confirmFn, onSuccess) {
  const confirmed = await confirmFn({
    title: "Delete Module",
    message: `Delete ${module.module_name}? This will delete enrollments too.`,
    confirmText: "Delete",
    cancelText: "Cancel",
    isDanger: true
  });
  if (!confirmed) return;
  await confirmDelete(module, setModules, notify, onSuccess);
}

export default function useModules() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [taskCountsByModule, setTaskCountsByModule] = useState({});
  const { addNotification } = useNotifications();
  const notify = useMemo(() => createNotify(addNotification), [addNotification]);
  const confirmFn = useConfirm();
  useEffect(() => { loadData(setLoading, setModules, setEnrollments, setTaskCountsByModule, notify); }, [notify]);
  return useModuleActions(
    modules,
    enrollments,
    loading,
    setModules,
    setEnrollments,
    notify,
    confirmFn,
    taskCountsByModule,
  );
}
