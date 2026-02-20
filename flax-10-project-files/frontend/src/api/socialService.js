import { fetchApi } from './client';

export const followUser = async (userId) => {
    return await fetchApi(`/social/${userId}/follow/`, { method: 'POST' });
};

export const unfollowUser = async (userId) => {
    return await fetchApi(`/social/${userId}/unfollow/`, { method: 'POST' });
};

export const getFollowers = async (userId) => {
    return await fetchApi(`/social/${userId}/followers/`);
};

export const getFollowing = async (userId) => {
    return await fetchApi(`/social/${userId}/following/`);
};
