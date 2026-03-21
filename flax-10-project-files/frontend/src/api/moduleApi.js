/*
 * Creates, reads, updates, and deletes modules and enrolments.
 */
import {fetchApi} from './client.js'

export async function getModules() {
    return fetchApi('/modules/');
}

export async function getModuleDetails(module_id) {
    return fetchApi(`/modules/${module_id}/`);
}

export async function createModule(module_data) {
    return fetchApi('/modules/', {
        method: "POST",
        body: JSON.stringify(module_data)
    });
}

export async function updateModule(module_id, module_data) {
    return fetchApi(`/modules/${module_id}/`, {
        method: "PUT",
        body: JSON.stringify(module_data)
    });
}

export async function deleteModule(module_id) {
    return fetchApi(`/modules/${module_id}/`, {
        method: "DELETE"
    });   
}

export async function getEnrollments() {
    return fetchApi('/enrollments/');
}

export async function enrollInModule(module_id) {
    return fetchApi('/enrollments/', {
        method: "POST",
        body: JSON.stringify({module: module_id})
    });
}

export async function disenrolFromModule(enrollment_id) {
    return fetchApi(`/enrollments/${enrollment_id}/`, {
        method: "DELETE"
    });
}

export async function disenrolByModuleId(module_id) {
    const enrollments = await getEnrollments();
    const enrollment = enrollments.find(e => e.module === module_id);
    if (!enrollment) throw new Error('Not enrolled in this module');
    return disenrolFromModule(enrollment.id);
}

