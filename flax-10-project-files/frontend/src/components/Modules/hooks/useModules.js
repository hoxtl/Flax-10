import { useState, useEffect } from 'react';
import { useNotifications } from '../../../context/NotificationContext';
import { getModules, getEnrollments, enrollInModule, disenrolFromModule, deleteModule } from '../../../api/moduleApi.js';
import { isEnrolledIn, getEnrollmentId } from '../utils/moduleUtils.js';
import { createNotify } from '../utils/notifyHelper.js';
import { useConfirm } from '../../../context/ConfirmContext.jsx';

function useModuleActions(modules, enrollments, loading, setModules, setEnrollments, notify, confirmFn) {
  return {
    modules, enrollments, loading,
    handleEnrollment: (m) => handleEnrollment(m, setEnrollments, notify),
    handleDisenrol: (m) => handleDisenrol(m, enrollments, setEnrollments, notify),
    toggleEnrollment: (m) => isEnrolledIn(m.id, enrollments)
      ? handleDisenrol(m, enrollments, setEnrollments, notify)
      : handleEnrollment(m, setEnrollments, notify),
    handleDeleteModule: (m, cb) => handleDeleteModule(m, setModules, notify, confirmFn, cb),
    handleModuleCreated: (m) => { setModules(prev => [...prev, m]); notify('Module created successfully', 'success'); },
    handleModuleUpdated: (m) => { setModules(prev => prev.map(x => x.id === m.id ? m : x)); notify('Module updated successfully', 'success'); },
  };
}

async function loadData(setLoading, setModules, setEnrollments, notify) {
  try {
    setLoading(true);
    const [modules_data, enrollments_data] = await Promise.all([getModules(), getEnrollments()]);
    setModules(modules_data);
    setEnrollments(enrollments_data);
  } catch (err) {
    notify(err.message, 'error');
  } finally {
    setLoading(false);
  }
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
    notify(`Disenrolled from ${module.module_name}!`, 'success');
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
  const { addNotification } = useNotifications();
  const notify = createNotify(addNotification);
  const confirmFn = useConfirm();

  useEffect(() => { loadData(setLoading, setModules, setEnrollments, notify); }, []);
  return useModuleActions(modules, enrollments, loading, setModules, setEnrollments, notify, confirmFn);
}
