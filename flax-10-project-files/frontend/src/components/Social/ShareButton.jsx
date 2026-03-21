import { useState, useEffect } from 'react';
import { shareCalendar, unshareCalendar } from '../../api/socialApi';
import styles from './Social.module.css';

function getLabel(loading, isSharing) {
    if (loading) return '...';
    return isSharing ? 'Shared' : 'Share Calendar';
}

async function toggleShare(userId, isSharing, setIsSharing, setLoading, onToggle) {
    setLoading(true);
    try {
        isSharing ? await unshareCalendar(userId) : await shareCalendar(userId);
        setIsSharing(!isSharing);
        onToggle?.(!isSharing);
    } catch (err) {
        console.error('Error toggling share status', err);
    } finally {
        setLoading(false);
    }
}

export default function ShareButton({ userId, initialIsSharing, onToggle }) {
    const [isSharing, setIsSharing] = useState(initialIsSharing);
    const [loading, setLoading] = useState(false);

    useEffect(() => { setIsSharing(initialIsSharing); }, [initialIsSharing]);

    const handleClick = (e) => {
        e.stopPropagation();
        if (!loading) toggleShare(userId, isSharing, setIsSharing, setLoading, onToggle);
    };

    const cls = `${styles.shareButton} ${isSharing ? styles.sharing : ''}`;
    return <button className={cls} onClick={handleClick} disabled={loading}>{getLabel(loading, isSharing)}</button>;
}
