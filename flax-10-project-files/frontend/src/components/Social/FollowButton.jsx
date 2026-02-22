import { useState, useEffect } from 'react';
import { followUser, unfollowUser } from '../../api/socialService';
import styles from './Social.module.css';

export default function FollowButton({ userId, initialIsFollowing, onToggle }) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

    // Sync button state when polled data updates from external components
    useEffect(() => {
        setIsFollowing(initialIsFollowing);
    }, [initialIsFollowing]);

    const handleToggle = async (e) => {
        e.stopPropagation();
        if (loading) return;
        setLoading(true);
        try {
            if (isFollowing) {
                await unfollowUser(userId);
                setIsFollowing(false);
            } else {
                await followUser(userId);
                setIsFollowing(true);
            }
            if (onToggle) onToggle(!isFollowing);
        } catch (error) {
            console.error('Error toggling follow status', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
            onClick={handleToggle}
            disabled={loading}
        >
            {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
        </button>
    );
}
