/**
 * Utility helper functions for user authentication
 */

export const validatePasswords = (password, password2) => {
    if (password !== password2) {
        return 'The two passwords do not match';
    }
    return null;
};

export const getErrorMessage = (data) => {
    const userFields = ['first_name', 'last_name', 'username', 'email', 'password'];

    for (const field of userFields) {
        if (data[field]) {
            return Array.isArray(data[field]) ? data[field][0] : data[field];
        }
    }

    return 'Unable to register the account, try again...'
};

export const saveUserData = (token, user) => {
    localStorage.setItem('user_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    window.location.reload();
};

export const clearUserData = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user');

    window.location.reload();
};