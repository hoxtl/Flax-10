import { fetch_api } from "./client";

export async function get_events(params = {}) {
    const query = build_query_string(params);
    return fetch_api(`/events${query}`);
}

export async function create_event(event_data) {
    return fetch_api(`/events`, {
        method: "POST",
        body: JSON.stringify(event_data),
    });
}

export async function update_event(id, event_data) {
    return fetch_api(`/events/${id}`, {
        method: "PUT",
        body: JSON.stringify(event_data),
    });
}

export async function delete_event(id) {
    return fetch_api(`/events/${id}`, {
        method: "DELETE",
    });
}

function build_query_string(params) {
    const entries = Object.entries(params)
        .filter(([, v]) => v);
    if (entries.length === 0) return '';
    return '?' + new URLSearchParams(entries).toString();
}