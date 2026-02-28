import { useState, useEffect } from 'react';
import { followUser, unfollowUser } from '../../api/socialService';
import styles from './Social.module.css';

function getLabel(loading, isFollowing) {
    if (loading) return '...';
    return isFollowing ? 'Following' : 'Follow';
}

async function toggleFollow(userId, isFollowing, setIsFollowing, setLoading, onToggle) {
    setLoading(true);
    try {
        isFollowing ? await unfollowUser(userId) : await followUser(userId);
        setIsFollowing(!isFollowing);
        onToggle?.(!isFollowing);
    } catch (err) {
        console.error('Error toggling follow status', err);
    } finally {
        setLoading(false);
    }
}

export default function FollowButton({ userId, initialIsFollowing, onToggle }) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

    useEffect(() => { setIsFollowing(initialIsFollowing); }, [initialIsFollowing]);

    const handleClick = (e) => {
        e.stopPropagation();
        if (!loading) toggleFollow(userId, isFollowing, setIsFollowing, setLoading, onToggle);
    };

    const cls = `${styles.followButton} ${isFollowing ? styles.following : ''}`;
    return <button className={cls} onClick={handleClick} disabled={loading}>{getLabel(loading, isFollowing)}</button>;
}
