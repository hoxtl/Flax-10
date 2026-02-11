import { fetchApi } from './client';

export async function fetchTags() {
    return fetchApi('/tags/');
}

export async function createTag(tag) {
    return fetchApi('/tags/', {
        method: 'POST',
        body: JSON.stringify(tag),
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
