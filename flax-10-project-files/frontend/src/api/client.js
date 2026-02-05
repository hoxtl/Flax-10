const API_BASE_URL = "/api";

export async function fetch_api(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = build_request_config(options);

    const response = await fetch(url, config);
    return handle_response(response);
}

function build_request_config(options) {
    return {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };
}

async function handle_response(response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Request failed`);
    }
    if (response.status === 204) return null;
    return response.json();
}