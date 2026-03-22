/*
 * Creates, updates, and deletes deadlines for each module.
 */

import {fetchApi} from '../client.js';

export async function getDeadlines(module_id) {
    return fetchApi(`/modules/${module_id}/deadlines/`);
}

export async function createDeadline(module_id, data) {
    return fetchApi(`/modules/${module_id}/deadlines/`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateDeadline(module_id, deadline_id, data) {
    return fetchApi(`/modules/${module_id}/deadlines/${deadline_id}/` , {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

export async function deleteDeadline(module_id, deadline_id) {
    return fetchApi(`/modules/${module_id}/deadlines/${deadline_id}/`, {
        method: "DELETE"
    });
}

export async function getUpcomingDeadlines() {
    return fetchApi('/deadlines/upcoming/')
}
