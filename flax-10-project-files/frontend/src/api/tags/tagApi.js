/*
 * Creates, updates, and deletes task tags.
 */

import { fetchApi } from '../client';

export async function getTags() {
    return fetchApi('/tags/');
}

export async function createTag(tagData) {
    return fetchApi('/tags/', {
        method: 'POST',
        body: JSON.stringify(tagData),
    });
}

export async function deleteTag(id) {
    return fetchApi(`/tags/${id}/`, { method: 'DELETE' });
}

export async function updateTag(id, data) {
    return fetchApi(`/tags/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}
