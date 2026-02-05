const API_BASE_URL = "/api";

export async function fetchApi(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = buildRequestConfig(options);

    const response = await fetch(url, config);
    return handleResponse(response);
}

function buildRequestConfig(options) {
    return {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };
}

async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Request failed`);
    }
    if (response.status === 204) return null;
    return response.json();
}