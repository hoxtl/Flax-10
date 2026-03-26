/*
 * Hook for managing modules state, enrolments, and CRUD operations.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { useState, useEffect, useMemo } from 'react';
import { useNotifications } from '../../../context/NotificationContext';
import { useTags } from '../../../context/TagContext';
import { getModules, getEnrollments, enrollInModule, disenrolFromModule, deleteModule } from '../../../api/moduleApi.js';
import { fetchTasks } from '../../../api/taskApi.js';
import { isEnrolledIn, getEnrollmentId, normaliseModuleCode } from '../utils/moduleUtils.js';
import { createNotify } from '../utils/notifyHelper.js';
import { useConfirm } from '../../../context/ConfirmContext.jsx';

<<<<<<< HEAD
function buildEnrollmentHandlers(enrollments, setEnrollments, notify, refreshTags) {
  return {
    handleEnrollment: (m) => handleEnrollment(m, setEnrollments, notify, refreshTags),
    handleDisenrol: (m) => handleDisenrol(m, enrollments, setEnrollments, notify, refreshTags),
    toggleEnrollment: (m) => isEnrolledIn(m.id, enrollments)
      ? handleDisenrol(m, enrollments, setEnrollments, notify, refreshTags)
      : handleEnrollment(m, setEnrollments, notify, refreshTags),
=======
function buildEnrollmentHandlers(enrollments, setEnrollments, notify) {
  return {
    handleEnrollment: (m) => handleEnrollment(m, setEnrollments, notify),
    handleDisenrol: (m) => handleDisenrol(m, enrollments, setEnrollments, notify),
    toggleEnrollment: (m) => isEnrolledIn(m.id, enrollments)
      ? handleDisenrol(m, enrollments, setEnrollments, notify)
      : handleEnrollment(m, setEnrollments, notify),
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  };
}

function buildModuleHandlers(setModules, notify, confirmFn) {
  return {
    handleDeleteModule: (m, cb) => handleDeleteModule(m, setModules, notify, confirmFn, cb),
    handleDirectDeleteModule: (m, cb) => confirmDelete(m, setModules, notify, cb),
    handleModuleCreated: (m) => { setModules(prev => [...prev, m]); notify('Module created successfully', 'success'); },
    handleModuleUpdated: (m) => { setModules(prev => prev.map(x => x.id === m.id ? m : x)); notify('Module updated successfully', 'success'); },
  };
}

<<<<<<< HEAD
function useModuleActions(modules, enrollments, loading, setModules, setEnrollments, notify, confirmFn, taskCountsByModule, refreshTags) {
  const enrollmentHandlers = buildEnrollmentHandlers(enrollments, setEnrollments, notify, refreshTags);
  const moduleHandlers = buildModuleHandlers(setModules, notify, confirmFn);
  return { modules, enrollments, loading, taskCountsByModule, ...enrollmentHandlers, ...moduleHandlers };
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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

async function safeRefreshTags(refreshTags) {
  if (!refreshTags) return;
  await refreshTags().catch(() => { });
}

async function handleEnrollment(module, setEnrollments, notify, refreshTags) {
  try {
    const new_enrollment = await enrollInModule(module.id);
    setEnrollments(prev => [...prev, new_enrollment]);
    notify(`Successfully enrolled in ${module.module_name}! Check your calendar for any updates.`, 'success');
    await safeRefreshTags(refreshTags);
  } catch (err) {
    notify(err.message, 'error');
  }
}

function handleDisenrolError(err, module, setEnrollments, notify) {
  if (/core course|core module/i.test(err.message)) {
    setEnrollments(prev => prev.map(e => e.module === module.id ? { ...e, is_core: true } : e));
  } else {
    notify(err.message, 'error');
  }
}

async function handleDisenrol(module, enrollments, setEnrollments, notify, refreshTags) {
  try {
    const enrollment_id = getEnrollmentId(module.id, enrollments);
    await disenrolFromModule(enrollment_id);
    setEnrollments(prev => prev.filter(e => e.id !== enrollment_id));
    notify(`Unenrolled from ${module.module_name}!`, 'success');
<<<<<<< HEAD
    await safeRefreshTags(refreshTags);
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  } catch (err) {
    handleDisenrolError(err, module, setEnrollments, notify);
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
<<<<<<< HEAD
  const { refreshTags } = useTags();
  useEffect(() => { loadData(setLoading, setModules, setEnrollments, setTaskCountsByModule, notify); }, [notify]);
  return useModuleActions(
    modules, enrollments, loading, setModules, setEnrollments, notify, confirmFn,
    taskCountsByModule, refreshTags
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  );
}
