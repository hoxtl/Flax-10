import { useState, useEffect } from 'react';
import { shareCalendar, unshareCalendar } from '../../api/socialApi';
import PrimaryButton from '../common/PrimaryButton/PrimaryButton';

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

    return (
        <PrimaryButton
            pill
            size="small"
            variant={isSharing ? "secondary" : "primary"}
            disabled={loading}
            onClick={handleClick}
        >
            {loading ? '...' : isSharing ? 'Shared' : 'Share Calendar'}
        </PrimaryButton>
    );
}
