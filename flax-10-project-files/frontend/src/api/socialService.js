import api from './client';

export const followUser = async (userId) => {
    const response = await api.post(`/social/${userId}/follow/`);
    return response.data;
};

export const unfollowUser = async (userId) => {
    const response = await api.post(`/social/${userId}/unfollow/`);
    return response.data;
};

export const getFollowers = async (userId) => {
    const response = await api.get(`/social/${userId}/followers/`);
    return response.data;
};

export const getFollowing = async (userId) => {
    const response = await api.get(`/social/${userId}/following/`);
    return response.data;
};
