import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserProfile } from '../api/userService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const s = localStorage.getItem('user');
        if (!s) return null;
        try { return JSON.parse(s); } catch { return null; }
    });
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(!!localStorage.getItem('token'));

    console.log('[AuthContext] init - auth:', authenticated, 'loading:', loading);

    const refreshProfile = useCallback(async () => {
        if (!authenticated) {
            setLoading(false);
            return;
        }
        try {
            console.log('[AuthContext] refreshing profile...');
            const data = await getUserProfile();
            console.log('[AuthContext] profile fetched:', !!data);
            setProfile(data);
            // Sync localStorage user object with fresh profile data
            if (data) {
                const updatedUser = { ...user, ...data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
            }
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
        } finally {
            console.log('[AuthContext] setting loading false');
            setLoading(false);
        }
    }, [authenticated, user]);

    useEffect(() => {
        refreshProfile();
    }, [authenticated]);

    // Handle logout/auth changes
    useEffect(() => {
        const handleAuthChange = () => {
            const isAuth = !!localStorage.getItem('token');
            setAuthenticated(isAuth);
            if (!isAuth) {
                setProfile(null);
                setUser(null);
            }
        };
        window.addEventListener('auth-changed', handleAuthChange);
        return () => window.removeEventListener('auth-changed', handleAuthChange);
    }, []);

    const value = {
        user,
        profile,
        loading,
        authenticated,
        refreshProfile,
        setAuthenticated
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
