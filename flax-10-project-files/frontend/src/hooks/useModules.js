import {useState, useEffect} from 'react';
import {useNotifications} from '../context/NotificationContext';
import {getModules, getEnrollments, enrollInModule, disenrolFromModule, deleteModule, isEnrolledIn, getEnrollmentId} from '../api/module_api.js';

async function LoadData(setLoading, setModules, setEnrollments, notify) {
    try {
        setLoading(true)
        const [modules_data, enrollments_data] = await Promise.all([getModules(), getEnrollments()]);
        setModules(modules_data);
        setEnrollments(enrollments_data);
    } catch (err) {
        notify(err.message, 'error');
    } finally {
        setLoading(false);
    }
}

async function HandleEnrollment(module, setEnrollments, notify) {
    try {
        const new_enrollment = await enrollInModule(module.id);
        setEnrollments(prev => [...prev, new_enrollment]);
        notify(`Successfully enrolled in ${module.module_name}! Check your calendar for any updates.`, 'success');
    } catch (err) {
        notify (err.message, 'error');
    }
}

async function HandleDisenrol(module, enrollments, setEnrollments, notify) {
    try {
        const enrollment_id = getEnrollmentId(module.id, enrollments);
        await disenrolFromModule(enrollment_id)
        setEnrollments(prev =>  prev.filter(e => e.id !== enrollment_id));
        notify(`Disenrolled from ${module.module_name}!`, 'success');
    } catch (err) {
        notify (err.message, 'error');
    }
}

async function HandleDeleteModule(module, setModules, notify, onSuccess) {
    const confirmed = confirm(`Delete ${module.module_name}? This will delete enrollments too.`);
    if (!confirmed) return;
    try {
        await deleteModule(module.id);
        setModules(prev =>  prev.filter(e => e.id !== module.id));
        notify('Module deleted successfully', 'success');
        if (onSuccess) onSuccess();
    } catch (err) {
        notify(err.message, 'error');
    }
}

export default function useModules() {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState([]);
    const { addNotification} = useNotifications();
    function notify (message, type) {
        addNotification({title: type === 'error' ? 'Error' : ' Success', message});
    }
    useEffect(() => {LoadData(setLoading, setModules, setEnrollments, notify);}, []);
}
