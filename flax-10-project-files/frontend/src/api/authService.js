/**
 * API service for user authentication endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/auth';


export const authService = {
    async register(userData) {
        const response = await fetch(`${API_BASE_URL}/register/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        return {response, data};
    },

    async login(userCredentials) {
        const response = await fetch(`${API_BASE_URL}/login/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(userCredentials)
        });

        const data = await response.json();
        return {response, data};
    },

    async logout() {
        const token = localStorage.getItem('user_token');

        const response = await fetch(`${API_BASE_URL}/logout/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`}
        });

        const data = await response.json();
        return {response, data};
    }
};