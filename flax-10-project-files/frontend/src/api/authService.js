const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';


export const authService = {
    async register(userData) {
        const response = await fetch(`${API_BASE_URL}/auth/register/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        return {response, data};
    },

    async login(userCredentials) {
        const response = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(userCredentials)
        });

        const data = await response.json();
        return {response, data};
    },

    async logout() {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`}
        });

        const data = await response.json();
        return {response, data};
    }
};