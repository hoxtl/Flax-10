import { fetchApi } from "./client";

export async function getTags() {
    return fetchApi('/tags/');
}

export async function createTag(tagData) {
    return fetchApi('/tags/', {
        method: "POST",
        body: JSON.stringify(tagData),
    });
}
