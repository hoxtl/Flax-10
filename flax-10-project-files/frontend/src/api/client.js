const API_BASE_URL = "/api";

export async function fetchApi(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = buildRequestConfig(options);

    const response = await fetch(url, config);
    return handleResponse(response);
}

function buildRequestConfig(options) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    return {
        headers: headers,
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